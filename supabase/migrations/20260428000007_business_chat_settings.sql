-- =====================================================
-- MIGRACIÓN: Configuración de Chat por Negocio
-- Fecha: 2026-04-28
-- Descripción:
--   Agrega allow_chat_with_professionals a businesses para
--   controlar si los clientes pueden ver el nombre/avatar
--   del profesional en conversaciones client_business.
--   La columna allow_professional_chat (20260703) controla
--   si pueden CHATEAR con profesionales; esta nueva columna
--   controla si se MUESTRA quién responde.
-- =====================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS allow_chat_with_professionals boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.businesses.allow_chat_with_professionals IS
  'Si es TRUE, los clientes ven el nombre/avatar del profesional que responde en el chat. '
  'Si es FALSE, solo ven el logo y nombre del negocio (modo anónimo de negocio). '
  'Diferente de allow_professional_chat (que controla acceso) — este controla visibilidad de identidad.';
