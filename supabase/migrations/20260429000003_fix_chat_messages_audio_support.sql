-- =====================================================
-- MIGRACIÓN: Soporte completo de mensajes de audio en chat_messages
-- Fecha: 2026-04-29
-- Descripción:
--   1. Extiende chat_messages_type_check para incluir audio, video, call_log
--   2. Relaja chat_messages_check para permitir mensajes de audio/video sin content
--   3. Agrega columnas duration_seconds y waveform a chat_messages
--   4. Actualiza la función send_message para persistir metadata, duration_seconds y waveform
-- =====================================================

-- 1. Ampliar el check de tipo para incluir audio, video, call_log
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_type_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_type_check
    CHECK (type = ANY (ARRAY[
      'text'::text,
      'image'::text,
      'file'::text,
      'system'::text,
      'audio'::text,
      'video'::text,
      'call_log'::text
    ]));

-- 2. Relajar el check de contenido para permitir audio/video sin content ni attachments
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_check
    CHECK (
      (content <> ''::text)
      OR (attachments IS NOT NULL)
      OR (type = ANY (ARRAY['audio'::text, 'video'::text, 'call_log'::text]))
    );

-- 3. Agregar columna duration_seconds (duración del audio/video/llamada en segundos)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS duration_seconds integer
    CONSTRAINT chat_messages_duration_check
      CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

-- 4. Agregar columna waveform (amplitudes del audio para visualización de onda)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS waveform jsonb;

COMMENT ON COLUMN public.chat_messages.duration_seconds IS
  'Duración en segundos para mensajes de tipo audio, video o call_log.';
COMMENT ON COLUMN public.chat_messages.waveform IS
  'Array de amplitudes normalizadas [0..1] para la visualización de onda de audio. Máximo 40 puntos.';

-- 5. Actualizar la función send_message para aceptar y persistir metadata, duration_seconds y waveform
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_type text DEFAULT 'text'::text,
  p_attachments jsonb DEFAULT NULL::jsonb,
  p_reply_to_id uuid DEFAULT NULL::uuid,
  p_metadata jsonb DEFAULT NULL::jsonb,
  p_duration_seconds integer DEFAULT NULL::integer,
  p_waveform jsonb DEFAULT NULL::jsonb
) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER
  AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insertar mensaje
  INSERT INTO chat_messages (
    conversation_id,
    sender_id,
    content,
    type,
    attachments,
    reply_to_id,
    metadata,
    duration_seconds,
    waveform
  )
  VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_type,
    p_attachments,
    p_reply_to_id,
    COALESCE(p_metadata, '{}'::jsonb),
    p_duration_seconds,
    p_waveform
  )
  RETURNING id INTO v_message_id;

  -- Actualizar último mensaje en conversación
  UPDATE chat_conversations
  SET
    last_message_at = now(),
    last_message_preview = CASE
      WHEN p_type = 'text'     THEN left(p_content, 100)
      WHEN p_type = 'image'    THEN '📷 Imagen'
      WHEN p_type = 'file'     THEN '📎 Archivo'
      WHEN p_type = 'audio'    THEN '🎵 Audio'
      WHEN p_type = 'video'    THEN '🎬 Video'
      WHEN p_type = 'call_log' THEN '📞 Llamada'
      ELSE '💬 Mensaje'
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Incrementar contador de no leídos para otros participantes
  UPDATE chat_participants
  SET
    unread_count = unread_count + 1,
    updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id
    AND left_at IS NULL;

  RETURN v_message_id;
END;
$$;
