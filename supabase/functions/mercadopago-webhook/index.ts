/**
 * MercadoPago Webhook Edge Function
 *
 * Procesa notificaciones MP y las ramifica según external_reference:
 *   "appointment::{appointment_id}"  → handleAppointmentPayment()
 *   "{businessId}::{plan}::{cycle}"  → flujo de suscripciones (existente)
 *
 * Seguridad (D6):
 *   - Valida firma HMAC x-signature antes de procesar (si MERCADOPAGO_WEBHOOK_SECRET
 *     está configurado). Sin secreto configurado, salta con warning.
 *
 * Idempotencia:
 *   - Usa webhook_idempotency_keys para absorber retries agresivos de MP.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkIdempotency, markIdempotencyProcessed } from '../_shared/idempotency.ts'

// ─── Subscriptions mappings (unchanged) ────────────────────────────────────

const PLAN_TYPE_MAPPING: Record<string, string> = {
  basico: 'inicio',
  pro: 'profesional',
  free: 'inicio',
}

const STATUS_MAPPING: Record<string, string> = {
  approved: 'active',
  pending: 'trialing',
  in_process: 'trialing',
  rejected: 'past_due',
  refunded: 'canceled',
  charged_back: 'canceled',
  cancelled: 'canceled',
}

// ─── HMAC Signature Validation (D6) ────────────────────────────────────────

/**
 * Valida la firma x-signature de MercadoPago.
 * Header formato: "ts=<timestamp>,v1=<HMAC-SHA256-hex>"
 * Data firmada:   "id:<data_id>;request-id:<x-request-id>;ts:<timestamp>;"
 * Ref: https://www.mercadopago.com.co/developers/en/docs/your-integrations/notifications/webhooks
 */
async function validateMpSignature(
  req: Request,
  paymentId: string,
  webhookSecret: string,
): Promise<boolean> {
  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id') || ''
  if (!xSignature) return false

  // Parsear ts y v1 del header
  let ts = ''
  let v1 = ''
  for (const part of xSignature.split(',')) {
    const [k, val] = part.split('=')
    if (k?.trim() === 'ts') ts = val?.trim() ?? ''
    if (k?.trim() === 'v1') v1 = val?.trim() ?? ''
  }
  if (!ts || !v1) return false

  // Construir el manifest a firmar
  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`

  // HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const computed = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return computed === v1
}

// ─── Appointment payment handler ────────────────────────────────────────────

interface MpPayment {
  id: number | string
  status: string
  status_detail: string
  external_reference: string
  transaction_amount: number
  fee_details?: Array<{ type: string; amount: number }>
  metadata?: Record<string, unknown>
  date_approved?: string
}

type SupabaseAdminClient = ReturnType<typeof createClient>

async function handleAppointmentPayment(
  payment: MpPayment,
  supabase: SupabaseAdminClient,
  supabaseUrl: string,
  supabaseServiceKey: string,
): Promise<void> {
  // Extraer appointment_id del external_reference ("appointment::{uuid}")
  const appointmentId = payment.external_reference.replace(/^appointment::/, '')
  if (!appointmentId) {
    console.error('[mp-webhook] appointment payment: no appointment_id in external_reference', payment.external_reference)
    return
  }

  const businessId = payment.metadata?.business_id as string | undefined
  const depositAmount = payment.transaction_amount

  // Calcular gateway_fee desde fee_details de MP (mp_fee)
  const gatewayFee =
    payment.fee_details?.find((f) => f.type === 'mercadopago_fee')?.amount ?? 0
  const platformFee = (payment.metadata?.platform_fee as number) ?? 0
  const netToBusiness = depositAmount - gatewayFee - platformFee

  if (payment.status === 'approved') {
    // Actualizar appointment
    const { error: aptErr } = await supabase
      .from('appointments')
      .update({
        deposit_status: 'paid',
        deposit_paid: depositAmount,
        deposit_paid_at: payment.date_approved ?? new Date().toISOString(),
        hold_expires_at: null,       // liberar el hold
        mp_payment_id: String(payment.id),
        gateway_fee: gatewayFee,
        platform_fee: platformFee,
        net_to_business: netToBusiness,
      })
      .eq('id', appointmentId)
      .eq('deposit_status', 'pending') // solo si sigue pendiente (evitar doble escritura)

    if (aptErr) {
      console.error('[mp-webhook] appointment update error:', aptErr.message)
      return
    }

    // Insertar evento de auditoría
    await supabase.from('appointment_payment_events').insert({
      appointment_id: appointmentId,
      event_type: 'deposit_charged',
      amount: depositAmount,
      gateway: 'mercadopago',
      gateway_reference: String(payment.id),
      status: 'completed',
      idempotency_key: `mp-charged-${payment.id}`,
      metadata: {
        gateway_fee: gatewayFee,
        platform_fee: platformFee,
        net_to_business: netToBusiness,
        status_detail: payment.status_detail,
      },
    })

    // TODO factura electrónica: cuando Matias API esté disponible,
    // generar factura del anticipo aquí. Ver [[Features/facturacion-electronica-matias-api]]

    // Notificar al negocio (fire-and-forget)
    if (businessId) {
      fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'appointment_deposit_received',
          business_id: businessId,
          data: {
            appointment_id: appointmentId,
            amount: depositAmount,
            net_to_business: netToBusiness,
          },
        }),
      }).catch(() => { /* fire-and-forget */ })
    }

  } else if (payment.status === 'refunded' || payment.status === 'charged_back') {
    // Actualizar estado a refunded (el procesamiento detallado lo hace refund-appointment-deposit EF)
    await supabase
      .from('appointments')
      .update({ deposit_status: 'refunded' })
      .eq('id', appointmentId)
      .eq('deposit_status', 'paid')

    await supabase.from('appointment_payment_events').insert({
      appointment_id: appointmentId,
      event_type: 'deposit_refunded',
      amount: depositAmount,
      gateway: 'mercadopago',
      gateway_reference: String(payment.id),
      status: 'completed',
      idempotency_key: `mp-refunded-${payment.id}`,
      metadata: {
        status_detail: payment.status_detail,
        source: payment.status === 'charged_back' ? 'chargeback' : 'refund',
      },
    })
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    // Marcar el depósito como fallido — el slot hold expirará por cron
    await supabase
      .from('appointments')
      .update({ deposit_status: 'failed' })
      .eq('id', appointmentId)
      .eq('deposit_status', 'pending')

    await supabase.from('appointment_payment_events').insert({
      appointment_id: appointmentId,
      event_type: 'deposit_charged',
      amount: depositAmount,
      gateway: 'mercadopago',
      gateway_reference: String(payment.id),
      status: 'failed',
      idempotency_key: `mp-failed-${payment.id}`,
      metadata: { status_detail: payment.status_detail },
    })
  }
  // Otros estados (pending, in_process) → no hacer nada; esperar próximo webhook
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')

    if (!id || !topic) {
      return new Response(JSON.stringify({ error: 'Missing id or topic' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Aceptar tanto 'payment' como 'merchant_order'
    if (topic !== 'payment' && topic !== 'merchant_order') {
      return new Response(JSON.stringify({ status: 'ok', ignored: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')

    if (!supabaseUrl || !supabaseServiceKey || !accessToken) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Validación de firma HMAC (D6) ────────────────────────────────────────
    if (webhookSecret) {
      const valid = await validateMpSignature(req, id, webhookSecret)
      if (!valid) {
        console.warn('[mp-webhook] Invalid x-signature for payment id:', id)
        // Devolver 200 a MP (no 401) para evitar que deje de enviar notificaciones
        // pero NO procesar el evento. El log en Sentry/error_logs alertará al equipo.
        return new Response(JSON.stringify({ status: 'ok', signature_invalid: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } else {
      console.warn('[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature validation')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Idempotencia: topic+id como clave única (ej: "payment:123456789").
    // Ref: auditoria-completa-abril-2026.md §1.2
    const idempotencyKey = `${topic}:${id}`
    const { firstSeen, duplicateResponse } = await checkIdempotency(
      supabase,
      'mercadopago',
      idempotencyKey,
      req,
    )
    if (!firstSeen) return duplicateResponse

    // Fetch payment details from MercadoPago API
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!paymentResponse.ok) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payment = await paymentResponse.json() as MpPayment

    // ── Ramificación por external_reference ──────────────────────────────────
    if (payment.external_reference?.startsWith('appointment::')) {
      // Flujo de anticipo de cita
      await handleAppointmentPayment(payment, supabase, supabaseUrl, supabaseServiceKey)
      await markIdempotencyProcessed(supabase, 'mercadopago', idempotencyKey, 200)
      return new Response(JSON.stringify({ status: 'ok', processed: true, flow: 'appointment' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Flujo de suscripciones (existente, sin cambios) ──────────────────────
    // external_reference formato: "{businessId}::{planType}::{billingCycle}"
    const refParts = (payment.external_reference || '').split('::')
    const businessId = payment.metadata?.business_id || refParts[0] || null
    const planType = payment.metadata?.plan_type || refParts[1] || 'basico'
    const billingCycle = payment.metadata?.billing_cycle || refParts[2] || 'monthly'

    if (!businessId) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Map status
    const subscriptionStatus = STATUS_MAPPING[payment.status] || 'pending'

    // Calculate dates
    const now = new Date()
    const end = new Date(now)
    if (billingCycle === 'monthly') {
      end.setMonth(end.getMonth() + 1)
    } else {
      end.setFullYear(end.getFullYear() + 1)
    }

    // Mapear plan_type del frontend al valor que espera la BD
    const dbPlanType = PLAN_TYPE_MAPPING[planType] || planType

    // Update business_plans
    const { error } = await supabase
      .from('business_plans')
      .upsert(
        {
          business_id: businessId,
          plan_type: dbPlanType,
          status: subscriptionStatus,
          start_date: now.toISOString(),
          end_date: end.toISOString(),
          billing_cycle: billingCycle,
          payment_gateway: 'mercadopago',
          gateway_subscription_id: payment.id.toString(),
        },
        { onConflict: 'business_id' }
      )

    if (error) {
      console.error('[mp-webhook] business_plans upsert error:', error.message)
    }

    // ─── Referral payout trigger ────────────────────────────────────────────
    if (payment.status === 'approved' && payment.metadata?.referral_code_id) {
      try {
        const { data: business } = await supabase
          .from('businesses')
          .select('owner_id')
          .eq('id', businessId)
          .single()

        if (business?.owner_id) {
          const { data: referralResult } = await supabase.rpc('mark_referral_redeemed', {
            p_code_id:     payment.metadata.referral_code_id,
            p_business_id: businessId,
            p_user_id:     business.owner_id,
            p_payment_id:  payment.id.toString(),
          })

          if (referralResult?.payoutId) {
            fetch(`${supabaseUrl}/functions/v1/mercadopago-payout-referral`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referralPayoutId: referralResult.payoutId }),
            }).catch(() => { /* fire-and-forget */ })
          }
        }
      } catch (_referralError) {
        // No fallar el webhook principal por errores en referrals
      }
    }

    await markIdempotencyProcessed(supabase, 'mercadopago', idempotencyKey, 200)

    return new Response(JSON.stringify({ status: 'ok', processed: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[mp-webhook] unhandled error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
