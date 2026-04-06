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
    console.error('[process-expired-plans] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const now = new Date().toISOString()

  // Find all active plans that have passed their end_date and are not canceled
  const { data: expiredPlans, error: fetchError } = await supabase
    .from('business_plans')
    .select('id, business_id, plan_type, end_date')
    .eq('status', 'active')
    .is('canceled_at', null)
    .lt('end_date', now)

  if (fetchError) {
    console.error('[process-expired-plans] Error fetching expired plans:', fetchError)
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!expiredPlans || expiredPlans.length === 0) {
    console.log('[process-expired-plans] No expired plans found')
    return new Response(JSON.stringify({ success: true, updated: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[process-expired-plans] Found ${expiredPlans.length} expired plan(s)`)

  const expiredIds = expiredPlans.map((p) => p.id)

  const { data: updatedRows, error: updateError } = await supabase
    .from('business_plans')
    .update({
      status: 'expired',
      updated_at: now,
    })
    .in('id', expiredIds)
    .select('id')

  if (updateError) {
    console.error('[process-expired-plans] Error updating plans:', updateError)
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const updatedCount = updatedRows?.length ?? 0
  console.log(`[process-expired-plans] Marked ${updatedCount} plan(s) as expired`)

  return new Response(
    JSON.stringify({
      success: true,
      updated: updatedCount,
      plan_ids: expiredIds,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
