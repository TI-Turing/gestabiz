/**
 * create-appointment-deposit-preference Edge Function
 *
 * Crea una Preference de MercadoPago para cobrar el anticipo de una cita.
 * Usa el access_token OAuth del NEGOCIO (no el de Gestabiz) — el dinero entra
 * directo a la cuenta MP del negocio. Gestabiz cobra su 5% via marketplace_fee.
 *
 * Flow:
 * 1. Auth + ownership check (cliente, owner o admin)
 * 2. Lee appointment + service + business + business_mp_connection (con token desencriptado)
 * 3. Llama RPC compute_appointment_fees para obtener breakdown autoritativo
 * 4. Crea Preference en MP con marketplace_fee = platform_fee
 * 5. Guarda mp_preference_id en appointment + evento webhook_received pending
 * 6. Setea hold_expires_at = now() + 15 min
 * 7. Retorna { preference_id, init_point, sandbox_init_point } al frontend
 *
 * TODO factura electrónica: cuando llegue Matias API, generar factura del anticipo.
 *
 * Required Supabase Secrets:
 * - APP_ENCRYPTION_KEY (para descifrar mp_access_token)
 * - APP_FRONTEND_URL
 *
 * Required body:
 * - appointment_id: uuid
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('create-appointment-deposit-preference')

const HOLD_TTL_MINUTES = 15

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
    const frontendUrl = Deno.env.get('APP_FRONTEND_URL') ?? 'http://localhost:5173'

    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: userData, error: userErr } = await supabaseAnon.auth.getUser()
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401, corsHeaders)
    const userId = userData.user.id

    const { appointment_id } = (await req.json()) as { appointment_id: string }
    if (!appointment_id) return json({ error: 'appointment_id required' }, 400, corsHeaders)

    // 1. Cargar cita + service + business
    const { data: apt, error: aptErr } = await supabaseAdmin
      .from('appointments')
      .select('id, business_id, service_id, client_id, start_time, end_time, status, deposit_status, price')
      .eq('id', appointment_id)
      .single()
    if (aptErr || !apt) return json({ error: 'Appointment not found' }, 404, corsHeaders)

    // Autorización: cliente, owner o admin del negocio
    const isClient = apt.client_id === userId
    let isAdmin = false
    if (!isClient) {
      const { data: bus } = await supabaseAdmin.from('businesses').select('owner_id').eq('id', apt.business_id).single()
      if (bus?.owner_id === userId) isAdmin = true
      else {
        const { data: roleData } = await supabaseAdmin
          .from('business_roles')
          .select('id')
          .eq('business_id', apt.business_id)
          .eq('user_id', userId)
          .eq('role', 'admin')
          .eq('is_active', true)
          .maybeSingle()
        if (roleData) isAdmin = true
      }
    }
    if (!isClient && !isAdmin) return json({ error: 'Forbidden' }, 403, corsHeaders)

    // 2. Validar que la cita aún acepta anticipo
    if (!['pending', 'confirmed'].includes(apt.status)) {
      return json({ error: `Cannot pay deposit for status ${apt.status}` }, 400, corsHeaders)
    }
    if (apt.deposit_status === 'paid') {
      return json({ error: 'Deposit already paid' }, 409, corsHeaders)
    }

    // 3. Calcular fees autoritativos via RPC
    const { data: feesRaw, error: feesErr } = await supabaseAdmin.rpc('compute_appointment_fees' as never, {
      p_business_id: apt.business_id,
      p_service_id: apt.service_id,
      p_override_price: apt.price,
    } as never)
    if (feesErr) throw feesErr

    const fees = feesRaw as {
      deposit_required: number
      platform_fee: number
      gateway_fee: number
      net_to_business: number
      is_enabled: boolean
      currency: string
    }

    if (!fees.is_enabled || fees.deposit_required <= 0) {
      return json({ error: 'Business does not require deposit for this service' }, 400, corsHeaders)
    }

    // 4. Cargar conexión MP del negocio + descifrar access_token
    const { data: conn, error: connErr } = await supabaseAdmin
      .from('business_mp_connections')
      .select('mp_access_token_encrypted, is_active, expires_at')
      .eq('business_id', apt.business_id)
      .single()
    if (connErr || !conn || !conn.is_active) {
      return json({ error: 'Business has no active MercadoPago connection' }, 400, corsHeaders)
    }
    if (new Date(conn.expires_at).getTime() < Date.now()) {
      return json({ error: 'MercadoPago connection expired' }, 400, corsHeaders)
    }

    // Setear app.encryption_key + decrypt token
    await supabaseAdmin.rpc('set_config' as never, {
      setting_name: 'app.encryption_key',
      new_value: encryptionKey,
      is_local: false,
    } as never)

    const { data: tokenPlain, error: decErr } = await supabaseAdmin.rpc('decrypt_mp_token' as never, {
      p_encrypted: conn.mp_access_token_encrypted,
    } as never)
    if (decErr) throw decErr
    const businessAccessToken = String(tokenPlain)

    // 5. Cargar service para descripción humana
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('name')
      .eq('id', apt.service_id)
      .single()

    // 6. Crear preferencia en MP usando token del negocio
    const externalReference = `appointment::${appointment_id}`
    const idempotencyKey = `apt-${appointment_id}-${Date.now()}`
    const notificationUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`

    const preferenceBody = {
      items: [
        {
          id: appointment_id,
          title: `Anticipo: ${service?.name ?? 'Servicio'}`,
          quantity: 1,
          currency_id: 'COP',
          unit_price: fees.deposit_required,
        },
      ],
      external_reference: externalReference,
      // marketplace_fee = comisión Gestabiz, MP la separa automáticamente al cobrar
      marketplace_fee: fees.platform_fee,
      // El cliente (auth user) podría no ser email del cita — preferimos no preasignar payer
      back_urls: {
        success: `${frontendUrl}/app/client/appointments/${appointment_id}?payment=success`,
        failure: `${frontendUrl}/app/client/appointments/${appointment_id}?payment=failure`,
        pending: `${frontendUrl}/app/client/appointments/${appointment_id}?payment=pending`,
      },
      auto_return: 'approved',
      notification_url: notificationUrl,
      statement_descriptor: 'Gestabiz Cita',
      metadata: {
        appointment_id,
        business_id: apt.business_id,
        service_id: apt.service_id,
        deposit_amount: fees.deposit_required,
        platform_fee: fees.platform_fee,
      },
      expires: true,
      expiration_date_to: new Date(Date.now() + HOLD_TTL_MINUTES * 60 * 1000).toISOString(),
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${businessAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(preferenceBody),
    })

    if (!mpRes.ok) {
      const errText = await mpRes.text()
      console.error('MP preference creation failed:', errText)
      return json({ error: `MP API error: ${mpRes.status}`, details: errText }, 502, corsHeaders)
    }

    const mpData = (await mpRes.json()) as {
      id: string
      init_point: string
      sandbox_init_point: string
    }

    // 7. Persistir en appointment + evento de auditoría
    const holdExpiresAt = new Date(Date.now() + HOLD_TTL_MINUTES * 60 * 1000).toISOString()

    await supabaseAdmin
      .from('appointments')
      .update({
        deposit_required: fees.deposit_required,
        deposit_status: 'pending',
        mp_preference_id: mpData.id,
        hold_expires_at: holdExpiresAt,
        gateway_fee: fees.gateway_fee,
        platform_fee: fees.platform_fee,
        net_to_business: fees.net_to_business,
      })
      .eq('id', appointment_id)

    await supabaseAdmin.from('appointment_payment_events').insert({
      appointment_id,
      event_type: 'webhook_received',
      amount: fees.deposit_required,
      gateway: 'mercadopago',
      gateway_reference: mpData.id,
      status: 'pending',
      idempotency_key: idempotencyKey,
      metadata: {
        action: 'preference_created',
        marketplace_fee: fees.platform_fee,
        hold_expires_at: holdExpiresAt,
      },
      created_by: userId,
    })

    // TODO factura electrónica: cuando se cobre (webhook approved), generar factura del anticipo via Matias API.

    return json(
      {
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        hold_expires_at: holdExpiresAt,
        breakdown: fees,
      },
      200,
      corsHeaders,
    )
  } catch (e) {
    captureEdgeFunctionError(e, { function: 'create-appointment-deposit-preference' })
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
