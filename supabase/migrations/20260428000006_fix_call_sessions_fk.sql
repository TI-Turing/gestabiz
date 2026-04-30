-- =====================================================
-- MIGRACIÓN: Fix FK call_sessions → chat_conversations
-- Fecha: 2026-04-28
-- Descripción:
--   La migración anterior referenciaba la tabla conversations
--   (sistema viejo) en vez de chat_conversations (sistema activo).
--   Esta migración corrige la FK para que call_sessions apunte
--   a la tabla correcta.
-- =====================================================

-- Eliminar FK antigua (apuntaba a conversations)
ALTER TABLE public.call_sessions
  DROP CONSTRAINT IF EXISTS call_sessions_conversation_id_fkey;

-- Agregar FK correcta → chat_conversations
ALTER TABLE public.call_sessions
  ADD CONSTRAINT call_sessions_conversation_id_fkey
  FOREIGN KEY (conversation_id)
  REFERENCES public.chat_conversations(id)
  ON DELETE CASCADE;
