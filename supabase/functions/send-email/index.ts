import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('send-email')

// Valida dirección de email (RFC5322 básico) y previene header injection
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

function sanitizeEmailField(value: string): string {
  // Eliminar CRLF para prevenir email header injection
  return value.replace(/[\r\n]/g, ' ').trim()
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254
}

interface EmailRequest {
  to: string
  subject: string
  message: string
  template?: 'reminder' | 'confirmation' | 'cancellation' | 'follow_up'
  appointmentData?: Record<string, unknown>
}

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  try {
    // ─── AUTENTICACIÓN: solo llamadas internas (service role) ──────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    let body: EmailRequest
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { to, subject, message, template, appointmentData } = body

    // ─── VALIDACIÓN DE INPUTS ──────────────────────────────────────────────────
    if (!to || typeof to !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid recipient email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const sanitizedTo = sanitizeEmailField(to)
    if (!validateEmail(sanitizedTo)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid recipient email format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!subject || typeof subject !== 'string' || subject.length > 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid subject' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const sanitizedSubject = sanitizeEmailField(subject)

    // Limitar tamaño de mensaje para evitar abusos
    const sanitizedMessage = typeof message === 'string' ? message.substring(0, 10000) : ''

    const { to: _to, subject: _subject, message: _message, ...rest } = body
    const sanitizedBody: EmailRequest = {
      ...rest,
      to: sanitizedTo,
      subject: sanitizedSubject,
      message: sanitizedMessage,
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Usar datos sanitizados a partir de aquí
    const { to: finalTo, subject: finalSubject, message: finalMessage, template: finalTemplate, appointmentData: finalAppointmentData } = sanitizedBody

    // Email service configuration (using Resend as example)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('Email service not configured')
    }

    // Helpers para resolver ubicación/dirección y ciudad
    const isUUID = (s?: string) => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s).trim())

    const resolveCityName = async (cityOrUuid?: string): Promise<string | undefined> => {
      const candidate = (cityOrUuid || '').trim()
      if (!candidate) return undefined
      if (!isUUID(candidate)) return candidate
      try {
        const { data: cityRow } = await supabase
          .from('cities')
          .select('name')
          .eq('id', candidate)
          .single()
        return cityRow?.name || candidate
      } catch (_) {
        return candidate
      }
    }

    const resolveLocationFromAppointment = async (apt: any) => {
      let locationName: string | undefined = apt?.location_name || apt?.location || undefined
      let address: string | undefined = apt?.location_address || apt?.address || undefined
      let city: string | undefined = apt?.location_city || apt?.city || undefined

      // Si tenemos location_id, enriquecer desde locations
      const locationId: string | undefined = apt?.location_id || apt?.location?.id || undefined
      if (locationId) {
        try {
          const { data: loc } = await supabase
            .from('locations')
            .select('name,address,city')
            .eq('id', locationId)
            .single()
          locationName = locationName || loc?.name
          address = address || loc?.address
          city = city || loc?.city
        } catch (_) {}
      }

      // Si la dirección trae ", <UUID>", separarlo y resolver ciudad
      if (address && /,\s*[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(address)) {
        const match = address.match(/^(.*?),\s*([0-9a-f-]{36})$/i)
        if (match) {
          address = match[1]
          city = city || match[2]
        }
      }

      // Resolver ciudad si es UUID
      city = await resolveCityName(city)

      const addressLine = address ? `${address}${city ? `, ${city}` : ''}` : undefined
      return {
        locationText: locationName || 'Por confirmar',
        addressText: addressLine
      }
    }

    // Build email content based on template — usar variables sanitizadas
    let emailContent = finalMessage
    let emailSubject = finalSubject

    if (finalTemplate && finalAppointmentData) {
      const appointmentData = finalAppointmentData
      const template = finalTemplate
      switch (template) {
        case 'reminder':
          emailSubject = `Recordatorio: ${appointmentData.title}`
          {
            const loc = await resolveLocationFromAppointment(appointmentData)
            emailContent = `
            Hola ${appointmentData.client_name},
            
            Te recordamos que tienes una cita programada:
            
            📅 Fecha: ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
            🕐 Hora: ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            📍 Lugar: ${loc.locationText}
            ${loc.addressText ? `📍 Dirección: ${loc.addressText}` : ''}
            📝 Servicio: ${appointmentData.title}
            
            ${appointmentData.notes ? `Notas: ${appointmentData.notes}` : ''}
            
            ¡Te esperamos!
          `
          }
          break
        case 'confirmation':
          emailSubject = `Cita Confirmada: ${appointmentData.title}`
          {
            const loc = await resolveLocationFromAppointment(appointmentData)
            emailContent = `
            Hola ${appointmentData.client_name},
            
            Tu cita ha sido confirmada:
            
            📅 Fecha: ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
            🕐 Hora: ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            📍 Lugar: ${loc.locationText}
            ${loc.addressText ? `📍 Dirección: ${loc.addressText}` : ''}
            📝 Servicio: ${appointmentData.title}
            
            Si necesitas cancelar o reprogramar, por favor contáctanos lo antes posible.
          `
          }
          break
        case 'cancellation':
          emailSubject = `Cita Cancelada: ${appointmentData.title}`
          emailContent = `
            Hola ${appointmentData.client_name},
            
            Lamentamos informarte que tu cita ha sido cancelada:
            
            📅 Fecha: ${new Date(appointmentData.start_time).toLocaleDateString('es-ES')}
            🕐 Hora: ${new Date(appointmentData.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            📝 Servicio: ${appointmentData.title}
            
            ${appointmentData.cancelled_reason ? `Motivo: ${appointmentData.cancelled_reason}` : ''}
            
            Puedes agendar una nueva cita cuando gustes.
          `
          break
        case 'follow_up':
          emailSubject = `Nos gustaría verte de nuevo`
          emailContent = `
            Hola ${appointmentData.client_name},
            
            Ha pasado un tiempo desde tu última visita. Nos gustaría saber de ti y ofrecerte nuestros servicios nuevamente.
            
            ¿Te gustaría agendar una nueva cita?
            
            ¡Esperamos verte pronto!
          `
          break
      }
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gestabiz <no-reply@gestabiz.com>',
        to: [finalTo],
        subject: emailSubject,
        html: emailContent.replace(/\n/g, '<br>'),
        text: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const emailResult = await emailResponse.json()

    // Log the email sending in database (optional)
    try {
      await supabase
        .from('email_logs')
        .insert({
          recipient: to,
          subject: emailSubject,
          template_used: template,
          status: 'sent',
          external_id: emailResult.id,
          sent_at: new Date().toISOString()
        })
    } catch (logError) {
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'send-email' })
    await flushSentry()
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
