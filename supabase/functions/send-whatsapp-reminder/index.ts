// Supabase Edge Function: Send WhatsApp Reminders via Twilio Content Templates
// Deploy with: npx supabase functions deploy send-whatsapp-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('send-whatsapp-reminder')

// ── helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_TIMEZONE = 'America/Bogota'

/** Format a date as "DD de MMMM de YYYY" in Spanish */
function formatDateEs(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: DEFAULT_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** Format a date as "HH:MM" */
function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  let notificationId: string | undefined

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // type may be 'reminder_24h' | 'reminder_2h'
    const body = await req.json()
    notificationId = body.notificationId
    const appointmentId: string = body.appointmentId
    const reminderType: string = body.type ?? 'reminder_2h'
    const requestRuntimeEnv: string = (body.runtimeEnv ?? '').toString().toLowerCase()
    const requestTemplateVariant: string = (body.templateVariant ?? '').toString().toLowerCase()

    if (!notificationId || !appointmentId) throw new Error('notificationId and appointmentId are required')

    // ── 1. Fetch appointment with all related data ───────────────────────────
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select(`
        id, start_time, status, business_id, confirmation_token,
        client:profiles!appointments_client_id_fkey (id, full_name, phone),
        service:services!appointments_service_id_fkey (name),
        location:locations!appointments_location_id_fkey (name, address, city),
        business:businesses!appointments_business_id_fkey (name, logo_url)
      `)
      .eq('id', appointmentId)
      .single()

    if (apptErr || !appointment) throw new Error('Appointment not found')

    // ── 2. Business channel gating ──────────────────────────────────────────
    const { data: bizSettings, error: bizErr } = await supabase
      .from('business_notification_settings')
      .select('whatsapp_enabled, notification_types')
      .eq('business_id', appointment.business_id)
      .single()

    if (bizErr) {
      await supabase.from('notifications')
        .update({ status: 'failed', error_message: 'Business settings not found' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'Business settings not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      })
    }

    const notifTypes = (bizSettings?.notification_types ?? {}) as Record<string, { enabled?: boolean; channels?: string[] }>
    const reminderCfg = notifTypes['appointment_reminder'] ?? { enabled: true, channels: ['email', 'whatsapp'] }
    const waAllowed =
      Boolean(bizSettings?.whatsapp_enabled) &&
      Boolean(reminderCfg.enabled) &&
      (reminderCfg.channels ?? []).includes('whatsapp')

    if (!waAllowed) {
      await supabase.from('notifications')
        .update({ status: 'failed', error_message: 'WhatsApp disabled by business settings' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'WhatsApp disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    // ── 3. Resolve phone number ──────────────────────────────────────────────
    const client = appointment.client as { id: string; full_name: string; phone?: string } | null
    const phoneRaw = client?.phone ?? ''
    const phoneDigits = String(phoneRaw).replace(/\D/g, '')
    if (!phoneDigits) throw new Error('Client phone/WhatsApp not available')

    // Normalize to E.164: Colombian mobile numbers stored as 10 digits (3XXXXXXXXX)
    // need the country code 57 prepended → +573XXXXXXXXX
    const e164Digits = phoneDigits.length === 10 && phoneDigits.startsWith('3')
      ? `57${phoneDigits}`
      : phoneDigits

    // ── 4. Resolve Twilio env vars ───────────────────────────────────────────
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER')
    const TEMPLATE_SID_24H_PENDING = Deno.env.get('TWILIO_TEMPLATE_SID_24H_PENDING')
    const TEMPLATE_SID_24H_CONFIRMED = Deno.env.get('TWILIO_TEMPLATE_SID_24H_CONFIRMED')
    const TEMPLATE_SID_2H_PENDING = Deno.env.get('TWILIO_TEMPLATE_SID_2H_PENDING')
    const TEMPLATE_SID_2H_CONFIRMED = Deno.env.get('TWILIO_TEMPLATE_SID_2H_CONFIRMED')
    const TEMPLATE_SID_DEV_24H_PENDING = Deno.env.get('TWILIO_TEMPLATE_SID_DEV_24H_PENDING')
    const TEMPLATE_SID_DEV_24H_CONFIRMED = Deno.env.get('TWILIO_TEMPLATE_SID_DEV_24H_CONFIRMED')
    const TEMPLATE_SID_DEV_2H_PENDING = Deno.env.get('TWILIO_TEMPLATE_SID_DEV_2H_PENDING')
    const TEMPLATE_SID_DEV_2H_CONFIRMED = Deno.env.get('TWILIO_TEMPLATE_SID_DEV_2H_CONFIRMED')
    const WHATSAPP_TEMPLATE_VARIANT = (Deno.env.get('WHATSAPP_TEMPLATE_VARIANT') ?? '').toLowerCase()
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://gestabiz.com'

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('WhatsApp provider not configured (missing TWILIO_* secrets)')
    }

    // ── 5. Build message params ──────────────────────────────────────────────
    const startDate = new Date(appointment.start_time)
    const clientName: string = client?.full_name ?? 'Cliente'
    const serviceName: string = (appointment.service as { name: string } | null)?.name ?? 'tu servicio'
    const business = appointment.business as { name: string; logo_url?: string | null } | null
    const businessName: string = business?.name ?? 'tu negocio'
    const location = appointment.location as { name?: string; address?: string; city?: string } | null
    const sedeLabel: string = location?.name ?? location?.city ?? businessName
    const logoUrl: string = business?.logo_url ?? Deno.env.get('GESTABIZ_DEFAULT_LOGO_URL') ?? `${APP_URL}/logo-light.svg`
    const token: string = (appointment as { confirmation_token?: string }).confirmation_token ?? ''

    const to = `whatsapp:+${e164Digits}`
    // Strip any non-digit chars (e.g. spaces, leading +) then re-add + to ensure valid E.164 From
    const fromDigits = TWILIO_WHATSAPP_NUMBER.replace(/\D/g, '')
    const from = `whatsapp:+${fromDigits}`
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const messagesUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const is24h = reminderType === 'reminder_24h'
    const isConfirmed = appointment.status === 'confirmed'
    const isDevRuntime = requestTemplateVariant === 'dev'
      || requestRuntimeEnv === 'development'
      || requestRuntimeEnv === 'local'
      || WHATSAPP_TEMPLATE_VARIANT === 'dev'
      || APP_URL.includes('localhost')
      || APP_URL.includes('127.0.0.1')

    const templateSid = isDevRuntime
      ? (is24h
          ? (isConfirmed ? TEMPLATE_SID_DEV_24H_CONFIRMED : TEMPLATE_SID_DEV_24H_PENDING)
          : (isConfirmed ? TEMPLATE_SID_DEV_2H_CONFIRMED : TEMPLATE_SID_DEV_2H_PENDING))
      : (is24h
          ? (isConfirmed ? TEMPLATE_SID_24H_CONFIRMED : TEMPLATE_SID_24H_PENDING)
          : (isConfirmed ? TEMPLATE_SID_2H_CONFIRMED : TEMPLATE_SID_2H_PENDING))
    // Confirmed appointments don't need a confirmation_token (appointment already confirmed).
    // Pending appointments need the token to build the confirmation link in the template.
    const hasTemplate = !!templateSid && (isConfirmed || !!token)

    const timeLabel = formatTime(startDate)
    const fallbackMsg = is24h
      ? `*Recordatorio de cita · ${businessName}*\n\nHola ${clientName}, te recordamos tu cita mañana (${formatDateEs(startDate)}) a las ${timeLabel} para ${serviceName} en ${sedeLabel}. ${isConfirmed ? 'Tu cita ya está confirmada.' : `Confirma aquí: ${APP_URL}/confirmar-cita/${token}. `}Si necesitas cancelar o reprogramar, hazlo desde la app: ${APP_URL}/app/client`
      : `*Recordatorio de cita · ${businessName}*\n\nHola ${clientName}, tu cita de ${serviceName} en ${sedeLabel} es en 2 horas (${timeLabel}). ${isConfirmed ? 'Tu cita ya está confirmada.' : `Confirma aquí: ${APP_URL}/confirmar-cita/${token}. `}Puedes cancelar o reprogramar en los próximos 30 minutos desde: ${APP_URL}/app/client`

    let messageParams: Record<string, string>

    if (hasTemplate) {
      // ── Template message ─────────────────────────────────────────────────
      // Confirmed templates have one fewer variable than pending templates:
      // - 24h confirmed: vars 1-7 (no token slot {{8}})
      // - 24h pending:   vars 1-8 (includes confirmation token as {{8}})
      // - 2h confirmed:  vars 1-6 (no token slot {{7}})
      // - 2h pending:    vars 1-7 (includes confirmation token as {{7}})
      // Sending extra variables not defined in the template causes Twilio error 21656.
      const contentVariables: Record<string, string> = is24h
        ? {
            '1': logoUrl,
            '2': businessName,
            '3': clientName,
            '4': formatDateEs(startDate),
            '5': formatTime(startDate),
            '6': sedeLabel,
            '7': serviceName,
            ...(isConfirmed ? {} : { '8': token }),
          }
        : {
            '1': logoUrl,
            '2': businessName,
            '3': clientName,
            '4': formatTime(startDate),
            '5': sedeLabel,
            '6': serviceName,
            ...(isConfirmed ? {} : { '7': token }),
          }

      messageParams = {
        To: to,
        From: from,
        ContentSid: templateSid!,
        ContentVariables: JSON.stringify(contentVariables),
      }
    } else {
      // No hay template disponible — los mensajes proactivos de WhatsApp SIEMPRE requieren template aprobado.
      // Para citas 'confirmed' solo se necesita templateSid.
      // Para citas 'pending' se necesita templateSid + confirmation_token (enlace de confirmación).
      throw new Error('No WhatsApp template available: missing Twilio templateSid or (for pending appointments) confirmation_token. Proactive messages require an approved template.')
    }

    // ── 6. Send via Twilio ───────────────────────────────────────────────────
    const resp = await fetch(messagesUrl, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(messageParams),
    })

    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(`Twilio error: ${txt}`)
    }

    await supabase.from('notifications')
      .update({ status: 'sent' })
      .eq('id', notificationId)

    return new Response(JSON.stringify({ success: true, template: hasTemplate }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })

  } catch (error) {
    if (notificationId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await supabase.from('notifications')
          .update({ status: 'failed', error_message: String(error) })
          .eq('id', notificationId)
      } catch (_) { /* best-effort */ }
    }

    captureEdgeFunctionError(error as Error, { functionName: 'send-whatsapp-reminder' })
    await flushSentry()
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
