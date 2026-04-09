import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('appointment-actions')

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  try {
    // ─── 1. AUTENTICACIÓN ───────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    const token = authHeader.replace('Bearer ', '')

    // Cliente con service role para operaciones privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar identidad del llamador
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // ─── 2. VALIDAR INPUT ───────────────────────────────────────────────────────
    let body: { appointmentId?: unknown; action?: unknown; reason?: unknown }
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { appointmentId, action, reason } = body

    if (!appointmentId || typeof appointmentId !== 'string' || !UUID_REGEX.test(appointmentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid appointmentId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const VALID_ACTIONS = ['confirm', 'cancel', 'complete', 'no_show']
    if (!action || typeof action !== 'string' || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be one of: confirm, cancel, complete, no_show' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const sanitizedReason = typeof reason === 'string' ? reason.substring(0, 500) : undefined

    // ─── 3. AUTORIZACIÓN: verificar que el usuario es admin/owner del negocio ──
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        service:services(name),
        client:profiles!appointments_client_id_fkey(full_name, email, phone),
        employee:profiles!appointments_employee_id_fkey(full_name),
        business:businesses(name, phone, owner_id)
      `)
      .eq('id', appointmentId)
      .single()

    if (fetchError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verificar que el usuario tiene permisos sobre este negocio
    const isOwner = appointment.business?.owner_id === user.id
    let isAuthorized = isOwner

    if (!isAuthorized) {
      // Verificar rol de admin en el negocio
      const { data: roleData } = await supabaseAdmin
        .from('business_roles')
        .select('role')
        .eq('business_id', appointment.business_id)
        .eq('user_id', user.id)
        .in('role', ['admin', 'manager'])
        .single()

      isAuthorized = !!roleData

      // Empleado puede marcar sus propias citas como completadas/no_show
      if (!isAuthorized && ['complete', 'no_show'].includes(action)) {
        isAuthorized = appointment.employee_id === user.id
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: insufficient permissions for this business' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // ─── 4. EJECUTAR ACCIÓN ─────────────────────────────────────────────────────
    let updateData: Record<string, unknown> = {}
    let notificationTitle = ''
    let notificationMessage = ''

    switch (action) {
      case 'confirm':
        updateData = { status: 'confirmed' }
        notificationTitle = 'Cita Confirmada'
        notificationMessage = `Tu cita para ${appointment.service?.name || 'el servicio'} ha sido confirmada.`
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: sanitizedReason || 'Cancelado por el negocio'
        }
        notificationTitle = 'Cita Cancelada'
        notificationMessage = `Tu cita para ${appointment.service?.name || 'el servicio'} ha sido cancelada.${sanitizedReason ? ` Motivo: ${sanitizedReason}` : ''}`
        break

      case 'complete':
        updateData = { status: 'completed' }
        notificationTitle = 'Cita Completada'
        notificationMessage = `Tu cita para ${appointment.service?.name || 'el servicio'} ha sido completada. ¡Gracias por visitarnos!`
        break

      case 'no_show':
        updateData = { status: 'no_show' }
        notificationTitle = 'Cita - No Show'
        notificationMessage = `No asististe a tu cita programada para ${appointment.service?.name || 'el servicio'}.`
        break
    }

    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)

    if (updateError) {
      throw new Error('Failed to update appointment')
    }

    // ─── 5. NOTIFICACIÓN AL CLIENTE ─────────────────────────────────────────────
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: appointment.client_id,
        type: action === 'confirm' ? 'appointment_confirmed' : 'appointment_cancelled',
        title: notificationTitle,
        message: notificationMessage,
        appointment_id: appointmentId
      })

    if (notificationError) {
    }

    // ─── 6. WHATSAPP / EMAIL ────────────────────────────────────────────────────
    if (appointment.client?.phone && ['confirm', 'cancel'].includes(action)) {
      await sendWhatsAppMessage({
        phone: appointment.client.phone,
        message: createWhatsAppMessage(action, appointment),
        appointmentId
      })
    }

    if (appointment.client?.email) {
      await sendEmailNotification({
        to: appointment.client.email,
        subject: notificationTitle,
        message: notificationMessage,
        appointmentDetails: {
          serviceName: appointment.service?.name || 'Servicio',
          businessName: appointment.business?.name || 'Negocio',
          startTime: appointment.start_time,
          endTime: appointment.end_time
        }
      })
    }

    return new Response(
      JSON.stringify({ success: true, appointmentId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'appointment-actions' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function createWhatsAppMessage(action: string, appointment: Record<string, any>): string {
  const startDate = new Date(appointment.start_time)
  const dateStr = startDate.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const timeStr = startDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const businessName = appointment.business?.name || 'Nuestro negocio'
  const serviceName = appointment.service?.name || 'el servicio'

  switch (action) {
    case 'confirm':
      return `¡Hola! Tu cita para *${serviceName}* ha sido confirmada.\n\nFecha: ${dateStr}\nHora: ${timeStr}\n${businessName}\n\n¡Te esperamos!`
    case 'cancel':
      return `Hola, tu cita para *${serviceName}* programada el ${dateStr} a las ${timeStr} ha sido cancelada.\n\n${businessName}\n\nPuedes reagendar cuando gustes.`
    default:
      return `Actualización de tu cita para *${serviceName}* en ${businessName} - ${dateStr} a las ${timeStr}`
  }
}

async function sendWhatsAppMessage(params: { phone: string; message: string; appointmentId: string }): Promise<boolean> {
  try {
    return true
  } catch (error) {
    return false
  }
}

async function sendEmailNotification(params: {
  to: string; subject: string; message: string
  appointmentDetails: { serviceName: string; businessName: string; startTime: string; endTime: string }
}): Promise<boolean> {
  try {
    return true
  } catch (error) {
    return false
  }
}
