import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

// Initialize Sentry
initSentry('update-hierarchy')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

serve(async (req: Request) => {
  const corsPreFlight = handleCorsPreFlight(req)
  if (corsPreFlight) return corsPreFlight

  const corsHeaders = getCorsHeaders(req)

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ─── 1. AUTENTICACIÓN ───────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar identidad del llamador
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── 2. VALIDAR INPUT ───────────────────────────────────────────────────────
    let body: { uid?: unknown; bid?: unknown; lvl?: unknown }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { uid, bid, lvl } = body
    const user_id = uid as string
    const business_id = bid as string
    const new_level = lvl as number

    if (!user_id || !business_id || new_level === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: uid, bid, lvl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!UUID_REGEX.test(user_id) || !UUID_REGEX.test(business_id)) {
      return new Response(JSON.stringify({ error: 'Invalid UUID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof new_level !== 'number' || new_level < 0 || new_level > 4) {
      return new Response(
        JSON.stringify({ error: 'Invalid level: must be 0-4' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── 3. AUTORIZACIÓN: llamador debe ser owner o admin del negocio ───────────
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', business_id)
      .single()

    const isOwner = business?.owner_id === requestingUser.id
    let isAuthorized = isOwner

    if (!isAuthorized) {
      const { data: adminRole } = await supabase
        .from('business_roles')
        .select('id')
        .eq('user_id', requestingUser.id)
        .eq('business_id', business_id)
        .eq('role', 'admin')
        .single()
      isAuthorized = !!adminRole
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only owner or admin can update hierarchy' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── 4. VERIFICAR QUE EL EMPLEADO EXISTE EN EL NEGOCIO ─────────────────────
    const { data: employee, error: checkError } = await supabase
      .from('business_roles')
      .select('id')
      .eq('user_id', user_id)
      .eq('business_id', business_id)
      .single()

    if (checkError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee not found in this business' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── 5. ACTUALIZAR NIVEL ────────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('business_roles')
      .update({ hierarchy_level: new_level, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('business_id', business_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update hierarchy level' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Nivel actualizado exitosamente a ' + new_level }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    captureEdgeFunctionError(error as Error, { functionName: 'update-hierarchy' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
