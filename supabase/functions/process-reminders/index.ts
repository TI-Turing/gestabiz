// Supabase Edge Function: process-reminders
// Runs every 15 minutes to send 24h and 2h appointment reminders.
// Windowing uses 15-minute slots: [24h, 24h15m] and [2h, 2h15m].

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('process-reminders')

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    // Permitir llamadas internas desde cron jobs (sin autenticación externa)
    // La Edge Function usa sus propias variables de entorno de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()
    const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60 * 1000)

    // Windows to catch every-15-min cron — 15-minute slots to avoid duplicates
    const windowStart24h = addMinutes(now, 24 * 60)
    const windowEnd24h = addMinutes(now, 24 * 60 + 15)

    const windowStart2h = addMinutes(now, 120)
    const windowEnd2h = addMinutes(now, 120 + 15)

    // Fetch appointments in both windows
    const [{ data: appts24h, error: err24 }, { data: appts2h, error: err2 }] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, client_id')
        .in('status', ['confirmed', 'pending'])
        .gte('start_time', windowStart24h.toISOString())
        .lte('start_time', windowEnd24h.toISOString()),
      supabase
        .from('appointments')
        .select('id, client_id')
        .in('status', ['confirmed', 'pending'])
        .gte('start_time', windowStart2h.toISOString())
        .lte('start_time', windowEnd2h.toISOString()),
    ])

    if (err24) throw new Error(`Failed to fetch 24h window appointments: ${err24.message}`)
    if (err2) throw new Error(`Failed to fetch 2h window appointments: ${err2.message}`)

    const whatsappConfigured = !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_WHATSAPP_NUMBER'))
    const smsConfigured = !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_SMS_NUMBER'))

    const allApptIds = [
      ...(appts24h ?? []).map(a => a.id),
      ...(appts2h ?? []).map(a => a.id),
    ]

    // ✅ Batch-fetch all existing notifications for these appointments in ONE query
    // instead of calling hasNotification() per appointment (N+1 pattern)
    const existingNotifSet = new Set<string>()
    if (allApptIds.length > 0) {
      const { data: existingNotifs } = await supabase
        .from('notifications')
        .select('appointment_id, type, delivery_method')
        .in('appointment_id', allApptIds)
        .in('type', ['reminder_24h', 'reminder_2h'])

      for (const n of existingNotifs ?? []) {
        existingNotifSet.add(`${n.appointment_id}:${n.type}:${n.delivery_method}`)
      }
    }

    const notificationsToCreate: Array<{
      appointment_id: string
      user_id: string | null
      type: 'reminder_24h' | 'reminder_2h'
      title: string
      message: string
      scheduled_for: string
      delivery_method: 'email' | 'whatsapp' | 'sms'
    }> = []

    const addIfNew = (
      apptId: string,
      userId: string | null,
      type: 'reminder_24h' | 'reminder_2h',
      title: string,
      message: string,
      delivery: 'email' | 'whatsapp' | 'sms',
    ) => {
      if (!existingNotifSet.has(`${apptId}:${type}:${delivery}`)) {
        notificationsToCreate.push({
          appointment_id: apptId,
          user_id: userId,
          type,
          title,
          message,
          scheduled_for: now.toISOString(),
          delivery_method: delivery,
        })
      }
    }

    // Build notifications for 24h window
    for (const appt of appts24h ?? []) {
      const userId = appt.client_id ?? null
      const msg = 'Tu cita es manana. Revisa los detalles en tu cuenta de Gestabiz.'
      addIfNew(appt.id, userId, 'reminder_24h', 'Recordatorio de cita (24h)', msg, 'email')
      if (whatsappConfigured) addIfNew(appt.id, userId, 'reminder_24h', 'Recordatorio de cita (24h)', msg, 'whatsapp')
      if (smsConfigured) addIfNew(appt.id, userId, 'reminder_24h', 'Recordatorio de cita (24h)', msg, 'sms')
    }

    // Build notifications for 2h window
    for (const appt of appts2h ?? []) {
      const userId = appt.client_id ?? null
      const msg = 'Tu cita es en 2 horas. Revisa los detalles en tu cuenta de Gestabiz.'
      addIfNew(appt.id, userId, 'reminder_2h', 'Recordatorio de cita (2h)', msg, 'email')
      if (whatsappConfigured) addIfNew(appt.id, userId, 'reminder_2h', 'Recordatorio de cita (2h)', msg, 'whatsapp')
      if (smsConfigured) addIfNew(appt.id, userId, 'reminder_2h', 'Recordatorio de cita (2h)', msg, 'sms')
    }

    let created: any[] = []
    if (notificationsToCreate.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('notifications')
        .insert(
          notificationsToCreate.map(n => ({
            ...n,
            status: 'queued',
          }))
        )
        .select('*')
      if (insertErr) throw new Error(`Failed to insert notifications: ${insertErr.message}`)
      created = inserted ?? []
    }

    // Fire actual senders in parallel batches grouped by delivery_method
    const senderUrl = (method: string) => {
      if (method === 'whatsapp') return `${supabaseUrl}/functions/v1/send-whatsapp-reminder`
      if (method === 'sms') return `${supabaseUrl}/functions/v1/send-sms-reminder`
      return `${supabaseUrl}/functions/v1/send-email-reminder`
    }

    await Promise.allSettled(
      created.map(n =>
        fetch(senderUrl(n.delivery_method), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId: n.id, appointmentId: n.appointment_id, type: n.type }),
        }).catch(async (sendErr) => {
          await supabase
            .from('notifications')
            .update({ status: 'failed', error_message: `${sendErr}` })
            .eq('id', n.id)
        })
      )
    )

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          window24h: { start: windowStart24h.toISOString(), end: windowEnd24h.toISOString(), count: (appts24h ?? []).length },
          window2h: { start: windowStart2h.toISOString(), end: windowEnd2h.toISOString(), count: (appts2h ?? []).length },
          created: created.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'process-reminders' })
    await flushSentry()
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
