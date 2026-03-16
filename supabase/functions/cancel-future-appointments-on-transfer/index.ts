import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface RequestBody {
  businessEmployeeId: string
  effectiveDate: string
  employeeId: string
}

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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── 2. VALIDAR INPUT ───────────────────────────────────────────────────────
    let body: RequestBody
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { businessEmployeeId, effectiveDate, employeeId } = body

    if (!businessEmployeeId || !effectiveDate || !employeeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!UUID_REGEX.test(businessEmployeeId) || !UUID_REGEX.test(employeeId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid UUID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar fecha
    const effectiveDateObj = new Date(effectiveDate)
    if (isNaN(effectiveDateObj.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid effectiveDate format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── 3. OBTENER DATOS DEL EMPLOYEE PARA VERIFICAR NEGOCIO ──────────────────
    const { data: employeeRecord } = await supabase
      .from('business_employees')
      .select('business_id')
      .eq('id', businessEmployeeId)
      .single()

    if (!employeeRecord) {
      return new Response(
        JSON.stringify({ error: 'Employee record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const businessId = employeeRecord.business_id

    // ─── 4. AUTORIZACIÓN: verificar owner o admin del negocio ──────────────────
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()

    const isOwner = business?.owner_id === user.id
    let isAuthorized = isOwner

    if (!isAuthorized) {
      const { data: adminRole } = await supabase
        .from('business_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .in('role', ['admin', 'manager'])
        .single()
      isAuthorized = !!adminRole
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: insufficient permissions for this business' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── 5. CANCELAR CITAS FUTURAS ──────────────────────────────────────────────
    console.log('[cancel-future-appointments-on-transfer] Starting cancellation', {
      businessEmployeeId,
      effectiveDate: effectiveDateObj.toISOString(),
    })

    const { data: appointmentsToCancel, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        client_id,
        start_time,
        end_time,
        service_id,
        location_id,
        services (name),
        profiles (name, email),
        locations (name)
      `)
      .eq('employee_id', businessEmployeeId)
      .gte('start_time', effectiveDate)
      .in('status', ['pending', 'confirmed'])

    if (fetchError) {
      console.error('[cancel-future-appointments-on-transfer] Fetch error:', fetchError.code)
      throw new Error('Failed to fetch appointments')
    }

    if (!appointmentsToCancel || appointmentsToCancel.length === 0) {
      return new Response(
        JSON.stringify({ success: true, cancelledCount: 0, notificationsSent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const appointmentIds = appointmentsToCancel.map(apt => apt.id)
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: employeeId,
        cancel_reason: 'Traslado de empleado a otra sede',
      })
      .in('id', appointmentIds)

    if (updateError) {
      console.error('[cancel-future-appointments-on-transfer] Update error:', updateError.code)
      throw new Error('Failed to cancel appointments')
    }

    // ─── 6. NOTIFICACIONES ──────────────────────────────────────────────────────
    let notificationsSent = 0

    for (const appointment of appointmentsToCancel) {
      try {
        const appointmentDate = new Date(appointment.start_time).toLocaleDateString('es', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })

        const { error: notifError } = await supabase
          .from('in_app_notifications')
          .insert({
            user_id: appointment.client_id,
            type: 'appointment_cancelled_transfer',
            title: 'Cita cancelada por traslado',
            message: `Tu cita del ${appointmentDate} ha sido cancelada debido a un traslado del profesional a otra sede.`,
            data: {
              appointment_id: appointment.id,
              reason: 'employee_transfer',
              effective_date: effectiveDate,
              service_name: appointment.services?.name,
              location_name: appointment.locations?.name,
            },
            read: false,
          })

        if (!notifError) notificationsSent++

        // Email vía send-notification
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              user_id: appointment.client_id,
              channel: 'email',
              type: 'appointment_cancelled',
              data: {
                client_name: appointment.profiles?.name,
                appointment_date: appointmentDate,
                service_name: appointment.services?.name,
                location_name: appointment.locations?.name,
                cancel_reason: 'Traslado de empleado a otra sede',
              },
            }),
          })
        } catch (emailError) {
          console.error('[cancel-future-appointments-on-transfer] Email error:', emailError instanceof Error ? emailError.message : 'unknown')
        }
      } catch (error) {
        console.error('[cancel-future-appointments-on-transfer] Notification error:', error instanceof Error ? error.message : 'unknown')
      }
    }

    return new Response(
      JSON.stringify({ success: true, cancelledCount: appointmentIds.length, notificationsSent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[cancel-future-appointments-on-transfer] Unexpected error:', error instanceof Error ? error.message : 'unknown')
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
