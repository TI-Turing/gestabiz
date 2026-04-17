-- =====================================================
-- MIGRACIÓN: Configuración de Chat por Negocio y Sede
-- Fecha: 2026-07-03
-- Descripción:
--   1. businesses.allow_professional_chat — toggle global para permitir/bloquear
--      que clientes chateen con profesionales (empleados no-admin).
--   2. locations.chat_admin_id — admin designado para atender el chat en cada sede.
--      Debe ser un usuario con hierarchy_level <= 1 (Owner=0, Admin=1).
-- =====================================================

-- 1. Columna global en businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS allow_professional_chat BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.businesses.allow_professional_chat IS
  'Si es TRUE los clientes pueden chatear con cualquier profesional que tenga allow_client_messages=true. '
  'Si es FALSE solo pueden chatear con el admin de chat asignado a la sede.';

-- 2. Columna de admin de chat por sede
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS chat_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.locations.chat_admin_id IS
  'ID del perfil que actúa como administrador de chat para esta sede. '
  'Debe ser un usuario con hierarchy_level 0 (Owner) o 1 (Admin) en el negocio.';

-- 3. Índice para acelerar búsquedas por chat_admin_id
CREATE INDEX IF NOT EXISTS idx_locations_chat_admin_id
  ON public.locations(chat_admin_id)
  WHERE chat_admin_id IS NOT NULL;
