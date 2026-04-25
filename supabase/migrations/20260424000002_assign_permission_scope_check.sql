-- ============================================================================
-- Migration: Scope check for assign_user_permission / apply_permission_template
-- Author:    Claude Code (Stabilization sprint — Abril 2026)
-- Ref:       Obsidian/Gestabiz/Contexto/auditoria-completa-abril-2026.md §1.1
-- Purpose:   Las funciones assign_user_permission y apply_permission_template
--            ya validan que el caller sea permission_manager (owner/admin),
--            pero NO validan que el permiso específico esté dentro del scope
--            del rol del caller. Resultado: un admin puede asignarse a sí
--            mismo (o a otros) permisos que deberían estar reservados al
--            owner — billing, eliminar negocio, transferir propiedad, etc.
--
--            Esta migración crea una whitelist de permisos owner-only y un
--            helper _can_grant_permission() que retorna false si el caller
--            es admin/manager y el permiso está en esa lista.
--
--            Diseño: tabla configurable (no constantes hardcoded) para que
--            el equipo pueda ajustar el alcance sin nueva migración.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla owner_only_permissions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.owner_only_permissions (
    permission text PRIMARY KEY,
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.owner_only_permissions IS
    'Permisos que SOLO el owner del negocio puede otorgar. Un admin/manager que intente asignarlos recibe error. Configurable sin migración.';

ALTER TABLE public.owner_only_permissions ENABLE ROW LEVEL SECURITY;

-- Lectura pública (lista no es secreta — es metadata de seguridad).
DROP POLICY IF EXISTS owner_only_permissions_read ON public.owner_only_permissions;
CREATE POLICY owner_only_permissions_read
    ON public.owner_only_permissions
    AS PERMISSIVE
    FOR SELECT
    TO authenticated, service_role
    USING (true);

-- Escritura solo service_role (manage via SQL/migration).
DROP POLICY IF EXISTS owner_only_permissions_write ON public.owner_only_permissions;
CREATE POLICY owner_only_permissions_write
    ON public.owner_only_permissions
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Seed inicial: permisos sensibles que un admin no debería otorgar.
INSERT INTO public.owner_only_permissions (permission, reason) VALUES
    ('billing.manage',              'Gestión de pagos y métodos de pago — solo owner'),
    ('billing.cancel_subscription', 'Cancelar suscripción del negocio — solo owner'),
    ('billing.change_plan',         'Cambiar plan de suscripción — solo owner'),
    ('business.delete',             'Eliminar negocio (acción destructiva) — solo owner'),
    ('business.transfer_ownership', 'Transferir propiedad del negocio — solo owner'),
    ('settings.delete_business',    'Eliminar negocio desde settings — solo owner'),
    ('permissions.assign_owner',    'Asignar nivel owner a otro usuario — solo owner')
ON CONFLICT (permission) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Helper _can_grant_permission(business_id, caller_id, permission)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._can_grant_permission(
    p_business_id uuid,
    p_caller_id uuid,
    p_permission text
) RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
BEGIN
    -- Owner siempre puede otorgar cualquier permiso.
    IF EXISTS (
        SELECT 1 FROM businesses
        WHERE id = p_business_id AND owner_id = p_caller_id
    ) THEN
        RETURN true;
    END IF;

    -- No-owner: solo puede otorgar si NO está en owner_only_permissions.
    IF EXISTS (
        SELECT 1 FROM owner_only_permissions
        WHERE permission = p_permission
    ) THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;

COMMENT ON FUNCTION public._can_grant_permission(uuid, uuid, text) IS
    'Devuelve true si el caller puede otorgar el permiso. Owner: siempre. Otros: solo si no está en owner_only_permissions.';

-- ----------------------------------------------------------------------------
-- 3. assign_user_permission — agregar scope check
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_user_permission(
    p_business_id uuid,
    p_user_id uuid,
    p_permission text,
    p_notes text DEFAULT NULL::text
) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
    v_granted_by UUID;
BEGIN
    v_granted_by := auth.uid();

    IF v_granted_by IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    -- Caller debe ser permission_manager (owner o admin/manager).
    IF NOT _check_permission_manager(p_business_id, v_granted_by) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Forbidden: insufficient privileges');
    END IF;

    -- *** SCOPE CHECK (nuevo, abr 2026) ***
    -- Caller debe tener autoridad para otorgar ESTE permiso específico.
    -- Bloquea que un admin se asigne (o asigne a otros) permisos owner-only.
    IF NOT _can_grant_permission(p_business_id, v_granted_by, p_permission) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Forbidden: only the business owner can grant this permission',
            'permission', p_permission
        );
    END IF;

    INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active, notes)
    VALUES (p_business_id, p_user_id, p_permission, v_granted_by, true, p_notes)
    ON CONFLICT (business_id, user_id, permission)
    DO UPDATE SET
        is_active  = true,
        granted_by = v_granted_by,
        notes      = COALESCE(p_notes, user_permissions.notes),
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success',     true,
        'business_id', p_business_id,
        'user_id',     p_user_id,
        'permission',  p_permission,
        'granted_by',  v_granted_by,
        'granted_at',  NOW()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. apply_permission_template — agregar scope check (todos los permisos
--    del template deben ser otorgables por el caller).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_permission_template(
    p_business_id uuid,
    p_user_id uuid,
    p_template_name text,
    p_notes text DEFAULT NULL::text
) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
    v_granted_by UUID;
    v_template_permissions TEXT[];
    v_inserted INTEGER := 0;
    v_blocked TEXT[];
    v_perm TEXT;
BEGIN
    v_granted_by := auth.uid();

    IF v_granted_by IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    IF NOT _check_permission_manager(p_business_id, v_granted_by) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Forbidden: insufficient privileges');
    END IF;

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

    -- *** SCOPE CHECK (nuevo, abr 2026) ***
    -- Si el template incluye permisos owner-only y el caller no es owner,
    -- rechazar el template completo (no aplicar parcial — un template medio
    -- aplicado es peor que ninguno).
    v_blocked := ARRAY[]::TEXT[];
    FOREACH v_perm IN ARRAY v_template_permissions LOOP
        IF NOT _can_grant_permission(p_business_id, v_granted_by, v_perm) THEN
            v_blocked := array_append(v_blocked, v_perm);
        END IF;
    END LOOP;

    IF array_length(v_blocked, 1) > 0 THEN
        RETURN jsonb_build_object(
            'success',  false,
            'error',    'Forbidden: template contains owner-only permissions',
            'blocked',  to_jsonb(v_blocked)
        );
    END IF;

    -- Aplicar todos los permisos del template.
    FOREACH v_perm IN ARRAY v_template_permissions LOOP
        INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active, notes)
        VALUES (p_business_id, p_user_id, v_perm, v_granted_by, true, p_notes)
        ON CONFLICT (business_id, user_id, permission)
        DO UPDATE SET
            is_active  = true,
            granted_by = v_granted_by,
            notes      = COALESCE(p_notes, user_permissions.notes),
            updated_at = NOW();
        v_inserted := v_inserted + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success',           true,
        'template',          p_template_name,
        'permissions_applied', v_inserted,
        'business_id',       p_business_id,
        'user_id',           p_user_id
    );
END;
$$;
