-- =====================================================
-- MIGRACIÓN: Horario de Trabajo por Empleado
-- Fecha: 2026-04-28
-- Descripción:
--   Tabla para configurar los bloques de horario laboral
--   por empleado y negocio. Permite múltiples bloques por día
--   (ej: 9-13 y 15-18 para jornada partida).
--   Usada por el semáforo de presencia del chat.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.employee_work_schedule (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id  uuid        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  day_of_week  smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 1=Lun ... 6=Sab
  start_time   time        NOT NULL,
  end_time     time        NOT NULL,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ews_end_after_start CHECK (end_time > start_time),
  CONSTRAINT ews_unique_slot UNIQUE (business_id, employee_id, day_of_week, start_time)
);

COMMENT ON TABLE public.employee_work_schedule IS
  'Bloques de horario laboral configurados por empleado y negocio. Múltiples bloques por día permiten jornadas partidas.';

-- Índice de lookup rápido para el semáforo de presencia
CREATE INDEX IF NOT EXISTS idx_ews_lookup
  ON public.employee_work_schedule (employee_id, business_id, is_active);

-- RLS
ALTER TABLE public.employee_work_schedule ENABLE ROW LEVEL SECURITY;

-- Empleado lee y edita su propio horario
CREATE POLICY "ews_employee_own"
  ON public.employee_work_schedule
  FOR ALL
  USING (employee_id = auth.uid());

-- Admin del negocio (en business_roles) lee y edita horarios de sus empleados
CREATE POLICY "ews_admin_business"
  ON public.employee_work_schedule
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_roles br
      WHERE br.business_id = employee_work_schedule.business_id
        AND br.user_id = auth.uid()
        AND br.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = employee_work_schedule.business_id
        AND b.owner_id = auth.uid()
    )
  );

-- Cualquier autenticado puede leer horarios (para calcular semáforo de presencia en chat)
CREATE POLICY "ews_read_authenticated"
  ON public.employee_work_schedule
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
