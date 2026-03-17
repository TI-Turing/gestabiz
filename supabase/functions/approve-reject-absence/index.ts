/**
 * Edge Function: approve-reject-absence
 * 
 * Permite a administradores aprobar o rechazar solicitudes de ausencia/vacaciones.
 * Cancela citas automáticamente al aprobar y notifica a clientes afectados.
 * 
 * Features:
 * - Validación de permisos de admin
 * - Aprobación/rechazo con notas opcionales
 * - Cancelación automática de citas (trigger)
 * - Actualización de balance de vacaciones
 * - Notificaciones al empleado y clientes afectados
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

interface ApprovalRequest {
  absenceId: string;
  action: 'approve' | 'reject';
  adminNotes?: string;
}

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autenticado');
    }
    const token = authHeader.replace('Bearer ', '');

    // Crear cliente admin para operaciones del servidor
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar autenticación con token explícito
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('No autenticado');
    }

    const requestData: ApprovalRequest = await req.json();
    const { absenceId, action, adminNotes } = requestData;

    // 1. Obtener ausencia con datos del empleado
    const { data: absence, error: absenceError } = await supabaseClient
      .from('employee_absences')
      .select(`
        *,
        employee:profiles!employee_absences_employee_id_fkey(id, full_name, email),
        business:businesses!employee_absences_business_id_fkey(id, owner_id, name)
      `)
      .eq('id', absenceId)
      .single();

    if (absenceError || !absence) {
      throw new Error('Ausencia no encontrada');
    }

    // 2. Verificar que usuario es owner O admin del negocio
    const isOwner = absence.business.owner_id === user.id;
    let isAuthorized = isOwner;

    if (!isAuthorized) {
      const { data: adminRole } = await supabaseClient
        .from('business_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', absence.business_id)
        .in('role', ['admin', 'manager'])
        .single();
      isAuthorized = !!adminRole;
    }

    if (!isAuthorized) {
      throw new Error('No tiene permisos para aprobar/rechazar esta ausencia');
    }

    // 3. Verificar que ausencia está pendiente
    if (absence.status !== 'pending') {
      throw new Error(`Esta ausencia ya fue ${absence.status === 'approved' ? 'aprobada' : 'rechazada'}`);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // 4. Actualizar ausencia
    const { error: updateError } = await supabaseClient
      .from('employee_absences')
      .update({
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', absenceId);

    if (updateError) {
      throw new Error('Error al actualizar ausencia');
    }

    // 5. Actualizar solicitud de aprobación
    const { error: approvalError } = await supabaseClient
      .from('absence_approval_requests')
      .update({
        status: newStatus,
        assigned_to: user.id,
        response_notes: adminNotes,
        responded_at: new Date().toISOString(),
      })
      .eq('absence_id', absenceId);

    if (approvalError) {
      console.error('Error updating approval request:', approvalError);
    }

    let cancelledAppointments = [];

    // 6. Si fue aprobada, procesar cancelaciones
    if (action === 'approve') {
      // Obtener citas que serán canceladas
      const { data: appointments } = await supabaseClient
        .from('appointments')
        .select(`
          id,
          client_id,
          start_time,
          end_time,
          service:service_id(service_name),
          client:client_id(id, full_name, email)
        `)
        .eq('employee_id', absence.employee_id)
        .eq('business_id', absence.business_id)
        .gte('start_time', absence.start_date)
        .lte('start_time', absence.end_date)
        .neq('status', 'cancelled');

      if (appointments && appointments.length > 0) {
        cancelledAppointments = appointments;

        // Cancelar citas
        const { error: cancelError } = await supabaseClient
          .from('appointments')
          .update({
            status: 'cancelled',
            cancellation_reason: `Ausencia del profesional aprobada: ${absence.reason}`,
            cancelled_at: new Date().toISOString(),
            cancelled_by: user.id,
          })
          .in('id', appointments.map(a => a.id));

        if (cancelError) {
          console.error('Error cancelling appointments:', cancelError);
        }

        // ✅ Batch insert all notifications in one query (was N sequential inserts)
        const notificationsToInsert = appointments
          .filter(a => a.client?.id)
          .map(appointment => ({
            user_id: appointment.client.id,
            type: 'appointment_cancelled',
            title: 'Cita cancelada',
            message: `Su cita del ${new Date(appointment.start_time).toLocaleDateString()} ha sido cancelada debido a ausencia del profesional`,
            data: {
              appointmentId: appointment.id,
              absenceId: absence.id,
              reason: absence.reason,
            },
          }))
        if (notificationsToInsert.length > 0) {
          await supabaseClient.from('in_app_notifications').insert(notificationsToInsert)
        }
      }

      // Actualizar balance de vacaciones si es de tipo vacation
      if (absence.absence_type === 'vacation') {
        const start = new Date(absence.start_date);
        const end = new Date(absence.end_date);
        const daysUsed = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const year = start.getFullYear();

        // Actualizar o insertar balance
        const { error: balanceError } = await supabaseClient.rpc('update_vacation_balance', {
          p_business_id: absence.business_id,
          p_employee_id: absence.employee_id,
          p_year: year,
          p_days_used: daysUsed,
        });

        if (balanceError) {
          console.error('Error updating vacation balance:', balanceError);
        }
      }
    }

    // 7. Notificar al empleado
    const notificationMessage = action === 'approve'
      ? `Su solicitud de ${absence.absence_type === 'vacation' ? 'vacaciones' : 'ausencia'} fue aprobada`
      : `Su solicitud de ${absence.absence_type === 'vacation' ? 'vacaciones' : 'ausencia'} fue rechazada${adminNotes ? `: ${adminNotes}` : ''}`;

    await supabaseClient.from('in_app_notifications').insert({
      user_id: absence.employee_id,
      type: action === 'approve' ? 'absence_approved' : 'absence_rejected',
      title: action === 'approve' ? 'Solicitud aprobada ✅' : 'Solicitud rechazada ❌',
      message: notificationMessage,
      data: {
        absenceId: absence.id,
        absenceType: absence.absence_type,
        startDate: absence.start_date,
        endDate: absence.end_date,
        adminNotes,
      },
    });

    // TODO: Enviar email al empleado
    console.log(`TODO: Enviar email a ${absence.employee.email} sobre ${action}`);

    return new Response(
      JSON.stringify({
        success: true,
        absence: {
          id: absenceId,
          status: newStatus,
          cancelledAppointments: cancelledAppointments.length,
        },
        message: action === 'approve'
          ? `Ausencia aprobada. ${cancelledAppointments.length} citas canceladas.`
          : 'Ausencia rechazada.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in approve-reject-absence:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
