/**
 * MercadoPago Webhook Edge Function
 * Procesa webh notifications y actualiza planes de negocio
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('[mercadopago-webhook] Request:', { method: req.method, url: req.url })

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')

    console.log('[mercadopago-webhook] Parsed:', { id, topic })

    if (!id || !topic) {
      return new Response(JSON.stringify({ error: 'Missing id or topic' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Aceptar tanto 'payment' como 'merchant_order'
    if (topic !== 'payment' && topic !== 'merchant_order') {
      console.log('[mercadopago-webhook] Ignoring topic:', topic)
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
      console.error('[mercadopago-webhook] Missing env vars')
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch payment details from MercadoPago API
    console.log('[mercadopago-webhook] Fetching payment:', id)
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!paymentResponse.ok) {
      console.error('[mercadopago-webhook] Failed to fetch payment:', paymentResponse.status)
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payment = await paymentResponse.json()
    console.log('[mercadopago-webhook] Payment:', {
      id: payment.id,
      status: payment.status,
      metadata: payment.metadata,
    })

    // Extraer businessId/plan desde external_reference (confiable) con fallback a metadata
    // external_reference formato: "{businessId}::{planType}::{billingCycle}"
    const refParts = (payment.external_reference || '').split('::')
    const businessId = payment.metadata?.business_id || refParts[0] || null
    const planType = payment.metadata?.plan_type || refParts[1] || 'basico'
    const billingCycle = payment.metadata?.billing_cycle || refParts[2] || 'monthly'

    console.log('[mercadopago-webhook] Extracted:', { businessId, planType, billingCycle, external_reference: payment.external_reference })

    if (!businessId) {
      console.error('[mercadopago-webhook] Missing business_id in both metadata and external_reference')
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
    console.log('[mercadopago-webhook] Updating plan:', { businessId, planType, dbPlanType, subscriptionStatus })

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
      console.error('[mercadopago-webhook] Update error:', error)
    } else {
      console.log('[mercadopago-webhook] Plan updated successfully')
    }

    return new Response(JSON.stringify({ status: 'ok', processed: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[mercadopago-webhook] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
