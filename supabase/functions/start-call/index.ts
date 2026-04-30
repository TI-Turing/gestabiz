import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
    }

    const { conversation_id, callee_id, call_type = 'voice' } = await req.json()

    if (!conversation_id || !callee_id) {
      return new Response(JSON.stringify({ error: 'conversation_id and callee_id are required' }), { status: 400, headers: CORS })
    }

    // Verificar que el caller es participante de la conversación
    const { data: member } = await supabase
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS })
    }

    // Insertar sesión de llamada
    const { data: callSession, error: insertErr } = await supabase
      .from('call_sessions')
      .insert({
        conversation_id,
        caller_id: user.id,
        callee_id,
        call_type,
        status: 'ringing',
      })
      .select('id')
      .single()

    if (insertErr) throw insertErr

    // Broadcast a través de Realtime al callee
    await supabase.channel(`call:${callSession.id}`).send({
      type: 'broadcast',
      event: 'incoming_call',
      payload: {
        call_id: callSession.id,
        caller_id: user.id,
        call_type,
        conversation_id,
      },
    })

    return new Response(
      JSON.stringify({ success: true, call_id: callSession.id }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: CORS }
    )
  }
})
