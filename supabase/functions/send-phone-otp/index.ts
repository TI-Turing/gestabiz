// Supabase Edge Function: Send Phone OTP via Twilio Verify (SMS)
// Deploy: npx supabase functions deploy send-phone-otp
//
// Secrets requeridos (PROD):
//   TWILIO_ACCOUNT_SID        — SID de la cuenta Twilio
//   TWILIO_AUTH_TOKEN         — Auth token de la cuenta Twilio
//   TWILIO_VERIFY_SERVICE_SID — SID del Verify Service (VAxxxxx) en Twilio Console
//
// En DEV (sin Twilio configurado): devuelve el código directamente como dev_code

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { validatePhone } from '../_shared/validation.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('send-phone-otp')

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { userId, phone } = await req.json()
    if (!userId || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId y phone son requeridos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Normalizar número a E.164
    const cleanPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+${phone.replace(/\D/g, '')}`

    if (!validatePhone(cleanPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de teléfono inválido. Debe incluir código de país (ej: +57300123456).' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar que el usuario existe
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (profileErr || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const TWILIO_ACCOUNT_SID        = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN         = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')

    // DEV: sin Twilio Verify configurado — generar código local y devolverlo
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      const isDev = supabaseUrl.includes('dkancockzvcqorqbwtyh')
      if (!isDev) throw new Error('Twilio Verify no configurado (falta TWILIO_VERIFY_SERVICE_SID)')

      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      const devCode = String(1000 + (array[0] % 9000))

      // Guardar en DB para que verify-phone-otp pueda validarlo en modo DEV
      await supabase.from('profiles').update({
        phone_otp_code: devCode,
        phone_otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        phone_otp_attempts: 0,
        phone_verified: false,
      }).eq('id', userId)

      return new Response(
        JSON.stringify({ success: true, dev_code: devCode, message: 'Modo dev: código devuelto en respuesta.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // PROD: usar Twilio Verify API — Twilio gestiona generación, envío y rate limiting
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const verifyResp = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: cleanPhone, Channel: 'sms' }),
      }
    )

    if (!verifyResp.ok) {
      if (verifyResp.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Demasiadas solicitudes. Espera antes de solicitar otro código.', retryAfter: 60 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }
      const errBody = await verifyResp.text()
      throw new Error(`Twilio Verify error ${verifyResp.status}: ${errBody}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err) {
    captureEdgeFunctionError(err as Error, {
      functionName: 'send-phone-otp',
      operation: 'sendOtp',
    })
    await flushSentry()
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
