-- =====================================================
-- MIGRACIÓN: Modelo de Relación de Chat
-- Fecha: 2026-04-28
-- Descripción:
--   Extiende la tabla `conversations` con campos de relación
--   para distinguir hilos cliente↔negocio, colaborador↔negocio
--   y soporte. Garantiza un único hilo por relación.
-- Tabla afectada: conversations (usa ENUM conversation_type existente)
-- =====================================================

-- 1. Agregar columna de tipo de relación
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS relationship_type text
    CHECK (relationship_type IN ('client_business', 'business_collaborator', 'support'));

-- 2. Agregar client_id (quién inicia desde el lado cliente)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS client_id uuid
    REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Agregar counterpart_user_id (el admin/empleado del lado negocio)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS counterpart_user_id uuid
    REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. CHECK: si hay relationship_type no-support, debe haber business_id
--    (business_id ya tiene NOT NULL en conversations, así que solo verificamos support)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_relationship_business_check'
      AND conrelid = 'public.conversations'::regclass
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_relationship_business_check
        CHECK (
          relationship_type IS NULL OR
          relationship_type = 'support' OR
          business_id IS NOT NULL
        );
  END IF;
END$$;

-- 5. Índice UNIQUE por relación para evitar hilos duplicados
--    Solo aplica cuando relationship_type IS NOT NULL y type = 'direct'
CREATE UNIQUE INDEX IF NOT EXISTS uniq_chat_relationship
  ON public.conversations (
    business_id,
    relationship_type,
    LEAST(client_id, counterpart_user_id),
    GREATEST(client_id, counterpart_user_id)
  )
  WHERE relationship_type IS NOT NULL
    AND type = 'direct'::public.conversation_type
    AND client_id IS NOT NULL
    AND counterpart_user_id IS NOT NULL;

COMMENT ON COLUMN public.conversations.relationship_type IS
  'Tipo de relación del hilo: client_business (cliente↔negocio), business_collaborator (equipo), support (soporte). NULL = hilo legacy sin clasificar.';
COMMENT ON COLUMN public.conversations.client_id IS
  'Para relationship_type=client_business: ID del perfil que actúa como cliente en esta conversación.';
COMMENT ON COLUMN public.conversations.counterpart_user_id IS
  'Para relationship_type=client_business: ID del admin/empleado que responde por el negocio.';
