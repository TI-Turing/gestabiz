// =====================================================
// Edge Function: get-client-dashboard-data
// =====================================================
// Propósito: Consolidar TODAS las queries del ClientDashboard en UN SOLO endpoint
// Reduce 10-15 requests → 1 request (90-95% mejora)
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('get-client-dashboard-data')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  try {
    // ─── 1. AUTENTICACIÓN ───────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 2. VALIDAR INPUT ───────────────────────────────────────────────────────
    let body: { client_id?: unknown; preferred_city_name?: unknown; preferred_region_name?: unknown }
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, preferred_city_name, preferred_region_name } = body;

    if (!client_id || typeof client_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!UUID_REGEX.test(client_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid client_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 3. AUTORIZACIÓN: solo el propio cliente puede ver sus datos ────────────
    if (user.id !== client_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: cannot access another user\'s dashboard' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitizar parámetros de texto
    const safeCityName = typeof preferred_city_name === 'string'
      ? preferred_city_name.substring(0, 100)
      : null;
    const safeRegionName = typeof preferred_region_name === 'string'
      ? preferred_region_name.substring(0, 100)
      : null;

    // ─── 4. CONSULTA UNIFICADA ──────────────────────────────────────────────────
    const { data: dashboardData, error: queryError } = await supabase.rpc(
      'get_client_dashboard_data',
      {
        p_client_id: client_id,
        p_preferred_city_name: safeCityName,
        p_preferred_region_name: safeRegionName,
      }
    );

    if (queryError) {
      console.error('[get-client-dashboard-data] RPC Error:', queryError.code);
      return new Response(
        JSON.stringify({ error: 'Failed to load dashboard data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = dashboardData || {
      appointments: [],
      reviewedAppointmentIds: [],
      pendingReviewsCount: 0,
      favorites: [],
      suggestions: [],
      stats: {
        totalAppointments: 0,
        completedAppointments: 0,
        upcomingAppointments: 0,
        cancelledAppointments: 0,
      },
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-client-dashboard-data] Unexpected error:', error instanceof Error ? error.message : 'unknown');
    captureEdgeFunctionError(error as Error, { functionName: 'get-client-dashboard-data' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
