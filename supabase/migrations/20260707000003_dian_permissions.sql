-- Migration: 20260707000003_dian_permissions.sql
-- Agrega permisos de facturación electrónica DIAN a los triggers auto_assign_*
-- y los actualiza en negocios/admins existentes.

-- ============================================================
-- 1. Actualizar función auto_assign_permissions_to_owner
--    Agrega 4 permisos DIAN a la lista de permisos del owner
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_assign_permissions_to_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permission text;
  v_count integer := 0;
BEGIN
  RAISE NOTICE 'auto_assign_permissions_to_owner: Asignando permisos al owner % del negocio %', NEW.owner_id, NEW.id;

  FOR v_permission IN
    SELECT unnest(ARRAY[
      -- Services (6)
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.toggle', 'services.pricing',
      -- Resources (5)
      'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'resources.availability',
      -- Locations (5)
      'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.manage',
      -- Employees (7)
      'employees.view', 'employees.create', 'employees.edit', 'employees.deactivate',
      'employees.view_salary', 'employees.transfer', 'employees.hierarchy',
      -- Appointments (6)
      'appointments.view_all', 'appointments.create', 'appointments.edit',
      'appointments.cancel', 'appointments.complete', 'appointments.reschedule',
      -- Clients (5)
      'clients.view', 'clients.edit', 'clients.export', 'clients.communication', 'clients.history',
      -- Accounting (9)
      'accounting.view', 'accounting.tax_config',
      'accounting.expenses.view', 'accounting.expenses.create', 'accounting.expenses.pay',
      'accounting.payroll.view', 'accounting.payroll.create', 'accounting.payroll.config',
      'accounting.export',
      -- Expenses (2)
      'expenses.create', 'expenses.delete',
      -- Reports (4)
      'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
      -- Permissions (5)
      'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee',
      'permissions.modify', 'permissions.revoke',
      -- Recruitment (4)
      'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
      -- Chat (3)
      'chat.view_all', 'chat.delete', 'chat.moderate',
      -- Reviews (4)
      'reviews.create', 'reviews.moderate', 'reviews.respond', 'reviews.toggle_visibility',
      -- Favorites (1)
      'favorites.toggle',
      -- Notifications (3)
      'notifications.send', 'notifications.bulk', 'notifications.manage',
      -- Settings (3)
      'settings.view', 'settings.edit_own', 'settings.edit_business',
      -- Absences (2)
      'absences.approve', 'absences.request',
      -- Sales (1)
      'sales.create',
      -- Billing (6) — ACTUALIZADO: agrega 4 nuevos permisos DIAN
      'billing.manage', 'billing.view',
      'billing.dian_enroll',      -- Configurar habilitación DIAN (wizard)
      'billing.emit_invoice',     -- Emitir facturas electrónicas
      'billing.view_invoices',    -- Ver historial de facturas
      'billing.emit_credit_note'  -- Emitir notas crédito
    ])
  LOOP
    INSERT INTO public.user_permissions (
      user_id,
      business_id,
      permission,
      granted_by,
      is_active,
      created_at,
      notes
    )
    VALUES (
      NEW.owner_id,
      NEW.id,
      v_permission,
      NEW.owner_id,
      true,
      NOW(),
      'Auto-asignado al crear negocio (trigger: auto_assign_permissions_to_owner)'
    )
    ON CONFLICT (business_id, user_id, permission) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '  ✅ Asignados % permisos al owner %', v_count, NEW.owner_id;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Actualizar función auto_assign_permissions_to_admin
--    Agrega los mismos 4 permisos DIAN al admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_assign_permissions_to_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permission text;
  v_count integer := 0;
BEGIN
  IF NEW.role != 'admin' THEN
    RETURN NEW;
  END IF;

  RAISE NOTICE 'auto_assign_permissions_to_admin: Asignando permisos al admin % del negocio %', NEW.user_id, NEW.business_id;

  FOR v_permission IN
    SELECT unnest(ARRAY[
      -- Services (6)
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.toggle', 'services.pricing',
      -- Resources (5)
      'resources.view', 'resources.create', 'resources.edit', 'resources.delete', 'resources.availability',
      -- Locations (5)
      'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.manage',
      -- Employees (7)
      'employees.view', 'employees.create', 'employees.edit', 'employees.deactivate',
      'employees.view_salary', 'employees.transfer', 'employees.hierarchy',
      -- Appointments (6)
      'appointments.view_all', 'appointments.create', 'appointments.edit',
      'appointments.cancel', 'appointments.complete', 'appointments.reschedule',
      -- Clients (5)
      'clients.view', 'clients.edit', 'clients.export', 'clients.communication', 'clients.history',
      -- Accounting (9)
      'accounting.view', 'accounting.tax_config',
      'accounting.expenses.view', 'accounting.expenses.create', 'accounting.expenses.pay',
      'accounting.payroll.view', 'accounting.payroll.create', 'accounting.payroll.config',
      'accounting.export',
      -- Expenses (2)
      'expenses.create', 'expenses.delete',
      -- Reports (4)
      'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
      -- Permissions (5)
      'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee',
      'permissions.modify', 'permissions.revoke',
      -- Recruitment (4)
      'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
      -- Chat (3)
      'chat.view_all', 'chat.delete', 'chat.moderate',
      -- Reviews (4)
      'reviews.create', 'reviews.moderate', 'reviews.respond', 'reviews.toggle_visibility',
      -- Favorites (1)
      'favorites.toggle',
      -- Notifications (3)
      'notifications.send', 'notifications.bulk', 'notifications.manage',
      -- Settings (3)
      'settings.view', 'settings.edit_own', 'settings.edit_business',
      -- Absences (2)
      'absences.approve', 'absences.request',
      -- Sales (1)
      'sales.create',
      -- Billing (6) — ACTUALIZADO
      'billing.manage', 'billing.view',
      'billing.dian_enroll',
      'billing.emit_invoice',
      'billing.view_invoices',
      'billing.emit_credit_note'
    ])
  LOOP
    INSERT INTO public.user_permissions (
      user_id,
      business_id,
      permission,
      granted_by,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      NEW.business_id,
      v_permission,
      NULL,
      TRUE,
      NOW(),
      NOW()
    )
    ON CONFLICT (business_id, user_id, permission) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '  ✅ Asignados % permisos al admin %', v_count, NEW.user_id;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Backfill: asignar los 4 nuevos permisos a todos los owners actuales
-- ============================================================

INSERT INTO public.user_permissions (user_id, business_id, permission, granted_by, is_active, created_at, notes)
SELECT
    b.owner_id,
    b.id,
    perm,
    b.owner_id,
    true,
    NOW(),
    'Backfill permisos DIAN — migración 20260707000003'
FROM
    public.businesses b,
    unnest(ARRAY[
        'billing.dian_enroll',
        'billing.emit_invoice',
        'billing.view_invoices',
        'billing.emit_credit_note'
    ]) AS perm
WHERE b.owner_id IS NOT NULL
ON CONFLICT (business_id, user_id, permission) DO NOTHING;

-- Backfill para admins existentes
INSERT INTO public.user_permissions (user_id, business_id, permission, granted_by, is_active, created_at, updated_at)
SELECT
    br.user_id,
    br.business_id,
    perm,
    NULL,
    true,
    NOW(),
    NOW()
FROM
    public.business_roles br,
    unnest(ARRAY[
        'billing.dian_enroll',
        'billing.emit_invoice',
        'billing.view_invoices',
        'billing.emit_credit_note'
    ]) AS perm
WHERE br.role = 'admin'
ON CONFLICT (business_id, user_id, permission) DO NOTHING;

-- ============================================================
-- 4. Agregar billing.view_invoices al template de Contador
--    billing.emit_invoice + billing.emit_credit_note a Manager de Sede
-- ============================================================

UPDATE public.permission_templates
SET
    permissions = permissions || '["billing.view_invoices", "billing.emit_invoice"]'::jsonb,
    updated_at = NOW()
WHERE name IN ('Contador', 'Accountant')
  AND NOT (permissions @> '["billing.view_invoices"]'::jsonb);

UPDATE public.permission_templates
SET
    permissions = permissions || '["billing.emit_invoice", "billing.view_invoices", "billing.emit_credit_note"]'::jsonb,
    updated_at = NOW()
WHERE name IN ('Manager de Sede', 'Location Manager', 'Gerente de Sede')
  AND NOT (permissions @> '["billing.emit_invoice"]'::jsonb);

COMMENT ON FUNCTION public.auto_assign_permissions_to_owner() IS
    'Auto-asigna 83 permisos completos (incl. 4 DIAN) al owner al crear negocio. '
    'Actualizado en migración 20260707000003 — Facturación Electrónica.';

COMMENT ON FUNCTION public.auto_assign_permissions_to_admin() IS
    'Auto-asigna 83 permisos completos (incl. 4 DIAN) a usuarios cuando se les asigna role=admin. '
    'Actualizado en migración 20260707000003 — Facturación Electrónica.';
