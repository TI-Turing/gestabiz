/**
 * mp-oauth-disconnect Edge Function
 *
 * Desactiva la conexión OAuth del negocio con MercadoPago.
 * - Marca is_active=false y disconnected_at=now()
 * - También deshabilita advance_payment_enabled del negocio (no tiene sentido seguir cobrando sin cuenta)
 * - NO revoca tokens en MP (no hay endpoint público; quedan inactivos en BD)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('mp-oauth-disconnect')

Deno.serve(async (req: Request) => {
  const cors = handleCorsPreFlight(req)
  if (cors) return cors

  try {
    if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse(req, { error: 'Missing Authorization' }, 401)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) return jsonResponse(req, { error: 'Invalid token' }, 401)
    const userId = userData.user.id

    const { business_id } = (await req.json()) as { business_id: string }
    if (!business_id) return jsonResponse(req, { error: 'business_id required' }, 400)

    const { data: bus } = await supabaseAdmin
      .from('businesses')
      .select('id, owner_id')
      .eq('id', business_id)
      .single()
    if (!bus) return jsonResponse(req, { error: 'Business not found' }, 404)

    if (bus.owner_id !== userId) {
      const { data: roleData } = await supabaseAdmin
        .from('business_roles')
        .select('id')
        .eq('business_id', business_id)
        .eq('user_id', userId)
        .eq('role', 'admin')
        .eq('is_active', true)
        .maybeSingle()
      if (!roleData) return jsonResponse(req, { error: 'Forbidden' }, 403)
    }

    const now = new Date().toISOString()

    const { error: updErr } = await supabaseAdmin
      .from('business_mp_connections')
      .update({ is_active: false, disconnected_at: now })
      .eq('business_id', business_id)
    if (updErr) throw updErr

    // Deshabilitar cobro de anticipos (sin cuenta MP no se puede cobrar)
    await supabaseAdmin
      .from('businesses')
      .update({ advance_payment_enabled: false, advance_payment_required: false })
      .eq('id', business_id)

    return jsonResponse(req, { success: true })
  } catch (e) {
    captureEdgeFunctionError(e, { function: 'mp-oauth-disconnect' })
    await flushSentry()
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return jsonResponse(req, { error: msg }, 500)
  }
})

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })
}
