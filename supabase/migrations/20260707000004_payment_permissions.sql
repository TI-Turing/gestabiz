-- ============================================================================
-- Migration: Payment Permissions
-- Adds 4 new payments.* permissions to system templates and assigns them to
-- existing owners (via auto trigger pattern).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Update existing system templates to include new payment permissions
-- ----------------------------------------------------------------------------

-- Admin Completo: incluir todos los permisos de pagos
UPDATE public.permission_templates
SET permissions = (
  SELECT jsonb_agg(DISTINCT p)
  FROM jsonb_array_elements_text(
    permissions ||
    '["payments.configure","payments.refund","payments.view","payments.connect_account"]'::jsonb
  ) p
)
WHERE is_system_template = true
  AND role = 'admin'
  AND name IN ('Admin Completo', 'Manager de Sede', 'Gerente de Sede');

-- Contador: solo view (lectura)
UPDATE public.permission_templates
SET permissions = (
  SELECT jsonb_agg(DISTINCT p)
  FROM jsonb_array_elements_text(
    permissions || '["payments.view"]'::jsonb
  ) p
)
WHERE is_system_template = true
  AND name IN ('Contador');

-- Recepcionista, Vendedor, Cajero: view (para conocer si la cita ya tiene anticipo pagado)
UPDATE public.permission_templates
SET permissions = (
  SELECT jsonb_agg(DISTINCT p)
  FROM jsonb_array_elements_text(
    permissions || '["payments.view"]'::jsonb
  ) p
)
WHERE is_system_template = true
  AND name IN ('Recepcionista', 'Vendedor', 'Cajero');

-- ----------------------------------------------------------------------------
-- 2. Backfill: asignar permisos de pagos a TODOS los owners existentes
-- ----------------------------------------------------------------------------

INSERT INTO public.user_permissions (business_id, user_id, permission, granted_by, is_active, notes)
SELECT
  b.id AS business_id,
  b.owner_id AS user_id,
  perm AS permission,
  b.owner_id AS granted_by,
  true AS is_active,
  'Auto-asignado en migración 20260707000004 (payments)' AS notes
FROM public.businesses b
CROSS JOIN unnest(ARRAY[
  'payments.configure',
  'payments.refund',
  'payments.view',
  'payments.connect_account'
]) AS perm
ON CONFLICT (business_id, user_id, permission) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Backfill: asignar permisos de pagos a admins existentes (no owners)
-- ----------------------------------------------------------------------------

INSERT INTO public.user_permissions (business_id, user_id, permission, granted_by, is_active, notes)
SELECT
  br.business_id,
  br.user_id,
  perm AS permission,
  b.owner_id AS granted_by,
  true AS is_active,
  'Auto-asignado en migración 20260707000004 (payments) — admin'
FROM public.business_roles br
JOIN public.businesses b ON b.id = br.business_id
CROSS JOIN unnest(ARRAY[
  'payments.configure',
  'payments.refund',
  'payments.view',
  'payments.connect_account'
]) AS perm
WHERE br.role = 'admin'
  AND br.is_active = true
  AND br.user_id <> b.owner_id
ON CONFLICT (business_id, user_id, permission) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Comentarios documentando los nuevos permisos
-- ----------------------------------------------------------------------------

COMMENT ON COLUMN public.user_permissions.permission IS
  'Tipo de permiso. Categorías: business.*, locations.*, services.*, resources.*, employees.*, appointments.*, clients.*, accounting.*, reports.*, permissions.*, notifications.*, settings.*, payments.* (configure/refund/view/connect_account).';
