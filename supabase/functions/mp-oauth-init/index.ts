/**
 * mp-oauth-init Edge Function
 *
 * Inicia el flujo OAuth de MercadoPago para conectar la cuenta del negocio.
 *
 * Flow:
 * 1. Cliente (admin/owner del negocio) llama vía supabase.functions.invoke
 * 2. Validamos auth + ownership/admin role del negocio
 * 3. Generamos `state` token CSRF firmado, lo guardamos en mp_oauth_states (in-memory cache via Deno.env or table)
 * 4. Construimos URL de autorización MP con redirect_uri al callback EF
 * 5. Retornamos { authorizationUrl } al frontend → redirect
 *
 * Docs MP OAuth: https://www.mercadopago.com.co/developers/en/docs/security/oauth/creation
 *
 * Required Supabase Secrets:
 * - MP_OAUTH_CLIENT_ID
 * - MP_OAUTH_REDIRECT_URI (debe coincidir con la app MP)
 * - APP_ENCRYPTION_KEY (para firmar el state)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('mp-oauth-init')

interface InitRequest {
  business_id: string
}

Deno.serve(async (req: Request) => {
  const cors = handleCorsPreFlight(req)
  if (cors) return cors

  try {
    if (req.method !== 'POST') {
      return jsonResponse(req, { error: 'Method not allowed' }, 405)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse(req, { error: 'Missing Authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) return jsonResponse(req, { error: 'Invalid token' }, 401)
    const userId = userData.user.id

    const { business_id } = (await req.json()) as InitRequest
    if (!business_id) return jsonResponse(req, { error: 'business_id required' }, 400)

    // Validar que el usuario es owner o admin del negocio
    const { data: bus, error: busError } = await supabaseAdmin
      .from('businesses')
      .select('id, owner_id')
      .eq('id', business_id)
      .single()
    if (busError || !bus) return jsonResponse(req, { error: 'Business not found' }, 404)

    const isOwner = bus.owner_id === userId
    if (!isOwner) {
      const { data: roleData } = await supabaseAdmin
        .from('business_roles')
        .select('id')
        .eq('business_id', business_id)
        .eq('user_id', userId)
        .eq('role', 'admin')
        .eq('is_active', true)
        .maybeSingle()
      if (!roleData) {
        return jsonResponse(req, { error: 'Forbidden: only owner or admin can connect MP' }, 403)
      }
    }

    const clientId = Deno.env.get('MP_OAUTH_CLIENT_ID')
    const redirectUri = Deno.env.get('MP_OAUTH_REDIRECT_URI')
    const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY')

    if (!clientId || !redirectUri || !encryptionKey) {
      return jsonResponse(req, { error: 'MP OAuth not configured (missing env)' }, 500)
    }

    // Generar state firmado: businessId.userId.timestamp.signature
    const stateData = `${business_id}.${userId}.${Date.now()}`
    const signature = await hmacSign(stateData, encryptionKey)
    const state = `${stateData}.${signature}`

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      platform_id: 'mp',
      state,
      redirect_uri: redirectUri,
    })

    const authorizationUrl = `https://auth.mercadopago.com.co/authorization?${params.toString()}`

    return jsonResponse(req, { authorizationUrl })
  } catch (e) {
    captureEdgeFunctionError(e, { function: 'mp-oauth-init' })
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

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
