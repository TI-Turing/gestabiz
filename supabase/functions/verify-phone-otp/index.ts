// Supabase Edge Function: Verify Phone OTP via Twilio Verify
// Deploy: npx supabase functions deploy verify-phone-otp
//
// Secrets requeridos (PROD):
//   TWILIO_ACCOUNT_SID        — SID de la cuenta Twilio
//   TWILIO_AUTH_TOKEN         — Auth token de la cuenta Twilio
//   TWILIO_VERIFY_SERVICE_SID — SID del Verify Service (VAxxxxx) en Twilio Console
//
// En DEV (sin Twilio): valida el código almacenado en profiles.phone_otp_code

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('verify-phone-otp')

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { userId, code, phone } = await req.json()
    if (!userId || !code) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId y code son requeridos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const TWILIO_ACCOUNT_SID        = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN         = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID) {
      // ── PROD: verificar con Twilio Verify Check API ───────────────────────
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'phone es requerido para verificación.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const cleanPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+${phone.replace(/\D/g, '')}`
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

      const checkResp = await fetch(
        `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: cleanPhone, Code: code }),
        }
      )

      const checkData = await checkResp.json()

      if (!checkData.valid) {
        let errMsg = 'Código incorrecto o expirado.'
        if (checkData.status === 'max_attempts_reached') errMsg = 'Demasiados intentos. Solicita un nuevo código.'
        if (checkData.status === 'expired')              errMsg = 'El código expiró. Solicita uno nuevo.'
        if (checkData.status === 'canceled')             errMsg = 'La verificación fue cancelada. Solicita un nuevo código.'
        return new Response(
          JSON.stringify({ success: false, error: errMsg }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Código aprobado: marcar teléfono como verificado
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ phone_verified: true, phone: cleanPhone })
        .eq('id', userId)

      if (updateErr) throw new Error(`Error actualizando perfil: ${updateErr.message}`)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )

    } else {
      // ── DEV: validar código almacenado en DB ──────────────────────────────
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('phone_otp_code, phone_otp_expires_at, phone_otp_attempts')
        .eq('id', userId)
        .single()

      if (profileErr || !profile) {
        return new Response(
          JSON.stringify({ success: false, error: 'Usuario no encontrado.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      if (!profile.phone_otp_code) {
        return new Response(
          JSON.stringify({ success: false, error: 'No hay código pendiente. Solicita uno nuevo.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const now      = new Date()
      const expires  = new Date(profile.phone_otp_expires_at)
      const attempts = (profile.phone_otp_attempts ?? 0) + 1

      if (now > expires) {
        await supabase.from('profiles')
          .update({ phone_otp_code: null, phone_otp_expires_at: null, phone_otp_attempts: 0 })
          .eq('id', userId)
        return new Response(
          JSON.stringify({ success: false, error: 'El código expiró. Solicita uno nuevo.', expired: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (attempts > 5) {
        await supabase.from('profiles')
          .update({ phone_otp_code: null, phone_otp_expires_at: null, phone_otp_attempts: 0 })
          .eq('id', userId)
        return new Response(
          JSON.stringify({ success: false, error: 'Demasiados intentos. Solicita un nuevo código.', maxAttempts: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }

      if (code !== profile.phone_otp_code) {
        await supabase.from('profiles').update({ phone_otp_attempts: attempts }).eq('id', userId)
        const remaining = 5 - attempts
        return new Response(
          JSON.stringify({ success: false, error: `Código incorrecto. Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Código correcto en DEV: actualizar perfil
      const updatePayload: Record<string, unknown> = {
        phone_verified: true,
        phone_otp_code: null,
        phone_otp_expires_at: null,
        phone_otp_attempts: 0,
      }
      if (phone) {
        updatePayload.phone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+${phone.replace(/\D/g, '')}`
      }

      const { error: updateErr } = await supabase.from('profiles').update(updatePayload).eq('id', userId)
      if (updateErr) throw new Error(`Error actualizando perfil: ${updateErr.message}`)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

  } catch (err) {
    captureEdgeFunctionError(err as Error, {
      functionName: 'verify-phone-otp',
      operation: 'verifyOtp',
    })
    await flushSentry()
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
