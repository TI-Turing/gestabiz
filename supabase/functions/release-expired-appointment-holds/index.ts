/**
 * release-expired-appointment-holds Edge Function (cron)
 *
 * Ejecutar cada 5 minutos. Llama al RPC release_expired_holds() que:
 *   - Busca appointments con hold_expires_at < now() Y deposit_status = 'pending'
 *   - Cambia su status a 'cancelled' y deposit_status a 'failed'
 *   - Inserta eventos de auditoría en appointment_payment_events
 *   - Retorna los appointment_ids liberados
 *
 * El cron está configurado en supabase/config.toml (cron schedule).
 *
 * No requiere autenticación — solo invocable desde Supabase scheduler
 * (verify_jwt = false en config.toml).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data, error } = await supabase.rpc('release_expired_holds' as never)

  if (error) {
    console.error('[release-expired-holds] RPC error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const released = (data as string[]) ?? []
  console.log(`[release-expired-holds] Released ${released.length} holds:`, released)

  return new Response(
    JSON.stringify({ ok: true, released_count: released.length, appointment_ids: released }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
