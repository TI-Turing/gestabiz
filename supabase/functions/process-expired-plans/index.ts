/**
 * process-expired-plans — Edge Function (cron: daily 00:05 UTC)
 *
 * Busca planes activos cuyo end_date ya paso y los marca como 'expired'.
 *
 * Variables requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const now = new Date().toISOString()

  // Find all active plans that have passed their end_date and are not canceled
  // ── 1. Planes activos con end_date vencida ────────────────────────────────
  const { data: expiredPlans, error: fetchError } = await supabase
    .from('business_plans')
    .select('id, business_id, plan_type, end_date')
    .eq('status', 'active')
    .is('canceled_at', null)
    .lt('end_date', now)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Planes trialing con trial_ends_at vencida ──────────────────────────
  const { data: expiredTrials, error: trialFetchError } = await supabase
    .from('business_plans')
    .select('id, business_id, plan_type, trial_ends_at')
    .eq('status', 'trialing')
    .not('trial_ends_at', 'is', null)
    .lt('trial_ends_at', now)

  if (trialFetchError) {
    return new Response(JSON.stringify({ error: trialFetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const allExpired = [...(expiredPlans ?? []), ...(expiredTrials ?? [])]

  if (allExpired.length === 0) {
    return new Response(JSON.stringify({ success: true, updated: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }


  const expiredIds = allExpired.map((p) => p.id)

  const { data: updatedRows, error: updateError } = await supabase
    .from('business_plans')
    .update({
      status: 'expired',
      updated_at: now,
    })
    .in('id', expiredIds)
    .select('id')

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const updatedCount = updatedRows?.length ?? 0

  // Registrar eventos trial_ended para los trials vencidos
  if (expiredTrials && expiredTrials.length > 0) {
    const trialEvents = expiredTrials.map((t) => ({
      business_id: t.business_id,
      plan_id: t.id,
      event_type: 'trial_ended',
      triggered_by: 'system',
      metadata: { trial_ends_at: t.trial_ends_at, processed_at: now },
    }))

    const { error: eventsError } = await supabase
      .from('subscription_events')
      .insert(trialEvents)

    if (eventsError) {
    } else {
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      updated: updatedCount,
      plan_ids: expiredIds,
      expired_active: expiredPlans?.length ?? 0,
      expired_trials: expiredTrials?.length ?? 0,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
