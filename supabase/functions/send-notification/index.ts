import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Sentry deshabilitado temporalmente para evitar fallos en carga del worker
import { sendBrevoEmail, createBasicEmailTemplate } from '../_shared/brevo.ts'
import { initSentry, captureEdgeFunctionError, captureEdgeFunctionMessage, flushSentry } from '../_shared/sentry.ts'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

// Initialize Sentry (se activa solo si existe SENTRY_DSN)
initSentry('send-notification')

interface NotificationRequest {
  type: 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation' | 
        'appointment_location_update' |
        'appointment_new_client' | 'appointment_new_employee' | 'appointment_new_business' |
        'email_verification' | 'phone_verification_sms' | 'phone_verification_whatsapp' |
        'employee_request_new' | 'employee_request_accepted' | 'employee_request_rejected' |
        'job_vacancy_new' | 'job_application_new' | 'job_application_accepted' | 
        'job_application_rejected' | 'job_application_interview'
  
  recipient_user_id?: string
  recipient_email?: string
  recipient_phone?: string
  recipient_whatsapp?: string
  recipient_name?: string
  
  business_id?: string
  appointment_id?: string
  
  data: any // Datos específicos del tipo de notificación
  
  force_channels?: ('email' | 'sms' | 'whatsapp' | 'in_app')[] // Forzar canales específicos
  skip_preferences?: boolean // Ignorar preferencias del usuario (para verificaciones)
  
  // Campos específicos para notificaciones in-app
  action_url?: string // URL de navegación al hacer clic
  priority?: number // -1: low, 0: normal, 1: high, 2: urgent
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const origin = req.headers.get('origin')
  const acrh = req.headers.get('Access-Control-Request-Headers')
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    captureEdgeFunctionMessage('send-notification:start', 'info', { request_id: requestId })
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: NotificationRequest = await req.json()
    
    captureEdgeFunctionMessage('send-notification:request', 'info', {
      request_id: requestId,
      type: request.type,
      has_recipient_email: Boolean(request.recipient_email),
      has_recipient_user_id: Boolean(request.recipient_user_id),
      business_id: request.business_id || 'none',
      appointment_id: request.appointment_id || 'none'
    })
    
    // Determinar canales a usar
    const channels = await determineChannels(supabase, request)
    captureEdgeFunctionMessage('send-notification:channels', 'info', { request_id: requestId, channels: channels.join(',') })
    
    // Preparar contenido de la notificación
    const content = await prepareNotificationContent(request, supabase)
    
    // Enriquecer destinatario: si falta email pero tenemos user_id, resolver desde profiles
    if (!request.recipient_email && request.recipient_user_id) {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', request.recipient_user_id)
        .single()
      if (profile?.email) {
        request.recipient_email = profile.email
        if (!request.recipient_name && profile.full_name) {
          request.recipient_name = profile.full_name
        }
      } else {
      }
    }
    
    // Construir diagnósticos ligeros (sin exponer secretos)
    const diagnostics = {
      env: {
        hasBrevoApiKey: Boolean(Deno.env.get('BREVO_API_KEY')),
        fromEmail: Deno.env.get('FROM_EMAIL') || Deno.env.get('BREVO_SMTP_USER') || 'noreply@gestabiz.app'
      },
      recipient: {
        email: request.recipient_email || null,
        name: request.recipient_name || null
      },
      cors: {
        origin,
        allowedOrigin: corsHeaders['Access-Control-Allow-Origin'],
        requestedHeaders: acrh || null
      },
      channels_selected: channels
    }
    captureEdgeFunctionMessage('send-notification:diagnostics', 'info', { request_id: requestId, hasBrevoApiKey: String(diagnostics.env.hasBrevoApiKey), fromEmail: diagnostics.env.fromEmail })

    // Enviar por cada canal
    const results = []
    
    for (const channel of channels) {
      try {
        let sent = false
        let externalId = null
        let errorMsg = null

        switch (channel) {
          case 'email': {
            const emailResult = await sendEmail(request, content)
            sent = emailResult.success
            externalId = ('messageId' in emailResult) ? emailResult.messageId : null
            errorMsg = emailResult.error || null
            break
          }
            
          case 'sms': {
            const smsResult = await sendSMS(request, content)
            sent = smsResult.success
            externalId = smsResult.id
            errorMsg = smsResult.error
            break
          }
            
          case 'whatsapp': {
            const waResult = await sendWhatsApp(request, content)
            sent = waResult.success
            externalId = waResult.id
            errorMsg = waResult.error
            break
          }
            
          case 'in_app': {
            const inAppResult = await sendInAppNotification(supabase, request, content)
            sent = inAppResult.success
            externalId = inAppResult.id
            errorMsg = inAppResult.error
            break
          }
        }


        // Registrar en notification_log
        const logData = {
          business_id: request.business_id,
          appointment_id: request.appointment_id,
          user_id: request.recipient_user_id,
          notification_type: request.type,
          channel: channel,
          recipient_name: request.recipient_name,
          recipient_contact: getRecipientContact(request, channel),
          subject: content.subject,
          message: content.message,
          status: sent ? 'sent' : 'failed',
          sent_at: sent ? new Date().toISOString() : null,
          external_id: externalId,
          error_message: errorMsg,
          metadata: request.data
        }
        
        const logResult = await supabase.from('notification_log').insert(logData)

        results.push({
          channel,
          sent,
          externalId,
          error: errorMsg
        })

        // Si se envió exitosamente y no requiere fallback, salir
        if (sent && !request.force_channels) {
          break
        }
      } catch (error) {
        results.push({
          channel,
          sent: false,
          error: error.message
        })
      }
    }

    const responseBody = {
      success: results.some(r => r.sent),
      type: request.type,
      channels_attempted: results.length,
      channels_succeeded: results.filter(r => r.sent).length,
      results,
      diagnostics,
      trace_id: requestId
    }
    captureEdgeFunctionMessage('send-notification:response', responseBody.success ? 'info' : 'warning', { request_id: requestId, channels_succeeded: responseBody.channels_succeeded })
    await flushSentry()
    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    captureEdgeFunctionError(error as Error, {
      functionName: 'send-notification',
      requestId,
      operation: 'serve'
    })
    
    // Sentry disabled: log request body for diagnostics only
    try {
    } catch {}

    // Diagnósticos mínimos también en error
    const errorDiagnostics: any = {
      env: {
        hasBrevoApiKey: Boolean(Deno.env.get('BREVO_API_KEY')),
        fromEmail: Deno.env.get('FROM_EMAIL') || Deno.env.get('BREVO_SMTP_USER') || 'noreply@gestabiz.app'
      },
      cors: {
        origin,
        allowedOrigin: corsHeaders['Access-Control-Allow-Origin'],
        requestedHeaders: acrh || null
      },
      recipient: null
    }

    try {
      const bodyText = await req.clone().text()
      const parsed = JSON.parse(bodyText || '{}')
      errorDiagnostics.recipient = {
        email: parsed?.recipient_email || null,
        name: parsed?.recipient_name || null
      }
    } catch {}
    
    const errorBody = { error: (error as Error).message, diagnostics: errorDiagnostics, trace_id: requestId }
    await flushSentry()
    return new Response(
      JSON.stringify(errorBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// ============================================================================
// Funciones auxiliares
// ============================================================================

type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app'

async function determineChannels(
  supabase: any,
  request: NotificationRequest
): Promise<NotificationChannel[]> {
  
  // Si se fuerzan canales específicos
  if (request.force_channels && request.force_channels.length > 0) {
    return request.force_channels
  }

  // Si se ignoran preferencias (ej: verificaciones)
  if (request.skip_preferences) {
    // Determinar qué canal usar basado en qué contacto está disponible
    const channels: NotificationChannel[] = []
    if (request.recipient_email) channels.push('email')
    if (request.recipient_whatsapp) channels.push('whatsapp')
    if (request.recipient_phone) channels.push('sms')
    return channels.slice(0, 1) // Solo uno para verificaciones
  }

  // Obtener preferencias del usuario
  if (request.recipient_user_id) {
    const { data: userPrefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', request.recipient_user_id)
      .single()

    if (userPrefs && userPrefs.notification_preferences) {
      const typePrefs = userPrefs.notification_preferences[request.type]
      
      if (typePrefs) {
        const channels: NotificationChannel[] = []
        // Siempre agregar in_app primero si está habilitado
        if (userPrefs.in_app_enabled !== false) channels.push('in_app')
        if (typePrefs.email && userPrefs.email_enabled) channels.push('email')
        if (typePrefs.whatsapp && userPrefs.whatsapp_enabled) channels.push('whatsapp')
        if (typePrefs.sms && userPrefs.sms_enabled) channels.push('sms')
        
        if (channels.length > 0) return channels
      }
    }
  }

  // Obtener configuración del negocio si aplica
  if (request.business_id) {
    const { data: bizSettings } = await supabase
      .from('business_notification_settings')
      .select('*')
      .eq('business_id', request.business_id)
      .single()

    if (bizSettings && bizSettings.channel_priority) {
      const channels: ('email' | 'sms' | 'whatsapp')[] = []
      for (const channel of bizSettings.channel_priority) {
        if (
          (channel === 'email' && bizSettings.email_enabled) ||
          (channel === 'sms' && bizSettings.sms_enabled) ||
          (channel === 'whatsapp' && bizSettings.whatsapp_enabled)
        ) {
          channels.push(channel)
        }
      }
      
      if (channels.length > 0) return channels
    }
  }

  // Default: email
  return ['email']
}

async function prepareNotificationContent(request: NotificationRequest, supabase?: any) {
  const templates = {
    appointment_confirmation: {
      subject: '✅ Cita Confirmada',
      message: `Hola {{name}},\n\nTu cita ha sido confirmada:\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Lugar: {{location}}\n📝 Servicio: {{service}}\n\n¡Te esperamos!`
    },
    appointment_reminder: {
      subject: '🔔 Recordatorio de Cita',
      message: `Hola {{name}},\n\nTe recordamos que tienes una cita:\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Lugar: {{location}}\n📝 Servicio: {{service}}\n\n¡Nos vemos pronto!`
    },
    appointment_cancellation: {
      subject: '❌ Cita Cancelada',
      message: `Hola {{name}},\n\nTu cita del {{date}} a las {{time}} ha sido cancelada.\n\nSi deseas reprogramar, contáctanos.`
    },
    appointment_location_update: {
      subject: '📍 Cambio de ubicación de tu cita',
      message: `Hola {{name}},\n\nLa sede de tu cita ha cambiado.\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Nueva dirección: {{new_address}}\n\nSi necesitas ajustar tu cita, contáctanos.`
    },
    appointment_new_client: {
      subject: '✅ Cita Agendada Exitosamente',
      message: `Hola {{client_name}},\n\n¡Tu cita ha sido agendada exitosamente!\n\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📍 Lugar: {{location}}\n📝 Servicio: {{service}}\n👨‍💼 Profesional: {{employee_name}}\n\n¡Te esperamos!`
    },
    appointment_new_employee: {
      subject: '📅 Nueva Cita Asignada',
      message: `Hola {{employee_name}},\n\nSe te ha asignado una nueva cita:\n\n👤 Cliente: {{client_name}}\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📝 Servicio: {{service}}`
    },
    appointment_new_business: {
      subject: '🎉 Nueva Cita Agendada',
      message: `Nueva cita registrada:\n\n👤 Cliente: {{client_name}}\n👨‍💼 Empleado: {{employee_name}}\n📅 Fecha: {{date}}\n🕐 Hora: {{time}}\n📝 Servicio: {{service}}`
    },
    employee_request_new: {
      subject: '👔 Nueva Solicitud de Empleado',
      message: `{{user_name}} desea unirse a tu equipo en {{business_name}}.\n\nRevisa su perfil y responde a la solicitud.`
    },
    employee_request_accepted: {
      subject: '🎉 ¡Solicitud Aceptada!',
      message: `¡Felicidades {{name}}!\n\nTu solicitud para unirte a {{business_name}} ha sido aceptada.\n\nYa puedes comenzar a gestionar citas.`
    },
    employee_request_rejected: {
      subject: 'Actualización de Solicitud',
      message: `Hola {{name}},\n\nLamentamos informarte que tu solicitud para {{business_name}} no fue aceptada en esta ocasión.`
    },
    job_application_new: {
      subject: '📋 Nueva Aplicación a Vacante',
      message: `{{user_name}} ha aplicado a la vacante: {{vacancy_title}}\n\nRevisa su perfil y experiencia.`
    },
    job_application_accepted: {
      subject: '🎉 ¡Aplicación Aceptada!',
      message: `¡Felicidades {{name}}!\n\nTu aplicación para {{vacancy_title}} en {{business_name}} ha sido aceptada.\n\nNos pondremos en contacto pronto.`
    },
    job_application_interview: {
      subject: '📞 Invitación a Entrevista',
      message: `Hola {{name}},\n\n¡Nos gustó tu perfil!\n\nTe invitamos a una entrevista para {{vacancy_title}}.\n\nFecha: {{date}}\nHora: {{time}}`
    },
    email_verification: {
      subject: '✉️ Verifica tu Email',
      message: `Hola {{name}},\n\nPor favor verifica tu email usando este código:\n\n{{code}}\n\nO haz clic en: {{link}}`
    },
    phone_verification_sms: {
      subject: 'Código de Verificación',
      message: `Tu código de verificación es: {{code}}`
    },
    phone_verification_whatsapp: {
      subject: 'Verificación de WhatsApp',
      message: `Hola {{name}}, tu código de verificación es: {{code}}`
    }
  }

  const template = templates[request.type] || {
    subject: 'Notificación',
    message: JSON.stringify(request.data)
  }

  // Intentar enriquecer variables desde appointment_details si hay appointment_id
  let appointment: any | null = null
  
  try {
    if (request.appointment_id) {
      
      // Crear cliente admin para consultar la vista
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { data: appt, error: apptError } = await supabaseAdmin
        .from('appointment_details')
        .select('id, client_name, employee_name, service_name, location_name, start_time')
        .eq('id', request.appointment_id)
        .single()
        
      if (apptError) {
      } else if (appt) {
        appointment = appt
      } else {
      }
    } else {
    }
  } catch (e) {
  }

  // Fallbacks inteligentes: si la vista no devolvió datos, resolver por IDs recibidos en request.data
  try {
    const d = request.data || {}

    // Crear cliente admin para los fallbacks
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Cliente
    if ((!appointment?.client_name || appointment?.client_name === '') && typeof d.client_id === 'string') {
      const { data: clientRow, error: clientError } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', d.client_id)
        .single()
      if (clientRow?.full_name) {
        appointment = { ...(appointment || {}), client_name: clientRow.full_name }
      }
    }

      // Empleado
      if ((!appointment?.employee_name || appointment?.employee_name === '') && typeof d.employee_id === 'string') {
        const { data: empRow, error: empError } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', d.employee_id)
          .single()
        if (empRow?.full_name) {
          appointment = { ...(appointment || {}), employee_name: empRow.full_name }
        }
      }

      // Servicio
      if ((!appointment?.service_name || appointment?.service_name === '') && typeof d.service_id === 'string') {
        const { data: svcRow, error: svcError } = await supabaseAdmin
          .from('services')
          .select('name')
          .eq('id', d.service_id)
          .single()
        if (svcRow?.name) {
          appointment = { ...(appointment || {}), service_name: svcRow.name }
        }
      }

      // Sede / ubicación: siempre intentar enriquecer dirección y ciudad si tenemos location_id
      if (typeof d.location_id === 'string') {
        const { data: locRow, error: locError } = await supabaseAdmin
          .from('locations')
          .select('name, address, city')
          .eq('id', d.location_id)
          .single()
        if (locRow?.name && (!appointment?.location_name || appointment?.location_name === '')) {
          appointment = { ...(appointment || {}), location_name: locRow.name }
        }
        if (locRow?.address) {
          appointment = { ...(appointment || {}), location_address: locRow.address }
        }
        if (locRow?.city) {
          // Puede venir como nombre o como UUID; si es UUID, resolver nombre desde cities
          const cityCandidate = String(locRow.city).trim()
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cityCandidate)
          if (isUuid) {
            try {
              const { data: cityRow } = await supabaseAdmin
                .from('cities')
                .select('name')
                .eq('id', cityCandidate)
                .single()
              const cityName = cityRow?.name || cityCandidate
              appointment = { ...(appointment || {}), location_city: cityName }
            } catch (e) {
              appointment = { ...(appointment || {}), location_city: cityCandidate }
            }
          } else {
            appointment = { ...(appointment || {}), location_city: cityCandidate }
          }
        }
      }

      // Fecha/hora desde appointment_date en payload
      if ((!appointment?.start_time || appointment?.start_time === '') && typeof d.appointment_date === 'string') {
        // Guardamos ISO para usar formato más abajo
        appointment = { ...(appointment || {}), start_time: d.appointment_date }
      }
  } catch (e) {
  }

  // Formateadores de fecha/hora en español
  const formatDate = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }
  const formatTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  // Normalizar variables con alias y fallbacks
  
  const data = request.data || {}
  const vars: Record<string, string> = {}

  // Nombre genérico del destinatario
  vars['name'] = String(
    data.name ?? request.recipient_name ?? ''
  )

  // Cliente
  vars['client_name'] = String(
    data.client_name ?? appointment?.client_name ?? request.recipient_name ?? ''
  )

  // Empleado/profesional
  vars['employee_name'] = String(
    data.employee_name ?? appointment?.employee_name ?? ''
  )

  // Servicio
  vars['service'] = String(
    data.service ?? data.service_name ?? appointment?.service_name ?? ''
  )

  // Ubicación
  vars['location'] = String(
    data.location ?? data.location_name ?? appointment?.location_name ?? ''
  )
  // Dirección de la sede (si está disponible)
  if (typeof data.new_address === 'string' && data.new_address) {
    vars['new_address'] = data.new_address
  }
  vars['address'] = String(
    (typeof data.address === 'string' ? data.address : '') ||
    (typeof data.location_address === 'string' ? data.location_address : '') ||
    (typeof (appointment && appointment.location_address) === 'string' ? appointment.location_address : '') ||
    ''
  )
  // Ciudad de la sede (si está disponible)
  vars['city'] = String(
    (typeof data.city === 'string' ? data.city : '') ||
    (typeof (appointment && (appointment as any).location_city) === 'string' ? (appointment as any).location_city : '') ||
    ''
  )
  

  // Si la ciudad aún parece un UUID, resolverla con la tabla cities para mostrar nombre
  try {
    const cityCandidate = (vars['city'] || '').trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cityCandidate)
    if (isUuid) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { data: cityRow } = await supabaseAdmin
        .from('cities')
        .select('name')
        .eq('id', cityCandidate)
        .single()
      if (cityRow?.name) {
        vars['city'] = cityRow.name
      }
    }
  } catch (e) {
  }

  // Fecha y hora
  const startIso = appointment?.start_time as string | undefined
  // Si tenemos ISO, formateamos siempre a humano; si solo viene en data, intentamos formatear
  const isoFromData = typeof data.appointment_date === 'string' ? data.appointment_date : undefined
  const isoCandidate = startIso || isoFromData
  vars['date'] = (data.date && String(data.date)) || (isoCandidate ? formatDate(isoCandidate) : '')
  vars['time'] = (data.time && String(data.time)) || (isoCandidate ? formatTime(isoCandidate) : '')

  // Otros campos comunes (por si las plantillas los usan)
  if (typeof data.business_name === 'string') vars['business_name'] = data.business_name
  if (typeof data.new_address === 'string') vars['new_address'] = data.new_address
  if (typeof data.user_name === 'string') vars['user_name'] = data.user_name

  
  // Reemplazar variables en subject y message
  let subject = template.subject
  let message = template.message

  // Primero con datos originales
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), String(value ?? ''))
    message = message.replace(new RegExp(placeholder, 'g'), String(value ?? ''))
  }

  // Luego asegurar los alias/fallbacks
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    message = message.replace(new RegExp(placeholder, 'g'), value)
  }
  

  // Añadir dirección de la sede al correo del cliente si existe
  try {
    if (request.type === 'appointment_new_client') {
      const address = (vars['address'] || '').trim()
      const city = (vars['city'] || '').trim()
      if (address) {
        const locationText = `📍 Lugar: ${vars['location'] || ''}`
        const addressText = `📍 Dirección: ${address}${city ? `, ${city}` : ''}`
        if (message.includes(locationText) && !message.includes(addressText)) {
          message = message.replace(locationText, `${locationText}\n${addressText}`)
        } else if (!message.includes(addressText)) {
          message = `${message}\n${addressText}`
        }
      }
    }
  } catch (_) {
    // No bloquear envío por errores menores de formato
  }

  // Saneado final: si aún faltan campos críticos para ciertos tipos, añadimos avisos
  const criticalByType: Record<string, string[]> = {
    appointment_new_employee: ['client_name', 'date', 'time', 'service'],
    appointment_new_client: ['date', 'time', 'location', 'service'],
    appointment_confirmation: ['date', 'time', 'location', 'service'],
    appointment_reminder: ['date', 'time'],
  }
  const crit = criticalByType[request.type] || []
  const missing = crit.filter(k => (vars[k] || '').trim() === '')
  if (missing.length > 0) {
    // Ajustar a un mensaje genérico para evitar enviar email “vacío”
    const genericMap: Record<string, string> = {
      appointment_new_employee: 'Se te ha asignado una nueva cita. Revisa la app para ver detalles completos.',
      appointment_new_client: 'Tu cita fue registrada correctamente. Revisa la app para ver detalles completos.',
      appointment_confirmation: 'Tu cita ha sido confirmada. Revisa la app para ver detalles completos.',
      appointment_reminder: 'Tienes una cita próxima. Revisa la app para ver detalles completos.',
    }
    const generic = genericMap[request.type] || 'Tienes una notificación. Revisa la app para más detalles.'
    message = generic
  }

  return { subject, message, vars }
}

// Template HTML para confirmación de cita agendada — diseño de marca Gestabiz
function createAppointmentBookedEmail(vars: Record<string, string>, subject: string): string {
  const clientName = vars['client_name'] || 'Cliente'
  const date = vars['date'] || ''
  const time = vars['time'] || ''
  const location = vars['location'] || ''
  const address = vars['address'] || ''
  const city = vars['city'] || ''
  const service = vars['service'] || ''
  const employeeName = vars['employee_name'] || ''

  const addressInline = (address || city)
    ? `<br><span style="color:#64748b;font-size:13px;">${address}${city ? `, ${city}` : ''}</span>`
    : ''

  const employeeRow = employeeName ? `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:10px 0;">
          <div style="width:32px;height:32px;border-radius:8px;background:#fffbeb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Profesional</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${employeeName}</span>
          </div>
        </div>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - Gestabiz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#F5F4FB;padding:40px 20px;line-height:1.6;}
    .email-wrapper{max-width:600px;margin:0 auto;}
    .header{background-color:#6820F7;border-radius:16px 16px 0 0;padding:36px 32px 28px;text-align:center;}
    .header-tagline{margin-top:10px;font-size:11px;font-weight:500;letter-spacing:2.5px;text-transform:uppercase;color:#3bbfa0;}
    .badge{display:inline-block;background:rgba(59,191,160,0.2);border:1px solid rgba(59,191,160,0.5);color:#3bbfa0;font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-top:16px;}
    .email-card{background:#ffffff;padding:44px 40px 36px;}
    h1{color:#1e293b;font-size:26px;font-weight:700;margin-bottom:12px;text-align:center;line-height:1.3;}
    .greeting{color:#475569;font-size:15px;margin-bottom:20px;text-align:center;}
    .message{color:#64748b;font-size:15px;margin-bottom:16px;text-align:center;line-height:1.75;}
    .accent-line{width:48px;height:3px;background:linear-gradient(90deg,#6820F7,#3bbfa0);border-radius:2px;margin:20px auto 28px;}
    .details-card{background:#F5F4FB;border:1px solid #ede9f9;border-radius:12px;padding:28px;margin:28px 0;}
    .details-title{color:#6820F7;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:18px;}
    .detail-row{display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid #ede9f9;}
    .detail-row:last-child{border-bottom:none;padding-bottom:0;}
    .divider{height:1px;background-color:#ede9f9;margin:32px 0;}
    .help-note{background:#f0fdfb;border-left:4px solid #3bbfa0;padding:14px 18px;border-radius:0 8px 8px 0;margin:24px 0;}
    .help-note p{color:#1e6b5c;font-size:13.5px;margin:0;line-height:1.6;}
    .footer{background:#f0eeff;border-radius:0 0 16px 16px;padding:28px 32px;text-align:center;border-top:1px solid #ede9f9;}
    .footer-text{color:#7c6fab;font-size:12.5px;margin-bottom:6px;line-height:1.5;}
    .footer-links{margin-top:14px;}
    .footer-link{color:#6820F7;text-decoration:none;font-size:12.5px;font-weight:500;margin:0 10px;}
    .footer-divider{display:inline-block;color:#c4b8e8;margin:0 2px;}
    @media only screen and (max-width:600px){
      body{padding:0;}
      .header{border-radius:0;padding:28px 20px 22px;}
      .email-card{padding:32px 20px 28px;}
      .footer{border-radius:0;padding:22px 20px;}
      h1{font-size:22px;}
      .details-card{padding:20px;}
    }
  </style>
</head>
<body>
  <div class="email-wrapper">

    <!-- Header -->
    <div class="header">
      <a href="https://gestabiz.com" style="display:inline-flex;align-items:center;gap:14px;text-decoration:none;">
        <img src="https://gestabiz.com/logo-icon.svg" width="52" height="52" alt="G" style="display:block;width:52px;height:52px;border-radius:11px;">
        <span style="font-family:'Outfit',sans-serif;font-size:30px;font-weight:700;letter-spacing:-0.5px;line-height:1;">
          <span style="color:#f0eeff;">Gesta</span><span style="color:#3bbfa0;">biz</span>
        </span>
      </a>
      <p class="header-tagline">Agenda &middot; Gestiona &middot; Crece</p>
      <div class="badge">Nueva cita</div>
    </div>

    <!-- Card principal -->
    <div class="email-card">

      <h1>&#x1F389; &#xA1;Cita Agendada!</h1>
      <div class="accent-line"></div>

      <p class="greeting">Hola <strong>${clientName}</strong>,</p>
      <p class="message">Tu cita fue agendada exitosamente. Aqu&iacute; est&aacute;n todos los detalles:</p>

      <!-- Detalles -->
      <div class="details-card">
        <p class="details-title">Detalles de la cita</p>

        <!-- Servicio -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0eeff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6820F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Servicio</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${service}</span>
          </div>
        </div>

        <!-- Fecha -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0fdfb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3bbfa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Fecha</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${date}</span>
          </div>
        </div>

        <!-- Hora -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0eeff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6820F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Hora</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${time}</span>
          </div>
        </div>

        <!-- Sede -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0fdfb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3bbfa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Sede</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${location}${addressInline}</span>
          </div>
        </div>

        ${employeeRow}

      </div>

      <div class="divider"></div>

      <div class="help-note">
        <p>Recibir&aacute;s un recordatorio antes de tu cita. Si necesitas cancelar o reprogramar, comun&iacute;cate directamente con el negocio.</p>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">&copy; 2026 Gestabiz &mdash; Todos los derechos reservados.</p>
      <p class="footer-text">Este es un mensaje autom&aacute;tico. No responder a este correo.</p>
      <div class="footer-links">
        <a href="https://gestabiz.com" class="footer-link">Sitio web</a>
        <span class="footer-divider">&bull;</span>
        <a href="https://gestabiz.com/support" class="footer-link">Soporte</a>
        <span class="footer-divider">&bull;</span>
        <a href="https://gestabiz.com/privacy" class="footer-link">Privacidad</a>
      </div>
    </div>

  </div>
</body>
</html>`
}

// Template HTML para nueva cita asignada al profesional/empleado — diseño de marca Gestabiz
function createAppointmentNewEmployeeEmail(vars: Record<string, string>, subject: string): string {
  const employeeName = vars['employee_name'] || vars['professional_name'] || 'Profesional'
  const clientName = vars['client_name'] || ''
  const date = vars['date'] || ''
  const time = vars['time'] || ''
  const service = vars['service'] || ''
  const location = vars['location'] || ''

  const locationRow = location ? `
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0fdfb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3bbfa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Sede</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${location}</span>
          </div>
        </div>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - Gestabiz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#F5F4FB;padding:40px 20px;line-height:1.6;}
    .email-wrapper{max-width:600px;margin:0 auto;}
    .header{background-color:#6820F7;border-radius:16px 16px 0 0;padding:36px 32px 28px;text-align:center;}
    .header-tagline{margin-top:10px;font-size:11px;font-weight:500;letter-spacing:2.5px;text-transform:uppercase;color:#3bbfa0;}
    .badge{display:inline-block;background:rgba(59,191,160,0.2);border:1px solid rgba(59,191,160,0.5);color:#3bbfa0;font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-top:16px;}
    .email-card{background:#ffffff;padding:44px 40px 36px;}
    h1{color:#1e293b;font-size:26px;font-weight:700;margin-bottom:12px;text-align:center;line-height:1.3;}
    .greeting{color:#475569;font-size:15px;margin-bottom:20px;text-align:center;}
    .message{color:#64748b;font-size:15px;margin-bottom:16px;text-align:center;line-height:1.75;}
    .accent-line{width:48px;height:3px;background:linear-gradient(90deg,#6820F7,#3bbfa0);border-radius:2px;margin:20px auto 28px;}
    .details-card{background:#F5F4FB;border:1px solid #ede9f9;border-radius:12px;padding:28px;margin:28px 0;}
    .details-title{color:#6820F7;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:18px;}
    .detail-row{display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid #ede9f9;}
    .detail-row:last-child{border-bottom:none;padding-bottom:0;}
    .divider{height:1px;background-color:#ede9f9;margin:32px 0;}
    .help-note{background:#f0fdfb;border-left:4px solid #3bbfa0;padding:14px 18px;border-radius:0 8px 8px 0;margin:24px 0;}
    .help-note p{color:#1e6b5c;font-size:13.5px;margin:0;line-height:1.6;}
    .footer{background:#f0eeff;border-radius:0 0 16px 16px;padding:28px 32px;text-align:center;border-top:1px solid #ede9f9;}
    .footer-text{color:#7c6fab;font-size:12.5px;margin-bottom:6px;line-height:1.5;}
    .footer-links{margin-top:14px;}
    .footer-link{color:#6820F7;text-decoration:none;font-size:12.5px;font-weight:500;margin:0 10px;}
    .footer-divider{display:inline-block;color:#c4b8e8;margin:0 2px;}
    @media only screen and (max-width:600px){
      body{padding:0;}
      .header{border-radius:0;padding:28px 20px 22px;}
      .email-card{padding:32px 20px 28px;}
      .footer{border-radius:0;padding:22px 20px;}
      h1{font-size:22px;}
      .details-card{padding:20px;}
    }
  </style>
</head>
<body>
  <div class="email-wrapper">

    <!-- Header -->
    <div class="header">
      <a href="https://gestabiz.com" style="display:inline-flex;align-items:center;gap:14px;text-decoration:none;">
        <img src="https://gestabiz.com/logo-icon.svg" width="52" height="52" alt="G" style="display:block;width:52px;height:52px;border-radius:11px;">
        <span style="font-family:'Outfit',sans-serif;font-size:30px;font-weight:700;letter-spacing:-0.5px;line-height:1;">
          <span style="color:#f0eeff;">Gesta</span><span style="color:#3bbfa0;">biz</span>
        </span>
      </a>
      <p class="header-tagline">Agenda &middot; Gestiona &middot; Crece</p>
      <div class="badge">Cita asignada</div>
    </div>

    <!-- Card principal -->
    <div class="email-card">

      <h1>Nueva Cita Asignada</h1>
      <div class="accent-line"></div>

      <p class="greeting">Hola <strong>${employeeName}</strong>,</p>
      <p class="message">Tienes una nueva cita agendada. Aqu&iacute; est&aacute;n los detalles:</p>

      <!-- Detalles -->
      <div class="details-card">
        <p class="details-title">Detalles de la cita</p>

        <!-- Cliente -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#fffbeb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Cliente</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${clientName}</span>
          </div>
        </div>

        <!-- Servicio -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0eeff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6820F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Servicio</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${service}</span>
          </div>
        </div>

        <!-- Fecha -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0fdfb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3bbfa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Fecha</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${date}</span>
          </div>
        </div>

        <!-- Hora -->
        <div class="detail-row">
          <div style="width:32px;height:32px;border-radius:8px;background:#f0eeff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6820F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <span style="color:#94a3b8;font-size:11.5px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Hora</span>
            <span style="color:#1e293b;font-size:15px;font-weight:500;line-height:1.4;">${time}</span>
          </div>
        </div>

        ${locationRow}

      </div>

      <div class="divider"></div>

      <div class="help-note">
        <p>Revisa tu agenda en la app para ver m&aacute;s detalles y gestionar la cita.</p>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">&copy; 2026 Gestabiz &mdash; Todos los derechos reservados.</p>
      <p class="footer-text">Este es un mensaje autom&aacute;tico. No responder a este correo.</p>
      <div class="footer-links">
        <a href="https://gestabiz.com" class="footer-link">Sitio web</a>
        <span class="footer-divider">&bull;</span>
        <a href="https://gestabiz.com/support" class="footer-link">Soporte</a>
        <span class="footer-divider">&bull;</span>
        <a href="https://gestabiz.com/privacy" class="footer-link">Privacidad</a>
      </div>
    </div>

  </div>
</body>
</html>`
}

// Helper para cargar template HTML personalizado
async function loadHTMLTemplate(_templateName: string, _data: any): Promise<string | null> {
  try {
    // TODO: Implementar carga de template desde Supabase Storage
    return null
  } catch (_error) {
    return null
  }
}

// Helper para renderizar template HTML con datos
function renderHTMLTemplate(template: string, data: any): string {
  let rendered = template
  
  // Reemplazar variables {{variable}}
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(placeholder, String(value || ''))
  }
  
  // Manejar condicionales {{#if variable}}...{{/if}}
  rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
    return data[variable] ? content : ''
  })
  
  return rendered
}

function getRecipientContact(request: NotificationRequest, channel: string): string {
  switch (channel) {
    case 'email': return request.recipient_email || ''
    case 'sms': return request.recipient_phone || ''
    case 'whatsapp': return request.recipient_whatsapp || request.recipient_phone || ''
    default: return ''
  }
}

async function sendEmail(request: NotificationRequest, content: any) {

  if (!request.recipient_email) {
    return { success: false, error: 'Recipient email missing' }
  }

  try {
    let htmlBody = ''
    
    
    // Template especializado para cita agendada (cliente)
    if (request.type === 'appointment_new_client') {
      htmlBody = createAppointmentBookedEmail(content.vars || {}, content.subject)
    // Template especializado para nueva cita asignada al empleado/profesional
    } else if (request.type === 'appointment_new_employee') {
      htmlBody = createAppointmentNewEmployeeEmail(content.vars || {}, content.subject)
    // Usar template HTML personalizado para job_application_new
    } else if (request.type === 'job_application_new' || request.type === 'job_application_accepted' || request.type === 'job_application_interview') {
      // Intentar cargar template HTML personalizado
      const templateName = request.type === 'job_application_new' ? 'job-application' : request.type
      const customTemplate = await loadHTMLTemplate(templateName, request.data)
      
      if (customTemplate) {
        htmlBody = renderHTMLTemplate(customTemplate, request.data)
      } else {
        // Fallback al template básico desde brevo.ts
        htmlBody = createBasicEmailTemplate(
          content.subject,
          content.message
        )
      }
    } else {
      // Template básico para otros tipos
      htmlBody = createBasicEmailTemplate(
        content.subject,
        content.message
      )
    }
    

    // Validación extra: si el mensaje quedó demasiado genérico o vacío, evitar enviar basura
    const isEmptyContent = !content.message || content.message.trim().length < 10
    if (isEmptyContent) {
      content.subject = content.subject || 'Notificación'
      content.message = 'Tienes una nueva notificación en Gestabiz. Abre la app para ver los detalles.'
      htmlBody = createBasicEmailTemplate(content.subject, content.message)
    }
    
    // Enviar email usando Brevo
    const emailParams = {
      to: request.recipient_email,
      subject: content.subject,
      htmlBody: htmlBody,
      textBody: content.message,
      fromEmail: Deno.env.get('FROM_EMAIL') || Deno.env.get('BREVO_SMTP_USER') || 'noreply@gestabiz.app',
      fromName: 'Gestabiz'
    }
    
    const result = await sendBrevoEmail(emailParams)
    
    
    if (result.success) {
    } else {
    }
    
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Helper para enviar email con AWS SES usando fetch (sin SDK)
async function sendSESEmail(params: any, accessKeyId: string, secretAccessKey: string, region: string) {
  try {
    // Preparar el body como query string para SES
    const formData = new URLSearchParams({
      'Action': 'SendEmail',
      'Source': params.Source,
      'Destination.ToAddresses.member.1': params.Destination.ToAddresses[0],
      'Message.Subject.Data': params.Message.Subject.Data,
      'Message.Subject.Charset': 'UTF-8',
      'Message.Body.Text.Data': params.Message.Body.Text.Data,
      'Message.Body.Text.Charset': 'UTF-8',
      'Message.Body.Html.Data': params.Message.Body.Html.Data,
      'Message.Body.Html.Charset': 'UTF-8'
    })

    // AWS Signature V4
    const host = `email.${region}.amazonaws.com`
    const endpoint = `https://${host}/`
    const method = 'POST'
    const service = 'ses'
    
    const now = new Date()
    const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    
    // Crear signature
    const canonicalUri = '/'
    const canonicalQuerystring = ''
    const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-date'
    const payloadHash = await sha256(formData.toString())
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`
    
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = await hmacSha256(signingKey, stringToSign)
    
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': amzDate,
        'Authorization': authorizationHeader
      },
      body: formData.toString()
    })

    const responseText = await response.text()
    
    if (response.ok) {
      // Extraer MessageId del XML response
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/)
      const messageId = messageIdMatch ? messageIdMatch[1] : 'unknown'
      return { success: true, id: messageId }
    } else {
      return { success: false, error: responseText }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Funciones auxiliares para AWS Signature V4
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const kDate = await hmacSha256Raw(new TextEncoder().encode('AWS4' + key), dateStamp)
  const kRegion = await hmacSha256Raw(kDate, regionName)
  const kService = await hmacSha256Raw(kRegion, serviceName)
  const kSigning = await hmacSha256Raw(kService, 'aws4_request')
  return kSigning
}

async function hmacSha256Raw(key: Uint8Array | ArrayBuffer, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return new Uint8Array(signature)
}

async function sendSMS(request: NotificationRequest, content: any) {
  const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
  const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
  const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1'
  
  if (!awsAccessKeyId || !awsSecretAccessKey || !request.recipient_phone) {
    return { success: false, error: 'SMS not configured or recipient missing' }
  }

  try {
    // Preparar mensaje para Amazon SNS
    const message = `${content.subject}\n\n${content.message}`
    
    const params = {
      Message: message,
      PhoneNumber: request.recipient_phone,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional' // Transactional = alta prioridad
        }
      }
    }

    // Usar Amazon SNS para enviar SMS
    const response = await sendSNSMessage(params, awsAccessKeyId, awsSecretAccessKey, awsRegion)
    
    return response
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// Helper para enviar SMS con Amazon SNS
async function sendSNSMessage(params: any, accessKeyId: string, secretAccessKey: string, region: string) {
  try {
    const host = `sns.${region}.amazonaws.com`
    const endpoint = `https://${host}/`
    const method = 'POST'
    const service = 'sns'
    
    const now = new Date()
    const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    
    // Preparar el body
    const bodyParams = new URLSearchParams({
      'Action': 'Publish',
      'Message': params.Message,
      'PhoneNumber': params.PhoneNumber,
      'MessageAttributes.entry.1.Name': 'AWS.SNS.SMS.SMSType',
      'MessageAttributes.entry.1.Value.DataType': 'String',
      'MessageAttributes.entry.1.Value.StringValue': 'Transactional'
    })
    
    const payloadHash = await sha256(bodyParams.toString())
    
    // Crear canonical request
    const canonicalUri = '/'
    const canonicalQuerystring = ''
    const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-date'
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    
    // Crear string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`
    
    // Calcular signature
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = await hmacSha256(signingKey, stringToSign)
    
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': amzDate,
        'Authorization': authorizationHeader
      },
      body: bodyParams.toString()
    })

    const responseText = await response.text()
    
    if (response.ok) {
      // Extraer MessageId del XML response
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/)
      const messageId = messageIdMatch ? messageIdMatch[1] : 'unknown'
      return { success: true, id: messageId }
    } else {
      return { success: false, error: responseText }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function sendWhatsApp(request: NotificationRequest, content: any) {
  const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  
  const recipient = request.recipient_whatsapp || request.recipient_phone
  
  if (!whatsappToken || !whatsappPhoneNumberId || !recipient) {
    return { success: false, error: 'WhatsApp not configured or recipient missing' }
  }

  try {
    const cleanedPhone = recipient.replace(/[^\d+]/g, '')
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanedPhone,
          type: 'text',
          text: {
            body: `*${content.subject}*\n\n${content.message}`
          }
        })
      }
    )

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, id: data.messages?.[0]?.id }
    } else {
      return { success: false, error: data.error?.message || 'Failed to send WhatsApp' }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function sendInAppNotification(
  supabase: any,
  request: NotificationRequest,
  content: any
) {
  if (!request.recipient_user_id) {
    return { success: false, error: 'Recipient user_id required for in-app notifications' }
  }

  try {
    // Usar directamente el tipo del request (ya está alineado con notification_type_enum)
    // No necesitamos mapeo porque el tipo ya es correcto desde el origen
    const inAppType = request.type

    // Preparar data JSONB (incluir appointment_id si existe)
    const notificationData = {
      ...request.data,
      ...(request.appointment_id && { appointment_id: request.appointment_id })
    }

    // Llamar a la función SQL helper para crear la notificación
    const { data, error } = await supabase.rpc('create_in_app_notification', {
      p_user_id: request.recipient_user_id,
      p_type: inAppType,
      p_title: content.subject,
        p_message: content.message,
        p_metadata: notificationData,
      p_business_id: request.business_id || null,
      p_priority: request.priority ?? 0,
      p_action_url: request.action_url || null
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, id: data }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
