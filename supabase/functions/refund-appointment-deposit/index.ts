/**
 * refund-appointment-deposit Edge Function
 *
 * Emite una devolución total o parcial del anticipo de una cita según la
 * política de cancelación del negocio. Se invoca:
 *   a) Automáticamente desde appointment-actions cuando se cancela una cita
 *      con anticipo pagado.
 *   b) Manualmente por un admin/owner con permiso payments.refund.
 *
 * Flow:
 * 1. Auth + verificar permiso payments.refund (owner, admin o cliente propio)
 * 2. Cargar appointment + business (política de cancelación)
 * 3. RPC compute_refund_amount → tramo aplicable + monto de devolución
 * 4. Si refundPct > 0 → llamar MP /v1/payments/{mp_payment_id}/refunds con
 *    el access_token del negocio.
 * 5. Si refundPct = 0 → registrar evento manual_adjustment (negocio retiene)
 * 6. UPDATE appointment deposit_status + deposit_refund_amount
 * 7. INSERT appointment_payment_events
 * 8. Notificar cliente (fire-and-forget)
 *
 * TODO factura electrónica: cuando Matias API esté disponible, generar nota
 * crédito de la devolución aquí. Ver [[Features/facturacion-electronica-matias-api]]
 *
 * Required body:
 * - appointment_id: uuid
 *
 * Required Supabase Secrets:
 * - APP_ENCRYPTION_KEY (para descifrar mp_access_token)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('refund-appointment-deposit')

Deno.serve(async (req: Request) => {
  const cors = handleCorsPreFlight(req)
  if (cors) return cors
  const corsHeaders = getCorsHeaders(req)

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401, corsHeaders)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY')!

    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: userData, error: userErr } = await supabaseAnon.auth.getUser()
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401, corsHeaders)
    const userId = userData.user.id

    const { appointment_id } = (await req.json()) as { appointment_id: string }
    if (!appointment_id) return json({ error: 'appointment_id required' }, 400, corsHeaders)

    // 1. Cargar cita
    const { data: apt, error: aptErr } = await supabaseAdmin
      .from('appointments')
      .select(
        'id, business_id, client_id, start_time, deposit_status, deposit_paid, mp_payment_id, ' +
        'deposit_required, gateway_fee, platform_fee, net_to_business',
      )
      .eq('id', appointment_id)
      .single()
    if (aptErr || !apt) return json({ error: 'Appointment not found' }, 404, corsHeaders)

    // 2. Verificar que el anticipo está pagado
    if (apt.deposit_status !== 'paid') {
      return json({ error: `Deposit status is '${apt.deposit_status}', must be 'paid' to refund` }, 400, corsHeaders)
    }
    if (!apt.mp_payment_id) {
      return json({ error: 'No MP payment ID — cannot refund' }, 400, corsHeaders)
    }

    // 3. Autorización: owner/admin del negocio o el cliente mismo
    const isClient = apt.client_id === userId
    let isAuthorized = isClient
    if (!isAuthorized) {
      const { data: bus } = await supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', apt.business_id)
        .single()
      if (bus?.owner_id === userId) {
        isAuthorized = true
      } else {
        // Check admin role
        const { data: roleData } = await supabaseAdmin
          .from('business_roles')
          .select('id')
          .eq('business_id', apt.business_id)
          .eq('user_id', userId)
          .eq('role', 'admin')
          .eq('is_active', true)
          .maybeSingle()
        if (roleData) isAuthorized = true
      }
    }
    if (!isAuthorized) return json({ error: 'Forbidden' }, 403, corsHeaders)

    // 4. Calcular monto de devolución via RPC (autoritativo)
    const { data: refundData, error: refundErr } = await supabaseAdmin.rpc(
      'compute_refund_amount' as never,
      { p_appointment_id: appointment_id } as never,
    )
    if (refundErr) throw refundErr

    const refund = refundData as {
      refund_amount: number
      refund_percentage: number
      tier: string       // 'full' | 'partial' | 'none'
      eligible: boolean
    }

    const idempotencyKey = `refund-apt-${appointment_id}-${Date.now()}`

    if (!refund.eligible || refund.refund_amount <= 0) {
      // No hay devolución según la política → registrar evento y dejar el monto al negocio
      await supabaseAdmin.from('appointment_payment_events').insert({
        appointment_id,
        event_type: 'manual_adjustment',
        amount: 0,
        gateway: 'mercadopago',
        gateway_reference: apt.mp_payment_id,
        status: 'completed',
        idempotency_key: idempotencyKey,
        metadata: {
          action: 'no_refund_policy',
          tier: refund.tier,
          refund_percentage: refund.refund_percentage,
          policy: 'business_retains_deposit',
        },
        created_by: userId,
      })

      await supabaseAdmin
        .from('appointments')
        .update({ deposit_status: 'refunded', deposit_refund_amount: 0 })
        .eq('id', appointment_id)

      return json(
        { refunded: false, amount: 0, tier: refund.tier, message: 'No refund per cancellation policy' },
        200,
        corsHeaders,
      )
    }

    // 5. Cargar token MP del negocio para emitir el refund
    await supabaseAdmin.rpc('set_config' as never, {
      setting_name: 'app.encryption_key',
      new_value: encryptionKey,
      is_local: false,
    } as never)

    const { data: conn, error: connErr } = await supabaseAdmin
      .from('business_mp_connections')
      .select('mp_access_token_encrypted, is_active')
      .eq('business_id', apt.business_id)
      .single()
    if (connErr || !conn?.is_active) {
      return json({ error: 'Business MP connection not found or inactive' }, 400, corsHeaders)
    }

    const { data: tokenPlain, error: decErr } = await supabaseAdmin.rpc('decrypt_mp_token' as never, {
      p_encrypted: conn.mp_access_token_encrypted,
    } as never)
    if (decErr) throw decErr
    const businessAccessToken = String(tokenPlain)

    // 6. Llamar a MP API para el refund
    const mpRefundBody: Record<string, unknown> = {
      amount: refund.refund_amount,
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${apt.mp_payment_id}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${businessAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(mpRefundBody),
    })

    if (!mpRes.ok) {
      const errText = await mpRes.text()
      console.error('[refund-appointment-deposit] MP refund failed:', errText)
      return json({ error: `MP refund failed: ${mpRes.status}`, details: errText }, 502, corsHeaders)
    }

    const mpRefundData = (await mpRes.json()) as { id: string; status: string }

    // 7. Actualizar appointment
    const newDepositStatus = refund.tier === 'full' ? 'refunded' : 'partial_refund'
    await supabaseAdmin
      .from('appointments')
      .update({
        deposit_status: newDepositStatus,
        deposit_refund_amount: refund.refund_amount,
        deposit_refunded_at: new Date().toISOString(),
      })
      .eq('id', appointment_id)

    // 8. Insertar evento de auditoría
    await supabaseAdmin.from('appointment_payment_events').insert({
      appointment_id,
      event_type: 'deposit_refunded',
      amount: refund.refund_amount,
      gateway: 'mercadopago',
      gateway_reference: String(mpRefundData.id),
      status: 'completed',
      idempotency_key: idempotencyKey,
      metadata: {
        original_mp_payment_id: apt.mp_payment_id,
        refund_percentage: refund.refund_percentage,
        tier: refund.tier,
        mp_refund_status: mpRefundData.status,
      },
      created_by: userId,
    })

    // TODO factura electrónica: generar nota crédito vía Matias API cuando esté disponible.

    // 9. Notificar al cliente (fire-and-forget)
    if (apt.client_id) {
      fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'appointment_deposit_refunded',
          user_id: apt.client_id,
          business_id: apt.business_id,
          data: {
            appointment_id,
            refund_amount: refund.refund_amount,
            refund_percentage: refund.refund_percentage,
            tier: refund.tier,
          },
        }),
      }).catch(() => { /* fire-and-forget */ })
    }

    return json(
      {
        refunded: true,
        amount: refund.refund_amount,
        percentage: refund.refund_percentage,
        tier: refund.tier,
        mp_refund_id: mpRefundData.id,
        deposit_status: newDepositStatus,
      },
      200,
      corsHeaders,
    )
  } catch (e) {
    captureEdgeFunctionError(e, { function: 'refund-appointment-deposit' })
    await flushSentry()
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return json({ error: msg }, 500, getCorsHeaders(req))
  }
})

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
