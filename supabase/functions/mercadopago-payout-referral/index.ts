/**
 * MercadoPago Payout Referral Edge Function
 *
 * Transfiere la comisión de referral al referrer vía MercadoPago Money Transfer API.
 * Llamada inmediatamente por mercadopago-webhook cuando confirma un pago con cupón.
 *
 * Input: { referralPayoutId: string }
 * Requiere: MERCADOPAGO_ACCESS_TOKEN secret
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('mercadopago-payout-referral')

const MAX_ATTEMPTS = 5

Deno.serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { referralPayoutId } = await req.json()
    if (!referralPayoutId) {
      return new Response(JSON.stringify({ error: 'referralPayoutId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load payout + recipient payout details
    const { data: payout, error: payoutError } = await supabase
      .from('referral_payouts')
      .select(`
        *,
        user_payout_details!recipient_user_id (
          mp_email,
          full_name
        )
      `)
      .eq('id', referralPayoutId)
      .single()

    if (payoutError || !payout) {
      return new Response(JSON.stringify({ error: 'Payout not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Skip if already transferred
    if (payout.status === 'transferred') {
      return new Response(JSON.stringify({ status: 'already_transferred' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Skip if max attempts reached
    if (payout.attempt_count >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ status: 'max_attempts_reached' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const recipientEmail = payout.user_payout_details?.mp_email
    if (!recipientEmail) {
      await supabase
        .from('referral_payouts')
        .update({
          status: 'failed',
          last_error: 'Recipient has no MercadoPago email configured',
          attempt_count: payout.attempt_count + 1,
        })
        .eq('id', referralPayoutId)

      return new Response(JSON.stringify({ error: 'Recipient email not found' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark as processing
    await supabase
      .from('referral_payouts')
      .update({ status: 'processing', attempt_count: payout.attempt_count + 1 })
      .eq('id', referralPayoutId)

    // Call MercadoPago Money Transfer API
    const transferPayload = {
      amount: payout.amount,
      currency_id: 'COP',
      receiver: {
        email: recipientEmail,
      },
      external_reference: payout.id,
      description: `Comisión referral Gestabiz - Cupón ${payout.referral_code_id}`,
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/money_transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': payout.idempotency_key,
      },
      body: JSON.stringify(transferPayload),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      const errorMessage = mpData?.message || mpData?.error || JSON.stringify(mpData)
      const newAttemptCount = payout.attempt_count + 1
      const newStatus = newAttemptCount >= MAX_ATTEMPTS ? 'manual_review' : 'failed'

      await supabase
        .from('referral_payouts')
        .update({
          status: newStatus,
          last_error: errorMessage,
          attempt_count: newAttemptCount,
        })
        .eq('id', referralPayoutId)

      if (newStatus === 'manual_review') {
        captureEdgeFunctionError(
          new Error(`Referral payout max attempts reached: ${referralPayoutId}`),
          { functionName: 'mercadopago-payout-referral', payoutId: referralPayoutId }
        )
      }

      return new Response(JSON.stringify({ error: 'Transfer failed', details: errorMessage }), {
        status: 200, // Return 200 so caller doesn't retry at network level
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Success — mark transferred
    const transferId = mpData?.id?.toString() || mpData?.transfer_id?.toString()

    await supabase
      .from('referral_payouts')
      .update({
        status: 'transferred',
        mp_transfer_id: transferId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', referralPayoutId)

    // Notify referrer via in_app_notifications
    const formattedAmount = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(payout.amount)

    await supabase.from('in_app_notifications').insert({
      user_id: payout.recipient_user_id,
      type: 'referral_payout_transferred',
      title: '¡Recibiste una comisión!',
      message: `Tu cupón de referral generó ${formattedAmount}. Ya están en tu cuenta MercadoPago.`,
      data: {
        referral_payout_id: referralPayoutId,
        referral_code_id: payout.referral_code_id,
        amount: payout.amount,
        mp_transfer_id: transferId,
      },
      read: false,
    })

    return new Response(
      JSON.stringify({ status: 'transferred', transferId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'mercadopago-payout-referral' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
