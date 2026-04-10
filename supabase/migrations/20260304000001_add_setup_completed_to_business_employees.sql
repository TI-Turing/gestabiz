-- =====================================================
-- Migración: setup_completed en business_employees
-- Fecha: 2026-03-04
-- Los empleados recién aprobados quedan en FALSE hasta
-- que el admin les asigne un supervisor (jefe directo).
-- Solo entonces aparecen disponibles para recibir citas.
--
-- NOTA: El backfill se omite aquí porque los UPDATEs
-- en business_employees disparan triggers de sincronización
-- que producen stack overflow en cascada. La lógica de
-- negocio en la app deriva el estado "configurado" de:
--   setup_completed = TRUE
--   OR role IN ('manager', 'owner')
--   OR business_roles.reports_to IS NOT NULL
-- =====================================================

ALTER TABLE business_employees
  ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_be_setup_completed
  ON business_employees(business_id, setup_completed)
  WHERE setup_completed = FALSE;
