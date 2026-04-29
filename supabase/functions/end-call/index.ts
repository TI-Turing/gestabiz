import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
    }

    const { call_id, status = 'ended' } = await req.json()

    if (!call_id) {
      return new Response(JSON.stringify({ error: 'call_id is required' }), { status: 400, headers: CORS })
    }

    // Obtener la sesión de llamada
    const { data: callSession, error: fetchErr } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('id', call_id)
      .single()

    if (fetchErr || !callSession) {
      return new Response(JSON.stringify({ error: 'Call session not found' }), { status: 404, headers: CORS })
    }

    // Solo el caller o callee pueden terminar la llamada
    if (callSession.caller_id !== user.id && callSession.callee_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS })
    }

    // Calcular duración si estaba activa
    const now = new Date()
    const answeredAt = callSession.answered_at ? new Date(callSession.answered_at) : null
    const durationSeconds = answeredAt ? Math.round((now.getTime() - answeredAt.getTime()) / 1000) : null

    // Actualizar sesión
    const { error: updateErr } = await supabase
      .from('call_sessions')
      .update({
        status,
        ended_at: now.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', call_id)

    if (updateErr) throw updateErr

    // Insertar mensaje call_log en el hilo
    await supabase.from('messages').insert({
      conversation_id: callSession.conversation_id,
      sender_id: user.id,
      type: 'call_log',
      content: status === 'missed' || status === 'rejected'
        ? 'Llamada perdida'
        : `Llamada de voz — ${durationSeconds ? `${Math.floor(durationSeconds / 60)} min ${durationSeconds % 60} seg` : ''}`,
      metadata: {
        call_type: callSession.call_type,
        duration: durationSeconds,
        status,
        call_id,
      },
    })

    // Broadcast evento de fin de llamada
    await supabase.channel(`call:${call_id}`).send({
      type: 'broadcast',
      event: 'call_ended',
      payload: { call_id, status, duration_seconds: durationSeconds },
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: CORS }
    )
  }
})
