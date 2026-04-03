/**
 * MercadoPago Manage Subscription Edge Function
 * Maneja operaciones de suscripción: update, cancel, pause, resume, reactivate
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('mercadopago-manage-subscription')

Deno.serve(async (req) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight
  const corsHeaders = getCorsHeaders(req)

  try {
    // ─── AUTENTICACIÓN: JWT obligatorio ────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verificar token con cliente anon
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, businessId, ...params } = await req.json()

    if (!businessId || !action) {
      return new Response(JSON.stringify({ error: 'businessId and action are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ─── AUTORIZACIÓN: verificar ownership o admin del negocio ─────────────
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()

    let isAuthorized = business?.owner_id === user.id
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
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let result

    switch (action) {
      case 'update':
      case 'cancel':
      case 'pause':
      case 'resume':
      case 'reactivate': {
        const { data, error } = await supabase
          .from('business_plans')
          .update({
            status: action === 'cancel' ? 'canceled' : action === 'pause' ? 'paused' : 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', businessId)
          .select()
          .single()

        if (error) throw error
        result = { subscription: data }
        break
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('mercadopago-manage-subscription error:', error)
    captureEdgeFunctionError(error as Error, { functionName: 'mercadopago-manage-subscription' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
