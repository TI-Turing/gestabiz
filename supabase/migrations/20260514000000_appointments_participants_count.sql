-- Agrega participants_count a appointments para soporte de group_class.
-- DEFAULT 1 garantiza retrocompatibilidad con todas las citas existentes.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS participants_count INT NOT NULL DEFAULT 1
    CHECK (participants_count > 0);

COMMENT ON COLUMN public.appointments.participants_count IS
  'Cantidad de personas para esta reserva. Default 1. Relevante para group_class.';

-- RPC para validar capacidad en slots de group_class.
-- Retorna true si aún caben p_requested participantes en el slot.
CREATE OR REPLACE FUNCTION public.is_resource_slot_available(
  p_resource_id  uuid,
  p_start        timestamptz,
  p_end          timestamptz,
  p_requested    int
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(a.participants_count), 0) + p_requested
       <= (SELECT capacity FROM public.business_resources WHERE id = p_resource_id)
  FROM public.appointments a
  WHERE a.resource_id = p_resource_id
    AND a.status NOT IN ('cancelled', 'no_show')
    AND a.start_time < p_end
    AND a.end_time > p_start;
$$;
