import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

// Cron: runs daily
// Checks all active DIAN resolutions and notifies admins if:
// - Resolution expires in < 30 days
// - Less than 10% of range remaining
// - Resolution already expired or range exhausted → auto-deactivate

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreFlight(req)

  const corsHeaders = getCorsHeaders(req.headers.get('Origin') ?? '')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()

    // Fetch all active resolutions
    const { data: resolutions, error } = await supabase
      .from('business_dian_resolution')
      .select('id, business_id, resolution_number, prefix, from_number, to_number, current_number, valid_to')
      .eq('is_active', true)

    if (error) throw error

    const results = { processed: 0, expired: 0, rangeExhausted: 0, warnings: 0 }

    for (const res of (resolutions ?? [])) {
      results.processed++

      const validTo = new Date(res.valid_to)
      const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const rangeTotal = res.to_number - res.from_number
      const rangeUsed = res.current_number - res.from_number
      const rangePercent = rangeTotal > 0 ? (rangeUsed / rangeTotal) * 100 : 100

      // Auto-deactivate if expired or range exhausted
      if (daysUntilExpiry <= 0 || res.current_number > res.to_number) {
        await supabase
          .from('business_dian_resolution')
          .update({ is_active: false })
          .eq('id', res.id)

        const reason = daysUntilExpiry <= 0 ? 'vencida' : 'rango agotado'
        await supabase
          .from('in_app_notifications')
          .insert({
            type: 'dian_resolution_expired',
            business_id: res.business_id,
            data: {
              resolution_number: res.resolution_number,
              reason,
            },
            priority: 2, // urgent
          })

        if (daysUntilExpiry <= 0) results.expired++
        else results.rangeExhausted++
        continue
      }

      // Warn if expiring soon or range almost exhausted
      const shouldWarnExpiry = daysUntilExpiry <= 30
      const shouldWarnRange = rangePercent >= 90

      if (shouldWarnExpiry || shouldWarnRange) {
        const existingWarning = await supabase
          .from('in_app_notifications')
          .select('id')
          .eq('business_id', res.business_id)
          .eq('type', 'dian_resolution_warning')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle()

        if (!existingWarning.data) {
          await supabase
            .from('in_app_notifications')
            .insert({
              type: 'dian_resolution_warning',
              business_id: res.business_id,
              data: {
                resolution_number: res.resolution_number,
                days_until_expiry: daysUntilExpiry,
                range_percent_used: Math.round(rangePercent),
              },
              priority: 1,
            })
          results.warnings++
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (err) {
    console.error('dian-resolution-monitor error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
