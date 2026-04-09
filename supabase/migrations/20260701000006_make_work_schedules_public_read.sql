-- =====================================================================================
-- Migration: 20260701000006_make_work_schedules_public_read.sql
-- Description: Permitir lectura publica de horarios de empleados para booking wizard
-- Date: 2026-04-08
-- =====================================================================================

-- Mantener RLS activo y abrir solo SELECT para cualquier usuario
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view employee schedules" ON public.work_schedules;
CREATE POLICY "Public can view employee schedules"
ON public.work_schedules
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (true);
