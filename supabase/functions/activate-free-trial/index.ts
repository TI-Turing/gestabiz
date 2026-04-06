/**
 * activate-free-trial — Edge Function
 *
 * Activa el mes gratuito del Plan Básico para un owner de negocio.
 * El trial es por usuario (no por negocio): cada usuario puede usarlo exactamente una vez.
 *
 * Validaciones:
 * 1. JWT obligatorio — verifica identidad del usuario
 * 2. Ownership — el usuario debe ser owner del negocio
 * 3. Trial no usado — profiles.has_used_free_trial = false
 * 4. Sin plan activo en el negocio destino
 * 5. Sin trial activo en otro negocio del mismo usuario
 *
 * Variables requeridas (Supabase Secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from './_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from './_shared/sentry.ts'

initSentry('activate-free-trial')

const TRIAL_DURATION_DAYS = 31

Deno.serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    // ─── AUTENTICACIÓN: JWT obligatorio ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { businessId } = await req.json()
    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: businessId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service role client para todas las lecturas/escrituras
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ─── VALIDACIÓN 1: Ownership del negocio ─────────────────────────────────
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (business.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: only the business owner can activate a free trial' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── VALIDACIÓN 2: El usuario no ha usado el trial antes ─────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('has_used_free_trial')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.has_used_free_trial) {
      return new Response(JSON.stringify({ error: 'trial_already_used' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── VALIDACIÓN 3: El negocio no tiene ya un plan activo/trialing ─────────
    const { data: existingPlan } = await supabase
      .from('business_plans')
      .select('id, status')
      .eq('business_id', businessId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle()

    if (existingPlan) {
      return new Response(JSON.stringify({ error: 'business_already_has_plan' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── VALIDACIÓN 4: El usuario no tiene trial activo en otro negocio ──────
    // Join manual: buscar si algún negocio del mismo owner tiene trial activo
    const { data: ownerBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .neq('id', businessId)

    if (ownerBusinesses && ownerBusinesses.length > 0) {
      const otherIds = ownerBusinesses.map((b: { id: string }) => b.id)
      const { data: activeTrialInOther } = await supabase
        .from('business_plans')
        .select('id')
        .in('business_id', otherIds)
        .eq('status', 'trialing')
        .limit(1)
        .maybeSingle()

      if (activeTrialInOther) {
        return new Response(JSON.stringify({ error: 'trial_active_in_another_business' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ─── ESCRITURAS (en orden: profile primero para mayor consistencia) ──────
    const now = new Date()
    const trialEndsAt = new Date(now)
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS)
    const trialEndsAtISO = trialEndsAt.toISOString()
    const nowISO = now.toISOString()

    // a) Marcar trial como usado en el perfil del usuario
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        has_used_free_trial: true,
        free_trial_used_at: nowISO,
        free_trial_business_id: businessId,
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      captureEdgeFunctionError(profileUpdateError, { functionName: 'activate-free-trial', userId: user.id, extra: { step: 'profile_update' } })
      return new Response(JSON.stringify({ error: 'Failed to update user profile' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // b) Crear el plan en estado trialing
    const { data: newPlan, error: planError } = await supabase
      .from('business_plans')
      .insert({
        business_id: businessId,
        plan_type: 'inicio',
        status: 'trialing',
        start_date: nowISO,
        end_date: trialEndsAtISO,
        trial_ends_at: trialEndsAtISO,
        billing_cycle: 'monthly',
        auto_renew: false,
      })
      .select('id')
      .single()

    if (planError || !newPlan) {
      captureEdgeFunctionError(planError ?? new Error('No plan returned'), { functionName: 'activate-free-trial', businessId, extra: { step: 'plan_insert' } })
      // Intentar revertir el update de profile (best-effort)
      await supabase
        .from('profiles')
        .update({ has_used_free_trial: false, free_trial_used_at: null, free_trial_business_id: null })
        .eq('id', user.id)
      return new Response(JSON.stringify({ error: 'Failed to create trial plan' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // c) Registrar evento de auditoría
    await supabase
      .from('subscription_events')
      .insert({
        business_id: businessId,
        plan_id: newPlan.id,
        event_type: 'trial_started',
        triggered_by: 'user',
        triggered_by_user_id: user.id,
        metadata: {
          plan_type: 'inicio',
          trial_duration_days: TRIAL_DURATION_DAYS,
          trial_ends_at: trialEndsAtISO,
        },
      })

    await flushSentry()

    return new Response(
      JSON.stringify({
        success: true,
        planId: newPlan.id,
        trialEndsAt: trialEndsAtISO,
        trialDurationDays: TRIAL_DURATION_DAYS,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    captureEdgeFunctionError(err instanceof Error ? err : new Error(String(err)), { functionName: 'activate-free-trial' })
    await flushSentry()
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
