-- =====================================================
-- MIGRACIÓN: Nuevos tipos de mensajes (audio, video, call_log)
-- Fecha: 2026-04-28
-- Descripción:
--   Amplía el ENUM message_type para soportar audio, video
--   y logs de llamadas. En Postgres 15+ ALTER TYPE ADD VALUE
--   puede ir dentro de transacción.
--   Agrega columnas duration_seconds y waveform para audio.
-- =====================================================

-- 1. Ampliar ENUM message_type (ADD VALUE es seguro en PG15+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.message_type'::regtype
      AND enumlabel = 'audio'
  ) THEN
    ALTER TYPE public.message_type ADD VALUE 'audio';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.message_type'::regtype
      AND enumlabel = 'video'
  ) THEN
    ALTER TYPE public.message_type ADD VALUE 'video';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.message_type'::regtype
      AND enumlabel = 'call_log'
  ) THEN
    ALTER TYPE public.message_type ADD VALUE 'call_log';
  END IF;
END$$;

-- 2. Agregar duration_seconds (para mensajes de audio/video/call_log)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS duration_seconds integer
    CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

-- 3. Agregar waveform (amplitudes del audio, array de números en JSONB)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS waveform jsonb;

COMMENT ON COLUMN public.messages.duration_seconds IS
  'Duración en segundos para mensajes de tipo audio, video o call_log.';
COMMENT ON COLUMN public.messages.waveform IS
  'Array de amplitudes normalizadas [0..1] para la visualización de onda de audio. Máximo 40 puntos.';
