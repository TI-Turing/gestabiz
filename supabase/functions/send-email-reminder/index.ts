// Supabase Edge Function: Send Email Reminders
// Deploy with: npx supabase functions deploy send-email-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { escapeHtml } from '../_shared/html.ts'
import { sendBrevoEmail } from '../_shared/brevo.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('send-email-reminder')

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
    const { notificationId, appointmentId } = await req.json()
    if (!notificationId || !appointmentId) {
      throw new Error('notificationId and appointmentId are required')
    }

    // Fetch notification
    const { data: notification, error: notifErr } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()
    if (notifErr) throw new Error(`Failed to fetch notification: ${notifErr.message}`)

    // Fetch appointment with client profile, business and token
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select(`
        id, notes, client_notes, start_time, business_id, status, confirmation_token,
        service:services!appointments_service_id_fkey(id, name),
        client:profiles!appointments_client_id_fkey(id, email, full_name),
        location:locations!appointments_location_id_fkey(id, name, address),
        business:businesses!appointments_business_id_fkey(id, name)
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
      // If settings missing, treat as disabled to be safe
      await supabase
        .from('notifications')
        .update({ status: 'failed', error_message: 'Business settings not found for email channel' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'Business settings not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const notifTypes = (bizSettings?.notification_types ?? {}) as Record<string, { enabled?: boolean; channels?: string[] }>
    const reminderCfg = notifTypes['appointment_reminder'] || { enabled: true, channels: ['email', 'whatsapp'] }
    const emailAllowed = Boolean(bizSettings?.email_enabled) && Boolean(reminderCfg.enabled) && (reminderCfg.channels || []).includes('email')
    if (!emailAllowed) {
      await supabase
        .from('notifications')
        .update({ status: 'failed', error_message: 'Email disabled by business settings' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'Email disabled by business settings' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const appointmentDate = new Date(appointment.start_time)
    const DEFAULT_TIMEZONE = 'America/Bogota'
    const formattedDate = new Intl.DateTimeFormat('es-CO', {
      timeZone: DEFAULT_TIMEZONE,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(appointmentDate)
    const formattedTime = new Intl.DateTimeFormat('es-CO', {
      timeZone: DEFAULT_TIMEZONE,
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(appointmentDate)

    const APP_URL = (Deno.env.get('APP_URL') ?? 'https://gestabiz.com').replace(/\/$/, '')
    const token: string = (appointment as any).confirmation_token ?? ''
    const appointmentStatus: string = (appointment as any).status ?? 'pending'
    const isConfirmed = appointmentStatus === 'confirmed'
    const businessName = escapeHtml((appointment as any).business?.name ?? 'tu negocio')

    // ── CTA Buttons based on status ───────────────────────────────────────────
    const ctaButtonsHtml = token ? `
            <div style="text-align:center;margin:28px 0 4px">
              ${!isConfirmed ? `
              <a href="${APP_URL}/confirmar-cita/${token}"
                 style="display:inline-block;background:#6820F7;color:#ffffff;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:10px;margin:6px 8px;letter-spacing:.3px;">
                Confirmar asistencia
              </a>` : ''}
              <a href="${APP_URL}/cancelar-cita/${token}"
                 style="display:inline-block;background:#ffffff;color:#dc2626;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;border:2px solid #dc2626;margin:6px 8px;letter-spacing:.3px;">
                Cancelar cita
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:10px;margin-bottom:0;">
              ${!isConfirmed
                ? 'Tienes <strong>30 minutos</strong> desde este mensaje para confirmar o cancelar sin costo.'
                : 'Si necesitas cancelar, puedes hacerlo durante los próximos <strong>30 minutos</strong>.'}
            </p>` : ''

    // Escapar todos los datos de usuario antes de insertar en HTML
    const safeTitle = escapeHtml((appointment.service as any)?.name ?? 'Tu cita')
    const safeLocationName = escapeHtml(appointment.location?.name)
    const safeDescription = escapeHtml(appointment.client_notes ?? appointment.notes)

    const emailSubject = isConfirmed
      ? `Tu cita está confirmada — ${safeTitle}`
      : `Recordatorio: ${safeTitle}`

    // Location detail rows (rendered only when data is present)
    const locationRowHtml = safeLocationName ? `
                <div class="detail-row">
                    <div class="detail-icon teal"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3bbfa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                    <div class="detail-content">
                        <span class="detail-label">Sede</span>
                        <span class="detail-value">${safeLocationName}${escapeHtml(appointment.location?.address ?? '') ? `<br><span style="color:#64748b;font-size:13px;">${escapeHtml(appointment.location?.address ?? '')}</span>` : ''}</span>
                    </div>
                </div>` : ''

    const clientNotesRowHtml = safeDescription ? `
                <div class="detail-row">
                    <div class="detail-icon amber" style="background:#fffbeb;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                    <div class="detail-content">
                        <span class="detail-label">Notas</span>
                        <span class="detail-value">${safeDescription}</span>
                    </div>
                </div>` : ''

    const safeClientName = escapeHtml(appointment.client?.full_name ?? 'estimado usuario')

    const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio de Cita - Gestabiz</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#F5F4FB;padding:40px 20px;line-height:1.6}
        .email-wrapper{max-width:600px;margin:0 auto}
        .header{background-color:#6820F7;border-radius:16px 16px 0 0;padding:36px 32px 28px;text-align:center}
        .header-wordmark{font-family:'Outfit',sans-serif;font-size:30px;font-weight:700;letter-spacing:-.5px;line-height:1}
        .header-tagline{margin-top:10px;font-family:'Outfit',sans-serif;font-size:11px;font-weight:500;letter-spacing:2.5px;text-transform:uppercase;color:#3bbfa0}
        .reminder-badge{display:inline-block;background:rgba(59,191,160,.2);border:1px solid rgba(59,191,160,.5);color:#3bbfa0;font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-top:16px}
        .email-card{background:#fff;padding:44px 40px 36px}
        h1{color:#1e293b;font-size:26px;font-weight:700;margin-bottom:12px;text-align:center;line-height:1.3}
        .accent-line{width:48px;height:3px;background:linear-gradient(90deg,#6820F7,#3bbfa0);border-radius:2px;margin:20px auto 28px}
        .greeting{color:#475569;font-size:15px;margin-bottom:20px;text-align:center}
        .message{color:#64748b;font-size:15px;margin-bottom:16px;text-align:center;line-height:1.75}
        .details-card{background:#F5F4FB;border:1px solid #ede9f9;border-radius:12px;padding:28px;margin:28px 0}
        .details-title{color:#6820F7;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:18px}
        .detail-row{display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid #ede9f9}
        .detail-row:last-child{border-bottom:none;padding-bottom:0}
        .detail-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}
        .detail-icon.violet{background:#f0eeff}
        .detail-icon.teal{background:#f0fdfb}
        .detail-label{color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;display:block;margin-bottom:2px}
        .detail-value{color:#1e293b;font-size:15px;font-weight:500;line-height:1.4}
        .divider{height:1px;background-color:#ede9f9;margin:32px 0}
        .help-note{background:#f0fdfb;border-left:4px solid #3bbfa0;padding:14px 18px;border-radius:0 8px 8px 0;margin:24px 0}
        .help-note p{color:#1e6b5c;font-size:13.5px;margin:0;line-height:1.6}
        .footer{background:#f0eeff;border-radius:0 0 16px 16px;padding:28px 32px;text-align:center;border-top:1px solid #ede9f9}
        .footer-text{color:#7c6fab;font-size:12.5px;margin-bottom:6px;line-height:1.5}
        .footer-link{color:#6820F7;text-decoration:none;font-size:12.5px;font-weight:500;margin:0 10px}
        .footer-divider{display:inline-block;color:#c4b8e8;margin:0 2px}
        @media only screen and (max-width:600px){body{padding:0}.header{border-radius:0;padding:28px 20px 22px}.email-card{padding:32px 20px 28px}.details-card{padding:20px}.footer{border-radius:0;padding:22px 20px}h1{font-size:22px}}
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <a href="https://gestabiz.com" style="display:inline-flex;align-items:center;gap:14px;text-decoration:none;">
                <img src="https://gestabiz.com/logo-icon.svg" width="52" height="52" alt="G" style="display:block;width:52px;height:52px;border-radius:11px;">
                <span class="header-wordmark">
                    <span style="color:#f0eeff;">Gesta</span><span style="color:#3bbfa0;">biz</span>
                </span>
            </a>
            <p class="header-tagline">Agenda &middot; Gestiona &middot; Crece</p>
            <div class="reminder-badge">Recordatorio de cita</div>
        </div>
        <div class="email-card">
            <h1>Tu cita es pronto</h1>
            <div class="accent-line"></div>
            <p class="greeting">Hola <strong>${safeClientName}</strong>,</p>
            <p class="message">Te recordamos que tienes una cita programada. Aquí tienes todos los detalles:</p>
            <div class="details-card">
                <p class="details-title">Detalles de la cita</p>
                <div class="detail-row" style="padding-top:0">
                    <div class="detail-icon violet"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6820F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
                    <div>
                        <span class="detail-label">Servicio</span>
                        <span class="detail-value">${safeTitle}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon teal"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3bbfa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                    <div>
                        <span class="detail-label">Fecha</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-icon violet"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6820F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                    <div>
                        <span class="detail-label">Hora</span>
                        <span class="detail-value">${formattedTime}</span>
                    </div>
                </div>
                ${locationRowHtml}
                ${clientNotesRowHtml}
            </div>
            <div class="divider"></div>
            ${ctaButtonsHtml || `
            <div class="help-note">
                <p>Si necesitas cancelar o reprogramar tu cita, por favor comunícate directamente con <strong>${businessName}</strong> con suficiente anticipación.</p>
            </div>`}
        </div>
        <div class="footer">
            <p class="footer-text">&copy; 2026 Gestabiz &mdash; Todos los derechos reservados.</p>
            <p class="footer-text">Este es un recordatorio automático. No responder a este correo.</p>
            <div style="margin-top:14px">
                <a href="https://gestabiz.com" class="footer-link">Sitio web</a>
                <span class="footer-divider">&bull;</span>
                <a href="https://gestabiz.com/support" class="footer-link">Soporte</a>
                <span class="footer-divider">&bull;</span>
                <a href="https://gestabiz.com/privacy" class="footer-link">Privacidad</a>
                <span class="footer-divider">&bull;</span>
                <a href="https://gestabiz.com/terms" class="footer-link">Términos</a>
            </div>
        </div>
    </div>
</body>
</html>`

    const toEmail = appointment.client?.email
    if (!toEmail) throw new Error('Client email not available')

    const brevoResult = await sendBrevoEmail({
      to: toEmail,
      subject: emailSubject,
      htmlBody: emailBody,
      textBody: emailSubject,
      fromEmail: Deno.env.get('FROM_EMAIL') || Deno.env.get('BREVO_SMTP_USER') || 'noreply@gestabiz.app',
      fromName: 'Gestabiz',
    })
    if (!brevoResult.success) {
      throw new Error(`Failed to send email: ${brevoResult.error}`)
    }

    await supabase
      .from('notifications')
      .update({ status: 'sent', sent_via_email: true })
      .eq('id', notificationId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Best effort mark failure if notificationId present
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

    console.error('Error sending email reminder:', error)
    captureEdgeFunctionError(error as Error, { functionName: 'send-email-reminder' })
    await flushSentry()
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
