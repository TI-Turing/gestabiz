-- =====================================================
-- MIGRACIÓN: Presencia de Usuario
-- Fecha: 2026-04-28
-- Descripción:
--   Tabla liviana para trackear el estado online/offline
--   de usuarios en tiempo real. Usada por el semáforo
--   de presencia en el chat (verde/amarillo/gris).
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id      uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'offline'
                             CHECK (status IN ('online', 'offline')),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_presence IS
  'Estado de presencia online/offline por usuario. Actualizado por el cliente vía Supabase Realtime o heartbeat periódico.';

-- RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer el estado de presencia (necesario para el semáforo del chat)
CREATE POLICY "presence_read_authenticated"
  ON public.user_presence
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo el propio usuario puede insertar/actualizar su estado
CREATE POLICY "presence_self_write"
  ON public.user_presence
  FOR ALL
  USING (user_id = auth.uid());

-- Índice para consultas de múltiples usuarios a la vez (ej: listar presencias de participantes)
CREATE INDEX IF NOT EXISTS idx_user_presence_status
  ON public.user_presence (status, last_seen_at DESC);
