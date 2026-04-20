// Supabase Edge Function: send-appointment-confirmation
// Deploy with: npx supabase functions deploy send-appointment-confirmation
// Purpose: Generate confirmation token & deadline, then send email with links

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'
// Initialize Sentry
initSentry('send-appointment-confirmation')

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { appointmentId } = await req.json();
    if (!appointmentId || typeof appointmentId !== "string") {
      throw new Error("appointmentId is required");
    }

    // Generar token y deadline sin depender del RPC (evita uuid_generate_v4)
    {
      const hoursEnv = Deno.env.get("APPOINTMENT_CONFIRMATION_DEADLINE_HOURS");
      const confirmationHours = hoursEnv ? Number.parseInt(hoursEnv, 10) : 24;
      const token = (globalThis.crypto && "randomUUID" in globalThis.crypto)
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 12)}`;
      const deadline = new Date(Date.now() + (Number.isFinite(confirmationHours) ? confirmationHours : 24) * 60 * 60 * 1000).toISOString();

      const { error: updErr } = await supabase
        .from("appointments")
        .update({ confirmation_token: token, confirmation_deadline: deadline })
        .eq("id", appointmentId);
      if (updErr) throw new Error(`Failed to set confirmation fields: ${updErr.message}`);
    }

    // Fetch updated appointment with joins for email content
    // Note: use explicit FK hints to avoid PGRST201 when a table has multiple FKs to the same target
    // appointments has two FKs to locations (location_id + original_location_id), so !location_id is required
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select(
        `id, business_id, employee_id, start_time, end_time, confirmation_token, confirmation_deadline,
         client:profiles!client_id(id, full_name, email, phone),
         employee:profiles!employee_id(id, full_name, email),
         service:services!appointments_service_id_fkey(id, name, duration_minutes, price),
         location:locations!location_id(id, name, address),
         business:businesses!appointments_business_id_fkey(id, name, email, phone)`
      )
      .eq("id", appointmentId)
      .single();
    if (apptErr || !appt) throw new Error(`Appointment not found (id=${appointmentId}, err=${apptErr?.message ?? "no data"})`);

    const token: string | null = appt.confirmation_token ?? null;
    if (!token) throw new Error("Failed to generate confirmation token");

    // Token y deadline ya están guardados. Los emails los envía send-notification.
    // Esta función solo genera el token y actualiza la BD.
    console.log(`[send-appointment-confirmation] Token generado para cita ${appointmentId}. Emails delegados a send-notification.`);

    return new Response(JSON.stringify({ success: true, sent: false, tokenSet: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'send-appointment-confirmation' })
    await flushSentry()
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
