// Supabase Edge Function: Send SMS Reminders
// Deploy with: npx supabase functions deploy send-sms-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { validatePhone } from '../_shared/validation.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('send-sms-reminder')

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { notificationId, appointmentId, type } = await req.json()
    if (!notificationId || !appointmentId || !type) {
      throw new Error('notificationId, appointmentId and type are required')
    }

    // Fetch appointment with client contact and business_id
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select(`
        id, title, start_time, business_id,
        client:profiles!client_id(id, full_name, phone)
      `)
      .eq('id', appointmentId)
      .single()
    if (apptErr || !appointment) throw new Error('Appointment not found')

    // Business-level channel gating
    const { data: bizSettings, error: bizErr } = await supabase
      .from('business_notification_settings')
      .select('*')
      .eq('business_id', appointment.business_id)
      .single()
    if (bizErr) {
      await supabase
        .from('notifications')
        .update({ status: 'failed', error_message: 'Business settings not found for SMS channel' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'Business settings not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const notifTypes = (bizSettings?.notification_types ?? {}) as Record<string, { enabled?: boolean; channels?: string[] }>
    const reminderCfg = notifTypes['appointment_reminder'] || { enabled: true, channels: ['email', 'whatsapp'] }
    const smsAllowed = Boolean(bizSettings?.sms_enabled) && Boolean(reminderCfg.enabled) && (reminderCfg.channels || []).includes('sms')
    if (!smsAllowed) {
      await supabase
        .from('notifications')
        .update({ status: 'failed', error_message: 'SMS disabled by business settings' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'SMS disabled by business settings' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const phoneRaw = String(appointment.client?.phone ?? '').trim()
    if (!phoneRaw) throw new Error('Client phone not available')

    // Validar formato E.164 antes de enviar a Twilio
    if (!validatePhone(phoneRaw)) {
      await supabase
        .from('notifications')
        .update({ status: 'failed', error_message: 'Invalid phone number format (E.164 required)' })
        .eq('id', notificationId)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const start = new Date(appointment.start_time)
    const timeStr = start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dateStr = start.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })

    const name = appointment.client?.full_name ?? ''
    const msg24h = `Hola ${name}, te recordamos tu cita mañana (${dateStr}) a las ${timeStr}. Si necesitas reprogramar, responde este mensaje.`
    const msg1h = `Hola ${name}, tu cita es en 1 hora a las ${timeStr}. ¡Te esperamos!`
    const msg = type === 'reminder_24h' ? msg24h : msg1h

    // Twilio SMS configuration
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_SMS_NUMBER = Deno.env.get('TWILIO_SMS_NUMBER')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_SMS_NUMBER) {
      throw new Error('SMS provider not configured')
    }

    const to = phoneRaw.startsWith('+') ? phoneRaw : `+${phoneRaw.replace(/\D/g, '')}`
    const from = TWILIO_SMS_NUMBER

    // Twilio API call
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: from, Body: msg })
    })
    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(`Failed to send SMS: ${txt}`)
    }

    await supabase
      .from('notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', notificationId)

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    // Best-effort failure mark
    try {
      const cloned = await req.clone().json().catch(() => null)
      const nid = cloned?.notificationId
      if (nid) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await supabase
          .from('notifications')
          .update({ status: 'failed', error_message: String(error) })
          .eq('id', nid)
      }
    } catch (_) {}

    console.error('Error sending SMS reminder:', error)
    captureEdgeFunctionError(_ as Error, { functionName: 'send-sms-reminder' })
    await flushSentry()
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
