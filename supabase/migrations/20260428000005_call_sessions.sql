-- =====================================================
-- MIGRACIÓN: Sesiones de Llamadas WebRTC
-- Fecha: 2026-04-28
-- Descripción:
--   Tabla para registrar llamadas de voz/video realizadas
--   a través del chat. El signaling WebRTC P2P usa
--   Supabase Realtime; esta tabla persiste el historial
--   y alimenta los mensajes de tipo call_log.
-- Tabla de conversaciones: conversations (no chat_conversations)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.call_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id        uuid        NOT NULL REFERENCES public.profiles(id),
  callee_id        uuid        NOT NULL REFERENCES public.profiles(id),
  call_type        text        NOT NULL CHECK (call_type IN ('voice', 'video')),
  status           text        NOT NULL CHECK (status IN ('ringing', 'answered', 'rejected', 'missed', 'ended', 'failed')),
  started_at       timestamptz NOT NULL DEFAULT now(),
  answered_at      timestamptz,
  ended_at         timestamptz,
  duration_seconds integer     CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

COMMENT ON TABLE public.call_sessions IS
  'Historial de llamadas de voz/video realizadas en el chat. Status: ringing→answered/rejected/missed, answered→ended/failed.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_call_sessions_conversation
  ON public.call_sessions (conversation_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_sessions_participants
  ON public.call_sessions (caller_id, callee_id);

-- RLS: solo los participantes de la llamada acceden al registro
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_sessions_participants"
  ON public.call_sessions
  FOR ALL
  USING (
    caller_id = auth.uid() OR callee_id = auth.uid()
  );
