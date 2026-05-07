/**
 * mp-oauth-refresh Edge Function (cron diario)
 *
 * Refresca access_token de conexiones próximas a expirar (<7 días).
 * - Lista business_mp_connections activos con expires_at < now() + 7d
 * - Llama POST /oauth/token con grant_type=refresh_token
 * - Actualiza access/refresh tokens encriptados + expires_at
 * - Si falla 5 veces, marca is_active=false y notifica al admin
 *
 * Trigger: pg_cron diario 03:00 vía select net.http_post(...)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { initSentry, captureEdgeFunctionError, flushSentry } from '../_shared/sentry.ts'

initSentry('mp-oauth-refresh')

const MAX_FAILURES = 5

Deno.serve(async (_req: Request) => {
  try {
    const adminSecret = _req.headers.get('x-admin-secret')
    if (adminSecret !== Deno.env.get('CRON_ADMIN_SECRET')) {
      return new Response('forbidden', { status: 403 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY')!
    const clientId = Deno.env.get('MP_OAUTH_CLIENT_ID')!
    const clientSecret = Deno.env.get('MP_OAUTH_CLIENT_SECRET')!

    // Inyectar key
    await supabaseAdmin.rpc('set_config' as never, {
      setting_name: 'app.encryption_key',
      new_value: encryptionKey,
      is_local: false,
    } as never)

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: expiring, error } = await supabaseAdmin
      .from('business_mp_connections')
      .select('id, business_id, mp_refresh_token_encrypted, refresh_failure_count')
      .eq('is_active', true)
      .lt('expires_at', sevenDaysFromNow)
      .lt('refresh_failure_count', MAX_FAILURES)
    if (error) throw error

    let refreshed = 0
    let failed = 0

    for (const conn of expiring ?? []) {
      try {
        const { data: refreshTokenPlain, error: decErr } = await supabaseAdmin.rpc(
          'decrypt_mp_token' as never,
          { p_encrypted: conn.mp_refresh_token_encrypted } as never
        )
        if (decErr) throw decErr

        const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: String(refreshTokenPlain),
          }),
        })

        if (!tokenRes.ok) throw new Error(`refresh failed: ${tokenRes.status}`)

        const td = (await tokenRes.json()) as {
          access_token: string
          refresh_token: string
          expires_in: number
        }

        const { data: newAcc } = await supabaseAdmin.rpc('encrypt_mp_token' as never, {
          p_token: td.access_token,
        } as never)
        const { data: newRef } = await supabaseAdmin.rpc('encrypt_mp_token' as never, {
          p_token: td.refresh_token,
        } as never)

        await supabaseAdmin
          .from('business_mp_connections')
          .update({
            mp_access_token_encrypted: newAcc,
            mp_refresh_token_encrypted: newRef,
            expires_at: new Date(Date.now() + td.expires_in * 1000).toISOString(),
            last_refreshed_at: new Date().toISOString(),
            refresh_failure_count: 0,
          })
          .eq('id', conn.id)

        refreshed++
      } catch (innerErr) {
        failed++
        const newCount = (conn.refresh_failure_count ?? 0) + 1
        const update: Record<string, unknown> = { refresh_failure_count: newCount }
        if (newCount >= MAX_FAILURES) {
          update.is_active = false
          update.disconnected_at = new Date().toISOString()
        }
        await supabaseAdmin.from('business_mp_connections').update(update).eq('id', conn.id)
        console.error(`Refresh failed for connection ${conn.id}:`, innerErr)
      }
    }

    return new Response(
      JSON.stringify({ refreshed, failed, total: expiring?.length ?? 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    captureEdgeFunctionError(e, { function: 'mp-oauth-refresh' })
    await flushSentry()
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
