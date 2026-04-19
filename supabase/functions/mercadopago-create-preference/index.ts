/**
 * MercadoPago Create Preference Edge Function
 * 
 * Crea una Preference de MercadoPago para Checkout Pro
 * 
 * Flujo:
 * 1. Recibe businessId, planType, billingCycle, discountCode
 * 2. Consulta datos del negocio en Supabase
 * 3. Calcula precio basado en plan y ciclo
 * 4. Aplica descuento si existe código válido
 * 5. Crea Preference en MercadoPago API
 * 6. Guarda payment pendiente en subscription_payments
 * 7. Retorna preference_id e init_point para redirección
 * 
 * Documentación: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
 * 
 * Variables requeridas (Supabase Secrets):
 * - MERCADOPAGO_ACCESS_TOKEN
 * 
 * @author GitHub Copilot
 * @date 2025-10-17
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('mercadopago-create-preference')

// Prices por plan (COP - Pesos Colombianos)
const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  free:   { monthly: 0,       yearly: 0        },
  basico: { monthly: 89900,   yearly: 899000   },
  pro:    { monthly: 159900,  yearly: 1599000  },
}

Deno.serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    // ─── AUTENTICACIÓN: JWT obligatorio ────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verificar token
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { businessId, planType, billingCycle, discountCode } = await req.json()

    if (!businessId || !planType || !billingCycle) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: businessId, planType, billingCycle' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client (service role)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get business data and verify ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, email, owner_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── AUTORIZACIÓN: solo el owner puede crear checkout ─────────────────
    if (business.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate price
    const basePrice = PLAN_PRICES[planType][billingCycle]
    let finalPrice = basePrice
    let discountAmount = 0

    // Apply discount code if provided
    let referralCodeId: string | null = null

    if (discountCode) {
      // Try as referral code first
      const { data: referralData, error: referralError } = await supabase.rpc('apply_referral_code', {
        p_business_id: businessId,
        p_code: discountCode,
      })

      if (!referralError && referralData?.isValid) {
        discountAmount = referralData.discountAmount
        finalPrice = referralData.finalAmount
        referralCodeId = referralData.referralCodeId
      } else {
        // Fallback: try as regular discount code
        const { data: discountData, error: discountError } = await supabase.rpc('apply_discount_code', {
          p_business_id: businessId,
          p_code: discountCode,
          p_plan_type: planType,
          p_amount: basePrice,
        })

        if (!discountError && discountData?.isValid) {
          discountAmount = discountData.discountAmount
          finalPrice = discountData.finalAmount
        }
      }
    }

    // external_reference es el único campo que MP propaga Preference→Payment de forma confiable
    const referenceCode = `${businessId}::${planType}::${billingCycle}`

    // Get MercadoPago Access Token
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured')
    }

    // Create Preference in MercadoPago
    // Docs: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
    const preferencePayload = {
      items: [
        {
          title: `Plan ${planType.charAt(0).toUpperCase() + planType.slice(1)} - ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}`,
          description: `Suscripción ${billingCycle === 'monthly' ? 'mensual' : 'anual'} al plan ${planType}`,
          quantity: 1,
          unit_price: finalPrice,
          currency_id: 'COP', // Pesos Colombianos
        },
      ],
      payer: {
        name: business.name,
        email: business.email,
      },
      back_urls: {
        success: `${Deno.env.get('APP_URL')}/admin/billing?payment=success`,
        failure: `${Deno.env.get('APP_URL')}/admin/billing?payment=failure`,
        pending: `${Deno.env.get('APP_URL')}/admin/billing?payment=pending`,
      },
      auto_return: 'approved', // Auto-redirect on success
      external_reference: referenceCode,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'GESTABIZ',
      metadata: {
        business_id: businessId,
        plan_type: planType,
        billing_cycle: billingCycle,
        discount_code: discountCode || null,
        discount_amount: discountAmount,
        referral_code_id: referralCodeId,
      },
    }

    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencePayload),
    })

    if (!mercadoPagoResponse.ok) {
      const errorData = await mercadoPagoResponse.json()
      throw new Error(`MercadoPago API error: ${JSON.stringify(errorData)}`)
    }

    const preferenceData = await mercadoPagoResponse.json()

    // Save pending payment in subscription_payments
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        business_id: businessId,
        amount: finalPrice,
        currency: 'COP',
        status: 'pending',
        metadata: {
          preference_id: preferenceData.id,
          init_point: preferenceData.init_point,
          plan_type: planType,
          billing_cycle: billingCycle,
          payment_method: 'mercadopago',
          discount_code: discountCode,
          discount_amount: discountAmount,
        },
      })

    if (paymentError) {
      // Don't throw, just log (payment still created in MercadoPago)
    }

    // Return preference data for frontend redirect
    return new Response(
      JSON.stringify({
        preference_id: preferenceData.id,
        init_point: preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'mercadopago-create-preference' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
