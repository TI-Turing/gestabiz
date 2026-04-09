import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendBrevoEmail, createBasicEmailTemplate } from '../_shared/brevo.ts'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('appointment-status-updater')

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const nowIso = now.toISOString()


    // CASO 1: Auto-completar citas que estaban 'in_progress' y ya pasó su end_time.
    // El cliente SÍ se presentó (por eso estaba en progreso), el admin olvidó marcarla.
    const { data: autoCompleted, error: autoCompleteError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        updated_at: nowIso
      })
      .eq('status', 'in_progress')
      .lte('end_time', nowIso)
      .select('id, client_id, start_time, end_time')

    if (autoCompleteError) {
    } else {
    }

    // CASO 2: Marcar como 'no_show' citas que el cliente no confirmó ni se presentó.
    // Solo aplica a estados donde el cliente NO ha llegado aún: pending, pending_confirmation,
    // scheduled, confirmed. Se activa cuando pasa auto_no_show_at (configurable, default
    // 10 min después del start_time) o cuando ya pasó el end_time completo.
    const { data: noShowAppointments, error: noShowError } = await supabase
      .from('appointments')
      .update({
        status: 'no_show',
        updated_at: nowIso
      })
      .in('status', ['pending', 'pending_confirmation', 'scheduled', 'confirmed'])
      .or(`auto_no_show_at.lte.${nowIso},end_time.lte.${nowIso}`)
      .select('id, client_id, start_time, end_time')

    if (noShowError) {
    } else {
    }

    // Nota: la inserción de notificaciones se omite aquí para evitar desalineaciones
    // con enums divergentes de notificaciones. Se puede reactivar cuando estén unificados.
    const totalUpdated = (autoCompleted?.length || 0) + (noShowAppointments?.length || 0)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Appointment status update completed',
        stats: {
          auto_completed: autoCompleted?.length || 0,
          no_show_appointments: noShowAppointments?.length || 0,
          total_updated: totalUpdated
        },
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    
    captureEdgeFunctionError(error as Error, { functionName: 'appointment-status-updater' })
    await flushSentry()
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
