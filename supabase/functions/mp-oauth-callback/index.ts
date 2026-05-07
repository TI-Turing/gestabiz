/**
 * mp-oauth-callback Edge Function
 *
 * Recibe el callback de MercadoPago tras autorización del usuario.
 * - Valida `state` token (CSRF + ownership)
 * - Intercambia `code` por tokens via MP /oauth/token
 * - Encripta tokens y los persiste en business_mp_connections
 * - Redirige al usuario a la UI con éxito/error
 *
 * Esta EF es invocada por MP via redirect HTTP GET — NO por el frontend.
 *
 * Required Supabase Secrets:
 * - MP_OAUTH_CLIENT_ID
 * - MP_OAUTH_CLIENT_SECRET
 * - MP_OAUTH_REDIRECT_URI
 * - APP_ENCRYPTION_KEY
 * - APP_FRONTEND_URL (e.g. https://gestabiz.com)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('mp-oauth-callback')

const STATE_MAX_AGE_MS = 10 * 60 * 1000 // 10 min

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const frontendUrl = Deno.env.get('APP_FRONTEND_URL') ?? 'http://localhost:5173'

  try {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const errorParam = url.searchParams.get('error')

    if (errorParam) {
      return redirectToFrontend(frontendUrl, 'error', errorParam)
    }
    if (!code || !state) {
      return redirectToFrontend(frontendUrl, 'error', 'missing_params')
    }

    // Validar state firmado
    const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY')
    if (!encryptionKey) throw new Error('APP_ENCRYPTION_KEY missing')

    const parts = state.split('.')
    if (parts.length !== 4) return redirectToFrontend(frontendUrl, 'error', 'invalid_state')

    const [businessId, userId, tsStr, signature] = parts
    const stateData = `${businessId}.${userId}.${tsStr}`
    const expectedSig = await hmacSign(stateData, encryptionKey)
    if (expectedSig !== signature) {
      return redirectToFrontend(frontendUrl, 'error', 'invalid_signature')
    }

    const ts = Number(tsStr)
    if (!Number.isFinite(ts) || Date.now() - ts > STATE_MAX_AGE_MS) {
      return redirectToFrontend(frontendUrl, 'error', 'state_expired')
    }

    // Intercambiar code por tokens
    const clientId = Deno.env.get('MP_OAUTH_CLIENT_ID')!
    const clientSecret = Deno.env.get('MP_OAUTH_CLIENT_SECRET')!
    const redirectUri = Deno.env.get('MP_OAUTH_REDIRECT_URI')!

    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('MP token exchange failed:', errBody)
      return redirectToFrontend(frontendUrl, 'error', 'token_exchange_failed')
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string
      refresh_token: string
      public_key: string
      live_mode: boolean
      user_id: number | string
      expires_in: number
      scope: string
    }

    // Guardar conexión via service_role (encripta vía RPC)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: {
          // Inyectar APP_ENCRYPTION_KEY como GUC en la sesión para encrypt_mp_token
          schema: 'public',
        },
      }
    )

    // Setear app.encryption_key en la sesión y luego encriptar + upsert
    const { error: setKeyErr } = await supabaseAdmin.rpc('set_config' as never, {
      setting_name: 'app.encryption_key',
      new_value: encryptionKey,
      is_local: false,
    } as never)
    if (setKeyErr) {
      // Fallback: usar SQL crudo via execute (no disponible). Si falla, abortar.
      console.error('Failed to set app.encryption_key:', setKeyErr)
      return redirectToFrontend(frontendUrl, 'error', 'encryption_setup_failed')
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    // Encriptar tokens
    const { data: accessEnc, error: accessEncErr } = await supabaseAdmin.rpc(
      'encrypt_mp_token' as never,
      { p_token: tokenData.access_token } as never
    )
    if (accessEncErr) throw accessEncErr

    const { data: refreshEnc, error: refreshEncErr } = await supabaseAdmin.rpc(
      'encrypt_mp_token' as never,
      { p_token: tokenData.refresh_token } as never
    )
    if (refreshEncErr) throw refreshEncErr

    const { error: upsertErr } = await supabaseAdmin.from('business_mp_connections').upsert(
      {
        business_id: businessId,
        mp_user_id: String(tokenData.user_id),
        mp_access_token_encrypted: accessEnc,
        mp_refresh_token_encrypted: refreshEnc,
        mp_public_key: tokenData.public_key,
        mp_live_mode: tokenData.live_mode,
        expires_at: expiresAt,
        scopes: tokenData.scope.split(' ').filter(Boolean),
        is_active: true,
        disconnected_at: null,
        connected_at: new Date().toISOString(),
        last_refreshed_at: new Date().toISOString(),
        refresh_failure_count: 0,
      },
      { onConflict: 'business_id' }
    )
    if (upsertErr) throw upsertErr

    return redirectToFrontend(frontendUrl, 'success', businessId)
  } catch (e) {
    captureEdgeFunctionError(e, { function: 'mp-oauth-callback' })
    await flushSentry()
    const msg = e instanceof Error ? e.message : 'unknown'
    return redirectToFrontend(frontendUrl, 'error', encodeURIComponent(msg))
  }
})

function redirectToFrontend(frontendUrl: string, status: 'success' | 'error', detail: string): Response {
  const target = `${frontendUrl}/app/admin/settings?mp_oauth=${status}&detail=${detail}`
  return Response.redirect(target, 302)
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
