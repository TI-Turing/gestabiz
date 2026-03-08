-- ===================================================================
-- MIGRACIÓN: Fix cascade de triggers al crear negocio (H-010/H-035)
-- Fecha: Junio 2026
-- Autor: TI-Turing Team
-- 
-- PROBLEMA: Stack depth limit exceeded al crear negocios.
-- CADENA INFINITA:
--   businesses INSERT
--     → trg_auto_insert_owner_to_business_employees (INSERT en business_employees)
--       → trg_sync_business_roles_from_business_employees (INSERT en business_roles)
--         → trg_auto_insert_admin_as_employee (UPDATE en business_employees via ON CONFLICT)
--           → trg_sync_business_roles_from_business_employees (UPDATE en business_roles)
--             → trg_auto_insert_admin_as_employee (UPDATE en business_employees)
--               → ... loop infinito → stack depth exceeded
--
-- SOLUCIÓN: En auto_insert_admin_as_employee usar DO NOTHING en lugar de DO UPDATE
--           para evitar actualizaciones redundantes que reinician el ciclo.
-- ===================================================================

-- Reemplazar la función con versión que corta el ciclo
CREATE OR REPLACE FUNCTION auto_insert_admin_as_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si:
  -- 1. El rol es 'admin'
  -- 2. El registro está activo
  -- 3. Es un INSERT o el is_active cambió a true
  IF NEW.role = 'admin' AND NEW.is_active = true THEN
    -- Insertar en business_employees si no existe.
    -- Usar DO NOTHING en lugar de DO UPDATE para evitar el ciclo de triggers:
    -- business_roles INSERT → business_employees UPDATE → business_roles UPDATE → loop
    INSERT INTO business_employees (
      employee_id,
      business_id,
      role,
      employee_type,
      status,
      is_active,
      hire_date,
      offers_services,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      NEW.business_id,
      'manager',
      'location_manager',
      'approved',
      true,
      CURRENT_DATE,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (employee_id, business_id)
    DO NOTHING;  -- ← FIX: DO NOTHING corta el ciclo. El registro ya existe con los valores correctos.

    RAISE NOTICE 'Admin % registrado/verificado en business_employees para negocio %',
                 NEW.user_id, NEW.business_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_insert_admin_as_employee() IS
'Trigger function: Auto-registra admins en business_employees como managers al asignar rol admin en business_roles.
FIX (H-010/H-035): Usa DO NOTHING en ON CONFLICT para evitar cascade infinito de triggers al crear negocios.';

-- ===================================================================
-- Igualmente, en sync_business_roles_from_business_employees
-- añadir una guard para evitar actualizaciones sin cambios reales.
-- ===================================================================

CREATE OR REPLACE FUNCTION sync_business_roles_from_business_employees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assigned_by UUID;
  v_existing_record RECORD;
  v_target_role TEXT;
  v_target_level INT;
BEGIN
  -- Calcular rol y nivel objetivo
  v_target_role  := CASE WHEN NEW.role = 'manager' THEN 'admin' ELSE 'employee' END;
  v_target_level := CASE WHEN NEW.role = 'manager' THEN 1 ELSE 4 END;

  -- Obtener el owner del negocio para usar como assigned_by
  SELECT owner_id INTO v_assigned_by
  FROM businesses
  WHERE id = NEW.business_id
  LIMIT 1;

  IF v_assigned_by IS NULL THEN
    v_assigned_by := NEW.employee_id;
  END IF;

  -- Verificar si ya existe el registro en business_roles
  SELECT id, role, is_active, hierarchy_level
  INTO v_existing_record
  FROM business_roles
  WHERE user_id = NEW.employee_id
    AND business_id = NEW.business_id
  LIMIT 1;

  IF v_existing_record.id IS NULL THEN
    -- No existe: insertar nuevo registro
    INSERT INTO business_roles (
      user_id,
      business_id,
      role,
      hierarchy_level,
      is_active,
      assigned_by
    )
    VALUES (
      NEW.employee_id,
      NEW.business_id,
      v_target_role,
      v_target_level,
      NEW.is_active,
      v_assigned_by
    );
  ELSIF v_existing_record.role != v_target_role
     OR v_existing_record.is_active != NEW.is_active
     OR v_existing_record.hierarchy_level != v_target_level THEN
    -- ← FIX: Solo actualizar si algo realmente cambió, evitando updates redundantes
    -- que reactivan trg_auto_insert_admin_as_employee innecesariamente.
    UPDATE business_roles
    SET
      is_active      = NEW.is_active,
      role           = v_target_role,
      hierarchy_level = v_target_level,
      updated_at     = NOW()
    WHERE id = v_existing_record.id;
  END IF;
  -- Si los valores son iguales no se hace nada → no dispara otros triggers

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_business_roles_from_business_employees() IS
'Trigger function: Mantiene sincronizado business_roles con business_employees.
Manager → Admin (hierarchy_level=1), Employee → Employee (hierarchy_level=4).
FIX (H-010/H-035): Solo realiza UPDATE cuando los valores cambian para evitar cascade infinito.';
