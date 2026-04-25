/**
 * MercadoPago Webhook Edge Function
 * Procesa webh notifications y actualiza planes de negocio
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkIdempotency, markIdempotencyProcessed } from '../_shared/idempotency.ts'

// Mapeo frontend → BD (el frontend usa 'basico'/'pro', la BD usa 'inicio'/'profesional')
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

    if (!supabaseUrl || !supabaseServiceKey || !accessToken) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Idempotencia: usar topic+id como clave única (ej: "payment:123456789").
    // MercadoPago reintenta notificaciones agresivamente; sin esto cada retry
    // gastaría una llamada externa a su API y podría duplicar upserts.
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

    const payment = await paymentResponse.json()

    // Extraer businessId/plan desde external_reference (confiable) con fallback a metadata
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
    } else {
    }

    // ─── Referral payout trigger ────────────────────────────────────────────
    // Si el pago incluye un referral_code_id en metadata, procesamos el payout
    if (payment.status === 'approved' && payment.metadata?.referral_code_id) {
      try {
        // Obtener owner_id del negocio para mark_referral_redeemed
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

          // Disparar payout de forma asíncrona (fire-and-forget)
          if (referralResult?.payoutId) {
            fetch(`${supabaseUrl}/functions/v1/mercadopago-payout-referral`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referralPayoutId: referralResult.payoutId }),
            }).catch(() => { /* fire-and-forget, error se maneja en la EF destino */ })
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
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
