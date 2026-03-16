-- Migration: Fix Permission RPC Authorization
-- Created: 2026-03-16
-- Purpose: Add proper owner/admin authorization checks to permission RPC functions.
--          Previously, any authenticated user could grant/revoke permissions on
--          ANY business — a critical privilege escalation vulnerability.
-- Severity: CRITICAL — Auth bypass allowing full permission takeover

-- Helper: checks if caller is owner or admin of the given business
-- Used internally to avoid code duplication across RPC functions
CREATE OR REPLACE FUNCTION _check_permission_manager(p_business_id UUID, p_caller_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Owner bypass: fastest check
  IF EXISTS (
    SELECT 1 FROM businesses
    WHERE id = p_business_id AND owner_id = p_caller_id
  ) THEN
    RETURN true;
  END IF;

  -- Admin check via business_roles
  IF EXISTS (
    SELECT 1 FROM business_roles
    WHERE business_id = p_business_id
      AND user_id = p_caller_id
      AND role IN ('admin', 'manager')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: revoke_user_permission (patched — add authorization check)
-- ============================================================================
CREATE OR REPLACE FUNCTION revoke_user_permission(
  p_business_id UUID,
  p_user_id UUID,
  p_permission TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_rows_affected INTEGER;
  v_was_active BOOLEAN;
  v_revoked_by UUID;
BEGIN
  v_revoked_by := auth.uid();

  IF v_revoked_by IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- *** AUTHORIZATION CHECK (was missing) ***
  IF NOT _check_permission_manager(p_business_id, v_revoked_by) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden: insufficient privileges');
  END IF;

  SELECT is_active INTO v_was_active
  FROM user_permissions
  WHERE business_id = p_business_id
    AND user_id = p_user_id
    AND permission = p_permission;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission not found');
  END IF;

  IF v_was_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already revoked');
  END IF;

  UPDATE user_permissions
  SET
    is_active = false,
    notes = COALESCE(p_notes, 'Revoked via RPC function'),
    updated_at = NOW()
  WHERE business_id = p_business_id
    AND user_id = p_user_id
    AND permission = p_permission
    AND is_active = true;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  SELECT jsonb_build_object(
    'success', true,
    'rows_affected', v_rows_affected,
    'business_id', p_business_id,
    'user_id', p_user_id,
    'permission', p_permission,
    'revoked_at', NOW(),
    'revoked_by', v_revoked_by
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: assign_user_permission (patched — add authorization check)
-- ============================================================================
CREATE OR REPLACE FUNCTION assign_user_permission(
  p_business_id UUID,
  p_user_id UUID,
  p_permission TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_granted_by UUID;
BEGIN
  v_granted_by := auth.uid();

  IF v_granted_by IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- *** AUTHORIZATION CHECK (was missing) ***
  IF NOT _check_permission_manager(p_business_id, v_granted_by) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden: insufficient privileges');
  END IF;

  INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active, notes)
  VALUES (p_business_id, p_user_id, p_permission, v_granted_by, true, p_notes)
  ON CONFLICT (business_id, user_id, permission)
  DO UPDATE SET
    is_active = true,
    granted_by = v_granted_by,
    notes = COALESCE(p_notes, user_permissions.notes),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'user_id', p_user_id,
    'permission', p_permission,
    'granted_by', v_granted_by,
    'granted_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: bulk_assign_permissions_from_template (patched — add auth check)
-- ============================================================================
CREATE OR REPLACE FUNCTION bulk_assign_permissions_from_template(
  p_business_id UUID,
  p_user_id UUID,
  p_template_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_granted_by UUID;
  v_template_permissions TEXT[];
  v_inserted INTEGER := 0;
BEGIN
  v_granted_by := auth.uid();

  IF v_granted_by IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- *** AUTHORIZATION CHECK (was missing) ***
  IF NOT _check_permission_manager(p_business_id, v_granted_by) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden: insufficient privileges');
  END IF;

  -- Get permissions from template
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(permissions)
    FROM permission_templates
    WHERE name = p_template_name
      AND (business_id = p_business_id OR business_id IS NULL)
    LIMIT 1
  ) INTO v_template_permissions;

  IF array_length(v_template_permissions, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template not found: ' || p_template_name);
  END IF;

  -- Bulk insert permissions
  INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
  SELECT p_business_id, p_user_id, unnest(v_template_permissions), v_granted_by, true
  ON CONFLICT (business_id, user_id, permission)
  DO UPDATE SET
    is_active = true,
    granted_by = v_granted_by,
    updated_at = NOW();

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'template', p_template_name,
    'permissions_assigned', v_inserted,
    'business_id', p_business_id,
    'user_id', p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: bulk_revoke_user_permissions (patched — add auth check)
-- ============================================================================
CREATE OR REPLACE FUNCTION bulk_revoke_user_permissions(
  p_business_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_revoked_by UUID;
  v_rows_affected INTEGER;
BEGIN
  v_revoked_by := auth.uid();

  IF v_revoked_by IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- *** AUTHORIZATION CHECK (was missing) ***
  IF NOT _check_permission_manager(p_business_id, v_revoked_by) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden: insufficient privileges');
  END IF;

  UPDATE user_permissions
  SET is_active = false, updated_at = NOW()
  WHERE business_id = p_business_id
    AND user_id = p_user_id
    AND is_active = true;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'rows_affected', v_rows_affected,
    'business_id', p_business_id,
    'user_id', p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
