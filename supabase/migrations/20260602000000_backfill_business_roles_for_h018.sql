-- ===================================================================
-- MIGRACIÓN: Backfill business_roles desde business_employees (H-018)
-- Fecha: Junio 2026
-- Autor: TI-Turing Team
--
-- PROBLEMA (H-018): El owner registrado en business_employees (via trigger
-- auto_insert_owner_to_business_employees) NO aparece en business_roles
-- cuando la migración/trigger sync_business_roles_from_business_employees
-- fue aplicado con posterioridad a la creación del negocio.
--
-- EFECTO: EmployeeManagementHierarchy (que usa RPC get_business_hierarchy
-- la cual consulta business_roles) mostraba "Total de Empleados: 0"
-- mientras OverviewTab (que consulta business_employees) mostraba "1".
--
-- SOLUCIÓN: Insertar en business_roles cualquier registro de business_employees
-- que no tenga su equivalente en business_roles, usando la misma lógica
-- que el trigger sync_business_roles_from_business_employees.
-- ===================================================================

-- Backfill: Insertar en business_roles los registros faltantes
INSERT INTO public.business_roles (
  user_id,
  business_id,
  role,
  hierarchy_level,
  is_active,
  assigned_by,
  created_at,
  updated_at
)
SELECT
  be.employee_id                                                   AS user_id,
  be.business_id,
  -- Owner del negocio → nivel 0 (Owner), demás managers → nivel 1 (Admin)
  CASE WHEN be.role = 'manager' THEN 'admin' ELSE 'employee' END  AS role,
  CASE
    WHEN be.employee_id = b.owner_id THEN 0   -- Owner del negocio
    WHEN be.role = 'manager'         THEN 1   -- Manager/Admin
    ELSE 4                                     -- Staff
  END                                                              AS hierarchy_level,
  be.is_active,
  b.owner_id                                                       AS assigned_by,
  NOW(),
  NOW()
FROM public.business_employees be
JOIN public.businesses b ON b.id = be.business_id
WHERE be.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.business_roles br
    WHERE br.user_id     = be.employee_id
      AND br.business_id = be.business_id
  )
ON CONFLICT DO NOTHING;

-- Verificación
DO $$
DECLARE
  v_inserted INTEGER;
  v_total_be INTEGER;
  v_total_br INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_be FROM public.business_employees WHERE is_active = true;
  SELECT COUNT(*) INTO v_total_br FROM public.business_roles      WHERE is_active = true;

  RAISE NOTICE '=== H-018 BACKFILL COMPLETADO ===';
  RAISE NOTICE 'business_employees activos : %', v_total_be;
  RAISE NOTICE 'business_roles    activos  : %', v_total_br;
END $$;
