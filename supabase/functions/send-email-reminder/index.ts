// Supabase Edge Function: Send Email Reminders
// Deploy with: npx supabase functions deploy send-email-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

// Escapa caracteres HTML para prevenir inyección en templates de email
function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

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

    // Fetch appointment with client profile and business_id
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .select(`
        id, title, description, notes, start_time, business_id,
        client:profiles!client_id(id, email, full_name),
        location:locations(id, name, address)
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
        .update({ status: 'cancelled', error_message: 'Business settings not found for email channel' })
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
        .update({ status: 'cancelled', error_message: 'Email disabled by business settings' })
        .eq('id', notificationId)
      return new Response(JSON.stringify({ success: false, error: 'Email disabled by business settings' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const appointmentDate = new Date(appointment.start_time)
    const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const formattedTime = appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

    // Escapar todos los datos de usuario antes de insertar en HTML
    const safeTitle = escapeHtml(appointment.title ?? 'Tu cita')
    const safeLocationName = escapeHtml(appointment.location?.name)
    const safeDescription = escapeHtml(appointment.description)
    const safeNotes = escapeHtml(appointment.notes)

    const emailSubject = `Recordatorio: ${safeTitle}`
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Recordatorio de Cita</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea; margin-top: 0;">Detalles de su cita:</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Título:</strong> ${safeTitle}</p>
                <p style="margin: 0 0 10px 0;"><strong>Fecha:</strong> ${formattedDate}</p>
                <p style="margin: 0 0 10px 0;"><strong>Hora:</strong> ${formattedTime}</p>
                ${safeLocationName ? `<p style="margin: 0 0 10px 0;"><strong>Ubicación:</strong> ${safeLocationName}</p>` : ''}
                ${safeDescription ? `<p style="margin: 0 0 10px 0;"><strong>Descripción:</strong> ${safeDescription}</p>` : ''}
              </div>
              ${safeNotes ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;"><strong>Notas:</strong> ${safeNotes}</p>
                </div>
              ` : ''}
              <div style="margin: 30px 0; text-align: center;">
                <p style="margin: 0; color: #6c757d;">Este es un recordatorio automático enviado por Gestabiz.</p>
              </div>
              <div style="border-top: 1px solid #e1e5e9; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px;">
                <p>Gestabiz - Sistema de Gestión de Citas</p>
                <p>Si tienes alguna pregunta, contacta directamente con tu proveedor de servicios.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')

    const toEmail = appointment.client?.email
    if (!toEmail) throw new Error('Client email not available')

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gestabiz <noreply@your-domain.com>',
        to: [toEmail],
        subject: emailSubject,
        html: emailBody,
      }),
    })
    if (!emailResponse.ok) {
      const errText = await emailResponse.text()
      throw new Error(`Failed to send email: ${errText}`)
    }

    await supabase
      .from('notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
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
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
