-- ============================================================
-- SCHEMA CONSOLIDADO - Gestabiz DEV
-- Generado: 2026-04-10
-- Reemplaza las 140+ migraciones anteriores.
-- Este archivo representa el estado completo del schema de DEV.
-- NO ejecutar directamente en una DB ya inicializada.
-- ============================================================
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_status AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
    'in_progress'
);


--
-- Name: business_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.business_category AS ENUM (
    'health',
    'beauty',
    'fitness',
    'education',
    'consulting',
    'professional',
    'maintenance',
    'food',
    'entertainment',
    'other'
);


--
-- Name: conversation_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.conversation_role AS ENUM (
    'member',
    'admin',
    'owner'
);


--
-- Name: conversation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.conversation_type AS ENUM (
    'direct',
    'group'
);


--
-- Name: delivery_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.delivery_status_enum AS ENUM (
    'sending',
    'sent',
    'delivered',
    'read',
    'failed'
);


--
-- Name: employee_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employee_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'issued',
    'paid',
    'overdue',
    'cancelled',
    'credit_note'
);


--
-- Name: legal_entity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.legal_entity_type AS ENUM (
    'company',
    'individual'
);


--
-- Name: message_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_type AS ENUM (
    'text',
    'image',
    'file',
    'system'
);


--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_channel AS ENUM (
    'email',
    'sms',
    'whatsapp',
    'in_app'
);


--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_status AS ENUM (
    'unread',
    'read',
    'archived'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'appointment_reminder',
    'appointment_cancelled',
    'appointment_confirmed',
    'system',
    'reminder_24h',
    'reminder_1h',
    'reminder_2h'
);


--
-- Name: notification_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type_enum AS ENUM (
    'appointment_reminder',
    'appointment_confirmation',
    'appointment_cancellation',
    'appointment_rescheduled',
    'appointment_new_client',
    'appointment_new_employee',
    'appointment_new_business',
    'email_verification',
    'phone_verification_sms',
    'phone_verification_whatsapp',
    'employee_request_new',
    'employee_request_accepted',
    'employee_request_rejected',
    'job_vacancy_new',
    'job_application_new',
    'job_application_accepted',
    'job_application_rejected',
    'job_application_interview',
    'absence_request',
    'daily_digest',
    'weekly_summary',
    'account_activity',
    'security_alert',
    'chat_message',
    'business_unconfigured',
    'appointment_reminder_24h',
    'appointment_reminder_1h'
);


--
-- Name: TYPE notification_type_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.notification_type_enum IS 'Tipos de notificaciones soportadas en el sistema.
business_unconfigured: NotificaciÃ³n cuando un negocio pierde configuraciÃ³n completa.';


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'refunded'
);


--
-- Name: resource_model; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resource_model AS ENUM (
    'professional',
    'physical_resource',
    'hybrid',
    'group_class'
);


--
-- Name: tax_regime; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tax_regime AS ENUM (
    'simple',
    'common',
    'special'
);


--
-- Name: tax_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tax_type AS ENUM (
    'iva_0',
    'iva_5',
    'iva_19',
    'ica',
    'retention',
    'none'
);


--
-- Name: transaction_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_category AS ENUM (
    'appointment_payment',
    'product_sale',
    'tip',
    'membership',
    'package',
    'other_income',
    'salary',
    'commission',
    'rent',
    'utilities',
    'supplies',
    'maintenance',
    'marketing',
    'tax',
    'insurance',
    'equipment',
    'training',
    'other_expense',
    'service_sale',
    'payroll',
    'bonuses',
    'internet',
    'water',
    'electricity',
    'gas',
    'phone',
    'cleaning',
    'repairs',
    'furniture',
    'tools',
    'software',
    'advertising',
    'social_media',
    'property_tax',
    'income_tax',
    'vat',
    'withholding',
    'liability_insurance',
    'fire_insurance',
    'theft_insurance',
    'health_insurance',
    'certifications',
    'courses',
    'fuel',
    'parking',
    'public_transport',
    'accounting_fees',
    'legal_fees',
    'consulting_fees',
    'depreciation',
    'bank_fees',
    'interest',
    'donations',
    'uniforms',
    'security',
    'waste_disposal'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'income',
    'expense'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'client',
    'employee',
    'admin'
);


--
-- Name: _check_permission_manager(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._check_permission_manager(p_business_id uuid, p_caller_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: apply_discount_code(uuid, text, text, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_discount_code(p_business_id uuid, p_code text, p_plan_type text, p_amount numeric) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_discount discount_codes%ROWTYPE;
    v_discount_amount DECIMAL(10,2);
    v_final_amount DECIMAL(10,2);
    v_valid BOOLEAN;
BEGIN
    -- Validar cÃ³digo
    v_valid := is_discount_code_valid(p_code, p_plan_type, p_amount);
    
    IF NOT v_valid THEN
        v_result := json_build_object(
            'valid', false,
            'message', 'Invalid or expired discount code'
        );
        RETURN v_result;
    END IF;
    
    -- Obtener informaciÃ³n del descuento
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE code = p_code;
    
    -- Calcular descuento
    IF v_discount.discount_type = 'percentage' THEN
        v_discount_amount := p_amount * (v_discount.discount_value / 100);
    ELSE
        v_discount_amount := v_discount.discount_value;
    END IF;
    
    v_final_amount := GREATEST(0, p_amount - v_discount_amount);
    
    v_result := json_build_object(
        'valid', true,
        'code', v_discount.code,
        'description', v_discount.description,
        'discount_type', v_discount.discount_type,
        'discount_value', v_discount.discount_value,
        'original_amount', p_amount,
        'discount_amount', v_discount_amount,
        'final_amount', v_final_amount,
        'currency', 'COP'
    );
    
    RETURN v_result;
END;
$$;


--
-- Name: FUNCTION apply_discount_code(p_business_id uuid, p_code text, p_plan_type text, p_amount numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.apply_discount_code(p_business_id uuid, p_code text, p_plan_type text, p_amount numeric) IS 'Valida y calcula el descuento de un cÃ³digo promocional';


--
-- Name: approve_employee_request(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_employee_request(request_id uuid, admin_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
  v_status TEXT;
  result JSONB;
BEGIN
  -- Get request details
  SELECT business_id, user_id, status 
  INTO v_business_id, v_user_id, v_status
  FROM employee_requests 
  WHERE id = request_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Check if already responded
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already responded');
  END IF;

  -- Check if admin owns the business
  IF NOT EXISTS(SELECT 1 FROM businesses WHERE id = v_business_id AND owner_id = admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update request status
  UPDATE employee_requests 
  SET 
    status = 'approved',
    responded_at = NOW(),
    responded_by = admin_id
  WHERE id = request_id;

  -- Add user to business_employees
  INSERT INTO business_employees (business_id, employee_id, role)
  VALUES (v_business_id, v_user_id, 'employee')
  ON CONFLICT (business_id, employee_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'message', 'Employee request approved');
END;
$$;


--
-- Name: assign_user_permission(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_user_permission(p_business_id uuid, p_user_id uuid, p_permission text, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: audit_business_roles_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_business_roles_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, new_value, performed_by, notes)
    VALUES (NEW.business_id, NEW.user_id, 'assign_role', NEW.role, NEW.assigned_by, NEW.notes);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role != NEW.role OR OLD.is_active != NEW.is_active THEN
      INSERT INTO permission_audit_log (business_id, user_id, action, old_value, new_value, performed_by, notes)
      VALUES (NEW.business_id, NEW.user_id, 'modify', OLD.role || '|' || OLD.is_active::TEXT, NEW.role || '|' || NEW.is_active::TEXT, auth.uid(), NEW.notes);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, old_value, performed_by)
    VALUES (OLD.business_id, OLD.user_id, 'remove_role', OLD.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: audit_user_permissions_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_user_permissions_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, permission, new_value, performed_by, notes)
    VALUES (NEW.business_id, NEW.user_id, 'grant', NEW.permission, 'granted', NEW.granted_by, NEW.notes);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO permission_audit_log (business_id, user_id, action, permission, old_value, new_value, performed_by, notes)
      VALUES (NEW.business_id, NEW.user_id, 'modify', NEW.permission, OLD.is_active::TEXT, NEW.is_active::TEXT, auth.uid(), NEW.notes);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, permission, old_value, performed_by)
    VALUES (OLD.business_id, OLD.user_id, 'revoke', OLD.permission, 'revoked', auth.uid());
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: auto_assign_permissions_to_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_assign_permissions_to_admin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_permission TEXT;
  v_count INT := 0;
BEGIN
  -- Solo aplicar si es un admin (role = 'admin')
  IF NEW.role != 'admin' THEN
    RETURN NEW;
  END IF;

  RAISE NOTICE 'ðŸ” Auto-asignando permisos a admin % del negocio %', NEW.user_id, NEW.business_id;

  -- Lista completa de permisos para admins (79 permisos)
  FOR v_permission IN 
    SELECT unnest(ARRAY[
      'business.view', 'business.edit', 'business.delete', 'business.settings', 'business.categories',
      'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.assign_employees',
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.prices',
      'resources.view', 'resources.create', 'resources.edit', 'resources.delete',
      'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 
      'employees.assign_services', 'employees.view_payroll', 'employees.manage_payroll', 'employees.set_schedules',
      'appointments.view_all', 'appointments.view_own', 'appointments.create', 'appointments.edit', 
      'appointments.delete', 'appointments.assign', 'appointments.confirm',
      'appointments.cancel_own', 'appointments.reschedule_own', 'appointments.view_history',
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 
      'clients.export', 'clients.communication', 'clients.history',
      'accounting.view', 'accounting.tax_config', 'accounting.expenses.view', 'accounting.expenses.create', 
      'accounting.expenses.pay', 'accounting.payroll.view', 'accounting.payroll.create', 
      'accounting.payroll.config', 'accounting.export',
      'expenses.create', 'expenses.delete',
      'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
      'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee', 
      'permissions.modify', 'permissions.revoke',
      'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
      'chat.view_all', 'chat.delete', 'chat.moderate',
      'reviews.create', 'reviews.moderate', 'reviews.respond', 'reviews.toggle_visibility',
      'favorites.toggle',
      'notifications.send', 'notifications.bulk', 'notifications.manage',
      'settings.view', 'settings.edit_own', 'settings.edit_business',
      'absences.approve', 'absences.request',
      'sales.create',
      'billing.manage', 'billing.view'
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

  RAISE NOTICE '  âœ… Asignados % permisos al admin %', v_count, NEW.user_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION auto_assign_permissions_to_admin(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.auto_assign_permissions_to_admin() IS 'Auto-asigna 79 permisos completos a usuarios cuando se les asigna role=admin en business_roles. 
Trigger ejecutado automÃ¡ticamente en INSERT/UPDATE. 
Fecha: 22 Nov 2025 | Bug Fix SesiÃ³n 6';


--
-- Name: auto_assign_permissions_to_owner(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_assign_permissions_to_owner() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_permission TEXT;
  v_permissions_count INT := 0;
BEGIN
  RAISE NOTICE 'ðŸ” Auto-asignando permisos a owner % del negocio %', NEW.owner_id, NEW.id;

  -- Lista completa de permisos que se asignan a owners (79 permisos totales)
  -- Agrupados por categorÃ­a para mejor legibilidad
  FOR v_permission IN 
    SELECT unnest(ARRAY[
      -- Business Management (5)
      'business.view', 'business.edit', 'business.delete', 'business.settings', 'business.categories',
      
      -- Locations (5)
      'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.assign_employees',
      
      -- Services (5)
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.prices',
      
      -- Resources (4) - NUEVO (Sistema de Modelo de Negocio Flexible)
      'resources.view', 'resources.create', 'resources.edit', 'resources.delete',
      
      -- Employees (8)
      'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 
      'employees.assign_services', 'employees.view_payroll', 'employees.manage_payroll', 'employees.set_schedules',
      
      -- Appointments (7)
      'appointments.view_all', 'appointments.view_own', 'appointments.create', 'appointments.edit', 
      'appointments.delete', 'appointments.assign', 'appointments.confirm',
      
      -- Appointments Client Permissions (3) - NUEVO
      'appointments.cancel_own', 'appointments.reschedule_own', 'appointments.view_history',
      
      -- Clients (7)
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 
      'clients.export', 'clients.communication', 'clients.history',
      
      -- Accounting (9)
      'accounting.view', 'accounting.tax_config', 'accounting.expenses.view', 'accounting.expenses.create', 
      'accounting.expenses.pay', 'accounting.payroll.view', 'accounting.payroll.create', 
      'accounting.payroll.config', 'accounting.export',
      
      -- Expenses (2) - NUEVO
      'expenses.create', 'expenses.delete',
      
      -- Reports (4)
      'reports.view_financial', 'reports.view_operations', 'reports.export', 'reports.analytics',
      
      -- Permissions Management (5)
      'permissions.view', 'permissions.assign_admin', 'permissions.assign_employee', 
      'permissions.modify', 'permissions.revoke',
      
      -- Recruitment (4) - NUEVO
      'recruitment.view', 'recruitment.create_vacancy', 'recruitment.view_applications', 'recruitment.approve_hire',
      
      -- Chat (3) - NUEVO (Phase 5)
      'chat.view_all', 'chat.delete', 'chat.moderate',
      
      -- Reviews (4) - NUEVO
      'reviews.create', 'reviews.moderate', 'reviews.respond', 'reviews.toggle_visibility',
      
      -- Favorites (1) - NUEVO
      'favorites.toggle',
      
      -- Notifications (3) - NUEVO
      'notifications.send', 'notifications.bulk', 'notifications.manage',
      
      -- Settings (3)
      'settings.view', 'settings.edit_own', 'settings.edit_business',
      
      -- Absences (2) - NUEVO (Sistema de Ausencias)
      'absences.approve', 'absences.request',
      
      -- Sales (1) - NUEVO (Ventas RÃ¡pidas)
      'sales.create',
      
      -- Billing (2) - NUEVO
      'billing.manage', 'billing.view'
    ])
  LOOP
    -- Insertar permiso en user_permissions
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
      NEW.owner_id, -- Auto-granted por creaciÃ³n de negocio
      true,
      NOW(),
      'Auto-asignado al crear negocio (trigger: auto_assign_permissions_to_owner)'
    )
    ON CONFLICT (user_id, business_id, permission) DO NOTHING;

    GET DIAGNOSTICS v_permissions_count = ROW_COUNT;
    
    IF v_permissions_count > 0 THEN
      RAISE NOTICE '  âœ“ Permiso asignado: %', v_permission;
    END IF;
  END LOOP;

  RAISE NOTICE 'âœ… Total de permisos asignados a owner % en negocio %', NEW.owner_id, NEW.id;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION auto_assign_permissions_to_owner(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.auto_assign_permissions_to_owner() IS 'Trigger function: Auto-asigna TODOS los permisos al owner cuando crea un negocio (79 permisos totales)';


--
-- Name: auto_generate_invitation_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_generate_invitation_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: auto_insert_admin_as_employee(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_insert_admin_as_employee() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Solo ejecutar si:
  -- 1. El rol es 'admin'
  -- 2. El registro estÃ¡ activo
  -- 3. Es un INSERT o el is_active cambiÃ³ a true
  IF NEW.role = 'admin' AND NEW.is_active = true THEN
    -- Insertar en business_employees si no existe.
    -- Usar DO NOTHING en lugar de DO UPDATE para evitar el ciclo de triggers:
    -- business_roles INSERT â†’ business_employees UPDATE â†’ business_roles UPDATE â†’ loop
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
    DO NOTHING;  -- â† FIX: DO NOTHING corta el ciclo. El registro ya existe con los valores correctos.

    RAISE NOTICE 'Admin % registrado/verificado en business_employees para negocio %',
                 NEW.user_id, NEW.business_id;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION auto_insert_admin_as_employee(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.auto_insert_admin_as_employee() IS 'Trigger function: Auto-registra admins en business_employees como managers al asignar rol admin en business_roles.
FIX (H-010/H-035): Usa DO NOTHING en ON CONFLICT para evitar cascade infinito de triggers al crear negocios.';


--
-- Name: auto_insert_owner_to_business_employees(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_insert_owner_to_business_employees() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.business_employees (
    business_id,
    employee_id,
    role,
    status,
    is_active,
    hire_date,
    employee_type,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.owner_id,
    'manager',
    'approved',
    true,
    CURRENT_DATE,
    'location_manager',
    NOW(),
    NOW()
  )
  ON CONFLICT (business_id, employee_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION auto_insert_owner_to_business_employees(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.auto_insert_owner_to_business_employees() IS 'Trigger function: Auto-registra al owner del negocio como empleado (manager) al crear un nuevo negocio.';


--
-- Name: auto_insert_owner_to_business_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_insert_owner_to_business_roles() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO business_roles (
    business_id,
    user_id,
    role,
    hierarchy_level,
    reports_to,
    assigned_by,
    is_active,
    assigned_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.owner_id,
    'admin',
    1,
    NULL,
    NEW.owner_id,
    true,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;


--
-- Name: auto_reject_candidates_on_vacancy_filled(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_reject_candidates_on_vacancy_filled() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_vacancy RECORD;
  v_accepted_count INTEGER;
BEGIN
  -- Solo procesar cuando cambia a accepted
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    
    -- Obtener informaciÃ³n de la vacante
    SELECT * INTO v_vacancy
    FROM job_vacancies
    WHERE id = NEW.vacancy_id;
    
    -- Contar cuÃ¡ntos candidatos han sido aceptados
    SELECT COUNT(*) INTO v_accepted_count
    FROM job_applications
    WHERE vacancy_id = NEW.vacancy_id
      AND status = 'accepted';
    
    -- Si se llenaron todas las posiciones
    IF v_accepted_count >= COALESCE(v_vacancy.number_of_positions, 1) THEN
      
      -- Marcar vacante como llena
      UPDATE job_vacancies
      SET status = 'filled',
          filled_at = NOW()
      WHERE id = NEW.vacancy_id;
      
      -- Rechazar automÃ¡ticamente a todos los candidatos en proceso
      UPDATE job_applications
      SET status = 'rejected',
          decision_at = NOW(),
          decision_notes = 'Vacante cubierta - Posiciones completas'
      WHERE vacancy_id = NEW.vacancy_id
        AND status IN ('in_selection_process', 'reviewing', 'pending')
        AND id != NEW.id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: bulk_assign_permissions_from_template(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_assign_permissions_from_template(p_business_id uuid, p_user_id uuid, p_template_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: bulk_assign_permissions_from_template(uuid, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_assign_permissions_from_template(p_business_id uuid, p_user_id uuid, p_template_id uuid, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
  v_granted_by UUID;
  v_permissions_count INTEGER;
  v_template_name TEXT;
BEGIN
  -- Get current auth user
  v_granted_by := auth.uid();
  
  -- Check authentication
  IF v_granted_by IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  -- Get template info
  SELECT name, jsonb_array_length(permissions)
  INTO v_template_name, v_permissions_count
  FROM permission_templates
  WHERE id = p_template_id AND business_id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Template not found'
    );
  END IF;
  
  -- Apply permissions from template
  WITH template AS (
    SELECT permissions FROM permission_templates
    WHERE id = p_template_id
  ),
  permisos_array AS (
    SELECT jsonb_array_elements_text(permissions) as permission
    FROM template
  )
  INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active, notes)
  SELECT 
    p_business_id,
    p_user_id,
    permission,
    v_granted_by,
    true,
    COALESCE(p_notes, 'Applied from template: ' || v_template_name)
  FROM permisos_array
  ON CONFLICT (business_id, user_id, permission)
  DO UPDATE SET
    is_active = true,
    granted_by = v_granted_by,
    notes = COALESCE(p_notes, 'Re-activated from template: ' || v_template_name),
    updated_at = NOW();
  
  -- Build response
  SELECT jsonb_build_object(
    'success', true,
    'template_name', v_template_name,
    'permissions_applied', v_permissions_count,
    'user_id', p_user_id,
    'applied_at', NOW(),
    'applied_by', v_granted_by
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


--
-- Name: bulk_mark_read(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_mark_read(p_user_id uuid, p_conversation_ids uuid[]) RETURNS TABLE(conversation_id uuid, previous_unread integer, updated boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH updated_conversations AS (
    UPDATE public.conversation_members
    SET 
      last_read_at = NOW(),
      unread_count = 0
    WHERE user_id = p_user_id
      AND conversation_id = ANY(p_conversation_ids)
      AND unread_count > 0
    RETURNING 
      conversation_members.conversation_id,
      conversation_members.unread_count AS prev_count
  )
  SELECT 
    unnest(p_conversation_ids) AS conversation_id,
    COALESCE(uc.prev_count, 0) AS previous_unread,
    (uc.conversation_id IS NOT NULL) AS updated
  FROM unnest(p_conversation_ids) AS cid
  LEFT JOIN updated_conversations uc ON uc.conversation_id = cid;
END;
$$;


--
-- Name: bulk_mark_read(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_mark_read(p_conversation_id uuid, p_user_id uuid) RETURNS TABLE(updated_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Marcar todos los mensajes como leÃ­dos
  WITH updated_messages AS (
    UPDATE messages
    SET read_by = CASE
      -- Si el usuario ya estÃ¡ en read_by, no duplicar
      WHEN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(read_by) AS elem
        WHERE elem->>'user_id' = p_user_id::text
      ) THEN read_by
      -- Si no estÃ¡, agregarlo
      ELSE read_by || jsonb_build_object(
        'user_id', p_user_id,
        'read_at', NOW()
      )
    END
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_deleted = FALSE
      -- Solo actualizar si no ha sido leÃ­do
      AND NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(read_by) AS elem
        WHERE elem->>'user_id' = p_user_id::text
      )
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_updated_count FROM updated_messages;
  
  -- Resetear unread_count del usuario
  UPDATE conversation_members
  SET 
    unread_count = 0,
    last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  RETURN QUERY SELECT v_updated_count;
END;
$$;


--
-- Name: FUNCTION bulk_mark_read(p_conversation_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.bulk_mark_read(p_conversation_id uuid, p_user_id uuid) IS 'Marca todos los mensajes de una conversaciÃ³n como leÃ­dos y resetea unread_count';


--
-- Name: bulk_revoke_user_permissions(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_revoke_user_permissions(p_business_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: businesses_search_vector_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.businesses_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'C');
  RETURN NEW;
END;
$$;


--
-- Name: calculate_absence_days(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_absence_days(p_start_date date, p_end_date date) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN (p_end_date - p_start_date) + 1;
END;
$$;


--
-- Name: FUNCTION calculate_absence_days(p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_absence_days(p_start_date date, p_end_date date) IS 'Calcula el nÃºmero de dÃ­as de ausencia entre dos fechas (inclusivo).';


--
-- Name: calculate_appointment_amounts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_appointment_amounts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  service_price DECIMAL(12,2);
  commission_pct DECIMAL(5,2);
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.gross_amount IS NULL THEN
    SELECT 
      COALESCE(NEW.price, s.price),
      COALESCE(s.commission_percentage, 0)
    INTO service_price, commission_pct
    FROM services s
    WHERE s.id = NEW.service_id;

    NEW.gross_amount := service_price;
    NEW.commission_amount := ROUND(service_price * (commission_pct / 100), 2);
    NEW.other_deductions := COALESCE(NEW.other_deductions, 0);
    NEW.net_amount := service_price - NEW.commission_amount - NEW.other_deductions;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION calculate_appointment_amounts(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_appointment_amounts() IS 'Calcula automÃ¡ticamente gross_amount, commission_amount y net_amount cuando una cita se marca como pagada';


--
-- Name: calculate_employee_occupancy(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_employee_occupancy(p_user_id uuid, p_business_id uuid) RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC * 100.0 / COUNT(*)::NUMERIC,
        1
      )
    END,
    0
  )
  FROM appointments
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND start_time >= NOW() - INTERVAL '30 days';
$$;


--
-- Name: calculate_employee_occupancy(uuid, uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_employee_occupancy(p_employee_id uuid, p_business_id uuid, p_start_date date, p_end_date date) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_total_hours_worked NUMERIC := 0;
  v_total_hours_available NUMERIC := 0;
  v_occupancy_config JSONB;
  v_daily_hours NUMERIC;
  v_exclude_days TEXT[];
  v_operating_days INTEGER;
BEGIN
  -- Obtener configuraciÃ³n de ocupaciÃ³n del negocio
  SELECT COALESCE(
    settings->'occupancy_config',
    jsonb_build_object(
      'method', 'hours_based',
      'daily_hours', 8,
      'exclude_days', ARRAY['sunday'],
      'include_breaks', false,
      'break_duration_minutes', 60
    )
  )
  INTO v_occupancy_config
  FROM businesses
  WHERE id = p_business_id;

  -- Extraer valores de configuraciÃ³n
  v_daily_hours := COALESCE((v_occupancy_config->>'daily_hours')::NUMERIC, 8);
  v_exclude_days := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(v_occupancy_config->'exclude_days')),
    ARRAY['sunday']::TEXT[]
  );

  -- Calcular horas trabajadas (suma de duraciÃ³n de citas completadas)
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600.0
  ), 0)
  INTO v_total_hours_worked
  FROM appointments a
  WHERE a.employee_id = p_employee_id
    AND a.business_id = p_business_id
    AND a.status = 'completed'
    AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date;

  -- Calcular dÃ­as operativos (excluyendo dÃ­as configurados)
  SELECT COUNT(*)
  INTO v_operating_days
  FROM generate_series(p_start_date, p_end_date, '1 day'::INTERVAL) AS day
  WHERE LOWER(TO_CHAR(day, 'Day')) NOT LIKE ANY(
    SELECT '%' || LOWER(TRIM(d)) || '%' FROM UNNEST(v_exclude_days) AS d
  );

  -- Calcular horas disponibles
  v_total_hours_available := v_operating_days * v_daily_hours;

  -- Calcular porcentaje de ocupaciÃ³n
  IF v_total_hours_available > 0 THEN
    RETURN ROUND((v_total_hours_worked / v_total_hours_available) * 100, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$;


--
-- Name: FUNCTION calculate_employee_occupancy(p_employee_id uuid, p_business_id uuid, p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_employee_occupancy(p_employee_id uuid, p_business_id uuid, p_start_date date, p_end_date date) IS 'Calcula la tasa de ocupaciÃ³n de un empleado en un perÃ­odo. Usa configuraciÃ³n del negocio (daily_hours, exclude_days). Solo cuenta citas completadas.';


--
-- Name: calculate_employee_rating_by_business(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_employee_rating_by_business(p_user_id uuid, p_business_id uuid) RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    ROUND(AVG(rating)::NUMERIC, 2),
    0
  )
  FROM reviews
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND is_visible = true;
$$;


--
-- Name: calculate_employee_rating_by_business(uuid, uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_employee_rating_by_business(p_employee_id uuid, p_business_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_avg_rating NUMERIC;
BEGIN
  SELECT COALESCE(AVG(rating), 0)
  INTO v_avg_rating
  FROM reviews
  WHERE employee_id = p_employee_id
    AND business_id = p_business_id
    AND is_visible = true
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);

  RETURN ROUND(v_avg_rating, 2);
END;
$$;


--
-- Name: calculate_employee_revenue(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_employee_revenue(p_user_id uuid, p_business_id uuid) RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    SUM(
      COALESCE(a.gross_amount, s.price, 0)
    ),
    0
  )
  FROM appointments a
  LEFT JOIN services s ON s.id = a.service_id
  WHERE a.employee_id = p_user_id
    AND a.business_id = p_business_id
    AND a.status = 'completed'
    AND a.start_time >= NOW() - INTERVAL '30 days';
$$;


--
-- Name: calculate_employee_revenue(uuid, uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_employee_revenue(p_employee_id uuid, p_business_id uuid, p_start_date date, p_end_date date) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_total_revenue NUMERIC;
BEGIN
  SELECT COALESCE(SUM(price), 0)
  INTO v_total_revenue
  FROM appointments
  WHERE employee_id = p_employee_id
    AND business_id = p_business_id
    AND status = 'completed'
    AND DATE(start_time) BETWEEN p_start_date AND p_end_date;

  RETURN ROUND(v_total_revenue, 2);
END;
$$;


--
-- Name: calculate_usage_metrics(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_usage_metrics(p_business_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_locations_count INTEGER;
    v_employees_count INTEGER;
    v_appointments_count INTEGER;
    v_clients_count INTEGER;
    v_services_count INTEGER;
    v_storage_mb DECIMAL(10,2);
    v_is_over_limit BOOLEAN;
    v_exceeded TEXT[];
BEGIN
    -- Contar recursos
    SELECT COUNT(*) INTO v_locations_count
    FROM locations
    WHERE business_id = p_business_id AND is_active = true;
    
    SELECT COUNT(*) INTO v_employees_count
    FROM business_employees
    WHERE business_id = p_business_id AND is_active = true;
    
    SELECT COUNT(*) INTO v_appointments_count
    FROM appointments
    WHERE business_id = p_business_id 
    AND start_time >= CURRENT_DATE - INTERVAL '30 days';
    
    SELECT COUNT(DISTINCT client_id) INTO v_clients_count
    FROM appointments
    WHERE business_id = p_business_id;
    
    SELECT COUNT(*) INTO v_services_count
    FROM services
    WHERE business_id = p_business_id AND is_active = true;
    
    -- Placeholder para storage (requiere integraciÃ³n con Supabase Storage)
    v_storage_mb := 0;
    
    -- TODO: Comparar con lÃ­mites del plan
    v_is_over_limit := false;
    v_exceeded := ARRAY[]::TEXT[];
    
    -- Insertar o actualizar mÃ©trica
    INSERT INTO usage_metrics (
        business_id,
        metric_date,
        locations_count,
        employees_count,
        appointments_count,
        clients_count,
        services_count,
        storage_mb,
        is_over_limit,
        limit_exceeded_resources,
        calculated_at
    ) VALUES (
        p_business_id,
        CURRENT_DATE,
        v_locations_count,
        v_employees_count,
        v_appointments_count,
        v_clients_count,
        v_services_count,
        v_storage_mb,
        v_is_over_limit,
        v_exceeded,
        NOW()
    )
    ON CONFLICT (business_id, metric_date)
    DO UPDATE SET
        locations_count = EXCLUDED.locations_count,
        employees_count = EXCLUDED.employees_count,
        appointments_count = EXCLUDED.appointments_count,
        clients_count = EXCLUDED.clients_count,
        services_count = EXCLUDED.services_count,
        storage_mb = EXCLUDED.storage_mb,
        is_over_limit = EXCLUDED.is_over_limit,
        limit_exceeded_resources = EXCLUDED.limit_exceeded_resources,
        calculated_at = EXCLUDED.calculated_at;
    
    v_result := json_build_object(
        'locations', v_locations_count,
        'employees', v_employees_count,
        'appointments', v_appointments_count,
        'clients', v_clients_count,
        'services', v_services_count,
        'storage_mb', v_storage_mb,
        'is_over_limit', v_is_over_limit,
        'exceeded_resources', v_exceeded,
        'calculated_at', NOW()
    );
    
    RETURN v_result;
END;
$$;


--
-- Name: FUNCTION calculate_usage_metrics(p_business_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_usage_metrics(p_business_id uuid) IS 'Calcula y almacena mÃ©tricas de uso actuales de un negocio';


--
-- Name: can_manage_location_media(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_location_media(p_location_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    WHERE l.id = p_location_id
      AND (
        public.is_business_admin(l.business_id) OR public.is_business_member(l.business_id)
      )
  );
$$;


--
-- Name: can_manage_service_media(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_service_media(p_service_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.services s
    WHERE s.id = p_service_id
      AND (
        public.is_business_admin(s.business_id)
        OR public.is_business_member(s.business_id)
      )
  );
$$;


--
-- Name: cancel_appointment_by_token(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancel_appointment_by_token(p_token text, p_reason text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.appointments
  WHERE confirmation_token = p_token
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancelled_reason = COALESCE(p_reason, cancelled_reason),
      confirmation_token = NULL,
      confirmation_deadline = NULL
  WHERE id = v_id;

  RETURN TRUE;
END;
$$;


--
-- Name: check_appointment_conflict(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_appointment_conflict() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check for employee conflicts (if employee is assigned)
    IF NEW.employee_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE employee_id = NEW.employee_id 
        AND id != COALESCE(NEW.id, (md5(random()::text || clock_timestamp()::text))::uuid)
        AND status NOT IN ('cancelled', 'no_show')
        AND (
            (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
            (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
            (NEW.start_time <= start_time AND NEW.end_time >= end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Employee has a conflicting appointment at this time';
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: check_max_subcategories(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_max_subcategories() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  subcategory_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subcategory_count
  FROM business_subcategories
  WHERE business_id = NEW.business_id;
  
  IF subcategory_count >= 3 THEN
    RAISE EXCEPTION 'Un negocio puede tener mÃ¡ximo 3 subcategorÃ­as';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: claim_invite_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.claim_invite_code(invite_code_input text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_request_id uuid;
  v_business_id uuid;
  v_business_name text;
  v_owner_id uuid;
  v_expires_at timestamptz;
  v_existing_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Find unclaimed invite code row
  SELECT id, business_id, invite_code_expires_at
  INTO v_request_id, v_business_id, v_expires_at
  FROM employee_join_requests
  WHERE invite_code = upper(trim(invite_code_input))
    AND employee_id IS NULL
    AND status = 'pending'
  LIMIT 1;

  -- If not found unclaimed, check if already claimed by this same employee (idempotent)
  IF v_request_id IS NULL THEN
    SELECT id, business_id INTO v_request_id, v_business_id
    FROM employee_join_requests
    WHERE invite_code = upper(trim(invite_code_input))
      AND employee_id = auth.uid()
      AND status = 'pending'
    LIMIT 1;

    IF v_request_id IS NOT NULL THEN
      SELECT b.name, b.owner_id INTO v_business_name, v_owner_id
      FROM businesses b WHERE b.id = v_business_id;
      RETURN jsonb_build_object(
        'request_id', v_request_id,
        'business_id', v_business_id,
        'business_name', v_business_name,
        'owner_id', v_owner_id
      );
    END IF;

    RAISE EXCEPTION 'CÃ³digo no encontrado o ya fue usado';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'El cÃ³digo ha vencido';
  END IF;

  -- Check if employee already has a DIFFERENT pending request for this business.
  -- Unique partial index prevents two pending rows for same (employee_id, business_id).
  SELECT id INTO v_existing_request_id
  FROM employee_join_requests
  WHERE employee_id = auth.uid()
    AND business_id = v_business_id
    AND status = 'pending'
  LIMIT 1;

  IF v_existing_request_id IS NOT NULL THEN
    -- Already in queue for this business â€” return existing request as success
    SELECT b.name, b.owner_id INTO v_business_name, v_owner_id
    FROM businesses b WHERE b.id = v_business_id;
    RETURN jsonb_build_object(
      'request_id', v_existing_request_id,
      'business_id', v_business_id,
      'business_name', v_business_name,
      'owner_id', v_owner_id
    );
  END IF;

  -- Claim the code
  UPDATE employee_join_requests
  SET employee_id = auth.uid(), updated_at = now()
  WHERE id = v_request_id;

  SELECT b.name, b.owner_id
  INTO v_business_name, v_owner_id
  FROM businesses b WHERE b.id = v_business_id;

  RETURN jsonb_build_object(
    'request_id', v_request_id,
    'business_id', v_business_id,
    'business_name', v_business_name,
    'owner_id', v_owner_id
  );
END;
$$;


--
-- Name: cleanup_completed_transfer(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_completed_transfer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Si el traslado se marca como completado, actualizar location_id
  IF NEW.transfer_status = 'completed' AND OLD.transfer_status = 'pending' THEN
    NEW.location_id := NEW.transfer_to_location_id;
    
    -- Limpiar campos de transiciÃ³n (opcional, lo haremos en edge function)
    -- NEW.transfer_from_location_id := NULL;
    -- NEW.transfer_to_location_id := NULL;
    -- NEW.transfer_effective_date := NULL;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: cleanup_expired_notifications(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_notifications() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM in_app_notifications
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  RETURN NULL;
END;
$$;


--
-- Name: FUNCTION cleanup_expired_notifications(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cleanup_expired_notifications() IS 'Limpia notificaciones expiradas automÃ¡ticamente';


--
-- Name: cleanup_expired_typing_indicators(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_typing_indicators() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM chat_typing_indicators
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;


--
-- Name: cleanup_old_cron_logs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_cron_logs() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM public.cron_execution_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$$;


--
-- Name: cleanup_old_notifications(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_notifications(days_old integer DEFAULT 90) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.in_app_notifications
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE status IN ('read', 'archived')
      AND created_at < NOW() - (days_old || ' days')::INTERVAL
      AND is_deleted = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


--
-- Name: cleanup_orphaned_attachments(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_orphaned_attachments() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'chat-attachments'
    AND created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_messages cm
      WHERE cm.deleted_at IS NULL
        AND cm.attachments::text LIKE '%' || name || '%'
    );
END;
$$;


--
-- Name: configure_cron_secrets(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.configure_cron_secrets() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Solo retornar instrucciones, NO ejecutar ALTER DATABASE
  -- (requiere permisos de superusuario)
  RETURN 'Ejecuta manualmente: ALTER DATABASE postgres SET app.supabase_url = ''https://dkancockzvcqorqbwtyh.supabase.co''; y ALTER DATABASE postgres SET app.supabase_service_role_key = ''YOUR_KEY_HERE'';';
END;
$$;


--
-- Name: FUNCTION configure_cron_secrets(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.configure_cron_secrets() IS 'Returns instructions to configure Supabase secrets manually.';


--
-- Name: confirm_appointment_by_token(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirm_appointment_by_token(p_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.appointments
  WHERE confirmation_token = p_token
    AND (confirmation_deadline IS NULL OR confirmation_deadline >= NOW())
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.appointments
  SET status = 'confirmed',
      confirmed_at = NOW(),
      confirmation_token = NULL,
      confirmation_deadline = NULL
  WHERE id = v_id;

  RETURN TRUE;
END;
$$;


--
-- Name: count_candidates_in_selection(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.count_candidates_in_selection(p_vacancy_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  candidate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO candidate_count
  FROM job_applications
  WHERE vacancy_id = p_vacancy_id
    AND status = 'in_selection_process';
  
  RETURN candidate_count;
END;
$$;


--
-- Name: FUNCTION count_candidates_in_selection(p_vacancy_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.count_candidates_in_selection(p_vacancy_id uuid) IS 'Retorna el nÃºmero de candidatos actualmente en proceso de selecciÃ³n para una vacante';


--
-- Name: create_appointment_reminders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_appointment_reminders() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only create reminders for confirmed appointments
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        -- 24 hour reminder
        INSERT INTO public.notifications (user_id, type, title, message, appointment_id, scheduled_for)
        VALUES (
            NEW.client_id,
            'appointment_reminder',
            'Recordatorio de cita - 24 horas',
            'Tienes una cita programada para maÃ±ana',
            NEW.id,
            NEW.start_time - INTERVAL '24 hours'
        );
        
        -- 1 hour reminder
        INSERT INTO public.notifications (user_id, type, title, message, appointment_id, scheduled_for)
        VALUES (
            NEW.client_id,
            'appointment_reminder',
            'Recordatorio de cita - 1 hora',
            'Tu cita es en 1 hora',
            NEW.id,
            NEW.start_time - INTERVAL '1 hour'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: create_appointment_transaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_appointment_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'completed' AND 
       (OLD IS NULL OR OLD.status != 'completed') AND 
       NEW.price IS NOT NULL AND 
       NEW.price > 0 THEN
        
        INSERT INTO transactions (
            business_id, location_id, type, category, amount, currency, 
            description, appointment_id, employee_id, created_by, 
            transaction_date, is_verified
        ) VALUES (
            NEW.business_id, 
            NEW.location_id, 
            'income', 
            'appointment_payment', 
            NEW.price, 
            NEW.currency, 
            'Payment for appointment service', 
            NEW.id, 
            NEW.employee_id, 
            NEW.client_id, 
            CURRENT_DATE,
            TRUE  -- Auto-verificada porque viene de cita completada
        );
        
        -- Actualizar total_revenue del negocio
        UPDATE businesses
        SET total_revenue = total_revenue + NEW.price
        WHERE id = NEW.business_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: create_default_business_notification_settings(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_default_business_notification_settings() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.business_notification_settings (business_id)
  VALUES (NEW.id)
  ON CONFLICT (business_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: create_default_user_notification_preferences(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_default_user_notification_preferences() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: create_in_app_notification(uuid, public.notification_type_enum, text, text, text, integer, uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_in_app_notification(p_user_id uuid, p_type public.notification_type_enum, p_title text, p_message text, p_action_url text DEFAULT NULL::text, p_priority integer DEFAULT 0, p_business_id uuid DEFAULT NULL::uuid, p_appointment_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_notification_id UUID;
  v_data JSONB;
BEGIN
  v_data := COALESCE(p_metadata, '{}'::jsonb);
  
  IF p_appointment_id IS NOT NULL THEN
    v_data := v_data || jsonb_build_object('appointment_id', p_appointment_id);
  END IF;
  
  INSERT INTO in_app_notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    priority,
    business_id,
    data
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_action_url,
    p_priority,
    p_business_id,
    v_data
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;


--
-- Name: FUNCTION create_in_app_notification(p_user_id uuid, p_type public.notification_type_enum, p_title text, p_message text, p_action_url text, p_priority integer, p_business_id uuid, p_appointment_id uuid, p_metadata jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_in_app_notification(p_user_id uuid, p_type public.notification_type_enum, p_title text, p_message text, p_action_url text, p_priority integer, p_business_id uuid, p_appointment_id uuid, p_metadata jsonb) IS 'FunciÃ³n helper para crear notificaciones in-app desde Edge Functions';


--
-- Name: deactivate_user_account(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_user_account(user_id_param uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  -- Marcar perfil como inactivo
  UPDATE profiles
  SET 
    is_active = FALSE,
    deactivated_at = NOW()
  WHERE id = user_id_param;

  -- Cancelar todas las citas futuras del usuario como cliente
  UPDATE appointments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes || E'\n', '') || 'Cancelada automÃ¡ticamente: cuenta desactivada'
  WHERE 
    client_id = user_id_param 
    AND status = 'pending'
    AND start_time > NOW();

  -- Cancelar todas las citas futuras del usuario como empleado
  UPDATE appointments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes || E'\n', '') || 'Cancelada automÃ¡ticamente: empleado desactivÃ³ cuenta'
  WHERE 
    employee_id = user_id_param 
    AND status = 'pending'
    AND start_time > NOW();

  -- Retornar resultado
  SELECT jsonb_build_object(
    'success', TRUE,
    'message', 'Cuenta desactivada exitosamente',
    'deactivated_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;


--
-- Name: debug_sorted_businesses_count(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_sorted_businesses_count(p_client_id uuid, p_preferred_city_name text) RETURNS integer
    LANGUAGE sql
    AS $$
  WITH unique_businesses AS (
    SELECT DISTINCT b.id
    FROM businesses b
    INNER JOIN business_employees be ON b.id = be.business_id
    INNER JOIN profiles p ON be.employee_id = p.id
    WHERE be.status = 'approved'
      AND be.is_active = true
      AND p.is_active = true
      AND (p_preferred_city_name IS NULL OR EXISTS (
        SELECT 1
        FROM locations loc
        WHERE loc.business_id = b.id
          AND loc.city = p_preferred_city_name
      ))
      AND NOT EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.business_id = b.id
          AND a.client_id = p_client_id
      )
  ),
  business_locations AS (
    SELECT DISTINCT ON (business_id)
      loc.business_id,
      loc.city AS location_city
    FROM locations loc
    WHERE loc.business_id IN (SELECT id FROM unique_businesses)
    ORDER BY loc.business_id, loc.created_at ASC
  ),
  sorted_businesses AS (
    SELECT 
      b.id,
      b.name,
      COALESCE(bl.location_city, 'Sin ubicaciÃ³n') AS city
    FROM businesses b
    INNER JOIN unique_businesses ub ON b.id = ub.id
    LEFT JOIN business_locations bl ON b.id = bl.business_id
    ORDER BY b.average_rating DESC NULLS LAST, b.total_reviews DESC
    LIMIT 6
  )
  SELECT COUNT(*)::INT FROM sorted_businesses;
$$;


--
-- Name: debug_suggestions_jsonb(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_suggestions_jsonb(p_client_id uuid, p_preferred_city_name text) RETURNS jsonb
    LANGUAGE sql
    AS $$
  WITH unique_businesses AS (
    SELECT DISTINCT b.id
    FROM businesses b
    INNER JOIN business_employees be ON b.id = be.business_id
    INNER JOIN profiles p ON be.employee_id = p.id
    WHERE be.status = 'approved'
      AND be.is_active = true
      AND p.is_active = true
      AND (p_preferred_city_name IS NULL OR EXISTS (
        SELECT 1
        FROM locations loc
        WHERE loc.business_id = b.id
          AND loc.city = p_preferred_city_name
      ))
      AND NOT EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.business_id = b.id
          AND a.client_id = p_client_id
      )
  ),
  business_locations AS (
    SELECT DISTINCT ON (business_id)
      loc.business_id,
      loc.city AS location_city
    FROM locations loc
    WHERE loc.business_id IN (SELECT id FROM unique_businesses)
    ORDER BY loc.business_id, loc.created_at ASC
  ),
  sorted_businesses AS (
    SELECT 
      b.id,
      b.name,
      COALESCE(bl.location_city, 'Sin ubicaciÃ³n') AS city
    FROM businesses b
    INNER JOIN unique_businesses ub ON b.id = ub.id
    LEFT JOIN business_locations bl ON b.id = bl.business_id
    ORDER BY b.average_rating DESC NULLS LAST, b.total_reviews DESC
    LIMIT 6
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'city', city
    )
  ), '[]'::jsonb)
  FROM sorted_businesses;
$$;


--
-- Name: debug_unique_businesses_count(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_unique_businesses_count(p_client_id uuid, p_preferred_city_name text) RETURNS integer
    LANGUAGE sql
    AS $$
  WITH unique_businesses AS (
    SELECT DISTINCT b.id
    FROM businesses b
    INNER JOIN business_employees be ON b.id = be.business_id
    INNER JOIN profiles p ON be.employee_id = p.id
    WHERE be.status = 'approved'
      AND be.is_active = true
      AND p.is_active = true
      AND (p_preferred_city_name IS NULL OR EXISTS (
        SELECT 1
        FROM locations loc
        WHERE loc.business_id = b.id
          AND loc.city = p_preferred_city_name
      ))
      AND NOT EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.business_id = b.id
          AND a.client_id = p_client_id
      )
  )
  SELECT COUNT(*)::INT FROM unique_businesses;
$$;


--
-- Name: delete_message_attachments(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_message_attachments() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  attachment JSONB;
  file_path TEXT;
BEGIN
  -- Solo ejecutar si deleted_at cambiÃ³ de NULL a timestamp
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Iterar sobre attachments
    IF NEW.attachments IS NOT NULL THEN
      FOR attachment IN SELECT * FROM jsonb_array_elements(NEW.attachments)
      LOOP
        -- Extraer path desde URL
        file_path := attachment->>'url';
        file_path := SUBSTRING(file_path FROM 'chat-attachments/(.*)');
        
        -- Eliminar archivo de storage
        DELETE FROM storage.objects
        WHERE bucket_id = 'chat-attachments'
          AND name = file_path;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: enforce_owner_hierarchy(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_owner_hierarchy() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM businesses
  WHERE id = NEW.business_id;

  IF NEW.user_id = v_owner_id THEN
    NEW.hierarchy_level := 0;
    NEW.reports_to := NULL;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: ensure_single_default_payment_method(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_single_default_payment_method() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE payment_methods
        SET is_default = false
        WHERE business_id = NEW.business_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: ensure_single_primary_location(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_single_primary_location() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If the new/updated location is being set as primary
  IF NEW.is_primary = true THEN
    -- Unset any other primary locations for this business
    UPDATE locations
    SET is_primary = false
    WHERE business_id = NEW.business_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: extract_storage_entity_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extract_storage_entity_id(object_path text) RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $_$
DECLARE
  path_parts text[];
  entity_id text;
BEGIN
  -- Split path by '/'
  path_parts := string_to_array(object_path, '/');
  
  -- El ID de la entidad estÃ¡ en la primera posiciÃ³n
  -- Ejemplo: 550e8400-e29b-41d4-a716-446655440000/logo.png
  -- path_parts[1] = entity_id
  IF array_length(path_parts, 1) >= 1 THEN
    entity_id := path_parts[1];
    
    -- Validar que es un UUID vÃ¡lido
    IF entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RETURN entity_id::uuid;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$_$;


--
-- Name: generate_confirmation_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_confirmation_token() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN md5(random()::text || clock_timestamp()::text || random()::text) || md5(random()::text || clock_timestamp()::text);
END;
$$;


--
-- Name: generate_invitation_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invitation_code() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars: I,O,0,1
  result VARCHAR(6) := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM businesses WHERE invitation_code = result) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    config RECORD;
BEGIN
    IF NEW.status = 'issued' AND NEW.invoice_number IS NULL THEN
        SELECT * INTO config FROM tax_configurations WHERE business_id = NEW.business_id;
        
        IF config IS NOT NULL THEN
            NEW.invoice_prefix := config.invoice_prefix;
            NEW.invoice_sequence := config.invoice_next_number;
            NEW.invoice_number := config.invoice_prefix || LPAD(config.invoice_next_number::TEXT, 6, '0');
            
            -- Incrementar contador
            UPDATE tax_configurations 
            SET invoice_next_number = invoice_next_number + 1 
            WHERE business_id = NEW.business_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: generate_recurring_expense_transaction(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_recurring_expense_transaction(p_recurring_expense_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_expense recurring_expenses%ROWTYPE;
  v_transaction_id UUID;
BEGIN
  -- Obtener el egreso recurrente
  SELECT * INTO v_expense
  FROM recurring_expenses
  WHERE id = p_recurring_expense_id
    AND is_active = true
    AND next_payment_date <= CURRENT_DATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring expense not found or not due for payment';
  END IF;
  
  -- Crear transacciÃ³n
  INSERT INTO transactions (
    business_id,
    location_id,
    employee_id,
    type,
    category,
    amount,
    currency,
    description,
    transaction_date,
    metadata,
    created_by,
    is_verified
  ) VALUES (
    v_expense.business_id,
    v_expense.location_id,
    v_expense.employee_id,
    'expense',
    v_expense.category,
    v_expense.amount,
    COALESCE(v_expense.currency, 'COP'),
    COALESCE(v_expense.description, v_expense.name, 'Egreso recurrente'),
    CURRENT_DATE,
    jsonb_build_object(
      'recurring_expense_id', v_expense.id,
      'auto_generated', true,
      'payment_period', TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    ),
    v_expense.created_by,
    v_expense.is_automated  -- Auto-verificado si es automatizado
  )
  RETURNING id INTO v_transaction_id;
  
  -- Actualizar egreso recurrente
  UPDATE recurring_expenses
  SET 
    last_payment_date = CURRENT_DATE,
    next_payment_date = CASE COALESCE(v_expense.recurrence_frequency, 'monthly')
      WHEN 'daily' THEN CURRENT_DATE + INTERVAL '1 day'
      WHEN 'weekly' THEN CURRENT_DATE + INTERVAL '1 week'
      WHEN 'biweekly' THEN CURRENT_DATE + INTERVAL '2 weeks'
      WHEN 'monthly' THEN (CURRENT_DATE + INTERVAL '1 month')::date
      WHEN 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
      WHEN 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
      ELSE (CURRENT_DATE + INTERVAL '1 month')::date
    END,
    total_paid = COALESCE(total_paid, 0) + v_expense.amount,
    payments_count = COALESCE(payments_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_recurring_expense_id;
  
  RETURN v_transaction_id;
END;
$$;


--
-- Name: FUNCTION generate_recurring_expense_transaction(p_recurring_expense_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.generate_recurring_expense_transaction(p_recurring_expense_id uuid) IS 'Genera una transacciÃ³n a partir de un egreso recurrente';


--
-- Name: generate_unique_slug(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_slug(business_name text, business_city text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(
    regexp_replace(
      business_name || '-' || COALESCE(business_city, ''),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 80);
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;


--
-- Name: get_business_hierarchy(uuid, date, date, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_business_hierarchy(p_business_id uuid, p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date date DEFAULT CURRENT_DATE, p_filters jsonb DEFAULT '{}'::jsonb) RETURNS TABLE(employee_id uuid, business_id uuid, full_name text, email text, avatar_url text, phone text, hierarchy_level integer, reports_to uuid, supervisor_name text, role text, employee_type text, job_title text, location_id uuid, location_name text, is_active boolean, hired_at timestamp with time zone, salary_base numeric, salary_type character varying, total_appointments integer, completed_appointments integer, cancelled_appointments integer, average_rating numeric, total_reviews integer, occupancy_rate numeric, gross_revenue numeric, services_offered jsonb, direct_reports_count integer, all_reports_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE employee_data AS (
    SELECT 
      br.user_id,
      br.business_id as biz_id,    -- â­ AGREGADO
      p.full_name,
      p.email,
      p.avatar_url,
      p.phone,
      br.hierarchy_level,
      br.reports_to,
      supervisor.full_name as supervisor_name,
      br.role,
      be.employee_type,
      be.job_title::TEXT,
      be.location_id,
      l.name::TEXT as location_name,
      br.is_active,
      be.hired_at,
      be.salary_base,
      be.salary_type,
      
      (SELECT COUNT(*) FROM appointments a
       WHERE a.employee_id = br.user_id AND a.business_id = p_business_id
         AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date) as total_appointments,
      
      (SELECT COUNT(*) FROM appointments a
       WHERE a.employee_id = br.user_id AND a.business_id = p_business_id
         AND a.status = 'completed' AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date) as completed_appointments,
      
      (SELECT COUNT(*) FROM appointments a
       WHERE a.employee_id = br.user_id AND a.business_id = p_business_id
         AND a.status = 'cancelled' AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date) as cancelled_appointments,
      
      COALESCE(
        (SELECT AVG(rating) 
         FROM reviews r 
         WHERE r.employee_id = br.user_id 
           AND r.business_id = p_business_id
           AND r.is_visible = true
           AND r.created_at::DATE BETWEEN p_start_date AND p_end_date
        ), 0
      ) as average_rating,
      
      (SELECT COUNT(*) FROM reviews r
       WHERE r.employee_id = br.user_id AND r.business_id = p_business_id
         AND r.is_visible = true) as total_reviews,
      
      COALESCE(
        (SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
              COUNT(*) FILTER (WHERE a.status = 'completed')::NUMERIC * 100.0 / COUNT(*)::NUMERIC,
              2
            )
          END
         FROM appointments a
         WHERE a.employee_id = br.user_id 
           AND a.business_id = p_business_id
           AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date
        ), 0
      ) as occupancy_rate,
      
      COALESCE(
        (SELECT SUM(price) 
         FROM appointments a
         WHERE a.employee_id = br.user_id 
           AND a.business_id = p_business_id
           AND a.status = 'completed' 
           AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date
           AND a.price IS NOT NULL
        ), 0
      ) as gross_revenue,
      
      (SELECT jsonb_agg(jsonb_build_object(
          'service_id', s.id,
          'service_name', s.name,
          'expertise_level', es.expertise_level,
          'commission_percentage', es.commission_percentage
        ))
       FROM employee_services es
       JOIN services s ON es.service_id = s.id
       WHERE es.employee_id = br.user_id AND es.business_id = p_business_id AND es.is_active = true) as services_offered,
      
      (SELECT COUNT(*) FROM business_roles sub
       WHERE sub.reports_to = br.user_id AND sub.business_id = p_business_id AND sub.is_active = true) as direct_reports_count
      
    FROM business_roles br
    JOIN profiles p ON br.user_id = p.id
    LEFT JOIN business_employees be ON be.employee_id = br.user_id AND be.business_id = br.business_id
    LEFT JOIN locations l ON be.location_id = l.id
    LEFT JOIN profiles supervisor ON br.reports_to = supervisor.id
    WHERE br.business_id = p_business_id AND br.is_active = true
  ),
  all_reports AS (
    SELECT ed.user_id, ed.user_id as report_id, 0 as level 
    FROM employee_data ed
    UNION ALL
    SELECT ar.user_id, br.user_id as report_id, ar.level + 1
    FROM all_reports ar
    JOIN business_roles br ON br.reports_to = ar.report_id
    WHERE br.business_id = p_business_id AND br.is_active = true AND ar.level < 10
  )
  SELECT 
    ed.user_id as employee_id,
    ed.biz_id as business_id,         -- â­ AGREGADO
    ed.full_name, 
    ed.email, 
    ed.avatar_url, 
    ed.phone,
    ed.hierarchy_level, 
    ed.reports_to, 
    ed.supervisor_name, 
    ed.role::TEXT,
    ed.employee_type::TEXT, 
    ed.job_title::TEXT,
    ed.location_id, 
    ed.location_name::TEXT,
    ed.is_active, 
    ed.hired_at,                      -- â­ CORREGIDO (TIMESTAMP)
    ed.salary_base,
    ed.salary_type::VARCHAR,
    ed.total_appointments::INTEGER, 
    ed.completed_appointments::INTEGER,
    ed.cancelled_appointments::INTEGER, 
    ed.average_rating,
    ed.total_reviews::INTEGER, 
    ed.occupancy_rate, 
    ed.gross_revenue,
    ed.services_offered, 
    ed.direct_reports_count::INTEGER,
    COALESCE((SELECT COUNT(DISTINCT report_id) - 1 FROM all_reports ar WHERE ar.user_id = ed.user_id), 0)::INTEGER as all_reports_count
  FROM employee_data ed
  ORDER BY ed.hierarchy_level ASC, ed.full_name ASC;
END;
$$;


--
-- Name: FUNCTION get_business_hierarchy(p_business_id uuid, p_start_date date, p_end_date date, p_filters jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_business_hierarchy(p_business_id uuid, p_start_date date, p_end_date date, p_filters jsonb) IS 'Obtiene jerarquÃ­a completa de empleados con datos de nÃ³mina. Incluye business_id y tipos corregidos (hired_at TIMESTAMP). Actualizado 20251115000008.';


--
-- Name: get_business_locations_with_city_names(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_business_locations_with_city_names(p_business_id uuid) RETURNS TABLE(id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, business_id uuid, name text, address text, city text, city_name text, state text, country text, postal_code text, latitude numeric, longitude numeric, phone text, email text, is_active boolean, opens_at time without time zone, closes_at time without time zone, business_hours jsonb)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $_$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.created_at,
    l.updated_at,
    l.business_id,
    l.name,
    l.address,
    l.city,
    CASE 
      WHEN l.city ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN COALESCE((SELECT c.name FROM cities c WHERE c.id = l.city::uuid LIMIT 1), l.city)
      ELSE l.city
    END AS city_name,
    l.state,
    l.country,
    l.postal_code,
    l.latitude,
    l.longitude,
    l.phone,
    l.email,
    l.is_active,
    l.opens_at,
    l.closes_at,
    l.business_hours
  FROM locations l
  WHERE l.business_id = p_business_id
    AND l.is_active = true
  ORDER BY l.name;
END;
$_$;


--
-- Name: FUNCTION get_business_locations_with_city_names(p_business_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_business_locations_with_city_names(p_business_id uuid) IS 'Returns business locations with city names resolved from cities table instead of UUIDs';


--
-- Name: get_businesses_in_city(text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_businesses_in_city(p_city_name text DEFAULT NULL::text, p_region_name text DEFAULT NULL::text, p_limit integer DEFAULT 5) RETURNS TABLE(id uuid, name text, logo_url text, average_rating numeric, category_name text, review_count bigint, city text, address text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.logo_url,
    b.average_rating,
    c.name as category_name,
    COUNT(DISTINCT r.id)::BIGINT as review_count,
    l.city,
    l.address
  FROM businesses b
  INNER JOIN locations l ON l.business_id = b.id AND l.is_primary = true
  LEFT JOIN categories c ON c.id = b.category_id
  LEFT JOIN reviews r ON r.business_id = b.id AND r.is_visible = true
  WHERE (
    -- BÃºsqueda exacta por ciudad
    (p_city_name IS NOT NULL AND LOWER(l.city) = LOWER(p_city_name))
    -- O por regiÃ³n/estado si la ciudad no coincide
    OR (p_city_name IS NULL AND p_region_name IS NOT NULL AND LOWER(COALESCE(l.state, '')) = LOWER(p_region_name))
  )
  AND b.average_rating >= 3.5
  GROUP BY b.id, b.name, b.logo_url, b.average_rating, c.name, l.city, l.address
  ORDER BY b.average_rating DESC NULLS LAST, COUNT(DISTINCT r.id) DESC
  LIMIT p_limit;
END;
$$;


--
-- Name: get_chat_stats(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_chat_stats(p_user_id uuid, p_business_id uuid DEFAULT NULL::uuid) RETURNS TABLE(total_conversations bigint, unread_conversations bigint, total_unread_messages bigint, messages_sent_today bigint, messages_received_today bigint, active_conversations_today bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (
      SELECT COUNT(*) 
      FROM public.conversation_members cm
      INNER JOIN public.conversations c ON cm.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND c.is_archived = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS total_conversations,
    (
      SELECT COUNT(*) 
      FROM public.conversation_members cm
      INNER JOIN public.conversations c ON cm.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND cm.unread_count > 0
        AND c.is_archived = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS unread_conversations,
    (
      SELECT COALESCE(SUM(cm.unread_count), 0)
      FROM public.conversation_members cm
      INNER JOIN public.conversations c ON cm.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND c.is_archived = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS total_unread_messages,
    (
      SELECT COUNT(*)
      FROM public.messages m
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE m.sender_id = p_user_id
        AND m.created_at >= CURRENT_DATE
        AND m.is_deleted = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS messages_sent_today,
    (
      SELECT COUNT(*)
      FROM public.messages m
      INNER JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND m.sender_id != p_user_id
        AND m.created_at >= CURRENT_DATE
        AND m.is_deleted = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS messages_received_today,
    (
      SELECT COUNT(DISTINCT m.conversation_id)
      FROM public.messages m
      INNER JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id
      INNER JOIN public.conversations c ON m.conversation_id = c.id
      WHERE cm.user_id = p_user_id
        AND m.created_at >= CURRENT_DATE
        AND m.is_deleted = FALSE
        AND (p_business_id IS NULL OR c.business_id = p_business_id)
    ) AS active_conversations_today;
END;
$$;


--
-- Name: get_client_dashboard_data(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_dashboard_data(p_client_id uuid, p_preferred_city_name text DEFAULT NULL::text, p_preferred_region_name text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_appointments jsonb;
  v_reviewed_appointment_ids jsonb;
  v_pending_reviews_count integer;
  v_favorites jsonb;
  v_suggestions jsonb;
  v_stats jsonb;
BEGIN
  -- =====================================================
  -- 1. APPOINTMENTS (todas: upcoming + history)
  -- =====================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', apt.id,
      'business_id', apt.business_id,
      'location_id', apt.location_id,
      'service_id', apt.service_id,
      'client_id', apt.client_id,
      'employee_id', apt.employee_id,
      'start_time', apt.start_time,
      'end_time', apt.end_time,
      'status', apt.status,
      'notes', apt.notes,
      'price', apt.price,
      'currency', apt.currency,
      'created_at', apt.created_at,
      'updated_at', apt.updated_at,
      'business', jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'banner_url', b.banner_url,
        'average_rating', b.average_rating,
        'total_reviews', b.total_reviews,
        'city', b.city,
        'state', b.state,
        'category_id', b.category_id,
        'category', CASE 
          WHEN bc.id IS NOT NULL THEN jsonb_build_object(
            'id', bc.id,
            'name', bc.name,
            'slug', bc.slug,
            'icon_name', bc.icon_name
          )
          ELSE NULL
        END
      ),
      'location', jsonb_build_object(
        'id', loc.id,
        'name', loc.name,
        'address', loc.address,
        'city', loc.city,
        'state', loc.state,
        'postal_code', loc.postal_code,
        'country', loc.country,
        'latitude', loc.latitude,
        'longitude', loc.longitude
      ),
      'service', CASE 
        WHEN svc.id IS NOT NULL THEN jsonb_build_object(
          'id', svc.id,
          'name', svc.name,
          'description', svc.description,
          'duration_minutes', svc.duration_minutes,
          'price', svc.price,
          'currency', svc.currency,
          'image_url', svc.image_url,
          'category', svc.category
        )
        ELSE NULL
      END,
      'employee', jsonb_build_object(
        'id', emp.id,
        'full_name', emp.full_name,
        'email', emp.email,
        'avatar_url', emp.avatar_url
      )
    )
  ), '[]'::jsonb)
  INTO v_appointments
  FROM appointments apt
  LEFT JOIN businesses b ON apt.business_id = b.id
  LEFT JOIN business_categories bc ON b.category_id = bc.id
  LEFT JOIN locations loc ON apt.location_id = loc.id
  LEFT JOIN services svc ON apt.service_id = svc.id
  LEFT JOIN business_employees be ON apt.employee_id = be.employee_id AND apt.business_id = be.business_id
  LEFT JOIN profiles emp ON be.employee_id = emp.id
  WHERE apt.client_id = p_client_id;

  -- =====================================================
  -- 2. REVIEWED APPOINTMENT IDS
  -- =====================================================
  SELECT COALESCE(jsonb_agg(r.appointment_id), '[]'::jsonb)
  INTO v_reviewed_appointment_ids
  FROM reviews r
  WHERE r.client_id = p_client_id
    AND r.appointment_id IS NOT NULL;

  -- =====================================================
  -- 3. PENDING REVIEWS COUNT
  -- =====================================================
  SELECT COUNT(*)::integer
  INTO v_pending_reviews_count
  FROM appointments apt
  WHERE apt.client_id = p_client_id
    AND apt.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM reviews r 
      WHERE r.appointment_id = apt.id 
        AND r.client_id = p_client_id
    );

  -- =====================================================
  -- 4. FAVORITES (SIN filtro de ciudad - mostrar todos)
  -- =====================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', fav.business_id,
      'name', fav.business_name,
      'description', fav.description,
      'logo_url', fav.logo_url,
      'banner_url', fav.banner_url,
      'city', fav.city,
      'state', fav.state,
      'average_rating', fav.average_rating,
      'total_reviews', fav.total_reviews,
      'favorited_at', fav.favorited_at
    )
  ), '[]'::jsonb)
  INTO v_favorites
  FROM (
    SELECT 
      b.id as business_id,
      b.name as business_name,
      b.description,
      b.logo_url,
      b.banner_url,
      b.city,
      b.state,
      b.average_rating,
      b.total_reviews,
      bf.created_at as favorited_at
    FROM business_favorites bf
    LEFT JOIN businesses b ON bf.business_id = b.id
    WHERE bf.user_id = p_client_id
    ORDER BY bf.created_at DESC
  ) fav;

  -- =====================================================
  -- 5. SUGGESTIONS (negocios recomendados por ciudad)
  -- =====================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'logo_url', b.logo_url,
      'banner_url', b.banner_url,
      'average_rating', b.average_rating,
      'total_reviews', b.total_reviews,
      'city', b.city,
      'state', b.state
    )
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM (
    SELECT
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.banner_url,
      b.average_rating,
      b.total_reviews,
      b.city,
      b.state,
      b.created_at,
      COALESCE(b.average_rating, 0) * COALESCE(b.total_reviews, 0) as relevance_score
    FROM businesses b
    WHERE b.is_active = TRUE
      AND (
        (p_preferred_city_name IS NOT NULL AND b.city ILIKE p_preferred_city_name || '%')
        OR (p_preferred_region_name IS NOT NULL AND b.state ILIKE p_preferred_region_name || '%')
        OR (p_preferred_city_name IS NULL AND p_preferred_region_name IS NULL)
      )
      AND NOT EXISTS (
        SELECT 1 
        FROM appointments apt2
        WHERE apt2.client_id = p_client_id
          AND apt2.business_id = b.id
          AND apt2.status = 'completed'
      )
    ORDER BY 
      relevance_score DESC,
      b.created_at DESC
    LIMIT 6
  ) b;

  -- =====================================================
  -- 6. STATS
  -- =====================================================
  SELECT jsonb_build_object(
    'totalAppointments', COUNT(*),
    'completedAppointments', COUNT(*) FILTER (WHERE status = 'completed'),
    'upcomingAppointments', COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed') AND start_time > NOW()),
    'cancelledAppointments', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  INTO v_stats
  FROM appointments
  WHERE client_id = p_client_id;

  -- =====================================================
  -- RETURN FINAL STRUCTURE
  -- =====================================================
  RETURN jsonb_build_object(
    'appointments', v_appointments,
    'reviewedAppointmentIds', v_reviewed_appointment_ids,
    'pendingReviewsCount', v_pending_reviews_count,
    'favorites', v_favorites,
    'suggestions', v_suggestions,
    'stats', v_stats
  );
END;
$$;


--
-- Name: FUNCTION get_client_dashboard_data(p_client_id uuid, p_preferred_city_name text, p_preferred_region_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_client_dashboard_data(p_client_id uuid, p_preferred_city_name text, p_preferred_region_name text) IS 'Retorna todos los datos del dashboard del cliente en una sola llamada.
Incluye: appointments (con service.image_url y service.duration_minutes),
reviewedAppointmentIds, pendingReviewsCount, favorites, suggestions y stats.
FIX 2026-03-14: Agregados image_url y duration_minutes al objeto service.';


--
-- Name: get_client_dashboard_data_debug(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_dashboard_data_debug(p_client_id uuid, p_preferred_city_name text DEFAULT NULL::text, p_preferred_region_name text DEFAULT NULL::text) RETURNS TABLE(total_businesses bigint, medellin_businesses bigint, filtered_count bigint)
    LANGUAGE sql
    AS $_$
  WITH location_stats AS (
    SELECT
      b.id AS business_id,
      CASE 
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)::uuid LIMIT 1)
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
      END AS city_name,
      (SELECT l.state FROM locations l WHERE l.business_id = b.id LIMIT 1) AS location_state
    FROM businesses b
    WHERE EXISTS (
      SELECT 1
      FROM business_employees be
      INNER JOIN profiles p ON be.employee_id = p.id
      WHERE be.business_id = b.id
        AND be.status = 'approved'
        AND be.is_active = true
        AND p.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.business_id = b.id
        AND a.client_id = p_client_id
        AND a.status IN ('pending', 'confirmed')
    )
  )
  SELECT 
    COUNT(*) as total_businesses,
    COUNT(CASE WHEN UPPER(city_name) = 'MEDELLÃN' THEN 1 END) as medellin_businesses,
    COUNT(CASE 
      WHEN (
        (p_preferred_city_name IS NOT NULL AND UPPER(city_name) = UPPER(p_preferred_city_name))
      ) THEN 1 
    END) as filtered_count
  FROM location_stats;
$_$;


--
-- Name: get_client_dashboard_data_test(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_dashboard_data_test(p_client_id uuid, p_preferred_city_name text DEFAULT NULL::text, p_preferred_region_name text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_suggestions JSONB;
BEGIN
  WITH location_stats AS (
    SELECT
      b.id AS business_id,
      b.name AS business_name,
      CASE 
        WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)::uuid LIMIT 1)
        ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
      END AS city_name
    FROM businesses b
    WHERE EXISTS (
      SELECT 1
      FROM business_employees be
      INNER JOIN profiles p ON be.employee_id = p.id
      WHERE be.business_id = b.id
        AND be.status = 'approved'
        AND be.is_active = true
        AND p.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.business_id = b.id
        AND a.client_id = p_client_id
        AND a.status IN ('pending', 'confirmed')
    )
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('id', ls.business_id, 'name', ls.business_name, 'city', ls.city_name)
  ), '[]'::jsonb)
  INTO v_suggestions
  FROM location_stats ls
  WHERE (p_preferred_city_name IS NOT NULL AND UPPER(ls.city_name) = UPPER(p_preferred_city_name));

  RETURN jsonb_build_object('suggestions', v_suggestions, 'count', jsonb_array_length(v_suggestions));
END;
$_$;


--
-- Name: get_client_favorite_business(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_favorite_business(p_client_id uuid) RETURNS TABLE(id uuid, name text, logo_url text, average_rating numeric, category_name text, review_count bigint, last_appointment_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (b.id)
    b.id,
    b.name,
    b.logo_url,
    b.average_rating,
    c.name as category_name,
    COUNT(DISTINCT r.id)::BIGINT as review_count,
    MAX(a.start_time) as last_appointment_date
  FROM businesses b
  INNER JOIN appointments a ON a.business_id = b.id
  INNER JOIN reviews r ON r.business_id = b.id AND r.client_id = a.client_id
  LEFT JOIN categories c ON c.id = b.category_id
  WHERE a.client_id = p_client_id
    AND r.rating >= 4
    AND a.status = 'completed'
  GROUP BY b.id, b.name, b.logo_url, b.average_rating, c.name
  ORDER BY b.id, COUNT(DISTINCT r.id) DESC, MAX(a.start_time) DESC
  LIMIT 1;
END;
$$;


--
-- Name: get_clients_with_unread_messages(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_clients_with_unread_messages(p_minutes_threshold integer DEFAULT 15) RETURNS TABLE(user_id uuid, email text, full_name text, unread_count bigint, oldest_unread_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH unread_notifications AS (
    SELECT 
      n.user_id,
      COUNT(*) as unread_count,
      MIN(n.created_at) as oldest_unread_at
    FROM in_app_notifications n
    WHERE n.type = 'chat_message'
      AND n.status = 'unread'
      AND n.created_at < NOW() - (p_minutes_threshold || ' minutes')::INTERVAL
      AND (n.data->>'email_reminder_sent' IS NULL OR n.data->>'email_reminder_sent' = 'false')
    GROUP BY n.user_id
  ),
  client_users AS (
    SELECT 
      u.user_id,
      u.unread_count,
      u.oldest_unread_at
    FROM unread_notifications u
    WHERE NOT EXISTS (
      -- Excluir admins (owners de negocios)
      SELECT 1 FROM businesses b 
      WHERE b.owner_id = u.user_id
    )
    AND NOT EXISTS (
      -- Excluir empleados
      SELECT 1 FROM business_employees be 
      WHERE be.employee_id = u.user_id
    )
    AND NOT EXISTS (
      -- Excluir usuarios que deshabilitaron email_enabled
      SELECT 1 FROM user_notification_preferences unp
      WHERE unp.user_id = u.user_id
        AND unp.email_enabled = false
    )
    AND NOT EXISTS (
      -- Excluir usuarios que deshabilitaron email para chat_message especÃ­ficamente
      SELECT 1 FROM user_notification_preferences unp
      WHERE unp.user_id = u.user_id
        AND (unp.notification_preferences->'chat_message'->>'email' = 'false')
    )
  )
  SELECT 
    c.user_id,
    p.email,
    p.full_name,
    c.unread_count,
    c.oldest_unread_at
  FROM client_users c
  JOIN profiles p ON p.id = c.user_id
  WHERE p.email IS NOT NULL
  ORDER BY c.oldest_unread_at ASC;
END;
$$;


--
-- Name: FUNCTION get_clients_with_unread_messages(p_minutes_threshold integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_clients_with_unread_messages(p_minutes_threshold integer) IS '[FIXED] Obtiene lista de clientes (no admins ni empleados) con mensajes no leÃ­dos 
mayores al umbral especificado. Usado por send-unread-chat-emails edge function.
ACTUALIZADO: Usa email_enabled y notification_preferences->chat_message->email correctamente.';


--
-- Name: get_conversation_members(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_conversation_members(p_conversation_id uuid) RETURNS TABLE(user_id uuid, full_name text, email text, avatar_url text, role public.conversation_role, joined_at timestamp with time zone, last_read_at timestamp with time zone, last_seen_at timestamp with time zone, unread_count integer, muted boolean, notifications_enabled boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    cm.role,
    cm.joined_at,
    cm.last_read_at,
    cm.last_seen_at,
    cm.unread_count,
    cm.muted,
    cm.notifications_enabled
  FROM public.conversation_members cm
  INNER JOIN public.profiles p ON cm.user_id = p.id
  WHERE cm.conversation_id = p_conversation_id
  ORDER BY 
    CASE cm.role 
      WHEN 'admin' THEN 1 
      WHEN 'member' THEN 2 
    END,
    cm.joined_at ASC;
END;
$$;


--
-- Name: get_conversation_preview(uuid, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_conversation_preview(p_user_id uuid, p_business_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(conversation_id uuid, conversation_type public.conversation_type, conversation_name text, conversation_avatar_url text, business_id uuid, business_name text, last_message_at timestamp with time zone, last_message_preview text, last_message_sender_name text, unread_count integer, is_muted boolean, is_archived boolean, member_count bigint, other_user_id uuid, other_user_name text, other_user_avatar text, custom_name text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS conversation_id,
    c.type AS conversation_type,
    c.name AS conversation_name,
    c.avatar_url AS conversation_avatar_url,
    c.business_id,
    b.name AS business_name,
    c.last_message_at,
    c.last_message_preview,
    (
      SELECT p.full_name 
      FROM public.messages m
      INNER JOIN public.profiles p ON m.sender_id = p.id
      WHERE m.conversation_id = c.id AND m.is_deleted = FALSE
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_sender_name,
    cm.unread_count,
    cm.muted AS is_muted,
    c.is_archived,
    (
      SELECT COUNT(*) 
      FROM public.conversation_members cm2 
      WHERE cm2.conversation_id = c.id
    ) AS member_count,
    CASE 
      WHEN c.type = 'direct' THEN (
        SELECT cm_other.user_id
        FROM public.conversation_members cm_other
        WHERE cm_other.conversation_id = c.id 
          AND cm_other.user_id != p_user_id
        LIMIT 1
      )
      ELSE NULL
    END AS other_user_id,
    CASE 
      WHEN c.type = 'direct' THEN (
        SELECT p_other.full_name
        FROM public.conversation_members cm_other
        INNER JOIN public.profiles p_other ON cm_other.user_id = p_other.id
        WHERE cm_other.conversation_id = c.id 
          AND cm_other.user_id != p_user_id
        LIMIT 1
      )
      ELSE NULL
    END AS other_user_name,
    CASE 
      WHEN c.type = 'direct' THEN (
        SELECT p_other.avatar_url
        FROM public.conversation_members cm_other
        INNER JOIN public.profiles p_other ON cm_other.user_id = p_other.id
        WHERE cm_other.conversation_id = c.id 
          AND cm_other.user_id != p_user_id
        LIMIT 1
      )
      ELSE NULL
    END AS other_user_avatar,
    cm.custom_name
  FROM public.conversations c
  INNER JOIN public.conversation_members cm ON c.id = cm.conversation_id
  INNER JOIN public.businesses b ON c.business_id = b.id
  WHERE cm.user_id = p_user_id
    AND (p_business_id IS NULL OR c.business_id = p_business_id)
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: get_conversations_with_participants(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_conversations_with_participants(p_user_id uuid) RETURNS TABLE(id uuid, type text, title text, created_by uuid, business_id uuid, last_message_at timestamp with time zone, last_message_preview text, created_at timestamp with time zone, updated_at timestamp with time zone, is_archived boolean, metadata jsonb, unread_count integer, is_pinned boolean, is_muted boolean, other_user_id uuid, other_user_full_name text, other_user_email text, other_user_avatar_url text, last_message_sender_id uuid)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT
    c.id,
    c.type::TEXT,
    c.title,
    c.created_by,
    c.business_id,
    c.last_message_at,
    c.last_message_preview,
    c.created_at,
    c.updated_at,
    c.is_archived,
    c.metadata,
    my_p.unread_count,
    my_p.is_pinned,
    my_p.is_muted,
    -- Perfil del otro participante (solo en directas)
    other_p.user_id         AS other_user_id,
    prof.full_name          AS other_user_full_name,
    prof.email              AS other_user_email,
    prof.avatar_url         AS other_user_avatar_url,
    -- Sender del mensaje mÃ¡s reciente
    lm.sender_id            AS last_message_sender_id
  FROM chat_participants my_p
  JOIN chat_conversations c ON c.id = my_p.conversation_id
  -- Otro participante en conversaciones directas (LATERAL para evitar producto cartesiano)
  LEFT JOIN LATERAL (
    SELECT cp.user_id
    FROM chat_participants cp
    WHERE cp.conversation_id = c.id
      AND cp.user_id != p_user_id
      AND cp.left_at IS NULL
    LIMIT 1
  ) other_p ON c.type = 'direct'
  -- Perfil del otro usuario
  LEFT JOIN profiles prof ON prof.id = other_p.user_id
  -- Ãšltimo mensaje no eliminado (LATERAL para eficiencia con Ã­ndice)
  LEFT JOIN LATERAL (
    SELECT m.sender_id
    FROM chat_messages m
    WHERE m.conversation_id = c.id
      AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  WHERE my_p.user_id = p_user_id
    AND my_p.left_at IS NULL
  ORDER BY c.last_message_at DESC NULLS LAST;
$$;


--
-- Name: get_datetime_selection_data(uuid, uuid, date, uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_datetime_selection_data(p_business_id uuid, p_location_id uuid, p_selected_date date, p_employee_id uuid DEFAULT NULL::uuid, p_resource_id uuid DEFAULT NULL::uuid, p_client_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
  v_day_start TIMESTAMP;
  v_day_end TIMESTAMP;
  v_month_start DATE;
  v_month_end DATE;
BEGIN
  -- Calculate date ranges
  v_day_start := (p_selected_date::TIMESTAMP AT TIME ZONE 'America/Bogota')::DATE;
  v_day_end := (v_day_start + INTERVAL '1 day')::DATE;
  v_month_start := DATE_TRUNC('month', p_selected_date)::DATE;
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  v_result := JSONB_BUILD_OBJECT(
    'location_schedule', (
      SELECT JSONB_BUILD_OBJECT(
        'opens_at', opens_at,
        'closes_at', closes_at
      )
      FROM public.locations
      WHERE id = p_location_id
    ),
    'employee_schedule', CASE WHEN p_employee_id IS NOT NULL THEN (
      SELECT JSONB_BUILD_OBJECT(
        'lunch_break_start', lunch_break_start,
        'lunch_break_end', lunch_break_end,
        'has_lunch_break', has_lunch_break
      )
      FROM public.business_employees
      WHERE employee_id = p_employee_id AND business_id = p_business_id
    ) ELSE NULL END,
    'work_schedules', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'day_of_week', day_of_week,
        'is_working', is_working
      ))
      FROM public.work_schedules
      WHERE employee_id = p_employee_id),
      '[]'::JSONB
    ),
    'day_appointments', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_time', start_time,
        'end_time', end_time,
        'status', status
      ) ORDER BY start_time)
      FROM public.appointments
      WHERE
        (CASE WHEN p_employee_id IS NOT NULL THEN employee_id = p_employee_id
              WHEN p_resource_id IS NOT NULL THEN resource_id = p_resource_id
              ELSE FALSE END)
        AND start_time >= v_day_start::TIMESTAMP
        AND end_time <= v_day_end::TIMESTAMP
        AND status NOT IN ('cancelled', 'no_show')),
      '[]'::JSONB
    ),
    'client_day_appointments', CASE WHEN p_client_id IS NOT NULL THEN COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_time', start_time,
        'end_time', end_time,
        'status', status
      ) ORDER BY start_time)
      FROM public.appointments
      WHERE
        client_id = p_client_id
        AND start_time >= v_day_start::TIMESTAMP
        AND end_time <= v_day_end::TIMESTAMP
        AND status NOT IN ('cancelled', 'no_show')),
      '[]'::JSONB
    ) ELSE NULL END,
    'month_appointments', COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_time', start_time,
        'end_time', end_time,
        'status', status,
        'employee_id', employee_id,
        'resource_id', resource_id
      ) ORDER BY start_time)
      FROM public.appointments
      WHERE
        ((CASE WHEN p_employee_id IS NOT NULL THEN employee_id = p_employee_id
               WHEN p_resource_id IS NOT NULL THEN resource_id = p_resource_id
               ELSE FALSE END)
        OR business_id = p_business_id)
        AND start_time::DATE >= v_month_start
        AND start_time::DATE <= v_month_end
        AND status NOT IN ('cancelled', 'no_show')),
      '[]'::JSONB
    ),
    'month_absences', CASE WHEN p_employee_id IS NOT NULL THEN COALESCE(
      (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', id,
        'start_date', start_date,
        'end_date', end_date,
        'absence_type', absence_type,
        'status', status
      ))
      FROM public.employee_absences
      WHERE
        employee_id = p_employee_id
        AND business_id = p_business_id
        AND status = 'approved'
        AND start_date <= v_month_end
        AND end_date >= v_month_start),
      '[]'::JSONB
    ) ELSE NULL END,
    'employee_transfer', CASE WHEN p_employee_id IS NOT NULL THEN (
      SELECT JSONB_BUILD_OBJECT(
        'location_id', location_id,
        'transfer_status', transfer_status,
        'transfer_effective_date', transfer_effective_date,
        'transfer_to_location_id', transfer_to_location_id
      )
      FROM public.business_employees
      WHERE employee_id = p_employee_id AND business_id = p_business_id
    ) ELSE NULL END
  );

  RETURN v_result;
END;
$$;


--
-- Name: get_direct_reports(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_direct_reports(p_user_id uuid, p_business_id uuid) RETURNS TABLE(user_id uuid, full_name text, email text, hierarchy_level integer, job_title text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    br.hierarchy_level,
    be.job_title
  FROM business_roles br
  JOIN profiles p ON br.user_id = p.id
  LEFT JOIN business_employees be ON be.employee_id = p.id AND be.business_id = br.business_id
  WHERE br.reports_to = p_user_id
    AND br.business_id = p_business_id
    AND br.is_active = true
  ORDER BY br.hierarchy_level ASC, p.full_name ASC;
END;
$$;


--
-- Name: get_employee_business_details(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_employee_business_details(p_employee_id uuid, p_business_id uuid) RETURNS TABLE(business_id uuid, business_name text, business_description text, logo_url text, phone text, email text, website text, address text, city text, state text, country text, average_rating numeric, total_reviews integer, category_name character varying, location_id uuid, location_name text, location_address text, role text, employee_type text, job_title character varying, salary_base numeric, salary_type character varying, contract_type character varying, hire_date date, is_active boolean, employee_avg_rating numeric, employee_total_reviews bigint, services_count bigint, completed_appointments bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo_url,
    b.phone,
    b.email,
    b.website,
    b.address,
    b.city,
    b.state,
    b.country,
    COALESCE(b.average_rating, 0),
    COALESCE(b.total_reviews, 0),
    bc.name,
    be.location_id,
    l.name,
    l.address,
    be.role,
    be.employee_type,
    be.job_title,
    be.salary_base,
    be.salary_type,
    be.contract_type,
    be.hire_date,
    be.is_active,
    (
      SELECT COALESCE(AVG(r.rating), 0)
      FROM reviews r
      WHERE r.employee_id = p_employee_id
        AND r.business_id = p_business_id
        AND r.is_visible = true
    )::NUMERIC,
    (
      SELECT COUNT(*)
      FROM reviews r
      WHERE r.employee_id = p_employee_id
        AND r.business_id = p_business_id
        AND r.is_visible = true
    )::BIGINT,
    (
      SELECT COUNT(*)
      FROM employee_services es
      WHERE es.employee_id = p_employee_id
        AND es.business_id = p_business_id
        AND es.is_active = true
    )::BIGINT,
    (
      SELECT COUNT(*)
      FROM appointments a
      WHERE a.employee_id = p_employee_id
        AND a.business_id = p_business_id
        AND a.status = 'completed'
    )::BIGINT
  FROM business_employees be
  INNER JOIN businesses b ON b.id = be.business_id
  LEFT JOIN locations l ON l.id = be.location_id
  LEFT JOIN business_categories bc ON bc.id = b.category_id
  WHERE be.employee_id = p_employee_id
    AND be.business_id = p_business_id
  LIMIT 1;
END;
$$;


--
-- Name: get_expense_summary_by_category(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_expense_summary_by_category(p_business_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS TABLE(category public.transaction_category, total_amount numeric, transaction_count bigint, avg_amount numeric, max_amount numeric, min_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.category,
    SUM(t.amount) as total_amount,
    COUNT(*)::BIGINT as transaction_count,
    AVG(t.amount) as avg_amount,
    MAX(t.amount) as max_amount,
    MIN(t.amount) as min_amount
  FROM transactions t
  WHERE t.business_id = p_business_id
    AND t.type = 'expense'
    AND (p_start_date IS NULL OR t.transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR t.transaction_date <= p_end_date)
  GROUP BY t.category
  ORDER BY total_amount DESC;
END;
$$;


--
-- Name: FUNCTION get_expense_summary_by_category(p_business_id uuid, p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_expense_summary_by_category(p_business_id uuid, p_start_date date, p_end_date date) IS 'Obtiene resumen de egresos agrupados por categorÃ­a para un rango de fechas';


--
-- Name: get_matching_vacancies(uuid, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_matching_vacancies(p_user_id uuid, p_city text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(vacancy_id uuid, title character varying, description text, position_type character varying, work_schedule jsonb, number_of_positions integer, remote_allowed boolean, experience_required character varying, salary_min numeric, salary_max numeric, required_services uuid[], location_city text, location_address text, benefits text[], published_at timestamp with time zone, business_id uuid, business_name text, business_city text, applications_count bigint, match_score integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
  user_specializations TEXT[];
  user_experience INTEGER;
BEGIN
  SELECT
    COALESCE(ep.specializations, '{}'),
    COALESCE(ep.years_of_experience, 0)
  INTO user_specializations, user_experience
  FROM employee_profiles ep
  WHERE ep.user_id = p_user_id;

  IF user_specializations IS NULL THEN
    user_specializations := '{}';
  END IF;

  IF user_experience IS NULL THEN
    user_experience := 0;
  END IF;

  RETURN QUERY
  SELECT
    jv.id, jv.title, jv.description, jv.position_type, jv.work_schedule,
    jv.number_of_positions, jv.remote_allowed, jv.experience_required,
    jv.salary_min, jv.salary_max, jv.required_services, jv.location_city,
    jv.location_address, ARRAY[]::TEXT[] as benefits_array, jv.published_at,
    b.id, b.name::TEXT, b.city::TEXT,
    COUNT(DISTINCT ja.id),
    (
      COALESCE(
        CASE
          WHEN user_specializations IS NULL OR ARRAY_LENGTH(user_specializations, 1) IS NULL THEN 20
          ELSE LEAST(50, (
            SELECT COUNT(*) * 15 FROM UNNEST(user_specializations) spec
            WHERE jv.description ILIKE '%' || spec || '%' OR jv.title ILIKE '%' || spec || '%'
          ))
        END, 20
      )::INTEGER
      + CASE
        WHEN jv.remote_allowed THEN 30
        WHEN p_city IS NOT NULL AND p_city != '' AND jv.location_city ILIKE '%' || p_city || '%' THEN 30
        ELSE 10
      END
      + CASE
        WHEN jv.experience_required = 'any' OR jv.experience_required IS NULL THEN 20
        WHEN jv.experience_required = 'entry_level' AND user_experience >= 0 THEN 20
        WHEN jv.experience_required = 'mid_level' AND user_experience >= 2 THEN 20
        WHEN jv.experience_required = 'senior' AND user_experience >= 5 THEN 20
        ELSE 10
      END
    )::INTEGER as match_score
  FROM job_vacancies jv
  JOIN businesses b ON b.id = jv.business_id
  LEFT JOIN job_applications ja ON ja.vacancy_id = jv.id
  WHERE (jv.status)::text IN ('active', 'open')
    AND jv.number_of_positions > 0
    AND NOT EXISTS (
      SELECT 1 FROM business_employees be
      WHERE be.employee_id = p_user_id AND be.business_id = jv.business_id AND be.status = 'approved'
    )
    AND NOT EXISTS (
      SELECT 1 FROM job_applications ja2
      WHERE ja2.vacancy_id = jv.id AND ja2.user_id = p_user_id
    )
    AND (p_city IS NULL OR p_city = '' OR jv.location_city ILIKE '%' || p_city || '%' OR jv.remote_allowed)
  GROUP BY jv.id, jv.title, jv.description, jv.position_type, jv.work_schedule,
    jv.number_of_positions, jv.remote_allowed, jv.experience_required,
    jv.salary_min, jv.salary_max, jv.required_services, jv.location_city,
    jv.location_address, jv.published_at, b.id, b.name, b.city,
    user_specializations, user_experience
  ORDER BY match_score DESC, jv.published_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


--
-- Name: get_messages_paginated(uuid, uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_messages_paginated(p_conversation_id uuid, p_before_id uuid DEFAULT NULL::uuid, p_after_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50) RETURNS TABLE(message_id uuid, sender_id uuid, sender_name text, sender_avatar text, body text, type public.message_type, metadata jsonb, created_at timestamp with time zone, edited_at timestamp with time zone, reply_to uuid, is_pinned boolean, reply_to_body text, reply_to_sender_name text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_reference_timestamp TIMESTAMPTZ;
BEGIN
  -- Si hay before_id, obtener su timestamp
  IF p_before_id IS NOT NULL THEN
    SELECT m.created_at INTO v_reference_timestamp -- FIX: prefijo m. agregado
    FROM public.messages m
    WHERE m.id = p_before_id;
  END IF;
  
  -- Si hay after_id, obtener su timestamp
  IF p_after_id IS NOT NULL THEN
    SELECT m.created_at INTO v_reference_timestamp -- FIX: prefijo m. agregado
    FROM public.messages m
    WHERE m.id = p_after_id;
  END IF;

  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.sender_id,
    p.full_name AS sender_name,
    p.avatar_url AS sender_avatar,
    m.body,
    m.type,
    m.metadata,
    m.created_at,
    m.edited_at,
    m.reply_to,
    m.is_pinned,
    -- Info del mensaje reply_to
    reply_msg.body AS reply_to_body,
    reply_sender.full_name AS reply_to_sender_name
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  LEFT JOIN public.messages reply_msg ON m.reply_to = reply_msg.id
  LEFT JOIN public.profiles reply_sender ON reply_msg.sender_id = reply_sender.id
  WHERE m.conversation_id = p_conversation_id
    AND m.is_deleted = FALSE
    AND (
      p_before_id IS NULL OR m.created_at < v_reference_timestamp
    )
    AND (
      p_after_id IS NULL OR m.created_at > v_reference_timestamp
    )
  ORDER BY 
    CASE WHEN p_before_id IS NOT NULL THEN m.created_at END DESC,
    CASE WHEN p_after_id IS NOT NULL THEN m.created_at END ASC
  LIMIT p_limit;
END;
$$;


--
-- Name: FUNCTION get_messages_paginated(p_conversation_id uuid, p_before_id uuid, p_after_id uuid, p_limit integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_messages_paginated(p_conversation_id uuid, p_before_id uuid, p_after_id uuid, p_limit integer) IS 'Obtiene mensajes de una conversaciÃ³n con paginaciÃ³n basada en cursores. 
Corrige bug de referencia ambigua de created_at.
FIXED: 2025-10-14 - Added table prefix m. to created_at in DECLARE section.';


--
-- Name: get_or_create_direct_conversation(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_or_create_direct_conversation(p_user1_id uuid, p_user2_id uuid, p_business_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Buscar conversaciÃ³n existente entre los dos usuarios
  SELECT DISTINCT c.id INTO v_conversation_id
  FROM chat_conversations c
  INNER JOIN chat_participants p1 ON c.id = p1.conversation_id AND p1.user_id = p_user1_id
  INNER JOIN chat_participants p2 ON c.id = p2.conversation_id AND p2.user_id = p_user2_id
  WHERE c.type = 'direct'
    AND p1.left_at IS NULL
    AND p2.left_at IS NULL
    AND (p_business_id IS NULL OR c.business_id = p_business_id)
  LIMIT 1;

  -- Si no existe, crear nueva conversaciÃ³n
  IF v_conversation_id IS NULL THEN
    INSERT INTO chat_conversations (type, created_by, business_id)
    VALUES ('direct', p_user1_id, p_business_id)
    RETURNING id INTO v_conversation_id;

    -- Agregar ambos participantes
    INSERT INTO chat_participants (conversation_id, user_id)
    VALUES 
      (v_conversation_id, p_user1_id),
      (v_conversation_id, p_user2_id);
  END IF;

  RETURN v_conversation_id;
END;
$$;


--
-- Name: get_pinned_messages(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pinned_messages(p_conversation_id uuid) RETURNS TABLE(message_id uuid, sender_id uuid, sender_name text, sender_avatar text, body text, type public.message_type, metadata jsonb, created_at timestamp with time zone, pinned_at timestamp with time zone, pinned_by uuid, pinned_by_name text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.sender_id,
    p.full_name AS sender_name,
    p.avatar_url AS sender_avatar,
    m.body,
    m.type,
    m.metadata,
    m.created_at,
    m.pinned_at,
    m.pinned_by,
    p_pinned.full_name AS pinned_by_name
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  LEFT JOIN public.profiles p_pinned ON m.pinned_by = p_pinned.id
  WHERE m.conversation_id = p_conversation_id
    AND m.is_pinned = TRUE
    AND m.is_deleted = FALSE
  ORDER BY m.pinned_at DESC;
END;
$$;


--
-- Name: get_reporting_chain(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_reporting_chain(p_user_id uuid, p_business_id uuid) RETURNS TABLE(level integer, user_id uuid, full_name text, hierarchy_level integer, job_title text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE chain AS (
    SELECT 
      0 as level,
      br.user_id,
      p.full_name,
      br.hierarchy_level,
      be.job_title,
      br.reports_to
    FROM business_roles br
    JOIN profiles p ON br.user_id = p.id
    LEFT JOIN business_employees be ON be.employee_id = p.id AND be.business_id = br.business_id
    WHERE br.user_id = p_user_id
      AND br.business_id = p_business_id
      AND br.is_active = true
    
    UNION ALL
    
    SELECT 
      c.level + 1,
      br.user_id,
      p.full_name,
      br.hierarchy_level,
      be.job_title,
      br.reports_to
    FROM chain c
    JOIN business_roles br ON br.user_id = c.reports_to
    JOIN profiles p ON br.user_id = p.id
    LEFT JOIN business_employees be ON be.employee_id = p.id AND be.business_id = br.business_id
    WHERE br.business_id = p_business_id
      AND br.is_active = true
      AND c.level < 10
  )
  SELECT 
    chain.level,
    chain.user_id,
    chain.full_name,
    chain.hierarchy_level,
    chain.job_title
  FROM chain
  ORDER BY chain.level ASC;
END;
$$;


--
-- Name: get_resource_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_resource_stats(p_resource_id uuid) RETURNS TABLE(total_bookings bigint, upcoming_bookings bigint, completed_bookings bigint, revenue_total numeric, revenue_this_month numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_bookings,
    COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed') AND start_time > NOW())::BIGINT AS upcoming_bookings,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_bookings,
    COALESCE(SUM(price), 0) AS revenue_total,
    COALESCE(SUM(price) FILTER (WHERE start_time >= date_trunc('month', NOW())), 0) AS revenue_this_month
  FROM appointments
  WHERE resource_id = p_resource_id;
END;
$$;


--
-- Name: FUNCTION get_resource_stats(p_resource_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_resource_stats(p_resource_id uuid) IS 'Obtiene estadÃ­sticas de un recurso: total de reservas, prÃ³ximas, completadas, ingresos.';


--
-- Name: get_subscription_dashboard(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_subscription_dashboard(p_business_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_plan business_plans%ROWTYPE;
    v_usage usage_metrics%ROWTYPE;
    v_payments JSON;
    v_payment_methods JSON;
    v_subscription JSON;
    v_usage_metrics JSON;
BEGIN
    -- Verificar que el usuario tiene acceso al negocio
    IF NOT (
        EXISTS (SELECT 1 FROM businesses WHERE id = p_business_id AND owner_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM business_employees WHERE business_id = p_business_id AND employee_id = auth.uid() AND role IN ('admin', 'manager'))
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Obtener plan actual
    SELECT * INTO v_plan
    FROM business_plans
    WHERE business_id = p_business_id
    AND status IN ('active', 'trialing', 'past_due', 'paused')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Si no hay plan, retornar null
    IF NOT FOUND THEN
        RETURN json_build_object(
            'subscription', NULL,
            'paymentMethods', '[]'::json,
            'recentPayments', '[]'::json,
            'upcomingInvoice', NULL,
            'usageMetrics', NULL
        );
    END IF;

    -- Construir objeto subscription compatible con el frontend
    v_subscription := json_build_object(
        'id', v_plan.id,
        'businessId', v_plan.business_id,
        'planType', v_plan.plan_type,
        'billingCycle', COALESCE(v_plan.billing_cycle, 'monthly'),
        'status', v_plan.status,
        'currentPeriodStart', v_plan.start_date,
        'currentPeriodEnd', v_plan.end_date,
        'trialEndsAt', v_plan.trial_ends_at,
        'canceledAt', v_plan.canceled_at,
        'cancellationReason', v_plan.cancellation_reason,
        'pausedAt', v_plan.paused_at,
        'amount', v_plan.price,
        'currency', COALESCE(v_plan.currency, 'COP')
    );

    -- Obtener mÃ©todos de pago
    SELECT COALESCE(json_agg(json_build_object(
        'id', pm.id,
        'type', pm.type,
        'brand', pm.brand,
        'last4', pm.last4,
        'expMonth', pm.exp_month,
        'expYear', pm.exp_year,
        'isActive', pm.is_default
    )), '[]'::json) INTO v_payment_methods
    FROM payment_methods pm
    WHERE pm.business_id = p_business_id
    AND pm.is_active = true;

    -- Obtener Ãºltimos 10 pagos
    SELECT COALESCE(json_agg(json_build_object(
        'id', sp.id,
        'amount', sp.amount,
        'currency', sp.currency,
        'status', sp.status,
        'paidAt', sp.paid_at,
        'failureReason', sp.failure_reason,
        'invoiceUrl', sp.metadata->>'invoice_pdf'
    )), '[]'::json) INTO v_payments
    FROM (
        SELECT * FROM subscription_payments
        WHERE business_id = p_business_id
        ORDER BY created_at DESC
        LIMIT 10
    ) sp;

    -- Obtener mÃ©tricas de uso mÃ¡s recientes
    SELECT * INTO v_usage
    FROM usage_metrics
    WHERE business_id = p_business_id
    ORDER BY metric_date DESC
    LIMIT 1;

    -- Construir objeto usageMetrics
    IF FOUND THEN
        v_usage_metrics := json_build_object(
            'locations', json_build_object(
                'current', v_usage.locations_count,
                'limit', (v_plan.limits->>'max_locations')::INTEGER
            ),
            'employees', json_build_object(
                'current', v_usage.employees_count,
                'limit', (v_plan.limits->>'max_employees')::INTEGER
            ),
            'appointments', json_build_object(
                'current', v_usage.appointments_count,
                'limit', (v_plan.limits->>'max_appointments_monthly')::INTEGER
            ),
            'clients', json_build_object(
                'current', v_usage.clients_count,
                'limit', (v_plan.limits->>'max_clients')::INTEGER
            ),
            'services', json_build_object(
                'current', v_usage.services_count,
                'limit', (v_plan.limits->>'max_services')::INTEGER
            )
        );
    END IF;

    -- Construir resultado con estructura esperada por el frontend
    v_result := json_build_object(
        'subscription', v_subscription,
        'paymentMethods', v_payment_methods,
        'recentPayments', v_payments,
        'upcomingInvoice', NULL,
        'usageMetrics', v_usage_metrics
    );

    RETURN v_result;
END;
$$;


--
-- Name: get_supabase_service_role_key(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_supabase_service_role_key() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Intentar obtener desde configuraciÃ³n personalizada
  RETURN current_setting('app.settings.service_role_key', true);
EXCEPTION WHEN OTHERS THEN
  -- Si no estÃ¡ configurada, retornar NULL
  RETURN NULL;
END;
$$;


--
-- Name: FUNCTION get_supabase_service_role_key(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_supabase_service_role_key() IS 'Returns the service role key for Edge Function invocations';


--
-- Name: get_supabase_url(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_supabase_url() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Intentar obtener desde configuraciÃ³n personalizada
  RETURN current_setting('app.settings.supabase_url', true);
EXCEPTION WHEN OTHERS THEN
  -- Si no estÃ¡ configurada, usar la URL por defecto del proyecto
  RETURN 'https://dkancockzvcqorqbwtyh.supabase.co';
END;
$$;


--
-- Name: FUNCTION get_supabase_url(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_supabase_url() IS 'Returns the Supabase project URL';


--
-- Name: get_transfer_impact(uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_transfer_impact(p_business_employee_id uuid, p_effective_date timestamp with time zone) RETURNS json
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_appointments_to_keep INTEGER;
  v_appointments_to_cancel INTEGER;
  v_result JSON;
BEGIN
  -- Contar citas a mantener (antes de fecha efectiva)
  SELECT COUNT(*)
  INTO v_appointments_to_keep
  FROM appointments
  WHERE employee_id = p_business_employee_id
    AND start_time >= NOW()
    AND start_time < p_effective_date
    AND status IN ('pending', 'confirmed');

  -- Contar citas a cancelar (despuÃ©s de fecha efectiva)
  SELECT COUNT(*)
  INTO v_appointments_to_cancel
  FROM appointments
  WHERE employee_id = p_business_employee_id
    AND start_time >= p_effective_date
    AND status IN ('pending', 'confirmed');

  -- Construir resultado JSON
  v_result := json_build_object(
    'appointments_to_keep', COALESCE(v_appointments_to_keep, 0),
    'appointments_to_cancel', COALESCE(v_appointments_to_cancel, 0),
    'effective_date', p_effective_date
  );

  RETURN v_result;
END;
$$;


--
-- Name: FUNCTION get_transfer_impact(p_business_employee_id uuid, p_effective_date timestamp with time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_transfer_impact(p_business_employee_id uuid, p_effective_date timestamp with time zone) IS 'Calcula cuÃ¡ntas citas se mantendrÃ¡n y cuÃ¡ntas se cancelarÃ¡n al programar un traslado';


--
-- Name: get_unread_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unread_count(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.in_app_notifications
    WHERE user_id = p_user_id 
      AND status = 'unread'
      AND status != 'archived'; -- Usar status en vez de is_deleted

    RETURN v_count;
END;
$$;


--
-- Name: get_unread_count_no_chat(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unread_count_no_chat(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM public.in_app_notifications
    WHERE 
        user_id = p_user_id 
        AND status = 'unread'
        AND type != 'chat_message'; -- âœ… Tipo correcto

    RETURN v_count;
END;
$$;


--
-- Name: FUNCTION get_unread_count_no_chat(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_unread_count_no_chat(p_user_id uuid) IS 'Retorna el conteo de notificaciones no leÃ­das de un usuario, excluyendo mensajes de chat.';


--
-- Name: get_unread_messages_count(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unread_messages_count(p_conversation_id uuid, p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND m.is_deleted = FALSE
    AND NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(m.read_by) AS elem
      WHERE elem->>'user_id' = p_user_id::text
    );
  
  RETURN v_count;
END;
$$;


--
-- Name: FUNCTION get_unread_messages_count(p_conversation_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_unread_messages_count(p_conversation_id uuid, p_user_id uuid) IS 'Retorna el conteo de mensajes no leÃ­dos en una conversaciÃ³n para un usuario';


--
-- Name: get_user_businesses(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_businesses(p_user_id uuid, p_include_owner boolean DEFAULT true) RETURNS TABLE(id uuid, name text, description text, logo_url text, phone text, email text, address text, city text, state text)
    LANGUAGE sql STABLE
    AS $$
  with emp_biz as (
    select 
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.phone,
      b.email,
      b.address,
      b.city,
      b.state
    from public.business_employees be
    join public.businesses b on b.id = be.business_id
    where be.employee_id = p_user_id
      and be.status = 'approved'
      and be.is_active = true
      and b.is_active = true
  ),
  own_biz as (
    select 
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.phone,
      b.email,
      b.address,
      b.city,
      b.state
    from public.businesses b
    where p_include_owner
      and b.owner_id = p_user_id
      and b.is_active = true
  ),
  combined as (
    select * from emp_biz
    union
    select * from own_biz
  )
  select * from combined;
$$;


--
-- Name: get_user_favorite_businesses(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_favorite_businesses() RETURNS TABLE(id uuid, name text, description text, logo_url text, banner_url text, address text, city text, phone text, average_rating numeric, review_count bigint, is_active boolean, favorited_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo_url,
    b.banner_url,
    b.address,
    -- FIX: Resolve city name from first location instead of businesses.city
    CASE 
      WHEN (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN (SELECT c.name FROM cities c WHERE c.id = (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)::uuid LIMIT 1)
      ELSE (SELECT l.city FROM locations l WHERE l.business_id = b.id LIMIT 1)
    END AS city,
    b.phone,
    COALESCE(brs.average_rating, 0)::DECIMAL(3,2) AS average_rating,
    COALESCE(brs.review_count, 0)::BIGINT AS review_count,
    b.is_active,
    bf.created_at AS favorited_at
  FROM business_favorites bf
  INNER JOIN businesses b ON bf.business_id = b.id
  LEFT JOIN business_ratings_stats brs ON b.id = brs.business_id
  WHERE bf.user_id = v_user_id
  ORDER BY bf.created_at DESC;
END;
$_$;


--
-- Name: FUNCTION get_user_favorite_businesses(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_favorite_businesses() IS 'Obtiene todos los negocios favoritos del usuario con informaciÃ³n completa incluyendo banner_url y city name resuelto desde locations';


--
-- Name: get_user_permissions(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_permissions(p_user_id uuid, p_business_id uuid) RETURNS TABLE(permission text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF is_business_owner(p_user_id, p_business_id) THEN
    RETURN QUERY SELECT 'owner.all_permissions'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT up.permission
  FROM user_permissions up
  WHERE up.user_id = p_user_id
    AND up.business_id = p_business_id
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > NOW());
END;
$$;


--
-- Name: get_user_permissions_fast(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_permissions_fast(p_user_id uuid, p_business_id uuid) RETURNS text[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_permissions TEXT[];
BEGIN
  -- Obtener array de permisos desde materialized view
  SELECT permissions
  INTO v_permissions
  FROM user_active_permissions
  WHERE user_id = p_user_id
    AND business_id = p_business_id;
  
  RETURN COALESCE(v_permissions, ARRAY[]::TEXT[]);
END;
$$;


--
-- Name: FUNCTION get_user_permissions_fast(p_user_id uuid, p_business_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_permissions_fast(p_user_id uuid, p_business_id uuid) IS 'Obtiene array de permisos activos usando materialized view.
Performance: ~30ms (vs ~150ms con query normal).
Uso: SELECT get_user_permissions_fast(user_id, business_id);';


--
-- Name: get_wizard_business_data(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_wizard_business_data(p_business_id uuid) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  with loc as (
    select 
      id,
      business_id,
      name,
      address,
      city,
      state,
      latitude,
      longitude,
      opens_at,
      closes_at,
      is_active
    from public.locations
    where business_id = p_business_id
      and is_active = true
    order by name
  ),
  svc_raw as (
    select 
      id,
      business_id,
      name,
      description,
      price,
      currency,
      duration_minutes,
      category,
      is_active,
      image_url
    from public.services
    where business_id = p_business_id
      and is_active = true
    order by name
  ),
  svc as (
    select 
      id,
      business_id,
      name,
      description,
      price,
      currency,
      coalesce(duration_minutes, 0) as duration,
      category,
      is_active,
      image_url
    from svc_raw
  )
  select jsonb_build_object(
    'locations', coalesce((select jsonb_agg(loc) from loc), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(svc) from svc), '[]'::jsonb)
  );
$$;


--
-- Name: get_wizard_employees_data(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_wizard_employees_data(p_business_id uuid, p_service_id uuid, p_location_id uuid DEFAULT NULL::uuid) RETURNS TABLE(employee_id uuid, full_name text, avatar_url text, email text, role text, expertise_level integer, setup_completed boolean, supervisor_name text, avg_rating numeric, review_count bigint)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    be.employee_id,
    p.full_name,
    p.avatar_url,
    p.email,
    be.role,
    es.expertise_level,
    be.setup_completed,
    (SELECT bp.full_name FROM public.profiles bp
     WHERE bp.id = br_supervisor.user_id LIMIT 1) AS supervisor_name,
    COALESCE(AVG(CAST(r.rating AS NUMERIC)), 0) AS avg_rating,
    COUNT(r.id) AS review_count
  FROM
    public.business_employees be
    INNER JOIN public.employee_services es
      ON be.employee_id = es.employee_id AND be.business_id = es.business_id
    INNER JOIN public.profiles p ON be.employee_id = p.id
    LEFT JOIN public.business_roles br
      ON be.business_id = br.business_id AND be.employee_id = br.user_id
    LEFT JOIN public.business_roles br_supervisor
      ON br.business_id = br_supervisor.business_id AND br_supervisor.role = 'admin'
    LEFT JOIN public.reviews r ON r.employee_id = be.employee_id
  WHERE
    be.business_id = p_business_id
    AND es.service_id = p_service_id
    AND be.is_active = TRUE
    AND be.status = 'approved'
    AND (p_location_id IS NULL OR be.location_id = p_location_id)
  GROUP BY
    be.employee_id,
    p.full_name,
    p.avatar_url,
    p.email,
    be.role,
    es.expertise_level,
    be.setup_completed,
    br_supervisor.user_id
  ORDER BY
    avg_rating DESC NULLS LAST,
    p.full_name;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NULLIF(COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        ), '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;


--
-- Name: has_permission_fast(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission_fast(p_user_id uuid, p_business_id uuid, p_permission text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- Check usando materialized view (80% mÃ¡s rÃ¡pido)
  SELECT permissions @> ARRAY[p_permission]
  INTO v_has_permission
  FROM user_active_permissions
  WHERE user_id = p_user_id
    AND business_id = p_business_id;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$;


--
-- Name: FUNCTION has_permission_fast(p_user_id uuid, p_business_id uuid, p_permission text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.has_permission_fast(p_user_id uuid, p_business_id uuid, p_permission text) IS 'VerificaciÃ³n rÃ¡pida de permiso usando materialized view.
Performance: ~30ms (vs ~150ms con query normal).
Uso: SELECT has_permission_fast(user_id, business_id, ''services.create'');';


--
-- Name: increment_discount_code_uses(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_discount_code_uses() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE discount_codes
    SET current_uses = current_uses + 1
    WHERE id = NEW.discount_code_id;
    RETURN NEW;
END;
$$;


--
-- Name: increment_unread_on_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_unread_on_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Actualizar last_read_at del SENDER (marca como leÃ­do para quien envÃ­a)
  UPDATE conversation_members
  SET last_read_at = NEW.created_at
  WHERE conversation_id = NEW.conversation_id
    AND user_id = NEW.sender_id;
  
  -- Incrementar unread_count de TODOS LOS DEMÃS MIEMBROS
  UPDATE conversation_members
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION increment_unread_on_message(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.increment_unread_on_message() IS 'Incrementa unread_count de todos los miembros excepto el sender cuando llega un nuevo mensaje';


--
-- Name: increment_vacancy_applications_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_vacancy_applications_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE job_vacancies 
  SET applications_count = applications_count + 1
  WHERE id = NEW.vacancy_id;
  RETURN NEW;
END;
$$;


--
-- Name: initialize_vacation_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_vacation_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_business_vacation_days INT;
  v_current_year INT;
  v_balance_record RECORD;
BEGIN
  -- Obtener dÃ­as de vacaciones anuales de la configuraciÃ³n del negocio
  SELECT vacation_days_per_year INTO v_business_vacation_days
  FROM businesses
  WHERE id = NEW.business_id;

  IF v_business_vacation_days IS NULL THEN
    v_business_vacation_days := 15; -- Default si no se especifica
  END IF;

  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Verificar si ya existe un registro
  SELECT * INTO v_balance_record
  FROM vacation_balance
  WHERE employee_id = NEW.employee_id
  AND business_id = NEW.business_id
  AND year = v_current_year;

  -- Si no existe, crear uno nuevo
  IF v_balance_record IS NULL THEN
    INSERT INTO vacation_balance (
      employee_id,
      business_id,
      year,
      total_days_available,
      days_used,
      days_pending,
      created_at,
      updated_at
    ) VALUES (
      NEW.employee_id,
      NEW.business_id,
      v_current_year,
      v_business_vacation_days,
      0,
      0,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: invoke_appointment_status_updater(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.invoke_appointment_status_updater() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- âœ… Leer service_role_key desde Vault (NO desde current_setting)
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not found in Vault';
    INSERT INTO public.cron_execution_logs (job_name, status, message)
    VALUES ('appointment-status-updater', 'failed', 'Service role key not found in Vault');
    RETURN;
  END IF;

  -- Invocar Edge Function (cuando exista)
  SELECT INTO request_id
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/appointment-status-updater',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );

  -- Log de Ã©xito
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'appointment-status-updater',
    'success',
    'Successfully invoked Edge Function',
    jsonb_build_object('request_id', request_id, 'timestamp', now())
  );

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'appointment-status-updater',
    'failed',
    SQLERRM,
    jsonb_build_object('error', SQLERRM, 'timestamp', now())
  );
  RAISE WARNING 'Failed to invoke appointment-status-updater: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION invoke_appointment_status_updater(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.invoke_appointment_status_updater() IS 'Invokes appointment-status-updater Edge Function using service_role_key from Vault';


--
-- Name: invoke_process_reminders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.invoke_process_reminders() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- âœ… Leer service_role_key desde Vault (NO desde current_setting)
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;
  
  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not found in Vault';
    INSERT INTO public.cron_execution_logs (job_name, status, message)
    VALUES ('process-reminders', 'failed', 'Service role key not found in Vault');
    RETURN;
  END IF;

  -- Invocar Edge Function
  SELECT INTO request_id
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/process-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );

  -- Log de Ã©xito
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'process-reminders',
    'success',
    'Successfully invoked Edge Function',
    jsonb_build_object('request_id', request_id, 'timestamp', now())
  );

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.cron_execution_logs (job_name, status, message, details)
  VALUES (
    'process-reminders',
    'failed',
    SQLERRM,
    jsonb_build_object('error', SQLERRM, 'timestamp', now())
  );
  RAISE WARNING 'Failed to invoke process-reminders: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION invoke_process_reminders(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.invoke_process_reminders() IS 'Invokes process-reminders Edge Function using service_role_key from Vault';


--
-- Name: is_business_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_business_admin(p_business_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- DueÃ±o
    IF is_business_owner(p_business_id) THEN
        RETURN true;
    END IF;
    
    -- Admin role
    RETURN EXISTS (
        SELECT 1 FROM business_roles
        WHERE business_id = p_business_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    );
END;
$$;


--
-- Name: is_business_favorite(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_business_favorite(p_business_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM business_favorites
    WHERE user_id = auth.uid() AND business_id = p_business_id
  );
END;
$$;


--
-- Name: is_business_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_business_member(bid uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.business_employees be
        WHERE be.business_id = bid AND be.employee_id = auth.uid() AND be.status = 'approved'
      );
    $$;


--
-- Name: is_business_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_business_owner(p_business_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM businesses
        WHERE id = p_business_id
        AND owner_id = auth.uid()
    );
END;
$$;


--
-- Name: is_business_owner(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_business_owner(p_user_id uuid, p_business_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id 
    AND owner_id = p_user_id
  );
END;
$$;


--
-- Name: is_business_owner_for_storage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_business_owner_for_storage(p_business_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id
    AND owner_id = auth.uid()
  );
END;
$$;


--
-- Name: is_discount_code_valid(text, text, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_discount_code_valid(p_code text, p_plan_type text DEFAULT NULL::text, p_amount numeric DEFAULT NULL::numeric) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_discount discount_codes%ROWTYPE;
BEGIN
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE code = p_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF v_discount.min_amount IS NOT NULL AND (p_amount IS NULL OR p_amount < v_discount.min_amount) THEN
        RETURN false;
    END IF;

    IF v_discount.eligible_plans IS NOT NULL AND p_plan_type IS NOT NULL THEN
        IF NOT (p_plan_type = ANY(v_discount.eligible_plans)) THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$;


--
-- Name: FUNCTION is_discount_code_valid(p_code text, p_plan_type text, p_amount numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_discount_code_valid(p_code text, p_plan_type text, p_amount numeric) IS 'Verifica si un cÃ³digo de descuento es vÃ¡lido para un plan y monto dados';


--
-- Name: is_employee_available_for_appointment(uuid, uuid, uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_employee_available_for_appointment(p_employee_id uuid, p_business_id uuid, p_location_id uuid, p_appointment_date timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_employee RECORD;
BEGIN
  -- Obtener datos del empleado
  SELECT 
    location_id,
    transfer_status,
    transfer_effective_date,
    transfer_to_location_id,
    is_active
  INTO v_employee
  FROM business_employees
  WHERE employee_id = p_employee_id
    AND business_id = p_business_id;

  -- Si no existe el empleado o no estÃ¡ activo
  IF v_employee IS NULL OR NOT v_employee.is_active THEN
    RETURN FALSE;
  END IF;

  -- Si no hay traslado programado, validar sede normal
  IF v_employee.transfer_status IS NULL OR v_employee.transfer_status != 'pending' THEN
    RETURN v_employee.location_id = p_location_id;
  END IF;

  -- Si hay traslado pendiente, aplicar lÃ³gica especial
  IF v_employee.transfer_status = 'pending' THEN
    -- Regla 1: Cita ANTES de fecha efectiva â†’ debe ser en sede ANTERIOR
    IF p_appointment_date < v_employee.transfer_effective_date THEN
      RETURN v_employee.location_id = p_location_id;
    END IF;

    -- Regla 2: Cita DESPUÃ‰S O EN fecha efectiva â†’ debe ser en sede NUEVA
    IF p_appointment_date >= v_employee.transfer_effective_date THEN
      RETURN v_employee.transfer_to_location_id = p_location_id;
    END IF;
  END IF;

  -- Default: no disponible
  RETURN FALSE;
END;
$$;


--
-- Name: FUNCTION is_employee_available_for_appointment(p_employee_id uuid, p_business_id uuid, p_location_id uuid, p_appointment_date timestamp with time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_employee_available_for_appointment(p_employee_id uuid, p_business_id uuid, p_location_id uuid, p_appointment_date timestamp with time zone) IS 'Valida si un empleado estÃ¡ disponible para una cita en una sede especÃ­fica, considerando traslados programados';


--
-- Name: is_employee_available_on_date(uuid, uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_employee_available_on_date(p_employee_id uuid, p_business_id uuid, p_check_date date) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_has_absence BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM employee_absences
    WHERE employee_id = p_employee_id
      AND business_id = p_business_id
      AND status = 'approved'
      AND p_check_date BETWEEN start_date AND end_date
  ) INTO v_has_absence;
  
  RETURN NOT v_has_absence;
END;
$$;


--
-- Name: FUNCTION is_employee_available_on_date(p_employee_id uuid, p_business_id uuid, p_check_date date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_employee_available_on_date(p_employee_id uuid, p_business_id uuid, p_check_date date) IS 'Verifica si un empleado estÃ¡ disponible en una fecha especÃ­fica (no tiene ausencias aprobadas).';


--
-- Name: is_location_owner_for_storage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_location_owner_for_storage(p_location_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    JOIN public.businesses b ON b.id = l.business_id
    WHERE l.id = p_location_id
      AND b.owner_id = auth.uid()
  );
$$;


--
-- Name: is_resource_available(uuid, timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_resource_available(p_resource_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_overlapping_count INTEGER;
BEGIN
  -- Contar citas que se solapan
  SELECT COUNT(*)
  INTO v_overlapping_count
  FROM appointments
  WHERE resource_id = p_resource_id
    AND status IN ('pending', 'confirmed')
    AND (id != p_exclude_appointment_id OR p_exclude_appointment_id IS NULL)
    AND (
      (start_time < p_end_time AND end_time > p_start_time)
    );
  
  RETURN v_overlapping_count = 0;
END;
$$;


--
-- Name: FUNCTION is_resource_available(p_resource_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_resource_available(p_resource_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid) IS 'Valida si un recurso estÃ¡ disponible en un rango de tiempo. Excluye cita especificada (Ãºtil para ediciÃ³n).';


--
-- Name: log_error_event(text, text, text, text, uuid, text, text, jsonb, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_error_event(p_source text DEFAULT 'frontend-web'::text, p_level text DEFAULT 'error'::text, p_message text DEFAULT 'Unknown error'::text, p_stack_trace text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_session_id text DEFAULT NULL::text, p_component text DEFAULT NULL::text, p_context jsonb DEFAULT '{}'::jsonb, p_environment text DEFAULT 'production'::text, p_error_hash text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_error_id UUID;
  v_error_hash TEXT;
  v_recent_count INTEGER;
BEGIN
  -- Validar parÃ¡metros requeridos
  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'message is required';
  END IF;
  
  IF p_source IS NULL OR p_source = '' THEN
    RAISE EXCEPTION 'source is required';
  END IF;
  
  IF p_level IS NULL OR p_level = '' THEN
    RAISE EXCEPTION 'level is required';
  END IF;

  -- Generar hash si no se proporciona
  v_error_hash := COALESCE(
    p_error_hash,
    md5(p_source || p_message || COALESCE(p_component, ''))
  );

  -- Rate limiting: max 100 errores idÃ©nticos por hora
  SELECT COUNT(*)
  INTO v_recent_count
  FROM error_logs
  WHERE error_hash = v_error_hash
    AND timestamp > NOW() - INTERVAL '1 hour';

  IF v_recent_count >= 100 THEN
    RETURN NULL;
  END IF;

  -- Insertar log
  INSERT INTO error_logs (
    source, level, message, stack_trace, error_hash,
    user_id, session_id, component, context, environment
  )
  VALUES (
    p_source, p_level, p_message, p_stack_trace, v_error_hash,
    p_user_id, p_session_id, p_component, p_context, p_environment
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$;


--
-- Name: FUNCTION log_error_event(p_source text, p_level text, p_message text, p_stack_trace text, p_user_id uuid, p_session_id text, p_component text, p_context jsonb, p_environment text, p_error_hash text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_error_event(p_source text, p_level text, p_message text, p_stack_trace text, p_user_id uuid, p_session_id text, p_component text, p_context jsonb, p_environment text, p_error_hash text) IS 'Registra un evento de error con rate limiting y hash deduplication';


--
-- Name: log_login_event(text, text, text, uuid, inet, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_login_event(p_email text DEFAULT 'unknown@example.com'::text, p_status text DEFAULT 'success'::text, p_method text DEFAULT 'password'::text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_login_id UUID;
  v_device TEXT;
  v_browser TEXT;
  v_os TEXT;
  v_is_suspicious BOOLEAN := FALSE;
  v_suspicious_reason TEXT := NULL;
  v_recent_failures INTEGER;
BEGIN
  -- Validar parÃ¡metros requeridos
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'email is required';
  END IF;
  
  IF p_status IS NULL OR p_status = '' THEN
    RAISE EXCEPTION 'status is required';
  END IF;
  
  IF p_method IS NULL OR p_method = '' THEN
    RAISE EXCEPTION 'method is required';
  END IF;

  -- Parsear user agent (simplificado)
  v_device := CASE
    WHEN p_user_agent ILIKE '%mobile%' THEN 'mobile'
    WHEN p_user_agent ILIKE '%tablet%' THEN 'tablet'
    WHEN p_user_agent IS NOT NULL THEN 'desktop'
    ELSE 'unknown'
  END;

  v_browser := CASE
    WHEN p_user_agent ILIKE '%chrome%' THEN 'Chrome'
    WHEN p_user_agent ILIKE '%firefox%' THEN 'Firefox'
    WHEN p_user_agent ILIKE '%safari%' AND p_user_agent NOT ILIKE '%chrome%' THEN 'Safari'
    WHEN p_user_agent ILIKE '%edge%' THEN 'Edge'
    ELSE 'Other'
  END;

  v_os := CASE
    WHEN p_user_agent ILIKE '%windows%' THEN 'Windows'
    WHEN p_user_agent ILIKE '%mac%' THEN 'macOS'
    WHEN p_user_agent ILIKE '%linux%' THEN 'Linux'
    WHEN p_user_agent ILIKE '%android%' THEN 'Android'
    WHEN p_user_agent ILIKE '%ios%' THEN 'iOS'
    ELSE 'Unknown'
  END;

  -- DetecciÃ³n de actividad sospechosa
  IF p_status = 'failure' THEN
    SELECT COUNT(*)
    INTO v_recent_failures
    FROM login_logs
    WHERE email = p_email
      AND status = 'failure'
      AND timestamp > NOW() - INTERVAL '15 minutes';

    IF v_recent_failures >= 5 THEN
      v_is_suspicious := TRUE;
      v_suspicious_reason := 'Multiple failed attempts in 15 minutes';
    END IF;
  END IF;

  INSERT INTO login_logs (
    user_id, email, status, method, ip_address, user_agent,
    device, browser, os, metadata, is_suspicious, suspicious_reason
  )
  VALUES (
    p_user_id, p_email, p_status, p_method, p_ip_address, p_user_agent,
    v_device, v_browser, v_os, p_metadata, v_is_suspicious, v_suspicious_reason
  )
  RETURNING id INTO v_login_id;

  RETURN v_login_id;
END;
$$;


--
-- Name: FUNCTION log_login_event(p_email text, p_status text, p_method text, p_user_id uuid, p_ip_address inet, p_user_agent text, p_metadata jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_login_event(p_email text, p_status text, p_method text, p_user_id uuid, p_ip_address inet, p_user_agent text, p_metadata jsonb) IS 'Registra un intento de login con detecciÃ³n de patrones sospechosos';


--
-- Name: log_payment_method_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_payment_method_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO billing_audit_log (
            business_id, action, entity_type, entity_id,
            performed_by, performed_by_source, new_value
        ) VALUES (
            NEW.business_id, 'payment_method_added', 'payment_method', NEW.id,
            NEW.created_by, 'user', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO billing_audit_log (
            business_id, action, entity_type, entity_id,
            performed_by, performed_by_source, old_value, new_value
        ) VALUES (
            NEW.business_id, 'payment_method_updated', 'payment_method', NEW.id,
            auth.uid(), 'user', to_jsonb(OLD), to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO billing_audit_log (
            business_id, action, entity_type, entity_id,
            performed_by, performed_by_source, old_value
        ) VALUES (
            OLD.business_id, 'payment_method_removed', 'payment_method', OLD.id,
            auth.uid(), 'user', to_jsonb(OLD)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: log_subscription_payment_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_subscription_payment_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_action TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'payment_' || NEW.status;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        v_action := 'payment_' || NEW.status;
    ELSE
        RETURN NEW;
    END IF;
    
    INSERT INTO billing_audit_log (
        business_id, action, entity_type, entity_id,
        performed_by_source, old_value, new_value
    ) VALUES (
        NEW.business_id, v_action, 'payment', NEW.id,
        'stripe_webhook', to_jsonb(OLD), to_jsonb(NEW)
    );
    
    RETURN NEW;
END;
$$;


--
-- Name: mark_message_as_read(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_message_as_read(p_message_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_read_by JSONB;
  v_already_read BOOLEAN;
BEGIN
  -- Obtener read_by actual
  SELECT read_by INTO v_read_by
  FROM messages
  WHERE id = p_message_id;
  
  -- Verificar si ya fue leÃ­do por este usuario
  SELECT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(v_read_by) AS elem
    WHERE elem->>'user_id' = p_user_id::text
  ) INTO v_already_read;
  
  -- Si no ha sido leÃ­do, agregarlo
  IF NOT v_already_read THEN
    UPDATE messages
    SET read_by = read_by || jsonb_build_object(
      'user_id', p_user_id,
      'read_at', NOW()
    )
    WHERE id = p_message_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


--
-- Name: FUNCTION mark_message_as_read(p_message_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.mark_message_as_read(p_message_id uuid, p_user_id uuid) IS 'Marca un mensaje como leÃ­do por un usuario especÃ­fico';


--
-- Name: mark_messages_as_read(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_messages_as_read(p_conversation_id uuid, p_user_id uuid, p_message_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_read_receipt jsonb;
BEGIN
  -- 1. Actualizar chat_participants (como antes)
  UPDATE chat_participants
  SET 
    last_read_at = now(),
    last_read_message_id = COALESCE(p_message_id, last_read_message_id),
    unread_count = 0,
    updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  -- 2. Crear objeto de read receipt
  v_read_receipt := jsonb_build_object(
    'user_id', p_user_id,
    'read_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  
  -- 3. Actualizar read_by en TODOS los mensajes de la conversaciÃ³n
  --    que aÃºn no han sido marcados como leÃ­dos por este usuario
  --    y que NO son del usuario actual (no marcar propios mensajes)
  UPDATE chat_messages
  SET 
    read_by = COALESCE(read_by, '[]'::jsonb) || v_read_receipt,
    updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id  -- No marcar propios mensajes
    AND deleted_at IS NULL
    AND (
      read_by IS NULL 
      OR NOT read_by @> jsonb_build_array(jsonb_build_object('user_id', p_user_id))
    )
    -- Si se especifica p_message_id, solo marcar hasta ese mensaje
    AND (p_message_id IS NULL OR sent_at <= (
      SELECT sent_at FROM chat_messages WHERE id = p_message_id
    ));
    
END;
$$;


--
-- Name: FUNCTION mark_messages_as_read(p_conversation_id uuid, p_user_id uuid, p_message_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.mark_messages_as_read(p_conversation_id uuid, p_user_id uuid, p_message_id uuid) IS 'Marca mensajes como leÃ­dos actualizando chat_participants.unread_count y chat_messages.read_by';


--
-- Name: mark_notifications_as_read(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_notifications_as_read(p_user_id uuid, p_notification_ids uuid[] DEFAULT NULL::uuid[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_notification_ids IS NOT NULL AND array_length(p_notification_ids, 1) > 0 THEN
        UPDATE public.in_app_notifications
        SET status = 'read', read_at = NOW()
        WHERE user_id = p_user_id 
          AND id = ANY(p_notification_ids)
          AND status = 'unread';
    ELSE
        UPDATE public.in_app_notifications
        SET status = 'read', read_at = NOW()
        WHERE user_id = p_user_id 
          AND status = 'unread';
    END IF;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


--
-- Name: mark_notifications_email_sent(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_notifications_email_sent(p_user_id uuid, p_notification_ids uuid[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE in_app_notifications
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{email_reminder_sent}',
    'true'::jsonb
  ) || jsonb_build_object('email_sent_at', NOW()::TEXT)
  WHERE id = ANY(p_notification_ids)
    AND user_id = p_user_id
    AND type = 'chat_message';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;


--
-- Name: notify_appointment_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_appointment_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_business_name TEXT;
    v_service_name TEXT;
    v_client_name TEXT;
    v_employee_name TEXT;
    v_appointment_time TEXT;
    v_business_owner_id UUID;
BEGIN
    -- Obtener informaciÃ³n del negocio
    SELECT name, owner_id 
    INTO v_business_name, v_business_owner_id
    FROM businesses 
    WHERE id = NEW.business_id;

    -- Obtener nombre del servicio (si existe)
    SELECT name 
    INTO v_service_name
    FROM services 
    WHERE id = NEW.service_id;

    -- Obtener nombre del cliente
    SELECT full_name 
    INTO v_client_name
    FROM profiles 
    WHERE id = NEW.client_id;

    -- Obtener nombre del empleado (si existe)
    IF NEW.employee_id IS NOT NULL THEN
        SELECT full_name 
        INTO v_employee_name
        FROM profiles 
        WHERE id = NEW.employee_id;
    END IF;

    -- Formatear la hora de la cita
    v_appointment_time := TO_CHAR(NEW.start_time AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH24:MI');

    -- 1. NOTIFICAR AL EMPLEADO (si existe y es diferente del cliente)
    -- CAMBIO: priority de 2 â†’ 1 (normal, no urgente)
    IF NEW.employee_id IS NOT NULL AND NEW.employee_id != NEW.client_id THEN
        INSERT INTO in_app_notifications (
            user_id,
            type,
            title,
            message,
            data,
            business_id,
            priority,
            status,
            action_url
        ) VALUES (
            NEW.employee_id,
            'appointment_new_employee',
            'Nueva Cita Asignada',
            CASE 
                WHEN v_service_name IS NOT NULL THEN
                    'Tienes una nueva cita de ' || v_service_name || ' con ' || COALESCE(v_client_name, 'un cliente') || ' el ' || v_appointment_time
                ELSE
                    'Tienes una nueva cita con ' || COALESCE(v_client_name, 'un cliente') || ' el ' || v_appointment_time
            END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'client_id', NEW.client_id,
                'client_name', v_client_name,
                'service_id', NEW.service_id,
                'service_name', v_service_name,
                'start_time', NEW.start_time,
                'business_id', NEW.business_id,
                'business_name', v_business_name
            ),
            NEW.business_id,
            1, -- Prioridad normal (era 2)
            'unread',
            '/app/employee/appointments'
        );
    END IF;

    -- 2. NOTIFICAR AL CLIENTE (si es diferente del empleado)
    IF NEW.client_id != NEW.employee_id OR NEW.employee_id IS NULL THEN
        INSERT INTO in_app_notifications (
            user_id,
            type,
            title,
            message,
            data,
            business_id,
            priority,
            status,
            action_url
        ) VALUES (
            NEW.client_id,
            'appointment_new_client',
            'Cita Confirmada',
            CASE 
                WHEN v_service_name IS NOT NULL AND v_employee_name IS NOT NULL THEN
                    'Tu cita de ' || v_service_name || ' con ' || v_employee_name || ' en ' || v_business_name || ' estÃ¡ programada para el ' || v_appointment_time
                WHEN v_service_name IS NOT NULL THEN
                    'Tu cita de ' || v_service_name || ' en ' || v_business_name || ' estÃ¡ programada para el ' || v_appointment_time
                ELSE
                    'Tu cita en ' || v_business_name || ' estÃ¡ programada para el ' || v_appointment_time
            END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'employee_id', NEW.employee_id,
                'employee_name', v_employee_name,
                'service_id', NEW.service_id,
                'service_name', v_service_name,
                'start_time', NEW.start_time,
                'business_id', NEW.business_id,
                'business_name', v_business_name
            ),
            NEW.business_id,
            1, -- Prioridad normal
            'unread',
            '/app/client/appointments'
        );
    END IF;

    -- 3. NOTIFICAR AL DUEÃ‘O DEL NEGOCIO (si es diferente del empleado y del cliente)
    IF v_business_owner_id IS NOT NULL 
       AND v_business_owner_id != NEW.employee_id 
       AND v_business_owner_id != NEW.client_id THEN
        INSERT INTO in_app_notifications (
            user_id,
            type,
            title,
            message,
            data,
            business_id,
            priority,
            status,
            action_url
        ) VALUES (
            v_business_owner_id,
            'appointment_new_business',
            'Nueva Cita en ' || v_business_name,
            CASE 
                WHEN v_service_name IS NOT NULL AND v_employee_name IS NOT NULL THEN
                    COALESCE(v_client_name, 'Un cliente') || ' ha reservado ' || v_service_name || ' con ' || v_employee_name || ' para el ' || v_appointment_time
                WHEN v_service_name IS NOT NULL THEN
                    COALESCE(v_client_name, 'Un cliente') || ' ha reservado ' || v_service_name || ' para el ' || v_appointment_time
                ELSE
                    'Nueva cita programada para el ' || v_appointment_time
            END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'client_id', NEW.client_id,
                'client_name', v_client_name,
                'employee_id', NEW.employee_id,
                'employee_name', v_employee_name,
                'service_id', NEW.service_id,
                'service_name', v_service_name,
                'start_time', NEW.start_time,
                'business_id', NEW.business_id
            ),
            NEW.business_id,
            1, -- Prioridad normal
            'unread',
            '/app/admin/appointments'
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION notify_appointment_created(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.notify_appointment_created() IS 'Trigger function que crea notificaciones in-app con PRIORIDAD NORMAL (1) para empleado, cliente y dueÃ±o del negocio cuando se crea una nueva cita';


--
-- Name: notify_business_on_application(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_business_on_application() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_business_owner_id UUID;
  v_vacancy_title TEXT;
  v_applicant_name TEXT;
BEGIN
  -- Get business owner and vacancy title
  SELECT jv.business_id, jv.title INTO v_business_owner_id, v_vacancy_title
  FROM job_vacancies jv
  WHERE jv.id = NEW.vacancy_id;

  -- Get owner ID
  SELECT owner_id INTO v_business_owner_id
  FROM businesses
  WHERE id = v_business_owner_id;

  -- Get applicant name
  SELECT full_name INTO v_applicant_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Insert in_app notification with action_url
  INSERT INTO in_app_notifications (
    user_id,
    type,
    title,
    message,
    status,
    priority,
    action_url,
    data
  ) VALUES (
    v_business_owner_id,
    'job_application_new',
    'Nueva aplicaciÃ³n recibida',
    COALESCE(v_applicant_name, 'Un candidato') || ' ha aplicado a la vacante "' || COALESCE(v_vacancy_title, 'sin tÃ­tulo') || '"',
    'unread',
    2,
    '/vacantes/aplicaciones/' || NEW.vacancy_id,
    jsonb_build_object(
      'application_id', NEW.id,
      'vacancy_id', NEW.vacancy_id,
      'applicant_id', NEW.user_id,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$;


--
-- Name: notify_chat_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_chat_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_participant RECORD;
    v_sender_name TEXT;
    v_conversation_title TEXT;
    v_message_preview TEXT;
BEGIN
    -- Solo procesar mensajes de tipo 'text' o 'image' o 'file' (no 'system')
    IF NEW.type = 'system' THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del remitente
    SELECT full_name INTO v_sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

    -- Si no tiene full_name, usar email
    IF v_sender_name IS NULL THEN
        SELECT email INTO v_sender_name
        FROM auth.users
        WHERE id = NEW.sender_id;
    END IF;

    -- Obtener tÃ­tulo de la conversaciÃ³n (si existe)
    SELECT title INTO v_conversation_title
    FROM public.chat_conversations
    WHERE id = NEW.conversation_id;

    -- Preview del mensaje (mÃ¡ximo 100 caracteres)
    v_message_preview := substring(NEW.content, 1, 100);
    IF length(NEW.content) > 100 THEN
        v_message_preview := v_message_preview || '...';
    END IF;

    -- Crear notificaciÃ³n para cada participante (excepto el sender)
    FOR v_participant IN
        SELECT 
            cp.user_id,
            cp.is_muted,
            cc.business_id
        FROM public.chat_participants cp
        INNER JOIN public.chat_conversations cc ON cc.id = cp.conversation_id
        WHERE cp.conversation_id = NEW.conversation_id
          AND cp.user_id != NEW.sender_id
          AND cp.left_at IS NULL  -- Solo participantes activos
          AND cp.is_muted = FALSE  -- Respetar mute preference
    LOOP
        -- Crear notificaciÃ³n in-app usando la funciÃ³n helper
        -- âœ… FIX: Usar 'chat_message' (tipo correcto del enum)
        PERFORM create_in_app_notification(
            p_user_id := v_participant.user_id,
            p_type := 'chat_message',  -- âœ… Tipo correcto
            p_title := COALESCE(v_sender_name, 'Nuevo mensaje'),
            p_body := v_message_preview,
            p_data := jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id,
                'sender_name', v_sender_name,
                'message_type', NEW.type,
                'conversation_title', v_conversation_title
            ),
            p_business_id := v_participant.business_id,
            p_priority := 0, -- Normal priority
            p_action_url := '/chat/' || NEW.conversation_id
        );
    END LOOP;

    RETURN NEW;
END;
$$;


--
-- Name: notify_new_chat_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_new_chat_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_recipient_ids uuid[];
  v_recipient_id uuid;
  v_sender_name text;
  v_action_url text;
BEGIN
  -- Obtener nombre del remitente
  SELECT full_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Construir action_url
  v_action_url := '/chat?conversation=' || NEW.conversation_id::text;

  -- Obtener todos los participantes excepto el remitente
  SELECT ARRAY_AGG(user_id)
  INTO v_recipient_ids
  FROM chat_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND left_at IS NULL;

  -- Crear notificaciÃ³n para cada participante
  IF v_recipient_ids IS NOT NULL THEN
    FOREACH v_recipient_id IN ARRAY v_recipient_ids
    LOOP
      PERFORM create_in_app_notification(
        p_user_id := v_recipient_id,
        p_type := 'chat_message',
        p_title := COALESCE(v_sender_name, 'Alguien') || ' te enviÃ³ un mensaje',
        p_message := SUBSTRING(NEW.content, 1, 100),
        p_action_url := v_action_url,
        p_priority := 1,
        p_metadata := jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'message_id', NEW.id,
          'sender_id', NEW.sender_id,
          'sender_name', v_sender_name
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION notify_new_chat_message(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.notify_new_chat_message() IS 'Trigger function que crea notificaciones in-app cuando llega un mensaje nuevo en el chat';


--
-- Name: process_due_recurring_expenses(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_due_recurring_expenses() RETURNS TABLE(expense_id uuid, transaction_id uuid, expense_name text, amount numeric, status text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_expense recurring_expenses%ROWTYPE;
  v_transaction_id UUID;
  v_expense_name TEXT;
BEGIN
  -- Iterar sobre egresos recurrentes que estÃ¡n listos para pago
  FOR v_expense IN
    SELECT *
    FROM recurring_expenses
    WHERE is_active = true
      AND is_automated = true
      AND next_payment_date <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY next_payment_date
  LOOP
    BEGIN
      -- Obtener nombre del egreso
      v_expense_name := COALESCE(v_expense.name, v_expense.description, 'Egreso recurrente');
      
      -- Generar transacciÃ³n
      v_transaction_id := generate_recurring_expense_transaction(v_expense.id);
      
      -- Retornar resultado exitoso
      expense_id := v_expense.id;
      transaction_id := v_transaction_id;
      expense_name := v_expense_name;
      amount := v_expense.amount;
      status := 'success';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Retornar resultado con error
      expense_id := v_expense.id;
      transaction_id := NULL;
      expense_name := v_expense_name;
      amount := v_expense.amount;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;


--
-- Name: FUNCTION process_due_recurring_expenses(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.process_due_recurring_expenses() IS 'Procesa todos los egresos recurrentes pendientes y genera transacciones automÃ¡ticamente (para ejecutar via cron)';


--
-- Name: profiles_search_vector_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.profiles_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'B');
  RETURN NEW;
END;
$$;


--
-- Name: project_future_expenses(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.project_future_expenses(p_business_id uuid, p_months integer DEFAULT 3) RETURNS TABLE(month_year text, projected_amount numeric, breakdown jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH monthly_recurring AS (
    SELECT 
      TO_CHAR(generate_series(
        CURRENT_DATE,
        CURRENT_DATE + (p_months || ' months')::interval,
        '1 month'::interval
      )::date, 'YYYY-MM') as month,
      SUM(
        CASE 
          WHEN recurrence_frequency = 'monthly' THEN amount
          WHEN recurrence_frequency = 'quarterly' THEN amount / 3
          WHEN recurrence_frequency = 'yearly' THEN amount / 12
          ELSE 0
        END
      ) as monthly_total,
      jsonb_object_agg(
        category::text, 
        SUM(
          CASE 
            WHEN recurrence_frequency = 'monthly' THEN amount
            WHEN recurrence_frequency = 'quarterly' THEN amount / 3
            WHEN recurrence_frequency = 'yearly' THEN amount / 12
            ELSE 0
          END
        )
      ) as breakdown_data
    FROM recurring_expenses
    CROSS JOIN generate_series(
      CURRENT_DATE,
      CURRENT_DATE + (p_months || ' months')::interval,
      '1 month'::interval
    ) AS month_series
    WHERE business_id = p_business_id
      AND is_active = true
      AND (end_date IS NULL OR end_date >= month_series::date)
    GROUP BY TO_CHAR(month_series::date, 'YYYY-MM')
  )
  SELECT 
    month,
    monthly_total,
    breakdown_data
  FROM monthly_recurring
  ORDER BY month;
END;
$$;


--
-- Name: FUNCTION project_future_expenses(p_business_id uuid, p_months integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.project_future_expenses(p_business_id uuid, p_months integer) IS 'Proyecta egresos futuros basÃ¡ndose en egresos recurrentes configurados';


--
-- Name: purge_old_logs(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.purge_old_logs(days_to_keep integer DEFAULT 90) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM error_logs
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO rows_deleted FROM deleted;

  DELETE FROM login_logs
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;

  RETURN rows_deleted;
END;
$$;


--
-- Name: FUNCTION purge_old_logs(days_to_keep integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.purge_old_logs(days_to_keep integer) IS 'Elimina logs anteriores a N dÃ­as (default 90) para cumplir GDPR';


--
-- Name: reactivate_user_account(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reactivate_user_account(user_id_param uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  -- Marcar perfil como activo
  UPDATE profiles
  SET 
    is_active = TRUE,
    deactivated_at = NULL
  WHERE id = user_id_param;

  -- Retornar resultado
  SELECT jsonb_build_object(
    'success', TRUE,
    'message', 'Cuenta reactivada exitosamente',
    'reactivated_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;


--
-- Name: refresh_appointments_with_relations(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_appointments_with_relations() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY appointments_with_relations;
  RETURN NULL;
END;
$$;


--
-- Name: FUNCTION refresh_appointments_with_relations(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.refresh_appointments_with_relations() IS 'Refresca la vista materializada appointments_with_relations de forma concurrente (no bloquea lecturas)';


--
-- Name: refresh_ratings_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_ratings_stats() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY business_ratings_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_ratings_stats;
END;
$$;


--
-- Name: refresh_resource_availability(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_resource_availability() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY resource_availability;
END;
$$;


--
-- Name: FUNCTION refresh_resource_availability(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.refresh_resource_availability() IS 'Refresca la vista materializada resource_availability. Llamar desde Edge Function cada 5 minutos.';


--
-- Name: refresh_user_active_permissions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_user_active_permissions() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Refresh CONCURRENTLY para no bloquear lecturas
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_active_permissions;
  
  RAISE NOTICE 'user_active_permissions refreshed at %', NOW();
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error refreshing user_active_permissions: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION refresh_user_active_permissions(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.refresh_user_active_permissions() IS 'Refresca materialized view de permisos CONCURRENTLY (sin bloquear lecturas).
Debe ser llamada cada 5 minutos vÃ­a cron job o Edge Function.';


--
-- Name: refresh_vacancy_selection_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_vacancy_selection_stats() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vacancy_selection_stats;
END;
$$;


--
-- Name: reject_employee_request(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reject_employee_request(request_id uuid, admin_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_business_id UUID;
  v_status TEXT;
BEGIN
  -- Get request details
  SELECT business_id, status 
  INTO v_business_id, v_status
  FROM employee_requests 
  WHERE id = request_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Check if already responded
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already responded');
  END IF;

  -- Check if admin owns the business
  IF NOT EXISTS(SELECT 1 FROM businesses WHERE id = v_business_id AND owner_id = admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update request status
  UPDATE employee_requests 
  SET 
    status = 'rejected',
    responded_at = NOW(),
    responded_by = admin_id
  WHERE id = request_id;

  RETURN jsonb_build_object('success', true, 'message', 'Employee request rejected');
END;
$$;


--
-- Name: reset_billing_test_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_billing_test_data() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Solo permitir en desarrollo
    IF current_setting('app.environment', true) != 'development' THEN
        RAISE EXCEPTION 'Cannot reset billing data in production environment';
    END IF;
    
    -- Eliminar datos de prueba
    DELETE FROM discount_code_uses WHERE business_id IN (
        SELECT id FROM businesses WHERE name LIKE '%Prueba%' OR name LIKE '%Test%'
    );
    
    DELETE FROM usage_metrics WHERE business_id IN (
        SELECT id FROM businesses WHERE name LIKE '%Prueba%' OR name LIKE '%Test%'
    );
    
    DELETE FROM subscription_events WHERE business_id IN (
        SELECT id FROM businesses WHERE name LIKE '%Prueba%' OR name LIKE '%Test%'
    );
    
    DELETE FROM subscription_payments WHERE business_id IN (
        SELECT id FROM businesses WHERE name LIKE '%Prueba%' OR name LIKE '%Test%'
    );
    
    DELETE FROM payment_methods WHERE business_id IN (
        SELECT id FROM businesses WHERE name LIKE '%Prueba%' OR name LIKE '%Test%'
    );
    
    DELETE FROM business_plans WHERE business_id IN (
        SELECT id FROM businesses WHERE name LIKE '%Prueba%' OR name LIKE '%Test%'
    );
    
    DELETE FROM billing_audit_log WHERE business_id IN (
        SELECT id FROM businesses WHERE name LIKE '%Prueba%' OR name LIKE '%Test%'
    );
    
    -- Reset cÃ³digos de descuento de dev
    UPDATE discount_codes
    SET current_uses = 0
    WHERE code IN ('DEVTEST', 'TRIAL60');
    
    RAISE NOTICE 'Billing test data reset successfully';
END;
$$;


--
-- Name: FUNCTION reset_billing_test_data(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.reset_billing_test_data() IS 'Limpia todos los datos de testing de billing (solo desarrollo)';


--
-- Name: revoke_user_permission(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.revoke_user_permission(p_business_id uuid, p_user_id uuid, p_permission text, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: safe_update_hierarchy_level(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.safe_update_hierarchy_level(p_user_id uuid, p_business_id uuid, p_new_level integer) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- ValidaciÃ³n de nivel
  IF p_new_level < 0 OR p_new_level > 4 THEN
    RETURN QUERY SELECT FALSE::boolean, 'Nivel invÃ¡lido: ' || p_new_level || '. Debe estar entre 0 y 4.'::text;
    RETURN;
  END IF;

  -- Validar que el usuario es propietario del negocio
  IF NOT EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id AND owner_id = auth.uid()
  ) THEN
    RETURN QUERY SELECT FALSE::boolean, 'No autorizado para actualizar este negocio'::text;
    RETURN;
  END IF;

  -- Validar que el registro existe
  IF NOT EXISTS (
    SELECT 1 FROM business_roles 
    WHERE user_id = p_user_id AND business_id = p_business_id
  ) THEN
    RETURN QUERY SELECT FALSE::boolean, 'Empleado no encontrado en este negocio'::text;
    RETURN;
  END IF;

  -- UPDATE
  UPDATE business_roles
  SET hierarchy_level = p_new_level,
      updated_at = now()
  WHERE user_id = p_user_id AND business_id = p_business_id;

  RETURN QUERY SELECT TRUE::boolean, 'Nivel jerÃ¡rquico actualizado exitosamente'::text;
END;
$$;


--
-- Name: search_businesses(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_businesses(search_query text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0) RETURNS TABLE(id uuid, name text, description text, logo_url text, category_id uuid, average_rating numeric, review_count bigint, rank real)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo_url,
    b.category_id,
    COALESCE(brs.average_rating, 0) as average_rating,
    COALESCE(brs.review_count, 0) as review_count,
    ts_rank(b.search_vector, plainto_tsquery('spanish', search_query)) as rank
  FROM businesses b
  LEFT JOIN business_ratings_stats brs ON b.id = brs.business_id
  WHERE 
    b.is_active = true
    AND (
      b.search_vector @@ plainto_tsquery('spanish', search_query)
      OR b.name ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, average_rating DESC, review_count DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;


--
-- Name: FUNCTION search_businesses(search_query text, limit_count integer, offset_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.search_businesses(search_query text, limit_count integer, offset_count integer) IS 'BÃºsqueda full-text optimizada de negocios con ranking por relevancia y rating.';


--
-- Name: search_messages(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_messages(p_conversation_id uuid, p_query text, p_limit integer DEFAULT 50) RETURNS TABLE(message_id uuid, sender_id uuid, sender_name text, sender_avatar text, body text, type public.message_type, created_at timestamp with time zone, rank real)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.sender_id,
    p.full_name AS sender_name,
    p.avatar_url AS sender_avatar,
    m.body,
    m.type,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('spanish', p_query)) AS rank
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  WHERE m.conversation_id = p_conversation_id
    AND m.is_deleted = FALSE
    AND m.search_vector @@ websearch_to_tsquery('spanish', p_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$;


--
-- Name: search_professionals(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_professionals(search_query text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0) RETURNS TABLE(id uuid, full_name text, bio text, avatar_url text, average_rating numeric, review_count bigint, rank real)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.id)
    p.id,
    p.full_name,
    ''::text as bio,
    p.avatar_url,
    COALESCE(ers.average_rating, 0::numeric),
    COALESCE(ers.review_count, 0::bigint),
    ts_rank(p.search_vector, plainto_tsquery('spanish', search_query))
  FROM profiles p
  INNER JOIN business_employees be ON be.employee_id = p.id 
    AND be.is_active = true AND be.status = 'approved'
  LEFT JOIN employee_ratings_stats ers ON p.id = ers.employee_id
  WHERE p.search_vector @@ plainto_tsquery('spanish', search_query)
     OR p.full_name ILIKE '%' || search_query || '%'
  ORDER BY p.id, ts_rank(p.search_vector, plainto_tsquery('spanish', search_query)) DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;


--
-- Name: FUNCTION search_professionals(search_query text, limit_count integer, offset_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.search_professionals(search_query text, limit_count integer, offset_count integer) IS 'BÃºsqueda full-text optimizada de profesionales con ratings agregados.';


--
-- Name: search_services(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_services(search_query text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0) RETURNS TABLE(id uuid, name text, description text, price numeric, duration_minutes integer, business_id uuid, business_name text, average_rating numeric, rank real)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.price,
    s.duration_minutes,
    s.business_id,
    b.name as business_name,
    COALESCE(brs.average_rating, 0) as average_rating,
    ts_rank(s.search_vector, plainto_tsquery('spanish', search_query)) as rank
  FROM services s
  INNER JOIN businesses b ON s.business_id = b.id
  LEFT JOIN business_ratings_stats brs ON b.id = brs.business_id
  WHERE 
    s.is_active = true
    AND b.is_active = true
    AND (
      s.search_vector @@ plainto_tsquery('spanish', search_query)
      OR s.name ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, average_rating DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;


--
-- Name: FUNCTION search_services(search_query text, limit_count integer, offset_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.search_services(search_query text, limit_count integer, offset_count integer) IS 'BÃºsqueda full-text optimizada de servicios con informaciÃ³n del negocio.';


--
-- Name: send_message(uuid, uuid, text, text, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.send_message(p_conversation_id uuid, p_sender_id uuid, p_content text, p_type text DEFAULT 'text'::text, p_attachments jsonb DEFAULT NULL::jsonb, p_reply_to_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insertar mensaje
  INSERT INTO chat_messages (
    conversation_id,
    sender_id,
    content,
    type,
    attachments,
    reply_to_id
  )
  VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_type,
    p_attachments,
    p_reply_to_id
  )
  RETURNING id INTO v_message_id;

  -- Actualizar Ãºltima mensaje en conversaciÃ³n
  UPDATE chat_conversations
  SET 
    last_message_at = now(),
    last_message_preview = CASE 
      WHEN p_type = 'text' THEN left(p_content, 100)
      WHEN p_type = 'image' THEN 'ðŸ“· Imagen'
      WHEN p_type = 'file' THEN 'ðŸ“Ž Archivo'
      ELSE 'ðŸ’¬ Mensaje'
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Incrementar contador de no leÃ­dos para otros participantes
  UPDATE chat_participants
  SET 
    unread_count = unread_count + 1,
    updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id
    AND left_at IS NULL;

  RETURN v_message_id;
END;
$$;


--
-- Name: services_search_vector_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.services_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$;


--
-- Name: set_appointment_completed_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_appointment_completed_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Set completed_at when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- Clear completed_at if status changes from 'completed' to something else
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: set_appointment_confirmation_deadline(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_appointment_confirmation_deadline(p_appointment_id uuid, p_hours integer DEFAULT 24) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a token (UUID v4)
  -- Prefer pgcrypto over uuid-ossp
  v_token := gen_random_uuid()::text;

  UPDATE public.appointments
  SET confirmation_token = v_token,
      confirmation_deadline = NOW() + make_interval(hours => p_hours)
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment % not found', p_appointment_id;
  END IF;

  RETURN v_token;
END;
$$;


--
-- Name: set_fiscal_period(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_fiscal_period() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fiscal_period := TO_CHAR(NEW.transaction_date, 'YYYY-MM');
    RETURN NEW;
END;
$$;


--
-- Name: sync_business_roles_from_business_employees(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_business_roles_from_business_employees() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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
    -- â† FIX: Solo actualizar si algo realmente cambiÃ³, evitando updates redundantes
    -- que reactivan trg_auto_insert_admin_as_employee innecesariamente.
    UPDATE business_roles
    SET
      is_active      = NEW.is_active,
      role           = v_target_role,
      hierarchy_level = v_target_level,
      updated_at     = NOW()
    WHERE id = v_existing_record.id;
  END IF;
  -- Si los valores son iguales no se hace nada â†’ no dispara otros triggers

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION sync_business_roles_from_business_employees(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_business_roles_from_business_employees() IS 'Trigger function: Mantiene sincronizado business_roles con business_employees.
Manager â†’ Admin (hierarchy_level=1), Employee â†’ Employee (hierarchy_level=4).
FIX (H-010/H-035): Solo realiza UPDATE cuando los valores cambian para evitar cascade infinito.';


--
-- Name: toggle_business_favorite(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.toggle_business_favorite(p_business_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM business_favorites
    WHERE user_id = v_user_id AND business_id = p_business_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM business_favorites
    WHERE user_id = v_user_id AND business_id = p_business_id;
    RETURN FALSE;
  ELSE
    INSERT INTO business_favorites (user_id, business_id)
    VALUES (v_user_id, p_business_id);
    RETURN TRUE;
  END IF;
END;
$$;


--
-- Name: track_first_client(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_first_client() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update first_client_at if this is the first client appointment
  UPDATE businesses 
  SET first_client_at = NOW() 
  WHERE id = NEW.business_id 
    AND first_client_at IS NULL
    AND NEW.status IN ('confirmed', 'completed');
  
  RETURN NEW;
END;
$$;


--
-- Name: trigger_notify_business_unconfigured(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_notify_business_unconfigured() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Solo procesar notificaciones de tipo business_unconfigured
  IF NEW.type != 'business_unconfigured' THEN
    RETURN NEW;
  END IF;

  -- Obtener URL de Supabase desde configuraciÃ³n
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  
  -- Si no hay URL configurada, usar valor por defecto (development)
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'http://localhost:54321';
  END IF;

  -- Usar pg_cron o pg_net para llamar a la Edge Function
  -- Nota: Esto requiere extensiÃ³n pg_net instalada en Supabase
  -- Por ahora, la Edge Function serÃ¡ llamada manualmente o via webhook HTTP
  
  -- Alternativa: Insertar en tabla de queue para procesamiento asÃ­ncrono
  -- INSERT INTO notification_queue (notification_id, function_name, payload, created_at)
  -- VALUES (NEW.id, 'notify-business-unconfigured', row_to_json(NEW), NOW());

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION trigger_notify_business_unconfigured(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.trigger_notify_business_unconfigured() IS 'Trigger que se ejecuta cuando se crea una notificaciÃ³n in-app de tipo business_unconfigured.
DeberÃ­a invocar la Edge Function notify-business-unconfigured para enviar email al owner.';


--
-- Name: trigger_refresh_ratings_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_refresh_ratings_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Llamar a la funciÃ³n de refresco de forma asÃ­ncrona (pg_background)
  -- Por ahora, simplemente marcar que se necesita refresco
  -- En producciÃ³n, usar un cron job o pg_cron
  PERFORM refresh_ratings_stats();
  RETURN NEW;
END;
$$;


--
-- Name: trigger_set_confirmation_deadline(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_set_confirmation_deadline() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only set for new appointments in 'pending' status
    IF NEW.status = 'pending' AND OLD IS NULL THEN
        PERFORM set_appointment_confirmation_deadline(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: trigger_update_business_config_on_employee_service(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_update_business_config_on_employee_service() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Obtener business_id desde el servicio
  IF TG_OP = 'DELETE' THEN
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = OLD.service_id;
  ELSE
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = NEW.service_id;
  END IF;

  IF v_business_id IS NOT NULL THEN
    PERFORM public.update_business_configuration(v_business_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


--
-- Name: trigger_update_business_config_on_employee_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_update_business_config_on_employee_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    PERFORM public.update_business_configuration(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trigger_update_business_config_on_location(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_update_business_config_on_location() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_business_configuration(OLD.business_id);
    RETURN OLD;
  ELSE
    PERFORM public.update_business_configuration(NEW.business_id);
    RETURN NEW;
  END IF;
END;
$$;


--
-- Name: trigger_update_business_config_on_location_service(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_update_business_config_on_location_service() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_business_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT business_id INTO v_business_id
    FROM public.locations
    WHERE id = OLD.location_id;
  ELSE
    SELECT business_id INTO v_business_id
    FROM public.locations
    WHERE id = NEW.location_id;
  END IF;

  IF v_business_id IS NOT NULL THEN
    PERFORM public.update_business_configuration(v_business_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


--
-- Name: trigger_update_business_config_on_resource_service(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_update_business_config_on_resource_service() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Obtener business_id desde el servicio
  IF TG_OP = 'DELETE' THEN
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = OLD.service_id;
  ELSE
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = NEW.service_id;
  END IF;

  IF v_business_id IS NOT NULL THEN
    PERFORM public.update_business_configuration(v_business_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


--
-- Name: trigger_update_business_config_on_resource_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_update_business_config_on_resource_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    PERFORM public.update_business_configuration(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_bug_reports_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_bug_reports_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_business_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_activity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE businesses 
  SET last_activity_at = NOW() 
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_business_appointment_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_appointment_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        UPDATE businesses
        SET total_appointments = total_appointments + 1
        WHERE id = NEW.business_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_business_closed_days_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_closed_days_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_business_configuration(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_configuration(p_business_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_is_configured BOOLEAN;
  v_old_configured BOOLEAN;
  v_owner_id UUID;
BEGIN
  -- Obtener estado anterior y owner
  SELECT is_configured, owner_id INTO v_old_configured, v_owner_id
  FROM public.businesses
  WHERE id = p_business_id;

  -- Calcular nueva configuraciÃ³n
  v_is_configured := public.validate_business_configuration(p_business_id);

  -- Actualizar solo si cambiÃ³ el estado
  IF v_is_configured != v_old_configured THEN
    UPDATE public.businesses
    SET is_configured = v_is_configured,
        updated_at = NOW()
    WHERE id = p_business_id;

    -- Si cambiÃ³ de TRUE â†’ FALSE, crear notificaciÃ³n in-app
    IF v_old_configured = true AND v_is_configured = false THEN
      INSERT INTO public.in_app_notifications (
        user_id,
        type,
        title,
        message,
        data,
        business_id,
        status,
        created_at
      ) VALUES (
        v_owner_id,
        'business_unconfigured',
        'Negocio no disponible al pÃºblico',
        'Tu negocio ya no estÃ¡ visible para clientes porque faltan configuraciones requeridas (sedes activas, servicios o empleados/recursos asignados).',
        jsonb_build_object('business_id', p_business_id),
        p_business_id,
        'unread',
        NOW()
      );
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION update_business_configuration(p_business_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_business_configuration(p_business_id uuid) IS 'Recalcula y actualiza el campo is_configured de un negocio.
Si cambia de TRUE â†’ FALSE, crea notificaciÃ³n in-app para el owner.';


--
-- Name: update_business_notification_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_notification_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_business_resources_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_resources_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_business_review_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_business_review_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE businesses
    SET 
        total_reviews = (
            SELECT COUNT(*) FROM reviews 
            WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
            AND is_visible = TRUE
        ),
        average_rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM reviews 
            WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
            AND is_visible = TRUE
        ), 0)
    WHERE id = COALESCE(NEW.business_id, OLD.business_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_chat_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_chat_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_conversation_last_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_last_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = SUBSTRING(NEW.body FROM 1 FOR 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_conversation_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_discount_codes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_discount_codes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_employee_join_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_employee_join_requests_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_employee_profile_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_employee_profile_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_hierarchy_level_v4(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_hierarchy_level_v4(uuid, uuid, integer) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_user_id alias for $1;
  v_business_id alias for $2;
  v_new_level alias for $3;
BEGIN
  -- Validaciones
  IF v_new_level < 0 OR v_new_level > 4 THEN
    RETURN QUERY SELECT FALSE, 'Nivel invÃ¡lido: ' || v_new_level::text;
    RETURN;
  END IF;
  
  -- Verificar si existe
  IF NOT EXISTS(
    SELECT 1 FROM business_roles 
    WHERE user_id = v_user_id AND business_id = v_business_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Empleado no encontrado en negocio';
    RETURN;
  END IF;
  
  -- Actualizar
  UPDATE business_roles
  SET hierarchy_level = v_new_level, updated_at = NOW()
  WHERE user_id = v_user_id AND business_id = v_business_id;
  
  RETURN QUERY SELECT TRUE, 'Nivel actualizado exitosamente a ' || v_new_level::text;
END;
$_$;


--
-- Name: update_job_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_job_applications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_job_vacancies_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_job_vacancies_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_location_expense_config_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_location_expense_config_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_message_delivery_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_message_delivery_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Si se marca un mensaje como leÃ­do (read_by actualizado)
  IF NEW.read_by IS DISTINCT FROM OLD.read_by THEN
    -- Contar cuÃ¡ntos miembros hay en la conversaciÃ³n (excluyendo sender)
    DECLARE
      total_members INTEGER;
      read_count INTEGER;
    BEGIN
      -- Total de miembros excluyendo sender
      SELECT COUNT(*) INTO total_members
      FROM conversation_members
      WHERE conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id;
      
      -- CuÃ¡ntos han leÃ­do
      read_count := jsonb_array_length(NEW.read_by);
      
      -- Actualizar estado segÃºn lecturas
      IF read_count >= total_members THEN
        NEW.delivery_status := 'read';
      ELSIF read_count > 0 THEN
        NEW.delivery_status := 'delivered';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION update_message_delivery_status(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_message_delivery_status() IS 'Actualiza delivery_status basÃ¡ndose en read_by array';


--
-- Name: update_message_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_message_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.body, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.metadata->>'file_name', '')), 'B');
  RETURN NEW;
END;
$$;


--
-- Name: update_payment_methods_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payment_methods_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_payroll_config_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payroll_config_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_payroll_payments_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payroll_payments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_public_holidays_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_public_holidays_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: update_recurring_expenses_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_recurring_expenses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_subscription_payments_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_subscription_payments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_typing_indicator(uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_typing_indicator(p_conversation_id uuid, p_user_id uuid, p_is_typing boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Usuario no es participante de la conversaciÃ³n';
  END IF;
  
  IF p_is_typing THEN
    INSERT INTO chat_typing_indicators (conversation_id, user_id)
    VALUES (p_conversation_id, p_user_id)
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET
      started_at = NOW(),
      expires_at = NOW() + INTERVAL '10 seconds';
  ELSE
    DELETE FROM chat_typing_indicators
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id;
  END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_notification_preferences_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_notification_preferences_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_vacation_balance_on_absence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_vacation_balance_on_absence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_days INTEGER;
  v_year INTEGER;
BEGIN
  IF NEW.absence_type != 'vacation' THEN
    RETURN NEW;
  END IF;
  
  v_days := calculate_absence_days(NEW.start_date, NEW.end_date);
  v_year := EXTRACT(YEAR FROM NEW.start_date);
  
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO vacation_balance (business_id, employee_id, year, total_days_available, days_used)
    VALUES (NEW.business_id, NEW.employee_id, v_year, 0, v_days)
    ON CONFLICT (business_id, employee_id, year)
    DO UPDATE SET 
      days_used = vacation_balance.days_used + v_days,
      updated_at = NOW();
      
  ELSIF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status NOT IN ('pending', 'approved')) THEN
    INSERT INTO vacation_balance (business_id, employee_id, year, total_days_available, days_pending)
    VALUES (NEW.business_id, NEW.employee_id, v_year, 0, v_days)
    ON CONFLICT (business_id, employee_id, year)
    DO UPDATE SET 
      days_pending = vacation_balance.days_pending + v_days,
      updated_at = NOW();
      
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    UPDATE vacation_balance
    SET days_pending = GREATEST(0, days_pending - v_days),
        updated_at = NOW()
    WHERE business_id = NEW.business_id
      AND employee_id = NEW.employee_id
      AND year = v_year;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_work_schedules_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_work_schedules_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: user_can_access_conversation_attachments(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can_access_conversation_attachments(object_path text, user_id_param uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $_$
DECLARE
  path_parts text[];
  conv_id text;
BEGIN
  -- Extraer conversation_id del path
  -- Formato: {conversation_id}/{message_id}/{filename}
  path_parts := string_to_array(object_path, '/');
  
  IF array_length(path_parts, 1) < 1 THEN
    RETURN false;
  END IF;
  
  conv_id := path_parts[1];
  
  -- Validar que sea UUID
  IF conv_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  
  -- Verificar sin disparar RLS (SECURITY DEFINER)
  RETURN EXISTS (
    SELECT 1
    FROM chat_participants cp
    WHERE cp.conversation_id = conv_id::uuid
      AND cp.user_id = user_id_param
      AND cp.left_at IS NULL
  );
END;
$_$;


--
-- Name: user_has_hierarchy_permission(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_hierarchy_permission(p_business_id uuid, p_permission_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = p_business_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE business_id = p_business_id
        AND user_id = auth.uid()
        AND permission = p_permission_name
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
END;
$$;


--
-- Name: user_is_in_conversation(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_is_in_conversation(conv_id uuid, user_id_param uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar si el usuario es participante de la conversaciÃ³n
  -- Sin usar RLS policies (SECURITY DEFINER ejecuta con privilegios del creador)
  RETURN EXISTS (
    SELECT 1 
    FROM chat_participants
    WHERE conversation_id = conv_id
      AND user_id = user_id_param
      AND left_at IS NULL
  );
END;
$$;


--
-- Name: validate_application_status_transition(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_application_status_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- No permitir cambiar de rejected/accepted a in_selection_process
  IF OLD.status IN ('rejected', 'accepted', 'withdrawn') 
     AND NEW.status = 'in_selection_process' THEN
    RAISE EXCEPTION 'No se puede iniciar proceso de selecciÃ³n con candidato en estado %', OLD.status;
  END IF;
  
  -- Si cambia a in_selection_process, asegurar que se llenen los campos de tracking
  IF NEW.status = 'in_selection_process' AND OLD.status != 'in_selection_process' THEN
    IF NEW.selection_started_at IS NULL THEN
      NEW.selection_started_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_business_configuration(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_business_configuration(p_business_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_resource_model TEXT;
  v_has_active_locations BOOLEAN;
  v_has_services_in_locations BOOLEAN;
  v_has_assignees BOOLEAN;
BEGIN
  -- Obtener modelo de negocio
  SELECT resource_model INTO v_resource_model
  FROM public.businesses
  WHERE id = p_business_id;

  IF v_resource_model IS NULL THEN
    RETURN false; -- Negocio no existe
  END IF;

  -- VALIDACIÃ“N 1: Tiene al menos 1 sede activa
  SELECT EXISTS(
    SELECT 1 FROM public.locations
    WHERE business_id = p_business_id
    AND is_active = true
    LIMIT 1
  ) INTO v_has_active_locations;

  IF NOT v_has_active_locations THEN
    RETURN false;
  END IF;

  -- VALIDACIÃ“N 2: Las sedes activas tienen servicios asociados
  SELECT EXISTS(
    SELECT 1 
    FROM public.locations l
    INNER JOIN public.location_services ls ON ls.location_id = l.id
    WHERE l.business_id = p_business_id
    AND l.is_active = true
    LIMIT 1
  ) INTO v_has_services_in_locations;

  IF NOT v_has_services_in_locations THEN
    RETURN false;
  END IF;

  -- VALIDACIÃ“N 3: Los servicios tienen empleados o recursos asignados
  -- Depende del resource_model del negocio
  CASE v_resource_model
    WHEN 'professional' THEN
      -- Requiere empleados asignados a servicios
      SELECT EXISTS(
        SELECT 1
        FROM public.locations l
        INNER JOIN public.location_services ls ON ls.location_id = l.id
        INNER JOIN public.employee_services es ON es.service_id = ls.service_id
        INNER JOIN public.business_employees be ON be.employee_id = es.employee_id
        WHERE l.business_id = p_business_id
        AND l.is_active = true
        AND be.is_active = true
        LIMIT 1
      ) INTO v_has_assignees;

    WHEN 'physical_resource' THEN
      -- Requiere recursos fÃ­sicos asignados a servicios
      SELECT EXISTS(
        SELECT 1
        FROM public.locations l
        INNER JOIN public.location_services ls ON ls.location_id = l.id
        INNER JOIN public.resource_services rs ON rs.service_id = ls.service_id
        INNER JOIN public.business_resources br ON br.id = rs.resource_id
        WHERE l.business_id = p_business_id
        AND l.is_active = true
        AND br.is_active = true
        LIMIT 1
      ) INTO v_has_assignees;

    WHEN 'hybrid' THEN
      -- Requiere al menos 1 empleado O 1 recurso fÃ­sico
      SELECT (
        EXISTS(
          SELECT 1
          FROM public.locations l
          INNER JOIN public.location_services ls ON ls.location_id = l.id
          INNER JOIN public.employee_services es ON es.service_id = ls.service_id
          INNER JOIN public.business_employees be ON be.employee_id = es.employee_id
          WHERE l.business_id = p_business_id
          AND l.is_active = true
          AND be.is_active = true
          LIMIT 1
        )
        OR
        EXISTS(
          SELECT 1
          FROM public.locations l
          INNER JOIN public.location_services ls ON ls.location_id = l.id
          INNER JOIN public.resource_services rs ON rs.service_id = ls.service_id
          INNER JOIN public.business_resources br ON br.id = rs.resource_id
          WHERE l.business_id = p_business_id
          AND l.is_active = true
          AND br.is_active = true
          LIMIT 1
        )
      ) INTO v_has_assignees;

    WHEN 'group_class' THEN
      -- Clases grupales no requieren empleados/recursos especÃ­ficos
      -- Solo necesita sedes activas + servicios
      v_has_assignees := true;

    ELSE
      v_has_assignees := false;
  END CASE;

  RETURN v_has_assignees;
END;
$$;


--
-- Name: FUNCTION validate_business_configuration(p_business_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_business_configuration(p_business_id uuid) IS 'Valida si un negocio estÃ¡ completamente configurado para operar pÃºblicamente.
Retorna TRUE si tiene sedes activas, servicios en sedes, y empleados/recursos asignados segÃºn su resource_model.';


--
-- Name: validate_direct_conversation_members(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_direct_conversation_members() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  member_count INT;
  conv_type conversation_type;
BEGIN
  SELECT type INTO conv_type
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  IF conv_type = 'direct' THEN
    SELECT COUNT(*) INTO member_count
    FROM public.conversation_members
    WHERE conversation_id = NEW.conversation_id;
    
    IF member_count >= 2 THEN
      RAISE EXCEPTION 'Las conversaciones directas solo pueden tener 2 miembros';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_employee_service_location(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_employee_service_location() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar que el servicio estÃ© disponible en la sede
    IF NOT EXISTS (
        SELECT 1 FROM location_services 
        WHERE location_id = NEW.location_id 
        AND service_id = NEW.service_id 
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Service is not available at this location';
    END IF;
    
    -- Verificar que el empleado estÃ© asignado al negocio y sede
    IF NOT EXISTS (
        SELECT 1 FROM business_employees
        WHERE employee_id = NEW.employee_id
        AND business_id = NEW.business_id
        AND (location_id = NEW.location_id OR location_id IS NULL)
        AND status = 'approved'
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Employee is not assigned to this business/location';
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: validate_hierarchy_no_cycles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_hierarchy_no_cycles() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_current_id UUID;
  v_depth INTEGER := 0;
  v_max_depth INTEGER := 10;
BEGIN
  IF NEW.reports_to IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM business_roles
    WHERE user_id = NEW.reports_to
      AND business_id = NEW.business_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'El supervisor debe ser un usuario activo del mismo negocio';
  END IF;

  IF NEW.user_id = NEW.reports_to THEN
    RAISE EXCEPTION 'Un empleado no puede reportar a sÃ­ mismo';
  END IF;

  v_current_id := NEW.reports_to;
  
  WHILE v_current_id IS NOT NULL AND v_depth < v_max_depth LOOP
    IF v_current_id = NEW.user_id THEN
      RAISE EXCEPTION 'Se detectÃ³ un ciclo en la jerarquÃ­a';
    END IF;

    SELECT reports_to INTO v_current_id
    FROM business_roles
    WHERE user_id = v_current_id
      AND business_id = NEW.business_id
      AND is_active = true;

    v_depth := v_depth + 1;
  END LOOP;

  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'La jerarquÃ­a excede la profundidad mÃ¡xima permitida';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: validate_plan_limits(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_plan_limits(p_business_id uuid, p_resource text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
    v_plan business_plans%ROWTYPE;
    v_current_count INTEGER;
    v_limit INTEGER;
    v_can_create BOOLEAN;
    v_message TEXT;
BEGIN
    -- Verificar permisos
    IF NOT is_business_admin(p_business_id) THEN
        RAISE EXCEPTION 'Unauthorized: User is not admin of this business';
    END IF;
    
    -- Obtener plan actual
    SELECT * INTO v_plan
    FROM business_plans
    WHERE business_id = p_business_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        v_can_create := false;
        v_message := 'No active plan found for this business';
    ELSE
        -- Obtener conteo actual segÃºn el tipo de recurso
        CASE p_resource
            WHEN 'location' THEN
                SELECT COUNT(*) INTO v_current_count
                FROM locations
                WHERE business_id = p_business_id AND is_active = true;
                
            WHEN 'employee' THEN
                SELECT COUNT(*) INTO v_current_count
                FROM business_employees
                WHERE business_id = p_business_id AND is_active = true;
                
            WHEN 'appointment' THEN
                SELECT COUNT(*) INTO v_current_count
                FROM appointments
                WHERE business_id = p_business_id 
                AND start_time >= CURRENT_DATE - INTERVAL '30 days';
                
            WHEN 'client' THEN
                SELECT COUNT(DISTINCT client_id) INTO v_current_count
                FROM appointments
                WHERE business_id = p_business_id;
                
            WHEN 'service' THEN
                SELECT COUNT(*) INTO v_current_count
                FROM services
                WHERE business_id = p_business_id AND is_active = true;
                
            ELSE
                RAISE EXCEPTION 'Invalid resource type: %', p_resource;
        END CASE;
        
        -- Placeholder: lÃ­mites hardcodeados segÃºn plan_type
        -- TODO: Mover a columna limits en business_plans
        v_limit := CASE v_plan.plan_type
            WHEN 'inicio' THEN 
                CASE p_resource
                    WHEN 'location' THEN 1
                    WHEN 'employee' THEN 3
                    WHEN 'appointment' THEN 100
                    WHEN 'client' THEN 50
                    WHEN 'service' THEN 10
                    ELSE 0
                END
            WHEN 'profesional' THEN
                CASE p_resource
                    WHEN 'location' THEN 3
                    WHEN 'employee' THEN 10
                    WHEN 'appointment' THEN 500
                    WHEN 'client' THEN 200
                    WHEN 'service' THEN 50
                    ELSE 0
                END
            WHEN 'empresarial' THEN
                CASE p_resource
                    WHEN 'location' THEN 10
                    WHEN 'employee' THEN 50
                    WHEN 'appointment' THEN 2000
                    WHEN 'client' THEN 1000
                    WHEN 'service' THEN 200
                    ELSE 0
                END
            ELSE -- corporativo
                999999 -- unlimited
        END;
        
        v_can_create := v_current_count < v_limit;
        v_message := CASE 
            WHEN v_can_create THEN 'OK'
            ELSE format('Limit reached: %s/%s %ss. Upgrade your plan to add more.', v_current_count, v_limit, p_resource)
        END;
    END IF;
    
    v_result := json_build_object(
        'can_create', v_can_create,
        'current_count', v_current_count,
        'limit', v_limit,
        'remaining', GREATEST(0, v_limit - v_current_count),
        'message', v_message,
        'plan_type', v_plan.plan_type
    );
    
    RETURN v_result;
END;
$$;


--
-- Name: FUNCTION validate_plan_limits(p_business_id uuid, p_resource text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_plan_limits(p_business_id uuid, p_resource text) IS 'Verifica si un negocio puede crear un nuevo recurso dado su plan actual';


--
-- Name: verify_review_on_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_review_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Auto-verificar si la cita fue completada
    NEW.is_verified := EXISTS (
        SELECT 1 FROM appointments 
        WHERE id = NEW.appointment_id 
        AND status = 'completed'
    );
    
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: absence_approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absence_approval_requests (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    absence_id uuid NOT NULL,
    business_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    assigned_to uuid,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    decision character varying(20),
    decision_notes text,
    created_at timestamp with time zone DEFAULT now(),
    notified_at timestamp with time zone,
    CONSTRAINT absence_approval_requests_decision_check CHECK (((decision)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT absence_approval_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'escalated'::character varying])::text[])))
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    service_id uuid NOT NULL,
    client_id uuid NOT NULL,
    employee_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status NOT NULL,
    notes text,
    client_notes text,
    price numeric(10,2),
    currency text DEFAULT 'MXN'::text,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    reminder_sent boolean DEFAULT false NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by uuid,
    cancel_reason text,
    is_location_exception boolean DEFAULT false NOT NULL,
    original_location_id uuid,
    resource_id uuid,
    confirmed boolean DEFAULT false,
    confirmation_sent_at timestamp with time zone,
    confirmation_deadline timestamp with time zone,
    confirmation_token text,
    auto_no_show_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    gross_amount numeric(12,2),
    commission_amount numeric(12,2),
    net_amount numeric(12,2),
    other_deductions numeric(12,2) DEFAULT 0,
    completed_at timestamp with time zone,
    CONSTRAINT appointments_check CHECK ((end_time > start_time)),
    CONSTRAINT check_appointment_has_assignee CHECK (((employee_id IS NOT NULL) OR (resource_id IS NOT NULL)))
);


--
-- Name: COLUMN appointments.is_location_exception; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.is_location_exception IS 'TRUE si el empleado trabaja en una sede diferente a su asignada por defecto';


--
-- Name: COLUMN appointments.original_location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.original_location_id IS 'Sede original del empleado si is_location_exception = TRUE';


--
-- Name: COLUMN appointments.resource_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.resource_id IS 'ID del recurso fÃ­sico asignado (habitaciÃ³n, mesa, cancha). Exclusivo con employee_id en modelos no hÃ­bridos.';


--
-- Name: COLUMN appointments.gross_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.gross_amount IS 'Monto bruto del servicio antes de deducciones';


--
-- Name: COLUMN appointments.commission_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.commission_amount IS 'ComisiÃ³n del empleado calculada segÃºn commission_percentage del servicio';


--
-- Name: COLUMN appointments.net_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.net_amount IS 'Monto neto que recibe el negocio (gross_amount - commission_amount - other_deductions)';


--
-- Name: COLUMN appointments.other_deductions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.other_deductions IS 'Otras deducciones adicionales (impuestos adicionales, descuentos, etc.)';


--
-- Name: COLUMN appointments.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.completed_at IS 'Timestamp when the appointment was marked as completed';


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.businesses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    phone text,
    email text,
    address text,
    city text,
    state text,
    country text,
    postal_code text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    logo_url text,
    website text,
    business_hours jsonb DEFAULT '{}'::jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    average_rating numeric(3,2) DEFAULT 0 NOT NULL,
    total_appointments integer DEFAULT 0 NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    invitation_code character varying(6),
    last_activity_at timestamp with time zone DEFAULT now(),
    first_client_at timestamp with time zone,
    category public.business_category DEFAULT 'other'::public.business_category,
    legal_entity_type public.legal_entity_type DEFAULT 'individual'::public.legal_entity_type,
    tax_id character varying(50),
    legal_name text,
    registration_number character varying(100),
    category_id uuid,
    search_vector tsvector,
    tax_regime public.tax_regime DEFAULT 'common'::public.tax_regime,
    fiscal_responsibilities jsonb DEFAULT '{"ica": false, "iva": true, "retention": false}'::jsonb,
    banner_url text,
    slug text NOT NULL,
    meta_title text,
    meta_description text,
    meta_keywords text[],
    og_image_url text,
    is_public boolean DEFAULT true,
    vacation_days_per_year integer DEFAULT 15,
    allow_same_day_absence boolean DEFAULT true,
    require_absence_approval boolean DEFAULT true,
    max_advance_vacation_request_days integer DEFAULT 90,
    resource_model public.resource_model DEFAULT 'professional'::public.resource_model NOT NULL,
    region_id uuid,
    city_id uuid,
    country_id uuid,
    is_configured boolean DEFAULT false NOT NULL,
    work_on_holidays boolean DEFAULT false NOT NULL,
    CONSTRAINT businesses_average_rating_check CHECK (((average_rating >= (0)::numeric) AND (average_rating <= (5)::numeric)))
);


--
-- Name: COLUMN businesses.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.is_active IS 'Whether business is active (auto-deactivated after 30 days of inactivity)';


--
-- Name: COLUMN businesses.total_reviews; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.total_reviews IS 'Cache: Total de reviews visibles (actualizado por trigger)';


--
-- Name: COLUMN businesses.average_rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.average_rating IS 'Cache: Promedio de calificaciones (actualizado por trigger)';


--
-- Name: COLUMN businesses.total_appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.total_appointments IS 'Cache: Total de citas completadas (actualizado por trigger)';


--
-- Name: COLUMN businesses.total_revenue; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.total_revenue IS 'Cache: Ingresos totales histÃ³ricos (actualizado por trigger)';


--
-- Name: COLUMN businesses.invitation_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.invitation_code IS 'Unique 6-character code for employees to join';


--
-- Name: COLUMN businesses.last_activity_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.last_activity_at IS 'Last time business had any activity (for 30-day inactivity rule)';


--
-- Name: COLUMN businesses.first_client_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.first_client_at IS 'When business got its first client (for 1-year deletion rule)';


--
-- Name: COLUMN businesses.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.category IS 'Business category/industry';


--
-- Name: COLUMN businesses.legal_entity_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.legal_entity_type IS 'Company (registered business) or Individual (independent professional)';


--
-- Name: COLUMN businesses.tax_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.tax_id IS 'Tax identification number (NIT for companies, CÃ©dula for individuals in Colombia)';


--
-- Name: COLUMN businesses.legal_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.legal_name IS 'Legal registered name (RazÃ³n social for companies, full name for individuals)';


--
-- Name: COLUMN businesses.registration_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.registration_number IS 'Commercial registry number (Registro mercantil)';


--
-- Name: COLUMN businesses.category_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.category_id IS 'CategorÃ­a principal del negocio (referencia a business_categories)';


--
-- Name: COLUMN businesses.resource_model; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.resource_model IS 'Tipo de recurso que ofrece el negocio: professional (empleados), physical_resource (habitaciones/mesas), hybrid (ambos), group_class (clases grupales)';


--
-- Name: COLUMN businesses.region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.region_id IS 'UUID de la regiÃ³n/departamento (FK a regions table)';


--
-- Name: COLUMN businesses.city_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.city_id IS 'UUID de la ciudad (FK a cities table)';


--
-- Name: COLUMN businesses.country_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.country_id IS 'UUID del paÃ­s (FK a countries table)';


--
-- Name: COLUMN businesses.is_configured; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.is_configured IS 'TRUE si el negocio estÃ¡ completamente configurado y puede brindar servicios pÃºblicamente. 
Requiere: â‰¥1 sede activa, â‰¥1 servicio en sede, â‰¥1 empleado o recurso asignado al servicio.';


--
-- Name: COLUMN businesses.work_on_holidays; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.work_on_holidays IS 'Si TRUE, el negocio atiende en festivos pÃºblicos. Las sedes pueden sobreescribir este valor.';


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text,
    country text NOT NULL,
    postal_code text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    phone text,
    is_active boolean DEFAULT true NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    business_hours jsonb DEFAULT '{"friday": {"open": "09:00", "close": "18:00", "closed": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": true}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false}, "saturday": {"open": "09:00", "close": "14:00", "closed": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false}}'::jsonb,
    description text,
    google_maps_url text,
    dane_code character varying(10),
    ica_rate numeric(5,4) DEFAULT 0.00,
    ica_enabled boolean DEFAULT false,
    is_primary boolean DEFAULT false NOT NULL,
    email text,
    opens_at time without time zone,
    closes_at time without time zone,
    work_on_holidays boolean
);


--
-- Name: COLUMN locations.images; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.images IS 'Array of image URLs for this location (from Supabase Storage)';


--
-- Name: COLUMN locations.business_hours; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.business_hours IS 'Operating hours specific to this location';


--
-- Name: COLUMN locations.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.description IS 'Description of this specific location/branch';


--
-- Name: COLUMN locations.google_maps_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.google_maps_url IS 'URL de Google Maps para la ubicaciÃ³n de la sede';


--
-- Name: COLUMN locations.dane_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.dane_code IS 'CÃ³digo DANE del departamento-municipio para cÃ¡lculo de ICA';


--
-- Name: COLUMN locations.is_primary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.is_primary IS 'Indica si esta es la sede principal del negocio. Solo puede haber una sede principal por negocio.';


--
-- Name: COLUMN locations.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.email IS 'Email de contacto especÃ­fico de la sede';


--
-- Name: COLUMN locations.opens_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.opens_at IS 'Opening time for the location (default business hours)';


--
-- Name: COLUMN locations.closes_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.closes_at IS 'Closing time for the location (default business hours)';


--
-- Name: COLUMN locations.work_on_holidays; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.work_on_holidays IS 'Override por sede. NULL = hereda business.work_on_holidays. TRUE = abre en festivos. FALSE = cierra.';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    role public.user_role DEFAULT 'client'::public.user_role NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    search_vector tsvector,
    deactivated_at timestamp with time zone,
    phone_otp_code character varying(6),
    phone_otp_expires_at timestamp with time zone,
    phone_otp_attempts integer DEFAULT 0 NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    has_used_free_trial boolean DEFAULT false NOT NULL,
    free_trial_used_at timestamp with time zone,
    free_trial_business_id uuid
);


--
-- Name: COLUMN profiles.phone_otp_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.phone_otp_code IS 'CÃ³digo OTP de 6 dÃ­gitos para verificar el nÃºmero de telÃ©fono. Se elimina tras verificaciÃ³n exitosa.';


--
-- Name: COLUMN profiles.phone_otp_expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.phone_otp_expires_at IS 'Fecha/hora de expiraciÃ³n del OTP actual. Expira a los 10 minutos.';


--
-- Name: COLUMN profiles.phone_otp_attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.phone_otp_attempts IS 'NÃºmero de intentos fallidos del OTP actual. Se resetea al generar nuevo OTP o tras verificaciÃ³n.';


--
-- Name: COLUMN profiles.phone_verified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.phone_verified IS 'TRUE cuando el nÃºmero de telÃ©fono fue verificado por OTP SMS.';


--
-- Name: COLUMN profiles.has_used_free_trial; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.has_used_free_trial IS 'True once the user has activated their one-time free trial of Plan BÃ¡sico. Never reset to false.';


--
-- Name: COLUMN profiles.free_trial_used_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.free_trial_used_at IS 'Timestamp when the free trial was activated.';


--
-- Name: COLUMN profiles.free_trial_business_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.free_trial_business_id IS 'The business where the free trial was activated. SET NULL if the business is deleted.';


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    category text,
    is_active boolean DEFAULT true NOT NULL,
    search_vector tsvector,
    tax_type public.tax_type DEFAULT 'iva_19'::public.tax_type,
    product_code character varying(20),
    is_taxable boolean DEFAULT true,
    image_url text,
    commission_percentage numeric(5,2),
    CONSTRAINT services_commission_percentage_check CHECK (((commission_percentage >= (0)::numeric) AND (commission_percentage <= (100)::numeric))),
    CONSTRAINT services_duration_minutes_check CHECK ((duration_minutes > 0)),
    CONSTRAINT services_price_check CHECK ((price >= (0)::numeric))
);


--
-- Name: COLUMN services.tax_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.services.tax_type IS 'Tipo de impuesto aplicable a este servicio';


--
-- Name: COLUMN services.product_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.services.product_code IS 'CÃ³digo de producto/servicio segÃºn clasificaciÃ³n DIAN';


--
-- Name: COLUMN services.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.services.image_url IS 'URL pÃºblica de la imagen del servicio almacenada en el bucket service-images de Supabase Storage';


--
-- Name: COLUMN services.commission_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.services.commission_percentage IS 'Porcentaje de comisiÃ³n a nivel de servicio (0-100). Puede ser NULL para indicar que no aplica o que se usa comisiÃ³n por empleado)';


--
-- Name: appointment_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.appointment_details AS
 SELECT a.id,
    a.created_at,
    a.updated_at,
    a.business_id,
    a.location_id,
    a.service_id,
    a.client_id,
    a.employee_id,
    a.start_time,
    a.end_time,
    a.status,
    a.notes,
    a.client_notes,
    a.price,
    a.currency,
    a.payment_status,
    a.reminder_sent,
    a.cancelled_at,
    a.cancelled_by,
    a.cancel_reason,
    a.is_location_exception,
    a.original_location_id,
    a.resource_id,
    s.name AS service_name,
    s.duration_minutes,
    s.price AS service_price,
    c.full_name AS client_name,
    c.email AS client_email,
    c.phone AS client_phone,
    e.full_name AS employee_name,
    l.name AS location_name,
    l.address AS location_address,
    b.name AS business_name
   FROM (((((public.appointments a
     LEFT JOIN public.services s ON ((a.service_id = s.id)))
     LEFT JOIN public.profiles c ON ((a.client_id = c.id)))
     LEFT JOIN public.profiles e ON ((a.employee_id = e.id)))
     LEFT JOIN public.locations l ON ((a.location_id = l.id)))
     LEFT JOIN public.businesses b ON ((a.business_id = b.id)));


--
-- Name: appointments_with_relations; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.appointments_with_relations AS
 SELECT a.id,
    a.created_at,
    a.updated_at,
    a.business_id,
    a.location_id,
    a.service_id,
    a.client_id,
    a.employee_id,
    a.start_time,
    a.end_time,
    a.status,
    a.notes,
    a.client_notes,
    a.price,
    a.currency,
    a.payment_status,
    a.reminder_sent,
    a.cancelled_at,
    a.cancelled_by,
    a.cancel_reason,
    a.is_location_exception,
    a.original_location_id,
    jsonb_build_object('id', b.id, 'name', b.name, 'description', b.description) AS business,
    jsonb_build_object('id', l.id, 'name', l.name, 'address', l.address, 'city', l.city, 'state', l.state, 'postal_code', l.postal_code, 'google_maps_url', l.google_maps_url) AS location,
    jsonb_build_object('id', e.id, 'full_name', e.full_name, 'email', e.email, 'phone', e.phone, 'avatar_url', e.avatar_url) AS employee,
    jsonb_build_object('id', c.id, 'full_name', c.full_name, 'email', c.email, 'phone', c.phone, 'avatar_url', c.avatar_url) AS client,
    jsonb_build_object('id', s.id, 'name', s.name, 'description', s.description, 'duration_minutes', s.duration_minutes, 'price', s.price, 'currency', s.currency) AS service
   FROM (((((public.appointments a
     LEFT JOIN public.businesses b ON ((a.business_id = b.id)))
     LEFT JOIN public.locations l ON ((a.location_id = l.id)))
     LEFT JOIN public.profiles e ON ((a.employee_id = e.id)))
     LEFT JOIN public.profiles c ON ((a.client_id = c.id)))
     LEFT JOIN public.services s ON ((a.service_id = s.id)))
  WITH NO DATA;


--
-- Name: billing_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    performed_by uuid,
    performed_by_source text,
    old_value jsonb,
    new_value jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT billing_audit_log_action_check CHECK ((action = ANY (ARRAY['payment_method_added'::text, 'payment_method_removed'::text, 'payment_method_updated'::text, 'subscription_created'::text, 'subscription_upgraded'::text, 'subscription_downgraded'::text, 'subscription_canceled'::text, 'subscription_paused'::text, 'subscription_resumed'::text, 'payment_succeeded'::text, 'payment_failed'::text, 'discount_code_applied'::text, 'plan_limit_exceeded'::text, 'plan_limit_warning'::text]))),
    CONSTRAINT billing_audit_log_performed_by_source_check CHECK ((performed_by_source = ANY (ARRAY['user'::text, 'system'::text, 'stripe_webhook'::text, 'admin'::text])))
);


--
-- Name: TABLE billing_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.billing_audit_log IS 'Log de auditorÃ­a de todas las acciones crÃ­ticas de billing';


--
-- Name: bug_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bug_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity text NOT NULL,
    url text,
    user_agent text,
    browser text,
    os text,
    viewport_width integer,
    viewport_height integer,
    screenshot_url text,
    console_logs text,
    network_logs text,
    environment text DEFAULT 'production'::text,
    app_version text,
    tags text[] DEFAULT '{}'::text[],
    status text DEFAULT 'open'::text,
    assigned_to uuid,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    steps_to_reproduce text,
    category text,
    affected_page text,
    browser_version text,
    device_type text,
    screen_resolution text,
    priority text DEFAULT 'normal'::text,
    CONSTRAINT bug_reports_environment_check CHECK ((environment = ANY (ARRAY['development'::text, 'staging'::text, 'production'::text]))),
    CONSTRAINT bug_reports_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT bug_reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'wont_fix'::text, 'duplicate'::text])))
);


--
-- Name: TABLE bug_reports; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.bug_reports IS 'Registro de reportes de bugs enviados por usuarios';


--
-- Name: COLUMN bug_reports.severity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bug_reports.severity IS 'Nivel de severidad: low, medium, high, critical';


--
-- Name: COLUMN bug_reports.environment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bug_reports.environment IS 'Ambiente donde se reportÃ³ el bug';


--
-- Name: business_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    icon_name character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0,
    parent_id uuid
);


--
-- Name: TABLE business_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_categories IS 'CategorÃ­as de negocios para clasificaciÃ³n y filtrado';


--
-- Name: business_closed_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_closed_days (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    closed_date date NOT NULL,
    reason text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE business_closed_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_closed_days IS 'DÃ­as especÃ­ficos en que el negocio o una sede en particular no atiende (fuera de festivos regulares).';


--
-- Name: COLUMN business_closed_days.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_closed_days.location_id IS 'Si es NULL, el cierre aplica a TODAS las sedes. Si tiene valor, aplica solo a esa sede.';


--
-- Name: business_confirmation_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_confirmation_policies (
    id uuid DEFAULT (md5(((random())::text || (clock_timestamp())::text)))::uuid NOT NULL,
    business_id uuid NOT NULL,
    confirmation_method text DEFAULT 'email'::text NOT NULL,
    email_enabled boolean DEFAULT true,
    email_hours_before integer DEFAULT 24,
    email_template_subject text DEFAULT 'Confirma tu cita - {{business_name}}'::text,
    email_template_body text DEFAULT 'Hola {{client_name}}, tienes una cita programada para {{appointment_date}} a las {{appointment_time}}. Por favor confirma tu asistencia.'::text,
    payment_enabled boolean DEFAULT false,
    payment_percentage numeric(5,2) DEFAULT 0.00,
    payment_hours_before integer DEFAULT 24,
    auto_no_show_enabled boolean DEFAULT true,
    auto_no_show_minutes_after integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT business_confirmation_policies_auto_no_show_minutes_after_check CHECK ((auto_no_show_minutes_after >= 0)),
    CONSTRAINT business_confirmation_policies_confirmation_method_check CHECK ((confirmation_method = ANY (ARRAY['email'::text, 'payment'::text, 'both'::text]))),
    CONSTRAINT business_confirmation_policies_email_hours_before_check CHECK ((email_hours_before >= 0)),
    CONSTRAINT business_confirmation_policies_payment_hours_before_check CHECK ((payment_hours_before >= 0)),
    CONSTRAINT business_confirmation_policies_payment_percentage_check CHECK (((payment_percentage >= (0)::numeric) AND (payment_percentage <= (100)::numeric)))
);


--
-- Name: business_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_employees (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    role text DEFAULT 'employee'::text,
    status public.employee_status DEFAULT 'pending'::public.employee_status NOT NULL,
    hired_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    location_id uuid,
    salary_base numeric(12,2),
    salary_type character varying(20) DEFAULT 'monthly'::character varying,
    social_security_contribution numeric(12,2) DEFAULT 0,
    health_contribution numeric(12,2) DEFAULT 0,
    pension_contribution numeric(12,2) DEFAULT 0,
    contract_type character varying(50) DEFAULT 'indefinido'::character varying,
    employee_type text DEFAULT 'service_provider'::text,
    offers_services boolean DEFAULT true NOT NULL,
    job_title character varying(100),
    hire_date date DEFAULT CURRENT_DATE,
    termination_date timestamp with time zone,
    lunch_break_start time without time zone DEFAULT '12:00:00'::time without time zone,
    lunch_break_end time without time zone DEFAULT '13:00:00'::time without time zone,
    has_lunch_break boolean DEFAULT true,
    allow_client_messages boolean DEFAULT true,
    transfer_from_location_id uuid,
    transfer_to_location_id uuid,
    transfer_effective_date timestamp with time zone,
    transfer_notice_period_days integer DEFAULT 7,
    transfer_scheduled_at timestamp with time zone,
    transfer_scheduled_by uuid,
    transfer_status text,
    vacation_days_accrued integer DEFAULT 0,
    setup_completed boolean DEFAULT false NOT NULL,
    CONSTRAINT business_employees_employee_type_check CHECK ((employee_type = ANY (ARRAY['service_provider'::text, 'support_staff'::text, 'location_manager'::text, 'team_lead'::text]))),
    CONSTRAINT business_employees_role_check CHECK ((role = ANY (ARRAY['employee'::text, 'manager'::text]))),
    CONSTRAINT business_employees_transfer_status_check CHECK ((transfer_status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT check_transfer_effective_date_future CHECK (((transfer_effective_date IS NULL) OR (transfer_effective_date > now()) OR (transfer_status = 'completed'::text))),
    CONSTRAINT check_transfer_notice_period CHECK (((transfer_notice_period_days IS NULL) OR ((transfer_notice_period_days >= 7) AND (transfer_notice_period_days <= 30)))),
    CONSTRAINT check_transfer_pending_complete CHECK ((((transfer_status = 'pending'::text) AND (transfer_from_location_id IS NOT NULL) AND (transfer_to_location_id IS NOT NULL) AND (transfer_effective_date IS NOT NULL)) OR (transfer_status <> 'pending'::text) OR (transfer_status IS NULL)))
);


--
-- Name: TABLE business_employees; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_employees IS 'Tabla de empleados vinculados a negocios. Incluye sistema de traslados programados entre sedes.';


--
-- Name: COLUMN business_employees.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.location_id IS 'Sede principal asignada al empleado en este negocio. NULL significa que puede trabajar en cualquier sede.';


--
-- Name: COLUMN business_employees.salary_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.salary_type IS 'Tipo de salario: monthly, hourly, commission_only';


--
-- Name: COLUMN business_employees.contract_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.contract_type IS 'Tipo de contrato: indefinido, fijo, prestacion_servicios';


--
-- Name: COLUMN business_employees.employee_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.employee_type IS 'Tipo de empleado: service_provider, support_staff, location_manager, team_lead';


--
-- Name: COLUMN business_employees.job_title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.job_title IS 'Cargo o puesto del empleado dentro del negocio (ej: "Estilista Senior", "Recepcionista"). Distinto a role del sistema y employee_type.';


--
-- Name: COLUMN business_employees.hire_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.hire_date IS 'Date when the employee was hired by the business';


--
-- Name: COLUMN business_employees.termination_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.termination_date IS 'Fecha en que el empleado finalizÃ³ su vÃ­nculo laboral con el negocio';


--
-- Name: COLUMN business_employees.lunch_break_start; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.lunch_break_start IS 'Hora de inicio del almuerzo (formato 24h)';


--
-- Name: COLUMN business_employees.lunch_break_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.lunch_break_end IS 'Hora de fin del almuerzo (formato 24h)';


--
-- Name: COLUMN business_employees.has_lunch_break; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.has_lunch_break IS 'Indica si el empleado tiene hora de almuerzo configurada';


--
-- Name: COLUMN business_employees.transfer_from_location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.transfer_from_location_id IS 'Sede de origen durante traslado programado';


--
-- Name: COLUMN business_employees.transfer_to_location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.transfer_to_location_id IS 'Sede de destino durante traslado programado';


--
-- Name: COLUMN business_employees.transfer_effective_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.transfer_effective_date IS 'Fecha en que el traslado se hace efectivo (empleado cambia de sede)';


--
-- Name: COLUMN business_employees.transfer_notice_period_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.transfer_notice_period_days IS 'DÃ­as de preaviso configurados (7-30 dÃ­as)';


--
-- Name: COLUMN business_employees.transfer_scheduled_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.transfer_scheduled_at IS 'Timestamp cuando se programÃ³ el traslado';


--
-- Name: COLUMN business_employees.transfer_scheduled_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.transfer_scheduled_by IS 'Usuario que programÃ³ el traslado (empleado o admin)';


--
-- Name: COLUMN business_employees.transfer_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_employees.transfer_status IS 'Estado del traslado: pending (programado), completed (completado), cancelled (cancelado)';


--
-- Name: business_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: business_notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_notification_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    whatsapp_enabled boolean DEFAULT false NOT NULL,
    channel_priority public.notification_channel[] DEFAULT ARRAY['whatsapp'::public.notification_channel, 'email'::public.notification_channel, 'sms'::public.notification_channel],
    reminder_times integer[] DEFAULT ARRAY[1440, 60],
    notification_types jsonb DEFAULT '{"daily_digest": {"enabled": false, "channels": ["email"]}, "employee_request": {"enabled": true, "channels": ["email"]}, "appointment_reminder": {"enabled": true, "channels": ["email", "whatsapp"]}, "appointment_rescheduled": {"enabled": true, "channels": ["email", "whatsapp"]}, "appointment_cancellation": {"enabled": true, "channels": ["email", "sms", "whatsapp"]}, "appointment_confirmation": {"enabled": true, "channels": ["email", "whatsapp"]}}'::jsonb,
    email_from_name character varying(255),
    email_from_address character varying(255),
    twilio_phone_number character varying(50),
    whatsapp_phone_number character varying(50),
    send_notifications_from time without time zone DEFAULT '08:00:00'::time without time zone,
    send_notifications_until time without time zone DEFAULT '22:00:00'::time without time zone,
    timezone character varying(50) DEFAULT 'America/Bogota'::character varying,
    use_fallback boolean DEFAULT true NOT NULL,
    max_retry_attempts integer DEFAULT 3
);


--
-- Name: TABLE business_notification_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_notification_settings IS 'ConfiguraciÃƒÂ³n de notificaciones multicanal por negocio (Email, SMS, WhatsApp)';


--
-- Name: COLUMN business_notification_settings.channel_priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_notification_settings.channel_priority IS 'Orden de prioridad para intentar envÃƒÂ­o de notificaciones';


--
-- Name: COLUMN business_notification_settings.reminder_times; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_notification_settings.reminder_times IS 'Tiempos en minutos antes del appointment para enviar recordatorios';


--
-- Name: COLUMN business_notification_settings.use_fallback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_notification_settings.use_fallback IS 'Si falla el canal principal, intentar con el siguiente en la lista de prioridad';


--
-- Name: business_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    plan_type text NOT NULL,
    status text DEFAULT 'active'::text,
    start_date timestamp with time zone DEFAULT now(),
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    billing_cycle text DEFAULT 'monthly'::text,
    auto_renew boolean DEFAULT true,
    discount_code text,
    trial_ends_at timestamp with time zone,
    grace_period_ends_at timestamp with time zone,
    paused_at timestamp with time zone,
    canceled_at timestamp with time zone,
    cancellation_reason text,
    payment_gateway text DEFAULT 'mercadopago'::text,
    gateway_subscription_id text,
    CONSTRAINT business_plans_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT business_plans_plan_type_check CHECK ((plan_type = ANY (ARRAY['inicio'::text, 'profesional'::text, 'empresarial'::text, 'corporativo'::text]))),
    CONSTRAINT business_plans_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'expired'::text, 'canceled'::text, 'suspended'::text, 'trialing'::text, 'past_due'::text, 'paused'::text])))
);


--
-- Name: TABLE business_plans; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_plans IS 'Planes de suscripciÃ³n de negocios. LÃ­mites por tipo de plan:
- inicio: 1 sede, 3 empleados, 100 citas/mes, 50 clientes, 10 servicios
- profesional: 3 sedes, 10 empleados, 500 citas/mes, 200 clientes, 50 servicios
- empresarial: 10 sedes, 50 empleados, 2000 citas/mes, 1000 clientes, 200 servicios
- corporativo: ilimitado';


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    appointment_id uuid NOT NULL,
    client_id uuid NOT NULL,
    employee_id uuid,
    rating integer NOT NULL,
    comment text,
    response text,
    response_at timestamp with time zone,
    response_by uuid,
    is_visible boolean DEFAULT true NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    helpful_count integer DEFAULT 0 NOT NULL,
    review_type text DEFAULT 'business'::text NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_type_check CHECK ((review_type = ANY (ARRAY['business'::text, 'employee'::text])))
);


--
-- Name: TABLE reviews; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reviews IS 'Calificaciones y comentarios de clientes sobre citas completadas';


--
-- Name: COLUMN reviews.is_verified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reviews.is_verified IS 'TRUE si el cliente asistiÃ³ a la cita (status = completed)';


--
-- Name: COLUMN reviews.helpful_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reviews.helpful_count IS 'Cantidad de usuarios que marcaron esta review como Ãºtil';


--
-- Name: COLUMN reviews.review_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reviews.review_type IS 'Tipo de review: business (sobre el negocio) o employee (sobre el profesional). Permite 2 reviews por cita.';


--
-- Name: business_ratings_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.business_ratings_stats AS
 SELECT b.id AS business_id,
    b.name AS business_name,
    count(r.id) AS review_count,
    COALESCE(avg(r.rating), (0)::numeric) AS average_rating,
    count(
        CASE
            WHEN (r.rating = 5) THEN 1
            ELSE NULL::integer
        END) AS five_star_count,
    count(
        CASE
            WHEN (r.rating = 4) THEN 1
            ELSE NULL::integer
        END) AS four_star_count,
    count(
        CASE
            WHEN (r.rating = 3) THEN 1
            ELSE NULL::integer
        END) AS three_star_count,
    count(
        CASE
            WHEN (r.rating = 2) THEN 1
            ELSE NULL::integer
        END) AS two_star_count,
    count(
        CASE
            WHEN (r.rating = 1) THEN 1
            ELSE NULL::integer
        END) AS one_star_count,
    max(r.created_at) AS latest_review_at
   FROM (public.businesses b
     LEFT JOIN public.reviews r ON (((b.id = r.business_id) AND (r.is_visible = true))))
  WHERE (b.is_active = true)
  GROUP BY b.id, b.name
  WITH NO DATA;


--
-- Name: MATERIALIZED VIEW business_ratings_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON MATERIALIZED VIEW public.business_ratings_stats IS 'Vista materializada con estadÃ­sticas agregadas de ratings por negocio. Refrescar cada 5-10 min.';


--
-- Name: business_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_resources (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    name character varying(200) NOT NULL,
    resource_type character varying(50) NOT NULL,
    description text,
    capacity integer,
    is_active boolean DEFAULT true NOT NULL,
    available_hours jsonb,
    image_url text,
    amenities text[],
    price_per_hour numeric(10,2),
    price_per_day numeric(10,2),
    currency character varying(3) DEFAULT 'COP'::character varying,
    max_simultaneous_bookings integer DEFAULT 1,
    CONSTRAINT business_resources_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT business_resources_max_simultaneous_bookings_check CHECK ((max_simultaneous_bookings > 0)),
    CONSTRAINT business_resources_price_per_day_check CHECK ((price_per_day >= (0)::numeric)),
    CONSTRAINT business_resources_price_per_hour_check CHECK ((price_per_hour >= (0)::numeric)),
    CONSTRAINT business_resources_resource_type_check CHECK (((resource_type)::text = ANY ((ARRAY['room'::character varying, 'table'::character varying, 'court'::character varying, 'studio'::character varying, 'meeting_room'::character varying, 'desk'::character varying, 'equipment'::character varying, 'vehicle'::character varying, 'space'::character varying, 'lane'::character varying, 'field'::character varying, 'station'::character varying, 'parking_spot'::character varying, 'bed'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: TABLE business_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_resources IS 'Recursos fÃ­sicos de un negocio (habitaciones, mesas, canchas, equipos, etc.)';


--
-- Name: COLUMN business_resources.resource_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_resources.resource_type IS 'Tipo de recurso: room, table, court, studio, meeting_room, desk, equipment, vehicle, space, lane, field, station, parking_spot, bed, other';


--
-- Name: COLUMN business_resources.capacity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_resources.capacity IS 'Capacidad mÃ¡xima del recurso (ej: habitaciÃ³n para 2 personas, mesa para 4)';


--
-- Name: COLUMN business_resources.max_simultaneous_bookings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_resources.max_simultaneous_bookings IS 'MÃ¡ximo de reservas simultÃ¡neas permitidas (para clases grupales)';


--
-- Name: business_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    employee_type text,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    hierarchy_level integer DEFAULT 4,
    reports_to uuid,
    CONSTRAINT business_roles_employee_type_check CHECK ((employee_type = ANY (ARRAY['service_provider'::text, 'support_staff'::text, NULL::text]))),
    CONSTRAINT business_roles_hierarchy_level_check CHECK (((hierarchy_level >= 0) AND (hierarchy_level <= 4))),
    CONSTRAINT business_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'employee'::text])))
);


--
-- Name: TABLE business_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_roles IS 'Roles de usuarios en negocios. Admin DueÃ±o se identifica por user_id === businesses.owner_id';


--
-- Name: COLUMN business_roles.hierarchy_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_roles.hierarchy_level IS 'Nivel jerÃ¡rquico: 0=Owner, 1=Admin, 2=Manager, 3=Lead, 4=Staff';


--
-- Name: COLUMN business_roles.reports_to; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_roles.reports_to IS 'ID del supervisor directo dentro del mismo negocio. NULL para Owner.';


--
-- Name: business_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.business_stats AS
 SELECT b.id AS business_id,
    b.name AS business_name,
    count(DISTINCT a.id) AS total_appointments,
    count(DISTINCT
        CASE
            WHEN (a.status = 'completed'::public.appointment_status) THEN a.id
            ELSE NULL::uuid
        END) AS completed_appointments,
    count(DISTINCT
        CASE
            WHEN (a.status = 'cancelled'::public.appointment_status) THEN a.id
            ELSE NULL::uuid
        END) AS cancelled_appointments,
    count(DISTINCT a.client_id) AS total_clients,
    COALESCE(sum(
        CASE
            WHEN (a.status = 'completed'::public.appointment_status) THEN a.price
            ELSE NULL::numeric
        END), (0)::numeric) AS total_revenue,
    count(DISTINCT be.employee_id) AS total_employees
   FROM ((public.businesses b
     LEFT JOIN public.appointments a ON ((b.id = a.business_id)))
     LEFT JOIN public.business_employees be ON (((b.id = be.business_id) AND (be.status = 'approved'::public.employee_status))))
  GROUP BY b.id, b.name;


--
-- Name: business_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_subcategories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    subcategory_id uuid NOT NULL,
    description text
);


--
-- Name: TABLE business_subcategories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_subcategories IS 'RelaciÃ³n N:M entre negocios y subcategorÃ­as (mÃ¡ximo 3 por negocio)';


--
-- Name: COLUMN business_subcategories.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.business_subcategories.description IS 'DescripciÃƒÂ³n especÃƒÂ­fica de los servicios que ofrece el negocio en esta subcategorÃƒÂ­a';


--
-- Name: calendar_sync_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_sync_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text DEFAULT 'google'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    calendar_id text DEFAULT ''::text NOT NULL,
    access_token text,
    refresh_token text,
    sync_direction text DEFAULT 'both'::text NOT NULL,
    auto_sync boolean DEFAULT true NOT NULL,
    last_sync timestamp with time zone,
    sync_errors text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT calendar_sync_settings_provider_check CHECK ((provider = ANY (ARRAY['google'::text, 'outlook'::text, 'apple'::text]))),
    CONSTRAINT calendar_sync_settings_sync_direction_check CHECK ((sync_direction = ANY (ARRAY['both'::text, 'export_only'::text, 'import_only'::text])))
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text,
    created_by uuid,
    business_id uuid,
    last_message_at timestamp with time zone DEFAULT now() NOT NULL,
    last_message_preview text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT chat_conversations_type_check CHECK ((type = ANY (ARRAY['direct'::text, 'group'::text])))
);


--
-- Name: TABLE chat_conversations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_conversations IS 'Conversaciones de chat (1-a-1 o grupo)';


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    attachments jsonb,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    delivered_at timestamp with time zone,
    read_by jsonb DEFAULT '[]'::jsonb,
    reply_to_id uuid,
    edited_at timestamp with time zone,
    deleted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_check CHECK (((content <> ''::text) OR (attachments IS NOT NULL))),
    CONSTRAINT chat_messages_type_check CHECK ((type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'system'::text])))
);


--
-- Name: TABLE chat_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_messages IS 'Mensajes de chat';


--
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone,
    last_read_at timestamp with time zone,
    last_read_message_id uuid,
    unread_count integer DEFAULT 0 NOT NULL,
    is_muted boolean DEFAULT false NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_participants_check CHECK (((left_at IS NULL) OR (left_at > joined_at)))
);


--
-- Name: TABLE chat_participants; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_participants IS 'Participantes de conversaciones de chat';


--
-- Name: chat_typing_indicators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_typing_indicators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:00:10'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE chat_typing_indicators; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_typing_indicators IS 'Indicadores de "escribiendo..." (expiran en 10 segundos)';


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    region_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE cities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cities IS 'Tabla de ciudades - Nombres corregidos con encoding UTF-8 apropiado (2025-11-14)';


--
-- Name: conversation_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_members (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    role public.conversation_role DEFAULT 'member'::public.conversation_role NOT NULL,
    muted boolean DEFAULT false NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    custom_name text,
    last_read_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    unread_count integer DEFAULT 0 NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    type public.conversation_type DEFAULT 'direct'::public.conversation_type NOT NULL,
    name text,
    description text,
    avatar_url text,
    created_by uuid NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    last_message_at timestamp with time zone,
    last_message_preview text,
    CONSTRAINT conversations_name_check CHECK ((((type = 'group'::public.conversation_type) AND (name IS NOT NULL)) OR ((type = 'direct'::public.conversation_type) AND (name IS NULL))))
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    phone_prefix character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE countries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.countries IS 'CatÃ¡logo de paÃ­ses';


--
-- Name: cron_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cron_execution_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    job_name text NOT NULL,
    status text NOT NULL,
    message text,
    execution_time_ms integer,
    details jsonb,
    CONSTRAINT cron_execution_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'warning'::text])))
);


--
-- Name: TABLE cron_execution_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cron_execution_logs IS 'Logs de ejecuciones de cron jobs para debugging';


--
-- Name: discount_code_uses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_code_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    discount_code_id uuid NOT NULL,
    business_id uuid NOT NULL,
    plan_id uuid,
    discount_amount numeric(10,2) NOT NULL,
    original_amount numeric(10,2) NOT NULL,
    final_amount numeric(10,2) NOT NULL,
    used_at timestamp with time zone DEFAULT now(),
    used_by uuid,
    CONSTRAINT discount_code_uses_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT discount_code_uses_final_amount_check CHECK ((final_amount >= (0)::numeric)),
    CONSTRAINT discount_code_uses_original_amount_check CHECK ((original_amount > (0)::numeric))
);


--
-- Name: TABLE discount_code_uses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.discount_code_uses IS 'Registro de uso de cÃ³digos de descuento por negocio';


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    max_uses integer,
    current_uses integer DEFAULT 0,
    min_amount numeric(10,2),
    eligible_plans text[],
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT discount_codes_current_uses_check CHECK ((current_uses >= 0)),
    CONSTRAINT discount_codes_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text]))),
    CONSTRAINT discount_codes_discount_value_check CHECK ((discount_value > (0)::numeric)),
    CONSTRAINT discount_codes_max_uses_check CHECK ((max_uses > 0)),
    CONSTRAINT discount_codes_min_amount_check CHECK ((min_amount > (0)::numeric)),
    CONSTRAINT discount_codes_percentage_limit CHECK ((((discount_type = 'percentage'::text) AND (discount_value <= (100)::numeric)) OR (discount_type = 'fixed_amount'::text))),
    CONSTRAINT discount_codes_valid_dates CHECK (((valid_until IS NULL) OR (valid_until > valid_from)))
);


--
-- Name: TABLE discount_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.discount_codes IS 'CÃ³digos de descuento promocionales aplicables a planes';


--
-- Name: document_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_types (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    abbreviation character varying(10) NOT NULL,
    country_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE document_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.document_types IS 'CatÃ¡logo de tipos de documento por paÃ­s';


--
-- Name: employee_absences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_absences (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    absence_type character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    reason text NOT NULL,
    employee_notes text,
    admin_notes text,
    approved_by uuid,
    approved_at timestamp with time zone,
    appointments_cancelled_count integer DEFAULT 0,
    appointments_cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT employee_absences_absence_type_check CHECK (((absence_type)::text = ANY ((ARRAY['vacation'::character varying, 'emergency'::character varying, 'sick_leave'::character varying, 'personal'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT employee_absences_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT valid_date_range CHECK ((end_date >= start_date))
);


--
-- Name: employee_join_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_join_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid,
    business_id uuid NOT NULL,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    invite_code text,
    invite_code_expires_at timestamp with time zone,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_join_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: employee_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_services (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    employee_id uuid NOT NULL,
    service_id uuid NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid NOT NULL,
    expertise_level integer DEFAULT 3,
    is_active boolean DEFAULT true NOT NULL,
    commission_percentage numeric(5,2),
    notes text,
    CONSTRAINT employee_services_commission_percentage_check CHECK (((commission_percentage >= (0)::numeric) AND (commission_percentage <= (100)::numeric))),
    CONSTRAINT employee_services_expertise_level_check CHECK (((expertise_level >= 1) AND (expertise_level <= 5)))
);


--
-- Name: TABLE employee_services; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employee_services IS 'Define quÃ© servicios puede ofrecer cada empleado. Un empleado solo puede ofrecer servicios disponibles en su sede.';


--
-- Name: COLUMN employee_services.expertise_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.employee_services.expertise_level IS 'Nivel de experiencia del empleado en este servicio (1=Principiante, 5=Experto)';


--
-- Name: COLUMN employee_services.commission_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.employee_services.commission_percentage IS 'Porcentaje de comisiÃ³n que recibe el empleado por este servicio';


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    type public.transaction_type NOT NULL,
    category public.transaction_category NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    description text,
    appointment_id uuid,
    employee_id uuid,
    created_by uuid,
    transaction_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method text,
    reference_number text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_verified boolean DEFAULT false NOT NULL,
    verified_by uuid,
    verified_at timestamp with time zone,
    subtotal numeric(12,2),
    tax_type public.tax_type DEFAULT 'none'::public.tax_type,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2),
    is_tax_deductible boolean DEFAULT true,
    invoice_id uuid,
    fiscal_period character varying(7),
    CONSTRAINT transactions_amount_check CHECK ((amount >= (0)::numeric))
);


--
-- Name: TABLE transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.transactions IS 'Registro de todos los ingresos y egresos del negocio para anÃ¡lisis financiero';


--
-- Name: COLUMN transactions.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transactions.type IS 'Tipo de transacciÃ³n: income (ingreso) o expense (egreso)';


--
-- Name: COLUMN transactions.payment_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transactions.payment_method IS 'MÃ©todo de pago: cash, card, transfer, etc.';


--
-- Name: COLUMN transactions.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transactions.metadata IS 'InformaciÃ³n adicional: factura, comprobante, notas internas, etc.';


--
-- Name: COLUMN transactions.subtotal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transactions.subtotal IS 'Valor antes de aplicar impuestos';


--
-- Name: COLUMN transactions.total_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transactions.total_amount IS 'Valor total incluyendo impuestos (subtotal + tax_amount)';


--
-- Name: COLUMN transactions.fiscal_period; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transactions.fiscal_period IS 'PerÃ­odo fiscal en formato YYYY-MM para agrupaciÃ³n';


--
-- Name: employee_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.employee_performance AS
 SELECT e.id AS employee_id,
    e.full_name AS employee_name,
    e.email,
    e.avatar_url,
    be.business_id,
    b.name AS business_name,
    be.location_id,
    l.name AS location_name,
    be.role AS "position",
    count(DISTINCT es.service_id) AS services_offered,
    count(DISTINCT a.id) FILTER (WHERE (a.status = ANY (ARRAY['confirmed'::public.appointment_status, 'completed'::public.appointment_status]))) AS total_appointments,
    count(DISTINCT a.id) FILTER (WHERE (a.status = 'completed'::public.appointment_status)) AS completed_appointments,
    count(DISTINCT a.id) FILTER (WHERE (a.status = 'cancelled'::public.appointment_status)) AS cancelled_appointments,
    round((((count(DISTINCT a.id) FILTER (WHERE (a.status = 'completed'::public.appointment_status)))::numeric / NULLIF((count(DISTINCT a.id) FILTER (WHERE (a.status = ANY (ARRAY['confirmed'::public.appointment_status, 'completed'::public.appointment_status]))))::numeric, (0)::numeric)) * (100)::numeric), 2) AS completion_rate,
    COALESCE(round(avg(r.rating), 2), (0)::numeric) AS average_rating,
    count(DISTINCT r.id) AS total_reviews,
    COALESCE(sum(a.price) FILTER (WHERE (a.status = 'completed'::public.appointment_status)), (0)::numeric) AS total_revenue,
    COALESCE(sum(t.amount) FILTER (WHERE ((t.type = 'expense'::public.transaction_type) AND (t.category = ANY (ARRAY['salary'::public.transaction_category, 'commission'::public.transaction_category])))), (0)::numeric) AS total_paid
   FROM (((((((public.profiles e
     JOIN public.business_employees be ON (((e.id = be.employee_id) AND (be.status = 'approved'::public.employee_status) AND (be.is_active = true))))
     JOIN public.businesses b ON ((be.business_id = b.id)))
     LEFT JOIN public.locations l ON ((be.location_id = l.id)))
     LEFT JOIN public.employee_services es ON (((e.id = es.employee_id) AND (es.business_id = be.business_id) AND (es.is_active = true))))
     LEFT JOIN public.appointments a ON (((e.id = a.employee_id) AND (a.business_id = be.business_id))))
     LEFT JOIN public.reviews r ON ((e.id = r.employee_id)))
     LEFT JOIN public.transactions t ON (((t.business_id = be.business_id) AND (t.employee_id = e.id))))
  GROUP BY e.id, e.full_name, e.email, e.avatar_url, be.business_id, b.name, be.location_id, l.name, be.role;


--
-- Name: employee_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    professional_summary text,
    years_of_experience integer DEFAULT 0,
    specializations text[] DEFAULT '{}'::text[],
    languages text[] DEFAULT '{}'::text[],
    certifications jsonb DEFAULT '[]'::jsonb,
    portfolio_url text,
    linkedin_url text,
    github_url text,
    available_for_hire boolean DEFAULT true,
    preferred_work_type text,
    expected_salary_min integer,
    expected_salary_max integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT employee_profiles_preferred_work_type_check CHECK ((preferred_work_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'freelance'::text, 'any'::text]))),
    CONSTRAINT employee_profiles_years_of_experience_check CHECK (((years_of_experience >= 0) AND (years_of_experience <= 50)))
);


--
-- Name: TABLE employee_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employee_profiles IS 'Perfiles profesionales extendidos para empleados que buscan trabajo';


--
-- Name: COLUMN employee_profiles.certifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.employee_profiles.certifications IS 'Array JSONB: [{"name": "...", "issuer": "...", "date": "...", "credential_id": "...", "url": "..."}]';


--
-- Name: employee_ratings_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.employee_ratings_stats AS
 SELECT p.id AS employee_id,
    p.full_name AS employee_name,
    count(r.id) AS review_count,
    COALESCE(avg(r.rating), (0)::numeric) AS average_rating,
    max(r.created_at) AS latest_review_at,
    count(DISTINCT r.business_id) AS businesses_count
   FROM (public.profiles p
     LEFT JOIN public.reviews r ON (((p.id = r.employee_id) AND (r.is_visible = true))))
  GROUP BY p.id, p.full_name
  WITH NO DATA;


--
-- Name: MATERIALIZED VIEW employee_ratings_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON MATERIALIZED VIEW public.employee_ratings_stats IS 'Vista materializada con estadÃ­sticas agregadas de ratings por empleado. Refrescar cada 5-10 min.';


--
-- Name: employee_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    invitation_code character varying(6) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    responded_by uuid,
    message text,
    CONSTRAINT employee_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: TABLE employee_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employee_requests IS 'Stores employee join requests via invitation codes';


--
-- Name: employee_time_off; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_time_off (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    employee_id uuid NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    type character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer GENERATED ALWAYS AS (((end_date - start_date) + 1)) STORED,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    employee_notes text,
    manager_notes text,
    rejection_reason text,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    cancelled_at timestamp with time zone,
    CONSTRAINT employee_time_off_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT employee_time_off_type_check CHECK (((type)::text = ANY ((ARRAY['vacation'::character varying, 'sick_leave'::character varying, 'personal'::character varying, 'unpaid'::character varying, 'bereavement'::character varying, 'maternity'::character varying, 'paternity'::character varying])::text[]))),
    CONSTRAINT valid_date_range CHECK ((end_date >= start_date)),
    CONSTRAINT valid_total_days CHECK (((total_days > 0) AND (total_days <= 365)))
);


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    source text NOT NULL,
    level text NOT NULL,
    message text NOT NULL,
    stack_trace text,
    error_hash text NOT NULL,
    user_id uuid,
    session_id text,
    component text,
    context jsonb DEFAULT '{}'::jsonb,
    environment text DEFAULT 'production'::text NOT NULL,
    resolved boolean DEFAULT false,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT error_logs_environment_check CHECK ((environment = ANY (ARRAY['development'::text, 'staging'::text, 'production'::text]))),
    CONSTRAINT error_logs_level_check CHECK ((level = ANY (ARRAY['debug'::text, 'info'::text, 'warning'::text, 'error'::text, 'fatal'::text]))),
    CONSTRAINT error_logs_source_check CHECK ((source = ANY (ARRAY['frontend-web'::text, 'frontend-mobile'::text, 'frontend-extension'::text, 'edge-function'::text, 'database'::text, 'cron-job'::text])))
);


--
-- Name: TABLE error_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.error_logs IS 'Logs de errores de todas las fuentes (web, mobile, edge functions)';


--
-- Name: error_logs_summary; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.error_logs_summary AS
 SELECT source,
    level,
    component,
    environment,
    date("timestamp") AS date,
    count(*) AS error_count,
    count(DISTINCT user_id) AS affected_users,
    count(DISTINCT error_hash) AS unique_errors
   FROM public.error_logs
  WHERE ("timestamp" > (now() - '30 days'::interval))
  GROUP BY source, level, component, environment, (date("timestamp"))
  WITH NO DATA;


--
-- Name: financial_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.financial_summary AS
 SELECT t.business_id,
    b.name AS business_name,
    date_trunc('month'::text, (t.transaction_date)::timestamp with time zone) AS month,
    sum(
        CASE
            WHEN (t.type = 'income'::public.transaction_type) THEN t.amount
            ELSE (0)::numeric
        END) AS total_income,
    sum(
        CASE
            WHEN (t.type = 'expense'::public.transaction_type) THEN t.amount
            ELSE (0)::numeric
        END) AS total_expenses,
    sum(
        CASE
            WHEN (t.type = 'income'::public.transaction_type) THEN t.amount
            ELSE (- t.amount)
        END) AS net_profit,
    count(DISTINCT
        CASE
            WHEN (t.type = 'income'::public.transaction_type) THEN t.id
            ELSE NULL::uuid
        END) AS income_count,
    count(DISTINCT
        CASE
            WHEN (t.type = 'expense'::public.transaction_type) THEN t.id
            ELSE NULL::uuid
        END) AS expense_count
   FROM (public.transactions t
     JOIN public.businesses b ON ((t.business_id = b.id)))
  GROUP BY t.business_id, b.name, (date_trunc('month'::text, (t.transaction_date)::timestamp with time zone));


--
-- Name: fiscal_obligations_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.fiscal_obligations_status AS
 SELECT t.business_id,
    b.name AS business_name,
    t.fiscal_period,
    count(DISTINCT t.tax_type) AS different_tax_types,
    sum(t.tax_amount) AS total_tax_liability,
    max(t.transaction_date) AS last_transaction_date,
    count(*) AS total_transactions
   FROM (public.transactions t
     JOIN public.businesses b ON ((t.business_id = b.id)))
  WHERE (t.tax_amount > (0)::numeric)
  GROUP BY t.business_id, b.name, t.fiscal_period;


--
-- Name: genders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.genders (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE genders; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.genders IS 'CatÃ¡logo de gÃ©neros';


--
-- Name: health_insurance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.health_insurance (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE health_insurance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.health_insurance IS 'CatÃ¡logo de EPS (Entidades Promotoras de Salud)';


--
-- Name: in_app_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.in_app_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type_enum NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    status public.notification_status DEFAULT 'unread'::public.notification_status NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    action_url text,
    business_id uuid,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    archived_at timestamp with time zone,
    expires_at timestamp with time zone,
    CONSTRAINT priority_range CHECK (((priority >= 0) AND (priority <= 3))),
    CONSTRAINT valid_timestamps CHECK ((((read_at IS NULL) OR (read_at >= created_at)) AND ((archived_at IS NULL) OR (archived_at >= created_at)) AND ((expires_at IS NULL) OR (expires_at > created_at))))
);


--
-- Name: TABLE in_app_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.in_app_notifications IS 'Notificaciones in-app para usuarios (feed de notificaciones)';


--
-- Name: COLUMN in_app_notifications.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.in_app_notifications.type IS 'Tipo de notificaciÃ³n (reutiliza notification_type_enum del sistema de notificaciones)';


--
-- Name: COLUMN in_app_notifications.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.in_app_notifications.priority IS '0=baja, 1=normal, 2=alta, 3=urgente';


--
-- Name: COLUMN in_app_notifications.data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.in_app_notifications.data IS 'Metadata adicional (appointment_id, employee_id, etc.)';


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    tax_type public.tax_type DEFAULT 'iva_19'::public.tax_type,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    subtotal numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    service_id uuid,
    sort_order integer DEFAULT 0,
    CONSTRAINT invoice_items_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT invoice_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    invoice_number character varying(50) NOT NULL,
    invoice_prefix character varying(10),
    invoice_sequence integer NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    paid_date date,
    client_id uuid,
    client_name character varying(255) NOT NULL,
    client_tax_id character varying(50),
    client_address text,
    client_email character varying(255),
    client_phone character varying(20),
    subtotal numeric(12,2) NOT NULL,
    discount numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'COP'::character varying NOT NULL,
    iva_amount numeric(12,2) DEFAULT 0,
    ica_amount numeric(12,2) DEFAULT 0,
    retention_amount numeric(12,2) DEFAULT 0,
    appointment_id uuid,
    transaction_id uuid,
    notes text,
    terms text,
    cufe character varying(100),
    qr_code text,
    xml_url text,
    pdf_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT invoices_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT invoices_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT invoices_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT invoices_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_applications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    vacancy_id uuid NOT NULL,
    user_id uuid NOT NULL,
    business_id uuid NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    cover_letter text,
    available_from date,
    availability_notes text,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    interview_scheduled_at timestamp with time zone,
    decision_at timestamp with time zone,
    decision_notes text,
    rating integer,
    admin_notes text,
    availability jsonb,
    cv_url text,
    expected_salary numeric(12,2),
    selection_started_at timestamp with time zone,
    selection_started_by uuid,
    CONSTRAINT job_applications_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: TABLE job_applications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.job_applications IS 'Aplicaciones de usuarios a vacantes laborales';


--
-- Name: COLUMN job_applications.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.status IS 'Estados vÃ¡lidos: pending, reviewing, in_selection_process, accepted, rejected, withdrawn';


--
-- Name: COLUMN job_applications.availability; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.availability IS 'Applicant availability schedule in JSONB format';


--
-- Name: COLUMN job_applications.cv_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.cv_url IS 'URL del CV cargado en Supabase Storage (formato: cvs/user_id/vacancy_id_timestamp.ext)';


--
-- Name: COLUMN job_applications.selection_started_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.selection_started_at IS 'Timestamp cuando el administrador iniciÃ³ el proceso de selecciÃ³n con este candidato';


--
-- Name: COLUMN job_applications.selection_started_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.selection_started_by IS 'ID del usuario administrador que iniciÃ³ el proceso de selecciÃ³n';


--
-- Name: job_vacancies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_vacancies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    requirements text,
    responsibilities text,
    benefits text[],
    position_type character varying(50) DEFAULT 'full_time'::character varying,
    experience_required character varying(50),
    salary_min numeric(10,2),
    salary_max numeric(10,2),
    currency character varying(3) DEFAULT 'COP'::character varying,
    location_id uuid,
    remote_allowed boolean DEFAULT false,
    required_services uuid[] DEFAULT ARRAY[]::uuid[],
    preferred_services uuid[] DEFAULT ARRAY[]::uuid[],
    status character varying(50) DEFAULT 'open'::character varying,
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    filled_at timestamp with time zone,
    views_count integer DEFAULT 0,
    applications_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    work_schedule jsonb,
    number_of_positions integer DEFAULT 1,
    location_city text,
    location_address text,
    experience_level text,
    slots integer DEFAULT 1,
    commission_based boolean DEFAULT false,
    CONSTRAINT job_vacancies_experience_level_check CHECK ((experience_level = ANY (ARRAY['entry'::text, 'mid'::text, 'senior'::text, 'expert'::text]))),
    CONSTRAINT job_vacancies_number_of_positions_check CHECK ((number_of_positions > 0)),
    CONSTRAINT job_vacancies_slots_check CHECK ((slots > 0))
);


--
-- Name: TABLE job_vacancies; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.job_vacancies IS 'Vacantes laborales publicadas por los negocios';


--
-- Name: COLUMN job_vacancies.work_schedule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_vacancies.work_schedule IS 'Horario laboral. Formato: {"monday": {"start": "09:00", "end": "17:00"}, ...}';


--
-- Name: COLUMN job_vacancies.number_of_positions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_vacancies.number_of_positions IS 'NÃºmero de puestos disponibles para esta vacante';


--
-- Name: COLUMN job_vacancies.experience_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_vacancies.experience_level IS 'Required experience level: entry, mid, senior, expert';


--
-- Name: COLUMN job_vacancies.slots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_vacancies.slots IS 'Number of available positions (synonym for number_of_positions)';


--
-- Name: COLUMN job_vacancies.commission_based; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_vacancies.commission_based IS 'Indica si el empleado recibirÃ¡ comisiones ademÃ¡s del salario base';


--
-- Name: location_expense_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_expense_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    location_id uuid NOT NULL,
    business_id uuid NOT NULL,
    rent_amount numeric(12,2) DEFAULT 0,
    rent_due_day integer DEFAULT 1,
    landlord_name character varying(200),
    landlord_contact character varying(100),
    lease_start_date date,
    lease_end_date date,
    electricity_avg numeric(10,2) DEFAULT 0,
    water_avg numeric(10,2) DEFAULT 0,
    gas_avg numeric(10,2) DEFAULT 0,
    internet_avg numeric(10,2) DEFAULT 0,
    phone_avg numeric(10,2) DEFAULT 0,
    security_amount numeric(10,2) DEFAULT 0,
    cleaning_amount numeric(10,2) DEFAULT 0,
    waste_disposal_amount numeric(10,2) DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT location_expense_config_rent_due_day_check CHECK (((rent_due_day >= 1) AND (rent_due_day <= 31)))
);


--
-- Name: TABLE location_expense_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.location_expense_config IS 'ConfiguraciÃ³n de egresos especÃ­ficos por sede (arrendamiento, servicios pÃºblicos, etc.)';


--
-- Name: COLUMN location_expense_config.rent_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.location_expense_config.rent_amount IS 'Monto mensual de arrendamiento';


--
-- Name: COLUMN location_expense_config.electricity_avg; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.location_expense_config.electricity_avg IS 'Promedio mensual de electricidad (para proyecciones)';


--
-- Name: location_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    url text NOT NULL,
    description text,
    is_banner boolean DEFAULT false,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT location_media_type_check CHECK (((type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[])))
);


--
-- Name: location_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_services (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    location_id uuid NOT NULL,
    service_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text
);


--
-- Name: TABLE location_services; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.location_services IS 'Define quÃ© servicios estÃ¡n disponibles en cada sede. Permite que diferentes sedes ofrezcan diferentes servicios.';


--
-- Name: location_services_availability; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.location_services_availability AS
 SELECT ls.location_id,
    l.name AS location_name,
    l.business_id,
    b.name AS business_name,
    ls.service_id,
    s.name AS service_name,
    s.duration_minutes,
    s.price,
    ls.is_active,
    count(DISTINCT es.employee_id) AS available_employees
   FROM ((((public.location_services ls
     JOIN public.locations l ON ((ls.location_id = l.id)))
     JOIN public.businesses b ON ((l.business_id = b.id)))
     JOIN public.services s ON ((ls.service_id = s.id)))
     LEFT JOIN public.employee_services es ON (((s.id = es.service_id) AND (es.is_active = true))))
  WHERE (ls.is_active = true)
  GROUP BY ls.location_id, l.name, l.business_id, b.name, ls.service_id, s.name, s.duration_minutes, s.price, ls.is_active;


--
-- Name: login_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    method text NOT NULL,
    ip_address inet,
    user_agent text,
    device text,
    browser text,
    os text,
    country text,
    city text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_suspicious boolean DEFAULT false,
    suspicious_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT login_logs_device_check CHECK ((device = ANY (ARRAY['desktop'::text, 'mobile'::text, 'tablet'::text, 'unknown'::text]))),
    CONSTRAINT login_logs_method_check CHECK ((method = ANY (ARRAY['password'::text, 'google'::text, 'magic_link'::text, 'extension'::text, 'password_reset'::text]))),
    CONSTRAINT login_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failure'::text, 'blocked'::text])))
);


--
-- Name: TABLE login_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.login_logs IS 'Logs de intentos de inicio de sesiÃ³n y detecciÃ³n de actividad sospechosa';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    edited_at timestamp with time zone,
    conversation_id uuid NOT NULL,
    sender_id uuid,
    type public.message_type DEFAULT 'text'::public.message_type NOT NULL,
    body text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    reply_to uuid,
    is_pinned boolean DEFAULT false NOT NULL,
    pinned_by uuid,
    pinned_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_by uuid,
    deleted_at timestamp with time zone,
    search_vector tsvector,
    delivery_status public.delivery_status_enum DEFAULT 'sent'::public.delivery_status_enum NOT NULL,
    read_by jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT messages_body_or_metadata_check CHECK (((body IS NOT NULL) OR (metadata <> '{}'::jsonb))),
    CONSTRAINT messages_pinned_check CHECK ((((is_pinned = true) AND (pinned_by IS NOT NULL) AND (pinned_at IS NOT NULL)) OR (is_pinned = false))),
    CONSTRAINT messages_read_by_is_array CHECK ((jsonb_typeof(read_by) = 'array'::text))
);


--
-- Name: COLUMN messages.delivery_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.delivery_status IS 'Estado de entrega del mensaje: sending, sent, delivered, read, failed';


--
-- Name: COLUMN messages.read_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.read_by IS 'Array de objetos {user_id: UUID, read_at: TIMESTAMPTZ} indicando quiÃ©n leyÃ³ el mensaje';


--
-- Name: mv_vacancy_selection_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.mv_vacancy_selection_stats AS
 SELECT v.id AS vacancy_id,
    v.business_id,
    v.title,
    count(
        CASE
            WHEN ((ja.status)::text = 'pending'::text) THEN 1
            ELSE NULL::integer
        END) AS pending_count,
    count(
        CASE
            WHEN ((ja.status)::text = 'reviewing'::text) THEN 1
            ELSE NULL::integer
        END) AS reviewing_count,
    count(
        CASE
            WHEN ((ja.status)::text = 'in_selection_process'::text) THEN 1
            ELSE NULL::integer
        END) AS in_selection_count,
    count(
        CASE
            WHEN ((ja.status)::text = 'accepted'::text) THEN 1
            ELSE NULL::integer
        END) AS accepted_count,
    count(
        CASE
            WHEN ((ja.status)::text = 'rejected'::text) THEN 1
            ELSE NULL::integer
        END) AS rejected_count,
    min(
        CASE
            WHEN ((ja.status)::text = 'in_selection_process'::text) THEN ja.selection_started_at
            ELSE NULL::timestamp with time zone
        END) AS first_selection_started_at,
    max(
        CASE
            WHEN ((ja.status)::text = 'in_selection_process'::text) THEN ja.selection_started_at
            ELSE NULL::timestamp with time zone
        END) AS last_selection_started_at
   FROM (public.job_vacancies v
     LEFT JOIN public.job_applications ja ON ((ja.vacancy_id = v.id)))
  WHERE ((v.status)::text = ANY ((ARRAY['open'::character varying, 'filled'::character varying])::text[]))
  GROUP BY v.id, v.business_id, v.title
  WITH NO DATA;


--
-- Name: MATERIALIZED VIEW mv_vacancy_selection_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON MATERIALIZED VIEW public.mv_vacancy_selection_stats IS 'EstadÃ­sticas en tiempo real de candidatos por estado en cada vacante';


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    appointment_id uuid,
    user_id uuid,
    notification_type public.notification_type_enum NOT NULL,
    channel public.notification_channel NOT NULL,
    recipient_name character varying(255),
    recipient_contact character varying(255) NOT NULL,
    subject character varying(500),
    message text NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    external_id character varying(255),
    error_message text,
    retry_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: TABLE notification_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notification_log IS 'Registro de todas las notificaciones enviadas con tracking de entrega';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    appointment_id uuid,
    read boolean DEFAULT false NOT NULL,
    sent_via_email boolean DEFAULT false NOT NULL,
    sent_via_push boolean DEFAULT false NOT NULL,
    scheduled_for timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    delivery_method text,
    status text DEFAULT 'queued'::text,
    error_message text,
    CONSTRAINT notifications_delivery_method_check CHECK ((delivery_method = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'in_app'::text]))),
    CONSTRAINT notifications_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'sent'::text, 'failed'::text, 'pending'::text])))
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    stripe_payment_method_id text NOT NULL,
    type text DEFAULT 'card'::text NOT NULL,
    brand text,
    last4 text NOT NULL,
    exp_month integer,
    exp_year integer,
    country text,
    funding text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT payment_methods_exp_month_check CHECK (((exp_month >= 1) AND (exp_month <= 12))),
    CONSTRAINT payment_methods_exp_year_check CHECK ((exp_year >= 2024)),
    CONSTRAINT payment_methods_type_check CHECK ((type = ANY (ARRAY['card'::text, 'bank_account'::text])))
);


--
-- Name: TABLE payment_methods; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payment_methods IS 'MÃ©todos de pago (tarjetas) vinculados a negocios. Solo guarda tokens de Stripe, nunca datos completos de tarjetas (PCI compliance)';


--
-- Name: payroll_configuration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_configuration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    commission_rate numeric(5,2) DEFAULT 0,
    commission_base text DEFAULT 'appointments'::text,
    calculate_prestaciones boolean DEFAULT true,
    cesantias_enabled boolean DEFAULT true,
    prima_enabled boolean DEFAULT true,
    vacaciones_enabled boolean DEFAULT true,
    intereses_cesantias_enabled boolean DEFAULT true,
    other_deductions jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payroll_configuration_commission_base_check CHECK ((commission_base = ANY (ARRAY['appointments'::text, 'transactions'::text, 'both'::text]))),
    CONSTRAINT payroll_configuration_commission_rate_check CHECK (((commission_rate >= (0)::numeric) AND (commission_rate <= (100)::numeric)))
);


--
-- Name: payroll_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    payment_period_start date NOT NULL,
    payment_period_end date NOT NULL,
    salary_base numeric(12,2) DEFAULT 0 NOT NULL,
    commissions numeric(12,2) DEFAULT 0 NOT NULL,
    cesantias numeric(12,2) DEFAULT 0 NOT NULL,
    prima numeric(12,2) DEFAULT 0 NOT NULL,
    vacaciones numeric(12,2) DEFAULT 0 NOT NULL,
    intereses_cesantias numeric(12,2) DEFAULT 0 NOT NULL,
    other_earnings numeric(12,2) DEFAULT 0 NOT NULL,
    total_earnings numeric(12,2) DEFAULT 0 NOT NULL,
    health_deduction numeric(12,2) DEFAULT 0 NOT NULL,
    pension_deduction numeric(12,2) DEFAULT 0 NOT NULL,
    other_deductions numeric(12,2) DEFAULT 0 NOT NULL,
    total_deductions numeric(12,2) DEFAULT 0 NOT NULL,
    net_payment numeric(12,2) DEFAULT 0 NOT NULL,
    payment_date date,
    payment_method text,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payroll_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])))
);


--
-- Name: permission_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    permission text,
    old_value text,
    new_value text,
    performed_by uuid NOT NULL,
    performed_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    CONSTRAINT permission_audit_log_action_check CHECK ((action = ANY (ARRAY['grant'::text, 'revoke'::text, 'modify'::text, 'assign_role'::text, 'remove_role'::text])))
);


--
-- Name: permission_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name text NOT NULL,
    description text,
    role text NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system_template boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT permission_templates_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'employee'::text])))
);


--
-- Name: public_holidays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.public_holidays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    holiday_date date NOT NULL,
    is_recurring boolean DEFAULT true,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE public_holidays; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.public_holidays IS 'Festivos pÃºblicos por paÃ­s. Usado para validar ausencias y vacaciones.';


--
-- Name: COLUMN public_holidays.country_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.public_holidays.country_id IS 'ID del paÃ­s (FK a countries.id)';


--
-- Name: COLUMN public_holidays.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.public_holidays.name IS 'Nombre del festivo (ej: Navidad, DÃ­a del Trabajo)';


--
-- Name: COLUMN public_holidays.holiday_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.public_holidays.holiday_date IS 'Fecha del festivo en formato YYYY-MM-DD';


--
-- Name: COLUMN public_holidays.is_recurring; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.public_holidays.is_recurring IS 'True si se repite cada aÃ±o';


--
-- Name: COLUMN public_holidays.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.public_holidays.description IS 'DescripciÃ³n opcional del festivo';


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    recurrence_frequency text NOT NULL,
    next_payment_date date NOT NULL,
    last_payment_date date,
    is_active boolean DEFAULT true NOT NULL,
    payment_method text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    location_id uuid,
    employee_id uuid,
    created_by uuid,
    name character varying(200),
    currency character varying(3) DEFAULT 'COP'::character varying,
    recurrence_day integer,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_automated boolean DEFAULT false,
    total_paid numeric(12,2) DEFAULT 0,
    payments_count integer DEFAULT 0,
    category public.transaction_category DEFAULT 'other_expense'::public.transaction_category NOT NULL,
    CONSTRAINT recurring_expenses_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT recurring_expenses_frequency_check CHECK ((recurrence_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text]))),
    CONSTRAINT recurring_expenses_recurrence_day_check CHECK (((recurrence_day >= 1) AND (recurrence_day <= 31)))
);


--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    country_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE regions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.regions IS 'CatÃ¡logo de regiones/departamentos por paÃ­s';


--
-- Name: resource_availability; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.resource_availability AS
 SELECT r.id AS resource_id,
    r.business_id,
    r.location_id,
    r.name,
    r.resource_type,
    r.capacity,
    r.is_active,
    count(a.id) FILTER (WHERE ((a.status = ANY (ARRAY['pending'::public.appointment_status, 'confirmed'::public.appointment_status])) AND (a.start_time > now()))) AS upcoming_bookings,
    max(a.end_time) FILTER (WHERE (a.status = ANY (ARRAY['pending'::public.appointment_status, 'confirmed'::public.appointment_status]))) AS next_available_from
   FROM (public.business_resources r
     LEFT JOIN public.appointments a ON ((a.resource_id = r.id)))
  WHERE (r.is_active = true)
  GROUP BY r.id, r.business_id, r.location_id, r.name, r.resource_type, r.capacity, r.is_active
  WITH NO DATA;


--
-- Name: MATERIALIZED VIEW resource_availability; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON MATERIALIZED VIEW public.resource_availability IS 'Vista materializada con disponibilidad actual de recursos. Refrescar cada 5 minutos vÃ­a cron job.';


--
-- Name: resource_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_services (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resource_id uuid NOT NULL,
    service_id uuid NOT NULL,
    custom_price numeric(10,2),
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT resource_services_custom_price_check CHECK ((custom_price >= (0)::numeric))
);


--
-- Name: TABLE resource_services; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.resource_services IS 'RelaciÃ³n N:M entre recursos fÃ­sicos y servicios (similar a employee_services)';


--
-- Name: subscription_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    plan_id uuid,
    event_type text NOT NULL,
    triggered_by text,
    triggered_by_user_id uuid,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subscription_events_event_type_check CHECK ((event_type = ANY (ARRAY['created'::text, 'activated'::text, 'upgraded'::text, 'downgraded'::text, 'renewed'::text, 'paused'::text, 'resumed'::text, 'canceled'::text, 'suspended'::text, 'expired'::text, 'payment_failed'::text, 'payment_succeeded'::text, 'trial_started'::text, 'trial_will_end'::text, 'trial_ended'::text, 'limit_warning'::text, 'limit_exceeded'::text, 'invoice_upcoming'::text]))),
    CONSTRAINT subscription_events_triggered_by_check CHECK ((triggered_by = ANY (ARRAY['user'::text, 'system'::text, 'stripe_webhook'::text, 'admin'::text, 'cron'::text])))
);


--
-- Name: TABLE subscription_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.subscription_events IS 'Eventos de ciclo de vida de suscripciones (activaciÃ³n, cancelaciÃ³n, renovaciÃ³n, etc)';


--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    plan_id uuid,
    stripe_payment_intent_id text,
    stripe_invoice_id text,
    stripe_charge_id text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'COP'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method_id uuid,
    failure_code text,
    failure_reason text,
    retry_count integer DEFAULT 0,
    next_retry_at timestamp with time zone,
    paid_at timestamp with time zone,
    refunded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT subscription_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT subscription_payments_retry_count_check CHECK (((retry_count >= 0) AND (retry_count <= 3))),
    CONSTRAINT subscription_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'refunded'::text, 'disputed'::text, 'canceled'::text])))
);


--
-- Name: TABLE subscription_payments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.subscription_payments IS 'Historial de pagos de suscripciones procesados por Stripe';


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    key text NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tax_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_configurations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    tax_regime public.tax_regime DEFAULT 'common'::public.tax_regime NOT NULL,
    is_iva_responsible boolean DEFAULT true NOT NULL,
    is_ica_responsible boolean DEFAULT false NOT NULL,
    is_retention_agent boolean DEFAULT false NOT NULL,
    dian_code character varying(50),
    activity_code character varying(10),
    default_iva_rate numeric(5,2) DEFAULT 19.00,
    ica_rate numeric(5,4) DEFAULT 0.00,
    retention_rate numeric(5,2) DEFAULT 0.00,
    accountant_name character varying(255),
    accountant_email character varying(255),
    accountant_phone character varying(20),
    accountant_license character varying(50),
    invoice_prefix character varying(10) DEFAULT 'F'::character varying,
    invoice_next_number integer DEFAULT 1,
    invoice_resolution_number character varying(50),
    invoice_resolution_date date,
    invoice_resolution_valid_until date,
    settings jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT tax_configurations_default_iva_rate_check CHECK (((default_iva_rate >= (0)::numeric) AND (default_iva_rate <= (100)::numeric))),
    CONSTRAINT tax_configurations_ica_rate_check CHECK (((ica_rate >= (0)::numeric) AND (ica_rate <= (100)::numeric))),
    CONSTRAINT tax_configurations_retention_rate_check CHECK (((retention_rate >= (0)::numeric) AND (retention_rate <= (100)::numeric)))
);


--
-- Name: TABLE tax_configurations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tax_configurations IS 'ConfiguraciÃ³n fiscal y tributaria por negocio para Colombia';


--
-- Name: tax_liabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_liabilities (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    liability_type character varying(50) NOT NULL,
    period character varying(7) NOT NULL,
    due_date date NOT NULL,
    filed_date date,
    calculated_amount numeric(12,2) DEFAULT 0,
    filed_amount numeric(12,2),
    paid_amount numeric(12,2) DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: tax_report_by_period; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.tax_report_by_period AS
 SELECT t.business_id,
    b.name AS business_name,
    t.fiscal_period,
    t.tax_type,
    count(*) AS transaction_count,
    sum(t.amount) AS total_amount,
    sum(t.subtotal) AS total_subtotal,
    sum(t.tax_amount) AS total_tax,
    avg(t.tax_rate) AS avg_tax_rate
   FROM (public.transactions t
     JOIN public.businesses b ON ((t.business_id = b.id)))
  WHERE (t.fiscal_period IS NOT NULL)
  GROUP BY t.business_id, b.name, t.fiscal_period, t.tax_type;


--
-- Name: usage_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    plan_id uuid,
    metric_date date DEFAULT CURRENT_DATE NOT NULL,
    locations_count integer DEFAULT 0,
    employees_count integer DEFAULT 0,
    appointments_count integer DEFAULT 0,
    clients_count integer DEFAULT 0,
    services_count integer DEFAULT 0,
    storage_mb numeric(10,2) DEFAULT 0,
    is_over_limit boolean DEFAULT false,
    limit_exceeded_resources text[],
    usage_percentage jsonb DEFAULT '{}'::jsonb,
    calculated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT usage_metrics_appointments_count_check CHECK ((appointments_count >= 0)),
    CONSTRAINT usage_metrics_clients_count_check CHECK ((clients_count >= 0)),
    CONSTRAINT usage_metrics_employees_count_check CHECK ((employees_count >= 0)),
    CONSTRAINT usage_metrics_locations_count_check CHECK ((locations_count >= 0)),
    CONSTRAINT usage_metrics_services_count_check CHECK ((services_count >= 0)),
    CONSTRAINT usage_metrics_storage_mb_check CHECK ((storage_mb >= (0)::numeric))
);


--
-- Name: TABLE usage_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usage_metrics IS 'MÃ©tricas diarias de uso de recursos por negocio (sedes, empleados, citas, etc)';


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    permission text NOT NULL,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_permissions IS 'Sistema de permisos granulares v2.0 - Actualizado 2025-11-16';


--
-- Name: user_active_permissions; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.user_active_permissions AS
 SELECT user_id,
    business_id,
    array_agg(permission ORDER BY permission) AS permissions,
    count(*) AS permissions_count,
    max(updated_at) AS last_updated
   FROM public.user_permissions
  WHERE (is_active = true)
  GROUP BY user_id, business_id
  WITH NO DATA;


--
-- Name: MATERIALIZED VIEW user_active_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON MATERIALIZED VIEW public.user_active_permissions IS 'Materialized view de permisos activos por usuario y negocio. 
Refresh cada 5 minutos para balance performance/freshness.
Reduce query time de ~150ms a ~30ms (80% mejora).';


--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notification_preferences (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    whatsapp_enabled boolean DEFAULT false NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    whatsapp_verified boolean DEFAULT false NOT NULL,
    notification_preferences jsonb DEFAULT '{"security_alert": {"sms": true, "email": true, "whatsapp": true}, "appointment_reminder": {"sms": false, "email": true, "whatsapp": true}, "appointment_cancellation": {"sms": true, "email": true, "whatsapp": true}, "appointment_confirmation": {"sms": false, "email": true, "whatsapp": true}, "appointment_new_employee": {"sms": false, "email": true, "whatsapp": true}, "job_application_accepted": {"sms": true, "email": true, "whatsapp": true}, "job_application_rejected": {"sms": false, "email": true, "whatsapp": false}, "employee_request_accepted": {"sms": false, "email": true, "whatsapp": true}, "employee_request_rejected": {"sms": false, "email": true, "whatsapp": false}, "job_application_interview": {"sms": true, "email": true, "whatsapp": true}}'::jsonb,
    do_not_disturb_enabled boolean DEFAULT false,
    do_not_disturb_start time without time zone DEFAULT '22:00:00'::time without time zone,
    do_not_disturb_end time without time zone DEFAULT '08:00:00'::time without time zone,
    daily_digest_enabled boolean DEFAULT false,
    daily_digest_time time without time zone DEFAULT '18:00:00'::time without time zone,
    weekly_summary_enabled boolean DEFAULT false,
    weekly_summary_day integer DEFAULT 1,
    in_app_enabled boolean DEFAULT true NOT NULL
);


--
-- Name: TABLE user_notification_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_notification_preferences IS 'Preferencias de notificaciones personalizadas por usuario';


--
-- Name: COLUMN user_notification_preferences.notification_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_notification_preferences.notification_preferences IS 'ConfiguraciÃƒÂ³n detallada de quÃƒÂ© canales usar para cada tipo de notificaciÃƒÂ³n';


--
-- Name: COLUMN user_notification_preferences.in_app_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_notification_preferences.in_app_enabled IS 'Habilita/deshabilita notificaciones in-app para este usuario';


--
-- Name: v_unread_chat_email_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_unread_chat_email_stats AS
 SELECT cp.user_id,
    u.email,
    u.full_name,
    count(DISTINCT m.id) AS unread_message_count,
    count(DISTINCT m.conversation_id) AS conversations_with_unread,
    min(m.created_at) AS oldest_unread_message,
    max(m.created_at) AS newest_unread_message
   FROM ((public.chat_participants cp
     JOIN public.profiles u ON ((cp.user_id = u.id)))
     LEFT JOIN public.messages m ON (((m.conversation_id = cp.conversation_id) AND (m.sender_id <> cp.user_id) AND ((m.read_by IS NULL) OR (NOT (m.read_by ? (cp.user_id)::text))))))
  GROUP BY cp.user_id, u.email, u.full_name
 HAVING (count(DISTINCT m.id) > 0);


--
-- Name: vacation_balance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vacation_balance (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    year integer NOT NULL,
    total_days_available integer DEFAULT 0 NOT NULL,
    days_used integer DEFAULT 0 NOT NULL,
    days_pending integer DEFAULT 0 NOT NULL,
    days_remaining integer GENERATED ALWAYS AS (((total_days_available - days_used) - days_pending)) STORED,
    hire_anniversary_date date,
    balance_reset_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT days_non_negative CHECK (((days_used >= 0) AND (days_pending >= 0)))
);


--
-- Name: work_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_schedules (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_working boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT work_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: TABLE work_schedules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.work_schedules IS 'Employee work schedules by day of week (0=Sunday, 6=Saturday)';


--
-- Name: COLUMN work_schedules.day_of_week; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.work_schedules.day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';


--
-- Name: COLUMN work_schedules.is_working; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.work_schedules.is_working IS 'Whether the employee is available to work on this day';


--
-- Name: absence_approval_requests absence_approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_approval_requests
    ADD CONSTRAINT absence_approval_requests_pkey PRIMARY KEY (id);


--
-- Name: absence_approval_requests absence_approval_requests_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_approval_requests
    ADD CONSTRAINT absence_approval_requests_unique UNIQUE (absence_id);


--
-- Name: appointments appointments_confirmation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_confirmation_token_key UNIQUE (confirmation_token);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: billing_audit_log billing_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_audit_log
    ADD CONSTRAINT billing_audit_log_pkey PRIMARY KEY (id);


--
-- Name: bug_reports bug_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_pkey PRIMARY KEY (id);


--
-- Name: business_categories business_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_categories
    ADD CONSTRAINT business_categories_name_key UNIQUE (name);


--
-- Name: business_categories business_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_categories
    ADD CONSTRAINT business_categories_pkey PRIMARY KEY (id);


--
-- Name: business_categories business_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_categories
    ADD CONSTRAINT business_categories_slug_key UNIQUE (slug);


--
-- Name: business_closed_days business_closed_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_closed_days
    ADD CONSTRAINT business_closed_days_pkey PRIMARY KEY (id);


--
-- Name: business_confirmation_policies business_confirmation_policies_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_confirmation_policies
    ADD CONSTRAINT business_confirmation_policies_business_id_key UNIQUE (business_id);


--
-- Name: business_confirmation_policies business_confirmation_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_confirmation_policies
    ADD CONSTRAINT business_confirmation_policies_pkey PRIMARY KEY (id);


--
-- Name: business_employees business_employees_business_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_business_id_employee_id_key UNIQUE (business_id, employee_id);


--
-- Name: business_employees business_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_pkey PRIMARY KEY (id);


--
-- Name: business_favorites business_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_favorites
    ADD CONSTRAINT business_favorites_pkey PRIMARY KEY (id);


--
-- Name: business_notification_settings business_notification_settings_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_notification_settings
    ADD CONSTRAINT business_notification_settings_business_id_key UNIQUE (business_id);


--
-- Name: business_notification_settings business_notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_notification_settings
    ADD CONSTRAINT business_notification_settings_pkey PRIMARY KEY (id);


--
-- Name: business_plans business_plans_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plans
    ADD CONSTRAINT business_plans_business_id_key UNIQUE (business_id);


--
-- Name: business_plans business_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plans
    ADD CONSTRAINT business_plans_pkey PRIMARY KEY (id);


--
-- Name: business_plans business_plans_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plans
    ADD CONSTRAINT business_plans_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: business_resources business_resources_business_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_resources
    ADD CONSTRAINT business_resources_business_id_name_key UNIQUE (business_id, name);


--
-- Name: business_resources business_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_resources
    ADD CONSTRAINT business_resources_pkey PRIMARY KEY (id);


--
-- Name: business_roles business_roles_business_id_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_roles
    ADD CONSTRAINT business_roles_business_id_user_id_role_key UNIQUE (business_id, user_id, role);


--
-- Name: business_roles business_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_roles
    ADD CONSTRAINT business_roles_pkey PRIMARY KEY (id);


--
-- Name: business_subcategories business_subcategories_business_id_subcategory_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subcategories
    ADD CONSTRAINT business_subcategories_business_id_subcategory_id_key UNIQUE (business_id, subcategory_id);


--
-- Name: business_subcategories business_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subcategories
    ADD CONSTRAINT business_subcategories_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_invitation_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_invitation_code_key UNIQUE (invitation_code);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);


--
-- Name: calendar_sync_settings calendar_sync_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_sync_settings
    ADD CONSTRAINT calendar_sync_settings_pkey PRIMARY KEY (id);


--
-- Name: calendar_sync_settings calendar_sync_settings_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_sync_settings
    ADD CONSTRAINT calendar_sync_settings_user_id_provider_key UNIQUE (user_id, provider);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_participants chat_participants_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- Name: chat_participants chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (id);


--
-- Name: chat_typing_indicators chat_typing_indicators_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_typing_indicators
    ADD CONSTRAINT chat_typing_indicators_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- Name: chat_typing_indicators chat_typing_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_typing_indicators
    ADD CONSTRAINT chat_typing_indicators_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: conversation_members conversation_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: cron_execution_logs cron_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cron_execution_logs
    ADD CONSTRAINT cron_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: discount_code_uses discount_code_uses_business_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_uses
    ADD CONSTRAINT discount_code_uses_business_code_unique UNIQUE (discount_code_id, business_id);


--
-- Name: discount_code_uses discount_code_uses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_uses
    ADD CONSTRAINT discount_code_uses_pkey PRIMARY KEY (id);


--
-- Name: discount_codes discount_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_code_key UNIQUE (code);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: document_types document_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_pkey PRIMARY KEY (id);


--
-- Name: employee_absences employee_absences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_absences
    ADD CONSTRAINT employee_absences_pkey PRIMARY KEY (id);


--
-- Name: employee_join_requests employee_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_join_requests
    ADD CONSTRAINT employee_join_requests_pkey PRIMARY KEY (id);


--
-- Name: employee_profiles employee_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_pkey PRIMARY KEY (id);


--
-- Name: employee_profiles employee_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_user_id_key UNIQUE (user_id);


--
-- Name: employee_requests employee_requests_business_id_user_id_status_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_business_id_user_id_status_key UNIQUE (business_id, user_id, status);


--
-- Name: employee_requests employee_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_pkey PRIMARY KEY (id);


--
-- Name: employee_services employee_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_pkey PRIMARY KEY (id);


--
-- Name: employee_time_off employee_time_off_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off
    ADD CONSTRAINT employee_time_off_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: genders genders_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genders
    ADD CONSTRAINT genders_name_key UNIQUE (name);


--
-- Name: genders genders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genders
    ADD CONSTRAINT genders_pkey PRIMARY KEY (id);


--
-- Name: health_insurance health_insurance_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_insurance
    ADD CONSTRAINT health_insurance_name_key UNIQUE (name);


--
-- Name: health_insurance health_insurance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_insurance
    ADD CONSTRAINT health_insurance_pkey PRIMARY KEY (id);


--
-- Name: in_app_notifications in_app_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- Name: job_applications job_applications_vacancy_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_vacancy_id_user_id_key UNIQUE (vacancy_id, user_id);


--
-- Name: job_vacancies job_vacancies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_vacancies
    ADD CONSTRAINT job_vacancies_pkey PRIMARY KEY (id);


--
-- Name: location_expense_config location_expense_config_location_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_expense_config
    ADD CONSTRAINT location_expense_config_location_id_key UNIQUE (location_id);


--
-- Name: location_expense_config location_expense_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_expense_config
    ADD CONSTRAINT location_expense_config_pkey PRIMARY KEY (id);


--
-- Name: location_media location_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_media
    ADD CONSTRAINT location_media_pkey PRIMARY KEY (id);


--
-- Name: location_services location_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_services
    ADD CONSTRAINT location_services_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_stripe_payment_method_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_stripe_payment_method_id_key UNIQUE (stripe_payment_method_id);


--
-- Name: payroll_configuration payroll_configuration_business_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_configuration
    ADD CONSTRAINT payroll_configuration_business_id_employee_id_key UNIQUE (business_id, employee_id);


--
-- Name: payroll_configuration payroll_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_configuration
    ADD CONSTRAINT payroll_configuration_pkey PRIMARY KEY (id);


--
-- Name: payroll_payments payroll_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_payments
    ADD CONSTRAINT payroll_payments_pkey PRIMARY KEY (id);


--
-- Name: permission_audit_log permission_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_pkey PRIMARY KEY (id);


--
-- Name: permission_templates permission_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_templates
    ADD CONSTRAINT permission_templates_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: public_holidays public_holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_holidays
    ADD CONSTRAINT public_holidays_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: resource_services resource_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_services
    ADD CONSTRAINT resource_services_pkey PRIMARY KEY (id);


--
-- Name: resource_services resource_services_resource_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_services
    ADD CONSTRAINT resource_services_resource_id_service_id_key UNIQUE (resource_id, service_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: subscription_events subscription_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_stripe_invoice_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_stripe_invoice_id_key UNIQUE (stripe_invoice_id);


--
-- Name: subscription_payments subscription_payments_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (key);


--
-- Name: tax_configurations tax_configurations_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_configurations
    ADD CONSTRAINT tax_configurations_business_id_key UNIQUE (business_id);


--
-- Name: tax_configurations tax_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_configurations
    ADD CONSTRAINT tax_configurations_pkey PRIMARY KEY (id);


--
-- Name: tax_liabilities tax_liabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_liabilities
    ADD CONSTRAINT tax_liabilities_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: public_holidays unique_country_holiday; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_holidays
    ADD CONSTRAINT unique_country_holiday UNIQUE (country_id, holiday_date);


--
-- Name: employee_services unique_employee_service; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT unique_employee_service UNIQUE (employee_id, service_id, business_id);


--
-- Name: invoices unique_invoice_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT unique_invoice_number UNIQUE (business_id, invoice_number);


--
-- Name: location_services unique_location_service; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_services
    ADD CONSTRAINT unique_location_service UNIQUE (location_id, service_id);


--
-- Name: business_favorites unique_user_business_favorite; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_favorites
    ADD CONSTRAINT unique_user_business_favorite UNIQUE (user_id, business_id);


--
-- Name: business_closed_days uq_business_closed_day; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_closed_days
    ADD CONSTRAINT uq_business_closed_day UNIQUE (business_id, location_id, closed_date);


--
-- Name: recurring_expenses uq_recurring_expenses_employee_payroll; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT uq_recurring_expenses_employee_payroll UNIQUE NULLS NOT DISTINCT (business_id, employee_id, category);


--
-- Name: CONSTRAINT uq_recurring_expenses_employee_payroll ON recurring_expenses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT uq_recurring_expenses_employee_payroll ON public.recurring_expenses IS 'Unique constraint para UPSERT de nÃ³mina: un solo registro por (business_id, employee_id, category). Creado en migraciÃ³n 20251115000011.';


--
-- Name: usage_metrics usage_metrics_business_date_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_business_date_unique UNIQUE (business_id, metric_date);


--
-- Name: usage_metrics usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_permissions user_permissions_business_id_user_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_business_id_user_id_permission_key UNIQUE (business_id, user_id, permission);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: vacation_balance vacation_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacation_balance
    ADD CONSTRAINT vacation_balance_pkey PRIMARY KEY (id);


--
-- Name: vacation_balance vacation_balance_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacation_balance
    ADD CONSTRAINT vacation_balance_unique UNIQUE (business_id, employee_id, year);


--
-- Name: work_schedules work_schedules_employee_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_employee_id_day_of_week_key UNIQUE (employee_id, day_of_week);


--
-- Name: work_schedules work_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_pkey PRIMARY KEY (id);


--
-- Name: appointments_with_relations_business_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_with_relations_business_idx ON public.appointments_with_relations USING btree (business_id);


--
-- Name: appointments_with_relations_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_with_relations_client_idx ON public.appointments_with_relations USING btree (client_id);


--
-- Name: appointments_with_relations_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_with_relations_employee_idx ON public.appointments_with_relations USING btree (employee_id);


--
-- Name: appointments_with_relations_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX appointments_with_relations_id_idx ON public.appointments_with_relations USING btree (id);


--
-- Name: appointments_with_relations_start_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_with_relations_start_time_idx ON public.appointments_with_relations USING btree (start_time);


--
-- Name: appointments_with_relations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_with_relations_status_idx ON public.appointments_with_relations USING btree (status);


--
-- Name: employee_join_requests_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_join_requests_business_id ON public.employee_join_requests USING btree (business_id, status);


--
-- Name: employee_join_requests_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_join_requests_employee_id ON public.employee_join_requests USING btree (employee_id);


--
-- Name: employee_join_requests_invite_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_join_requests_invite_code ON public.employee_join_requests USING btree (invite_code) WHERE (invite_code IS NOT NULL);


--
-- Name: employee_join_requests_unique_emp_biz; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_join_requests_unique_emp_biz ON public.employee_join_requests USING btree (employee_id, business_id) WHERE ((employee_id IS NOT NULL) AND (status = 'pending'::text));


--
-- Name: idx_absence_approval_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_absence_approval_business ON public.absence_approval_requests USING btree (business_id);


--
-- Name: idx_absence_approval_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_absence_approval_status ON public.absence_approval_requests USING btree (status);


--
-- Name: idx_absences_business_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_absences_business_status ON public.employee_absences USING btree (business_id, status);


--
-- Name: idx_absences_employee_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_absences_employee_dates ON public.employee_absences USING btree (employee_id, start_date, end_date);


--
-- Name: idx_appointments_auto_no_show_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_auto_no_show_at ON public.appointments USING btree (auto_no_show_at) WHERE (auto_no_show_at IS NOT NULL);


--
-- Name: idx_appointments_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_business_id ON public.appointments USING btree (business_id);


--
-- Name: idx_appointments_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_client_id ON public.appointments USING btree (client_id);


--
-- Name: idx_appointments_client_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_client_start ON public.appointments USING btree (client_id, start_time);


--
-- Name: idx_appointments_client_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_client_status ON public.appointments USING btree (client_id, status);


--
-- Name: idx_appointments_completed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_completed_at ON public.appointments USING btree (completed_at);


--
-- Name: idx_appointments_confirmation_deadline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_confirmation_deadline ON public.appointments USING btree (confirmation_deadline) WHERE (confirmation_deadline IS NOT NULL);


--
-- Name: idx_appointments_confirmation_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_confirmation_token ON public.appointments USING btree (confirmation_token) WHERE (confirmation_token IS NOT NULL);


--
-- Name: idx_appointments_confirmed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_confirmed ON public.appointments USING btree (confirmed);


--
-- Name: idx_appointments_date_range; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_date_range ON public.appointments USING btree (start_time, end_time);


--
-- Name: idx_appointments_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_employee_id ON public.appointments USING btree (employee_id);


--
-- Name: idx_appointments_employee_metrics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_employee_metrics ON public.appointments USING btree (employee_id, business_id, status, start_time) WHERE (status = 'completed'::public.appointment_status);


--
-- Name: idx_appointments_employee_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_employee_start ON public.appointments USING btree (employee_id, start_time) WHERE (employee_id IS NOT NULL);


--
-- Name: idx_appointments_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_location_id ON public.appointments USING btree (location_id);


--
-- Name: idx_appointments_location_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_location_start ON public.appointments USING btree (location_id, start_time) WHERE (status <> ALL (ARRAY['cancelled'::public.appointment_status, 'no_show'::public.appointment_status]));


--
-- Name: idx_appointments_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_payment_status ON public.appointments USING btree (payment_status) WHERE (payment_status = 'paid'::public.payment_status);


--
-- Name: idx_appointments_resource_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_resource_id ON public.appointments USING btree (resource_id);


--
-- Name: idx_appointments_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_service_id ON public.appointments USING btree (service_id);


--
-- Name: idx_appointments_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_start_time ON public.appointments USING btree (start_time);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_be_setup_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_be_setup_completed ON public.business_employees USING btree (business_id, setup_completed) WHERE (setup_completed = false);


--
-- Name: idx_billing_audit_log_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_audit_log_action ON public.billing_audit_log USING btree (action);


--
-- Name: idx_billing_audit_log_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_audit_log_business_id ON public.billing_audit_log USING btree (business_id);


--
-- Name: idx_billing_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_audit_log_created_at ON public.billing_audit_log USING btree (created_at DESC);


--
-- Name: idx_billing_audit_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_audit_log_entity ON public.billing_audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_bug_reports_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bug_reports_created_at ON public.bug_reports USING btree (created_at DESC);


--
-- Name: idx_bug_reports_environment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bug_reports_environment ON public.bug_reports USING btree (environment);


--
-- Name: idx_bug_reports_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bug_reports_priority ON public.bug_reports USING btree (priority);


--
-- Name: idx_bug_reports_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bug_reports_severity ON public.bug_reports USING btree (severity);


--
-- Name: idx_bug_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bug_reports_status ON public.bug_reports USING btree (status);


--
-- Name: idx_bug_reports_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bug_reports_user_id ON public.bug_reports USING btree (user_id);


--
-- Name: idx_business_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_categories_is_active ON public.business_categories USING btree (is_active);


--
-- Name: idx_business_categories_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_categories_parent_id ON public.business_categories USING btree (parent_id);


--
-- Name: idx_business_categories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_categories_slug ON public.business_categories USING btree (slug);


--
-- Name: idx_business_closed_days_business_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_closed_days_business_date ON public.business_closed_days USING btree (business_id, closed_date);


--
-- Name: idx_business_closed_days_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_closed_days_business_id ON public.business_closed_days USING btree (business_id);


--
-- Name: idx_business_closed_days_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_closed_days_date ON public.business_closed_days USING btree (closed_date);


--
-- Name: idx_business_closed_days_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_closed_days_location_id ON public.business_closed_days USING btree (location_id);


--
-- Name: idx_business_confirmation_policies_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_confirmation_policies_business_id ON public.business_confirmation_policies USING btree (business_id);


--
-- Name: idx_business_employees_allow_client_messages; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_allow_client_messages ON public.business_employees USING btree (allow_client_messages) WHERE (is_active = true);


--
-- Name: idx_business_employees_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_business_id ON public.business_employees USING btree (business_id);


--
-- Name: idx_business_employees_business_location_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_business_location_active ON public.business_employees USING btree (business_id, location_id, is_active, status);


--
-- Name: idx_business_employees_business_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_business_status ON public.business_employees USING btree (business_id, status);


--
-- Name: idx_business_employees_employee_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_employee_business ON public.business_employees USING btree (employee_id, business_id);


--
-- Name: idx_business_employees_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_employee_id ON public.business_employees USING btree (employee_id);


--
-- Name: idx_business_employees_job_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_job_title ON public.business_employees USING btree (job_title) WHERE (job_title IS NOT NULL);


--
-- Name: idx_business_employees_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_location_id ON public.business_employees USING btree (location_id);


--
-- Name: idx_business_employees_location_transfer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_location_transfer ON public.business_employees USING btree (location_id, transfer_to_location_id, transfer_status);


--
-- Name: idx_business_employees_pending_transfers; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_pending_transfers ON public.business_employees USING btree (transfer_status, transfer_effective_date) WHERE (transfer_status = 'pending'::text);


--
-- Name: idx_business_employees_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_status ON public.business_employees USING btree (status);


--
-- Name: idx_business_employees_transfer_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_employees_transfer_business ON public.business_employees USING btree (business_id, transfer_status) WHERE (transfer_status IS NOT NULL);


--
-- Name: idx_business_favorites_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_favorites_business_id ON public.business_favorites USING btree (business_id);


--
-- Name: idx_business_favorites_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_favorites_created_at ON public.business_favorites USING btree (created_at DESC);


--
-- Name: idx_business_favorites_user_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_favorites_user_business ON public.business_favorites USING btree (user_id, business_id);


--
-- Name: idx_business_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_favorites_user_id ON public.business_favorites USING btree (user_id);


--
-- Name: idx_business_notification_settings_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_notification_settings_business_id ON public.business_notification_settings USING btree (business_id);


--
-- Name: idx_business_plans_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_plans_business_id ON public.business_plans USING btree (business_id);


--
-- Name: idx_business_plans_stripe_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_plans_stripe_customer ON public.business_plans USING btree (stripe_customer_id);


--
-- Name: idx_business_plans_stripe_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_plans_stripe_subscription ON public.business_plans USING btree (stripe_subscription_id);


--
-- Name: idx_business_ratings_stats_average_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_ratings_stats_average_rating ON public.business_ratings_stats USING btree (average_rating DESC);


--
-- Name: idx_business_ratings_stats_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_business_ratings_stats_business_id ON public.business_ratings_stats USING btree (business_id);


--
-- Name: idx_business_ratings_stats_review_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_ratings_stats_review_count ON public.business_ratings_stats USING btree (review_count DESC);


--
-- Name: idx_business_resources_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_resources_active ON public.business_resources USING btree (is_active);


--
-- Name: idx_business_resources_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_resources_business_id ON public.business_resources USING btree (business_id);


--
-- Name: idx_business_resources_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_resources_location_id ON public.business_resources USING btree (location_id);


--
-- Name: idx_business_resources_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_resources_type ON public.business_resources USING btree (resource_type);


--
-- Name: idx_business_roles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_active ON public.business_roles USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_business_roles_business_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_business_active ON public.business_roles USING btree (business_id, is_active);


--
-- Name: idx_business_roles_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_business_id ON public.business_roles USING btree (business_id);


--
-- Name: idx_business_roles_direct_reports; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_direct_reports ON public.business_roles USING btree (reports_to, business_id) WHERE ((reports_to IS NOT NULL) AND (is_active = true));


--
-- Name: idx_business_roles_hierarchy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_hierarchy ON public.business_roles USING btree (business_id, hierarchy_level);


--
-- Name: idx_business_roles_hierarchy_full; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_hierarchy_full ON public.business_roles USING btree (business_id, hierarchy_level, reports_to, is_active) WHERE (is_active = true);


--
-- Name: idx_business_roles_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_lookup ON public.business_roles USING btree (business_id, user_id, is_active);


--
-- Name: idx_business_roles_reports_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_reports_to ON public.business_roles USING btree (reports_to) WHERE (reports_to IS NOT NULL);


--
-- Name: idx_business_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_role ON public.business_roles USING btree (role);


--
-- Name: idx_business_roles_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_user_active ON public.business_roles USING btree (user_id, is_active);


--
-- Name: idx_business_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_roles_user_id ON public.business_roles USING btree (user_id);


--
-- Name: idx_business_subcategories_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_subcategories_business_id ON public.business_subcategories USING btree (business_id);


--
-- Name: idx_business_subcategories_subcategory_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_subcategories_subcategory_id ON public.business_subcategories USING btree (subcategory_id);


--
-- Name: idx_businesses_average_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_average_rating ON public.businesses USING btree (average_rating DESC);


--
-- Name: idx_businesses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_category ON public.businesses USING btree (category);


--
-- Name: idx_businesses_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_category_id ON public.businesses USING btree (category_id);


--
-- Name: idx_businesses_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_city_id ON public.businesses USING btree (city_id);


--
-- Name: idx_businesses_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_country_id ON public.businesses USING btree (country_id);


--
-- Name: idx_businesses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_created_at ON public.businesses USING btree (created_at DESC);


--
-- Name: idx_businesses_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_email ON public.businesses USING btree (email);


--
-- Name: idx_businesses_invitation_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_invitation_code ON public.businesses USING btree (invitation_code) WHERE (invitation_code IS NOT NULL);


--
-- Name: idx_businesses_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_is_active ON public.businesses USING btree (is_active);


--
-- Name: idx_businesses_is_configured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_is_configured ON public.businesses USING btree (is_configured) WHERE (is_configured = true);


--
-- Name: INDEX idx_businesses_is_configured; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_businesses_is_configured IS 'Optimiza bÃºsquedas de negocios configurados para clientes.';


--
-- Name: idx_businesses_legal_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_legal_entity_type ON public.businesses USING btree (legal_entity_type);


--
-- Name: idx_businesses_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_name_trgm ON public.businesses USING gin (name public.gin_trgm_ops);


--
-- Name: idx_businesses_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_owner_id ON public.businesses USING btree (owner_id);


--
-- Name: idx_businesses_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_region_id ON public.businesses USING btree (region_id);


--
-- Name: idx_businesses_resource_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_resource_model ON public.businesses USING btree (resource_model);


--
-- Name: idx_businesses_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_search_vector ON public.businesses USING gin (search_vector);


--
-- Name: idx_businesses_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_slug ON public.businesses USING btree (slug);


--
-- Name: idx_businesses_tax_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_tax_id ON public.businesses USING btree (tax_id) WHERE (tax_id IS NOT NULL);


--
-- Name: idx_businesses_total_reviews; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_total_reviews ON public.businesses USING btree (total_reviews DESC);


--
-- Name: idx_calendar_sync_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_sync_settings_user_id ON public.calendar_sync_settings USING btree (user_id);


--
-- Name: idx_chat_conversations_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_business ON public.chat_conversations USING btree (business_id);


--
-- Name: idx_chat_conversations_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_created_by ON public.chat_conversations USING btree (created_by);


--
-- Name: idx_chat_conversations_last_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_last_message ON public.chat_conversations USING btree (last_message_at DESC);


--
-- Name: idx_chat_messages_conv_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_conv_created ON public.chat_messages USING btree (conversation_id, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_chat_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_conversation ON public.chat_messages USING btree (conversation_id, sent_at DESC);


--
-- Name: idx_chat_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_sender ON public.chat_messages USING btree (sender_id);


--
-- Name: idx_chat_messages_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_sent_at ON public.chat_messages USING btree (sent_at DESC);


--
-- Name: idx_chat_participants_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_participants_active ON public.chat_participants USING btree (conversation_id, user_id) WHERE ((left_at IS NULL) AND (is_muted = false));


--
-- Name: INDEX idx_chat_participants_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_chat_participants_active IS 'Ãndice para optimizar bÃºsqueda de participantes activos y no silenciados en trigger de notificaciones';


--
-- Name: idx_chat_participants_conv_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_participants_conv_active ON public.chat_participants USING btree (conversation_id, user_id) WHERE (left_at IS NULL);


--
-- Name: idx_chat_participants_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_participants_conversation ON public.chat_participants USING btree (conversation_id);


--
-- Name: idx_chat_participants_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_participants_user ON public.chat_participants USING btree (user_id);


--
-- Name: idx_chat_participants_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_participants_user_active ON public.chat_participants USING btree (user_id, conversation_id) WHERE (left_at IS NULL);


--
-- Name: idx_chat_typing_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_typing_expires ON public.chat_typing_indicators USING btree (expires_at);


--
-- Name: idx_cities_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_region_id ON public.cities USING btree (region_id);


--
-- Name: idx_conversation_members_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_members_conversation ON public.conversation_members USING btree (conversation_id);


--
-- Name: idx_conversation_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_members_user ON public.conversation_members USING btree (user_id);


--
-- Name: idx_conversations_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_archived ON public.chat_conversations USING btree (is_archived) WHERE (is_archived = false);


--
-- Name: idx_conversations_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_business ON public.chat_conversations USING btree (business_id) WHERE (business_id IS NOT NULL);


--
-- Name: idx_conversations_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_created_by ON public.conversations USING btree (created_by);


--
-- Name: idx_conversations_last_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_last_message ON public.chat_conversations USING btree (last_message_at DESC);


--
-- Name: idx_conversations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_type ON public.chat_conversations USING btree (type);


--
-- Name: idx_countries_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_countries_code ON public.countries USING btree (code);


--
-- Name: idx_cron_logs_job_name_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cron_logs_job_name_created ON public.cron_execution_logs USING btree (job_name, created_at DESC);


--
-- Name: idx_discount_code_uses_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_code_uses_business_id ON public.discount_code_uses USING btree (business_id);


--
-- Name: idx_discount_code_uses_code_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_code_uses_code_id ON public.discount_code_uses USING btree (discount_code_id);


--
-- Name: idx_discount_code_uses_used_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_code_uses_used_at ON public.discount_code_uses USING btree (used_at DESC);


--
-- Name: idx_discount_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_codes_code ON public.discount_codes USING btree (code) WHERE (is_active = true);


--
-- Name: idx_discount_codes_valid_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_codes_valid_dates ON public.discount_codes USING btree (valid_from, valid_until) WHERE (is_active = true);


--
-- Name: idx_document_types_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_types_country_id ON public.document_types USING btree (country_id);


--
-- Name: idx_employee_absences_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_absences_business ON public.employee_absences USING btree (business_id);


--
-- Name: idx_employee_absences_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_absences_dates ON public.employee_absences USING btree (start_date, end_date);


--
-- Name: idx_employee_absences_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_absences_employee ON public.employee_absences USING btree (employee_id);


--
-- Name: idx_employee_absences_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_absences_employee_id ON public.employee_absences USING btree (employee_id);


--
-- Name: idx_employee_absences_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_absences_status ON public.employee_absences USING btree (status);


--
-- Name: idx_employee_absences_status_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_absences_status_dates ON public.employee_absences USING btree (employee_id, status, start_date, end_date);


--
-- Name: idx_employee_profiles_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_profiles_available ON public.employee_profiles USING btree (available_for_hire) WHERE (available_for_hire = true);


--
-- Name: idx_employee_profiles_certifications; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_profiles_certifications ON public.employee_profiles USING gin (certifications);


--
-- Name: idx_employee_profiles_languages; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_profiles_languages ON public.employee_profiles USING gin (languages);


--
-- Name: idx_employee_profiles_specializations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_profiles_specializations ON public.employee_profiles USING gin (specializations);


--
-- Name: idx_employee_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles USING btree (user_id);


--
-- Name: idx_employee_ratings_stats_average_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_ratings_stats_average_rating ON public.employee_ratings_stats USING btree (average_rating DESC);


--
-- Name: idx_employee_ratings_stats_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_employee_ratings_stats_employee_id ON public.employee_ratings_stats USING btree (employee_id);


--
-- Name: idx_employee_requests_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_requests_business_id ON public.employee_requests USING btree (business_id);


--
-- Name: idx_employee_requests_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_requests_created_at ON public.employee_requests USING btree (created_at DESC);


--
-- Name: idx_employee_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_requests_status ON public.employee_requests USING btree (status);


--
-- Name: idx_employee_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_requests_user_id ON public.employee_requests USING btree (user_id);


--
-- Name: idx_employee_services_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_services_active ON public.employee_services USING btree (is_active);


--
-- Name: idx_employee_services_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_services_business_id ON public.employee_services USING btree (business_id);


--
-- Name: idx_employee_services_business_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_services_business_service ON public.employee_services USING btree (business_id, service_id);


--
-- Name: idx_employee_services_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_services_employee_id ON public.employee_services USING btree (employee_id);


--
-- Name: idx_employee_services_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_services_location_id ON public.employee_services USING btree (location_id);


--
-- Name: idx_employee_services_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_services_service_id ON public.employee_services USING btree (service_id);


--
-- Name: idx_error_logs_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_context ON public.error_logs USING gin (context);


--
-- Name: idx_error_logs_environment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_environment ON public.error_logs USING btree (environment);


--
-- Name: idx_error_logs_error_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_error_hash ON public.error_logs USING btree (error_hash);


--
-- Name: idx_error_logs_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_level ON public.error_logs USING btree (level);


--
-- Name: idx_error_logs_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_resolved ON public.error_logs USING btree (resolved);


--
-- Name: idx_error_logs_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_source ON public.error_logs USING btree (source);


--
-- Name: idx_error_logs_summary; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_error_logs_summary ON public.error_logs_summary USING btree (source, level, COALESCE(component, ''::text), environment, date);


--
-- Name: idx_error_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_timestamp ON public.error_logs USING btree ("timestamp" DESC);


--
-- Name: idx_error_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_user_id ON public.error_logs USING btree (user_id);


--
-- Name: idx_in_app_notifs_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifs_active ON public.in_app_notifications USING btree (user_id, created_at DESC) WHERE (status <> 'archived'::public.notification_status);


--
-- Name: INDEX idx_in_app_notifs_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_in_app_notifs_active IS 'Optimiza queries de notificaciones activas';


--
-- Name: idx_in_app_notifs_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifs_business ON public.in_app_notifications USING btree (business_id) WHERE (business_id IS NOT NULL);


--
-- Name: idx_in_app_notifs_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifs_expires ON public.in_app_notifications USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_in_app_notifs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifs_type ON public.in_app_notifications USING btree (type) WHERE (status <> 'archived'::public.notification_status);


--
-- Name: idx_in_app_notifs_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifs_user_status ON public.in_app_notifications USING btree (user_id, status, created_at DESC);


--
-- Name: INDEX idx_in_app_notifs_user_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_in_app_notifs_user_status IS 'Optimiza queries principales del feed';


--
-- Name: idx_invoice_items_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoices_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_business ON public.invoices USING btree (business_id);


--
-- Name: idx_invoices_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_client ON public.invoices USING btree (client_id);


--
-- Name: idx_invoices_issue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_issue_date ON public.invoices USING btree (issue_date DESC);


--
-- Name: idx_invoices_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_number ON public.invoices USING btree (invoice_number);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_job_applications_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_business_id ON public.job_applications USING btree (business_id);


--
-- Name: idx_job_applications_business_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_business_status ON public.job_applications USING btree (business_id, status) INCLUDE (vacancy_id, user_id);


--
-- Name: idx_job_applications_cv_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_cv_url ON public.job_applications USING btree (cv_url) WHERE (cv_url IS NOT NULL);


--
-- Name: idx_job_applications_in_selection; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_in_selection ON public.job_applications USING btree (vacancy_id, status) WHERE ((status)::text = 'in_selection_process'::text);


--
-- Name: idx_job_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_status ON public.job_applications USING btree (status);


--
-- Name: idx_job_applications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_user_id ON public.job_applications USING btree (user_id);


--
-- Name: idx_job_applications_vacancy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_vacancy_id ON public.job_applications USING btree (vacancy_id);


--
-- Name: idx_job_vacancies_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_business_id ON public.job_vacancies USING btree (business_id);


--
-- Name: idx_job_vacancies_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_city ON public.job_vacancies USING btree (location_city) WHERE ((status)::text = 'open'::text);


--
-- Name: idx_job_vacancies_experience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_experience ON public.job_vacancies USING btree (experience_required) WHERE ((status)::text = 'open'::text);


--
-- Name: idx_job_vacancies_experience_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_experience_level ON public.job_vacancies USING btree (experience_level) WHERE ((status)::text = 'open'::text);


--
-- Name: idx_job_vacancies_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_published_at ON public.job_vacancies USING btree (published_at);


--
-- Name: idx_job_vacancies_remote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_remote ON public.job_vacancies USING btree (remote_allowed) WHERE ((remote_allowed = true) AND ((status)::text = 'open'::text));


--
-- Name: idx_job_vacancies_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_status ON public.job_vacancies USING btree (status);


--
-- Name: idx_job_vacancies_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_vacancies_status_created ON public.job_vacancies USING btree (status, created_at DESC) WHERE ((status)::text = 'open'::text);


--
-- Name: idx_location_expense_config_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_expense_config_business_id ON public.location_expense_config USING btree (business_id);


--
-- Name: idx_location_expense_config_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_expense_config_location_id ON public.location_expense_config USING btree (location_id);


--
-- Name: idx_location_services_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_services_active ON public.location_services USING btree (is_active);


--
-- Name: idx_location_services_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_services_location_id ON public.location_services USING btree (location_id);


--
-- Name: idx_location_services_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_services_service_id ON public.location_services USING btree (service_id);


--
-- Name: idx_locations_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_business_id ON public.locations USING btree (business_id);


--
-- Name: idx_locations_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_city ON public.locations USING btree (city);


--
-- Name: idx_locations_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_coordinates ON public.locations USING btree (latitude, longitude);


--
-- Name: idx_locations_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_is_active ON public.locations USING btree (is_active);


--
-- Name: idx_locations_is_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_is_primary ON public.locations USING btree (business_id, is_primary) WHERE (is_primary = true);


--
-- Name: idx_locations_one_primary_per_business; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_locations_one_primary_per_business ON public.locations USING btree (business_id) WHERE (is_primary = true);


--
-- Name: INDEX idx_locations_one_primary_per_business; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_locations_one_primary_per_business IS 'Asegura que solo una sede puede ser marcada como principal por negocio.';


--
-- Name: idx_login_logs_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_email ON public.login_logs USING btree (email);


--
-- Name: idx_login_logs_ip_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_ip_address ON public.login_logs USING btree (ip_address);


--
-- Name: idx_login_logs_is_suspicious; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_is_suspicious ON public.login_logs USING btree (is_suspicious) WHERE (is_suspicious = true);


--
-- Name: idx_login_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_status ON public.login_logs USING btree (status);


--
-- Name: idx_login_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_timestamp ON public.login_logs USING btree ("timestamp" DESC);


--
-- Name: idx_login_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_user_id ON public.login_logs USING btree (user_id);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.chat_messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_messages_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_deleted ON public.chat_messages USING btree (conversation_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_messages_delivery_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_delivery_status ON public.messages USING btree (conversation_id, delivery_status) WHERE (is_deleted = false);


--
-- Name: INDEX idx_messages_delivery_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_messages_delivery_status IS 'Ãndice para queries de mensajes por estado de entrega';


--
-- Name: idx_messages_pinned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_pinned ON public.messages USING btree (conversation_id, is_pinned) WHERE (is_pinned = true);


--
-- Name: idx_messages_read_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_read_by ON public.messages USING gin (read_by);


--
-- Name: INDEX idx_messages_read_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_messages_read_by IS 'Ãndice GIN para bÃºsquedas en read_by array';


--
-- Name: idx_messages_reply; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_reply ON public.chat_messages USING btree (reply_to_id) WHERE (reply_to_id IS NOT NULL);


--
-- Name: idx_messages_reply_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_reply_to ON public.messages USING btree (reply_to);


--
-- Name: idx_messages_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_search_vector ON public.messages USING gin (search_vector);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.chat_messages USING btree (sender_id);


--
-- Name: idx_mv_vacancy_selection_stats; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_mv_vacancy_selection_stats ON public.mv_vacancy_selection_stats USING btree (vacancy_id);


--
-- Name: idx_notification_log_appointment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_appointment_id ON public.notification_log USING btree (appointment_id);


--
-- Name: idx_notification_log_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_business_id ON public.notification_log USING btree (business_id);


--
-- Name: idx_notification_log_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_channel ON public.notification_log USING btree (channel);


--
-- Name: idx_notification_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_created_at ON public.notification_log USING btree (created_at);


--
-- Name: idx_notification_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_status ON public.notification_log USING btree (status);


--
-- Name: idx_notifications_appointment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_appointment_id ON public.notifications USING btree (appointment_id);


--
-- Name: idx_notifications_appointment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_appointment_type ON public.notifications USING btree (appointment_id, type) WHERE (appointment_id IS NOT NULL);


--
-- Name: idx_notifications_data_email_reminder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_data_email_reminder ON public.in_app_notifications USING gin (data jsonb_path_ops);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_scheduled_for; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_scheduled_for ON public.notifications USING btree (scheduled_for);


--
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_status ON public.notifications USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_unread_chat_messages; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_unread_chat_messages ON public.in_app_notifications USING btree (type, status, created_at DESC) WHERE ((type = 'chat_message'::public.notification_type_enum) AND (status = 'unread'::public.notification_status));


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created ON public.in_app_notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_status ON public.in_app_notifications USING btree (user_id, status);


--
-- Name: idx_notifications_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_type ON public.in_app_notifications USING btree (user_id, type);


--
-- Name: idx_participants_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_conversation ON public.chat_participants USING btree (conversation_id);


--
-- Name: idx_participants_pinned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_pinned ON public.chat_participants USING btree (user_id, is_pinned) WHERE (is_pinned = true);


--
-- Name: idx_participants_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_unread ON public.chat_participants USING btree (user_id, unread_count) WHERE (unread_count > 0);


--
-- Name: idx_participants_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_user ON public.chat_participants USING btree (user_id);


--
-- Name: idx_participants_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_user_active ON public.chat_participants USING btree (user_id) WHERE (left_at IS NULL);


--
-- Name: idx_payment_methods_business_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_payment_methods_business_default ON public.payment_methods USING btree (business_id) WHERE ((is_default = true) AND (is_active = true));


--
-- Name: idx_payment_methods_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_methods_business_id ON public.payment_methods USING btree (business_id) WHERE (is_active = true);


--
-- Name: idx_payment_methods_stripe_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_methods_stripe_customer ON public.payment_methods USING btree (stripe_customer_id);


--
-- Name: idx_payroll_config_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_config_business_id ON public.payroll_configuration USING btree (business_id);


--
-- Name: idx_payroll_config_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_config_employee_id ON public.payroll_configuration USING btree (employee_id);


--
-- Name: idx_payroll_payments_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_payments_business_id ON public.payroll_payments USING btree (business_id);


--
-- Name: idx_payroll_payments_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_payments_employee_id ON public.payroll_payments USING btree (employee_id);


--
-- Name: idx_payroll_payments_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_payments_period ON public.payroll_payments USING btree (payment_period_start, payment_period_end);


--
-- Name: idx_payroll_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_payments_status ON public.payroll_payments USING btree (status);


--
-- Name: idx_permission_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_action ON public.permission_audit_log USING btree (action);


--
-- Name: idx_permission_audit_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_business_id ON public.permission_audit_log USING btree (business_id);


--
-- Name: idx_permission_audit_performed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_performed_at ON public.permission_audit_log USING btree (performed_at DESC);


--
-- Name: idx_permission_audit_performed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_performed_by ON public.permission_audit_log USING btree (performed_by);


--
-- Name: idx_permission_audit_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_audit_user_id ON public.permission_audit_log USING btree (user_id);


--
-- Name: idx_permission_templates_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_templates_business_id ON public.permission_templates USING btree (business_id);


--
-- Name: idx_permission_templates_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_templates_role ON public.permission_templates USING btree (role);


--
-- Name: idx_permission_templates_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_templates_system ON public.permission_templates USING btree (is_system_template);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_full_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_full_name_trgm ON public.profiles USING gin (full_name public.gin_trgm_ops);


--
-- Name: idx_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);


--
-- Name: idx_profiles_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone);


--
-- Name: idx_profiles_phone_otp_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_phone_otp_expires ON public.profiles USING btree (phone_otp_expires_at) WHERE (phone_otp_code IS NOT NULL);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_profiles_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_search_vector ON public.profiles USING gin (search_vector);


--
-- Name: idx_profiles_trial_eligible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_trial_eligible ON public.profiles USING btree (id) WHERE (has_used_free_trial = false);


--
-- Name: idx_public_holidays_country_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_public_holidays_country_date ON public.public_holidays USING btree (country_id, holiday_date);


--
-- Name: idx_public_holidays_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_public_holidays_country_id ON public.public_holidays USING btree (country_id);


--
-- Name: idx_public_holidays_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_public_holidays_date ON public.public_holidays USING btree (holiday_date);


--
-- Name: idx_recurring_expenses_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_business_id ON public.recurring_expenses USING btree (business_id);


--
-- Name: idx_recurring_expenses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_category ON public.recurring_expenses USING btree (category);


--
-- Name: idx_recurring_expenses_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_employee_id ON public.recurring_expenses USING btree (employee_id);


--
-- Name: idx_recurring_expenses_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_is_active ON public.recurring_expenses USING btree (is_active);


--
-- Name: idx_recurring_expenses_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_location_id ON public.recurring_expenses USING btree (location_id);


--
-- Name: idx_recurring_expenses_next_payment_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_next_payment_date ON public.recurring_expenses USING btree (next_payment_date);


--
-- Name: idx_recurring_expenses_next_payment_date_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_next_payment_date_active ON public.recurring_expenses USING btree (next_payment_date) WHERE (is_active = true);


--
-- Name: idx_regions_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regions_country_id ON public.regions USING btree (country_id);


--
-- Name: idx_resource_availability_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_availability_business_id ON public.resource_availability USING btree (business_id);


--
-- Name: idx_resource_availability_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_availability_location_id ON public.resource_availability USING btree (location_id);


--
-- Name: idx_resource_availability_resource_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_resource_availability_resource_id ON public.resource_availability USING btree (resource_id);


--
-- Name: idx_resource_services_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_services_active ON public.resource_services USING btree (is_active);


--
-- Name: idx_resource_services_resource_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_services_resource_id ON public.resource_services USING btree (resource_id);


--
-- Name: idx_resource_services_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_services_service_id ON public.resource_services USING btree (service_id);


--
-- Name: idx_reviews_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_business_id ON public.reviews USING btree (business_id);


--
-- Name: idx_reviews_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_client_id ON public.reviews USING btree (client_id);


--
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);


--
-- Name: idx_reviews_employee_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_employee_business ON public.reviews USING btree (employee_id, business_id, is_visible, created_at) WHERE (is_visible = true);


--
-- Name: idx_reviews_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_employee_id ON public.reviews USING btree (employee_id);


--
-- Name: idx_reviews_employee_id_filtered; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_employee_id_filtered ON public.reviews USING btree (employee_id) WHERE (employee_id IS NOT NULL);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);


--
-- Name: idx_reviews_review_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_review_type ON public.reviews USING btree (review_type);


--
-- Name: idx_reviews_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_visible ON public.reviews USING btree (is_visible);


--
-- Name: idx_services_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_business_id ON public.services USING btree (business_id);


--
-- Name: idx_services_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_category ON public.services USING btree (category);


--
-- Name: idx_services_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_is_active ON public.services USING btree (is_active);


--
-- Name: idx_services_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_name_trgm ON public.services USING gin (name public.gin_trgm_ops);


--
-- Name: idx_services_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_price ON public.services USING btree (price);


--
-- Name: idx_services_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_search_vector ON public.services USING gin (search_vector);


--
-- Name: idx_subscription_events_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_events_business_id ON public.subscription_events USING btree (business_id);


--
-- Name: idx_subscription_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_events_created_at ON public.subscription_events USING btree (created_at DESC);


--
-- Name: idx_subscription_events_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_events_plan_id ON public.subscription_events USING btree (plan_id);


--
-- Name: idx_subscription_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_events_type ON public.subscription_events USING btree (event_type);


--
-- Name: idx_subscription_payments_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_payments_business_id ON public.subscription_payments USING btree (business_id);


--
-- Name: idx_subscription_payments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_payments_created_at ON public.subscription_payments USING btree (created_at DESC);


--
-- Name: idx_subscription_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_payments_status ON public.subscription_payments USING btree (status);


--
-- Name: idx_subscription_payments_stripe_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_payments_stripe_invoice ON public.subscription_payments USING btree (stripe_invoice_id) WHERE (stripe_invoice_id IS NOT NULL);


--
-- Name: idx_tax_configurations_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_configurations_business ON public.tax_configurations USING btree (business_id);


--
-- Name: idx_tax_liabilities_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_liabilities_business ON public.tax_liabilities USING btree (business_id);


--
-- Name: idx_tax_liabilities_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_liabilities_due_date ON public.tax_liabilities USING btree (due_date);


--
-- Name: idx_tax_liabilities_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_liabilities_period ON public.tax_liabilities USING btree (period);


--
-- Name: idx_tax_liabilities_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_liabilities_status ON public.tax_liabilities USING btree (status);


--
-- Name: idx_time_off_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_off_business ON public.employee_time_off USING btree (business_id);


--
-- Name: idx_time_off_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_off_dates ON public.employee_time_off USING btree (start_date, end_date);


--
-- Name: idx_time_off_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_off_employee ON public.employee_time_off USING btree (employee_id);


--
-- Name: idx_time_off_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_off_status ON public.employee_time_off USING btree (status);


--
-- Name: idx_transactions_appointment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_appointment_id ON public.transactions USING btree (appointment_id);


--
-- Name: idx_transactions_business_fiscal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_business_fiscal ON public.transactions USING btree (business_id, fiscal_period) WHERE (fiscal_period IS NOT NULL);


--
-- Name: idx_transactions_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_business_id ON public.transactions USING btree (business_id);


--
-- Name: idx_transactions_business_type_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_business_type_date ON public.transactions USING btree (business_id, type, created_at DESC);


--
-- Name: idx_transactions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_category ON public.transactions USING btree (category);


--
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (transaction_date DESC);


--
-- Name: idx_transactions_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_employee_id ON public.transactions USING btree (employee_id);


--
-- Name: idx_transactions_fiscal_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_fiscal_period ON public.transactions USING btree (fiscal_period);


--
-- Name: idx_transactions_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_invoice ON public.transactions USING btree (invoice_id);


--
-- Name: idx_transactions_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_location_id ON public.transactions USING btree (location_id);


--
-- Name: idx_transactions_tax_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_tax_type ON public.transactions USING btree (tax_type);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: idx_transactions_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_verified ON public.transactions USING btree (is_verified);


--
-- Name: idx_typing_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_typing_expires ON public.chat_typing_indicators USING btree (expires_at);


--
-- Name: idx_usage_metrics_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_metrics_business_id ON public.usage_metrics USING btree (business_id);


--
-- Name: idx_usage_metrics_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_metrics_date ON public.usage_metrics USING btree (metric_date DESC);


--
-- Name: idx_usage_metrics_over_limit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_metrics_over_limit ON public.usage_metrics USING btree (business_id) WHERE (is_over_limit = true);


--
-- Name: idx_user_active_permissions_array; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_active_permissions_array ON public.user_active_permissions USING gin (permissions);


--
-- Name: INDEX idx_user_active_permissions_array; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_user_active_permissions_array IS 'Ãndice GIN para bÃºsquedas eficientes en array de permisos.
Habilita operador @> (contains) para verificaciÃ³n rÃ¡pida.';


--
-- Name: idx_user_active_permissions_pk; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_active_permissions_pk ON public.user_active_permissions USING btree (user_id, business_id);


--
-- Name: INDEX idx_user_active_permissions_pk; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_user_active_permissions_pk IS 'Ãndice Ãºnico para lookup O(1) en materialized view. 
Permite Index Only Scan para mÃ¡xima performance.';


--
-- Name: idx_user_notif_prefs_in_app_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notif_prefs_in_app_enabled ON public.user_notification_preferences USING btree (in_app_enabled) WHERE (in_app_enabled = true);


--
-- Name: INDEX idx_user_notif_prefs_in_app_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_user_notif_prefs_in_app_enabled IS 'Optimiza queries de usuarios con in_app habilitado';


--
-- Name: idx_user_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notification_preferences_user_id ON public.user_notification_preferences USING btree (user_id);


--
-- Name: idx_user_permissions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_active ON public.user_permissions USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_user_permissions_active_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_active_lookup ON public.user_permissions USING btree (business_id, user_id, permission, is_active) WHERE (is_active = true);


--
-- Name: idx_user_permissions_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_business_id ON public.user_permissions USING btree (business_id);


--
-- Name: idx_user_permissions_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_lookup ON public.user_permissions USING btree (business_id, user_id, is_active);


--
-- Name: idx_user_permissions_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_permission ON public.user_permissions USING btree (permission);


--
-- Name: idx_user_permissions_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_user_active ON public.user_permissions USING btree (user_id, is_active);


--
-- Name: idx_user_permissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);


--
-- Name: idx_vacation_balance_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacation_balance_employee ON public.vacation_balance USING btree (employee_id, business_id, year);


--
-- Name: idx_vacation_balance_employee_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacation_balance_employee_business ON public.vacation_balance USING btree (employee_id, business_id);


--
-- Name: idx_work_schedules_day_of_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_schedules_day_of_week ON public.work_schedules USING btree (day_of_week);


--
-- Name: idx_work_schedules_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_schedules_employee_id ON public.work_schedules USING btree (employee_id);


--
-- Name: idx_work_schedules_is_working; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_schedules_is_working ON public.work_schedules USING btree (is_working);


--
-- Name: reviews_appointment_type_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reviews_appointment_type_unique ON public.reviews USING btree (appointment_id, review_type);


--
-- Name: unique_business_review_per_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_business_review_per_appointment ON public.reviews USING btree (appointment_id) WHERE (employee_id IS NULL);


--
-- Name: unique_employee_review_per_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_employee_review_per_appointment ON public.reviews USING btree (appointment_id, employee_id) WHERE (employee_id IS NOT NULL);


--
-- Name: appointments appointments_set_confirmation_deadline; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER appointments_set_confirmation_deadline AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.trigger_set_confirmation_deadline();


--
-- Name: businesses businesses_search_vector_update_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER businesses_search_vector_update_trigger BEFORE INSERT OR UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.businesses_search_vector_update();


--
-- Name: appointments check_appointment_conflict_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER check_appointment_conflict_trigger BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.check_appointment_conflict();


--
-- Name: appointments create_appointment_reminders_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER create_appointment_reminders_trigger AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.create_appointment_reminders();


--
-- Name: appointments create_appointment_transaction_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER create_appointment_transaction_trigger AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.create_appointment_transaction();


--
-- Name: employee_profiles employee_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION public.update_employee_profile_timestamp();


--
-- Name: business_roles enforce_owner_hierarchy_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_owner_hierarchy_trigger BEFORE INSERT OR UPDATE ON public.business_roles FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_hierarchy();


--
-- Name: invoices generate_invoice_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: appointments notify_on_appointment_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_on_appointment_created AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_created();


--
-- Name: TRIGGER notify_on_appointment_created ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER notify_on_appointment_created ON public.appointments IS 'EnvÃ­a notificaciones in-app a empleado, cliente y dueÃ±o del negocio cuando se crea una cita nueva';


--
-- Name: job_applications on_job_application_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_job_application_created AFTER INSERT ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.notify_business_on_application();


--
-- Name: profiles profiles_search_vector_update_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_search_vector_update_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_search_vector_update();


--
-- Name: appointments refresh_appointments_view; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER refresh_appointments_view AFTER INSERT OR DELETE OR UPDATE ON public.appointments FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_appointments_with_relations();


--
-- Name: businesses refresh_appointments_view_from_businesses; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER refresh_appointments_view_from_businesses AFTER UPDATE OF name, description ON public.businesses FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_appointments_with_relations();


--
-- Name: locations refresh_appointments_view_from_locations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER refresh_appointments_view_from_locations AFTER UPDATE OF name, address, city, state, postal_code, google_maps_url ON public.locations FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_appointments_with_relations();


--
-- Name: profiles refresh_appointments_view_from_profiles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER refresh_appointments_view_from_profiles AFTER UPDATE OF full_name, email, phone, avatar_url ON public.profiles FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_appointments_with_relations();


--
-- Name: services refresh_appointments_view_from_services; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER refresh_appointments_view_from_services AFTER UPDATE OF name, description, duration_minutes, price ON public.services FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_appointments_with_relations();


--
-- Name: services services_search_vector_update_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER services_search_vector_update_trigger BEFORE INSERT OR UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.services_search_vector_update();


--
-- Name: transactions set_fiscal_period_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_fiscal_period_trigger BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_fiscal_period();


--
-- Name: business_roles trg_auto_assign_permissions_to_admin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_assign_permissions_to_admin AFTER INSERT OR UPDATE OF role ON public.business_roles FOR EACH ROW EXECUTE FUNCTION public.auto_assign_permissions_to_admin();


--
-- Name: businesses trg_auto_assign_permissions_to_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_assign_permissions_to_owner AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.auto_assign_permissions_to_owner();


--
-- Name: TRIGGER trg_auto_assign_permissions_to_owner ON businesses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_auto_assign_permissions_to_owner ON public.businesses IS 'Auto-asigna todos los permisos al owner cuando se crea un negocio nuevo';


--
-- Name: business_roles trg_auto_insert_admin_as_employee; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_insert_admin_as_employee AFTER INSERT OR UPDATE OF role, is_active ON public.business_roles FOR EACH ROW EXECUTE FUNCTION public.auto_insert_admin_as_employee();


--
-- Name: TRIGGER trg_auto_insert_admin_as_employee ON business_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_auto_insert_admin_as_employee ON public.business_roles IS 'Auto-registra admins en business_employees cuando se les asigna rol admin';


--
-- Name: businesses trg_auto_insert_owner_to_business_employees; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_insert_owner_to_business_employees AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.auto_insert_owner_to_business_employees();


--
-- Name: job_applications trg_auto_reject_on_filled; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_reject_on_filled AFTER UPDATE ON public.job_applications FOR EACH ROW WHEN ((((new.status)::text = 'accepted'::text) AND ((old.status)::text <> 'accepted'::text))) EXECUTE FUNCTION public.auto_reject_candidates_on_vacancy_filled();


--
-- Name: business_closed_days trg_business_closed_days_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_business_closed_days_updated_at BEFORE UPDATE ON public.business_closed_days FOR EACH ROW EXECUTE FUNCTION public.update_business_closed_days_updated_at();


--
-- Name: business_employees trg_business_employees_sync_roles_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_business_employees_sync_roles_insert AFTER INSERT ON public.business_employees FOR EACH ROW EXECUTE FUNCTION public.sync_business_roles_from_business_employees();


--
-- Name: business_employees trg_business_employees_sync_roles_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_business_employees_sync_roles_update AFTER UPDATE ON public.business_employees FOR EACH ROW WHEN (((old.is_active IS DISTINCT FROM new.is_active) OR (old.role IS DISTINCT FROM new.role))) EXECUTE FUNCTION public.sync_business_roles_from_business_employees();


--
-- Name: conversations trg_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_conversation_updated_at();


--
-- Name: employee_join_requests trg_employee_join_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_employee_join_requests_updated_at BEFORE UPDATE ON public.employee_join_requests FOR EACH ROW EXECUTE FUNCTION public.update_employee_join_requests_updated_at();


--
-- Name: messages trg_messages_increment_unread; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_messages_increment_unread AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.increment_unread_on_message();


--
-- Name: messages trg_messages_update_conversation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_messages_update_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();


--
-- Name: messages trg_messages_update_delivery_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_messages_update_delivery_status BEFORE UPDATE OF read_by ON public.messages FOR EACH ROW WHEN ((new.read_by IS DISTINCT FROM old.read_by)) EXECUTE FUNCTION public.update_message_delivery_status();


--
-- Name: in_app_notifications trg_notify_business_unconfigured; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_business_unconfigured AFTER INSERT ON public.in_app_notifications FOR EACH ROW WHEN ((new.type = 'business_unconfigured'::public.notification_type_enum)) EXECUTE FUNCTION public.trigger_notify_business_unconfigured();


--
-- Name: TRIGGER trg_notify_business_unconfigured ON in_app_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_notify_business_unconfigured ON public.in_app_notifications IS 'Trigger que llama a notify-business-unconfigured Edge Function cuando se crea notificaciÃ³n de negocio desconfigurado.';


--
-- Name: business_employees trg_sync_business_roles_from_business_employees; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_business_roles_from_business_employees AFTER INSERT OR UPDATE ON public.business_employees FOR EACH ROW EXECUTE FUNCTION public.sync_business_roles_from_business_employees();


--
-- Name: employee_services trg_update_business_config_on_employee_service; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_business_config_on_employee_service AFTER INSERT OR DELETE ON public.employee_services FOR EACH ROW EXECUTE FUNCTION public.trigger_update_business_config_on_employee_service();


--
-- Name: business_employees trg_update_business_config_on_employee_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_business_config_on_employee_status AFTER UPDATE OF is_active ON public.business_employees FOR EACH ROW EXECUTE FUNCTION public.trigger_update_business_config_on_employee_status();


--
-- Name: locations trg_update_business_config_on_location; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_business_config_on_location AFTER INSERT OR DELETE OR UPDATE OF is_active ON public.locations FOR EACH ROW EXECUTE FUNCTION public.trigger_update_business_config_on_location();


--
-- Name: location_services trg_update_business_config_on_location_service; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_business_config_on_location_service AFTER INSERT OR DELETE ON public.location_services FOR EACH ROW EXECUTE FUNCTION public.trigger_update_business_config_on_location_service();


--
-- Name: resource_services trg_update_business_config_on_resource_service; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_business_config_on_resource_service AFTER INSERT OR DELETE ON public.resource_services FOR EACH ROW EXECUTE FUNCTION public.trigger_update_business_config_on_resource_service();


--
-- Name: business_resources trg_update_business_config_on_resource_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_business_config_on_resource_status AFTER UPDATE OF is_active ON public.business_resources FOR EACH ROW EXECUTE FUNCTION public.trigger_update_business_config_on_resource_status();


--
-- Name: work_schedules trg_update_work_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_work_schedules_updated_at BEFORE UPDATE ON public.work_schedules FOR EACH ROW EXECUTE FUNCTION public.update_work_schedules_updated_at();


--
-- Name: job_applications trg_validate_application_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_application_status BEFORE UPDATE ON public.job_applications FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.validate_application_status_transition();


--
-- Name: conversation_members trg_validate_direct_members; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_direct_members BEFORE INSERT ON public.conversation_members FOR EACH ROW EXECUTE FUNCTION public.validate_direct_conversation_members();


--
-- Name: business_roles trigger_audit_business_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_business_roles AFTER INSERT OR DELETE OR UPDATE ON public.business_roles FOR EACH ROW EXECUTE FUNCTION public.audit_business_roles_changes();


--
-- Name: user_permissions trigger_audit_user_permissions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_user_permissions AFTER INSERT OR DELETE OR UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_user_permissions_changes();


--
-- Name: businesses trigger_auto_generate_invitation_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_generate_invitation_code BEFORE INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.auto_generate_invitation_code();


--
-- Name: businesses trigger_auto_insert_owner_to_business_employees; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_insert_owner_to_business_employees AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.auto_insert_owner_to_business_employees();


--
-- Name: businesses trigger_auto_insert_owner_to_business_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_insert_owner_to_business_roles AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.auto_insert_owner_to_business_roles();


--
-- Name: appointments trigger_calculate_appointment_amounts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_calculate_appointment_amounts BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW WHEN ((new.payment_status = 'paid'::public.payment_status)) EXECUTE FUNCTION public.calculate_appointment_amounts();


--
-- Name: business_subcategories trigger_check_max_subcategories; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_check_max_subcategories BEFORE INSERT ON public.business_subcategories FOR EACH ROW EXECUTE FUNCTION public.check_max_subcategories();


--
-- Name: business_employees trigger_cleanup_completed_transfer; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_cleanup_completed_transfer BEFORE UPDATE ON public.business_employees FOR EACH ROW WHEN (((new.transfer_status = 'completed'::text) AND (old.transfer_status = 'pending'::text))) EXECUTE FUNCTION public.cleanup_completed_transfer();


--
-- Name: TRIGGER trigger_cleanup_completed_transfer ON business_employees; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trigger_cleanup_completed_transfer ON public.business_employees IS 'Auto-actualiza location_id cuando un traslado se completa';


--
-- Name: cron_execution_logs trigger_cleanup_cron_logs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_cleanup_cron_logs AFTER INSERT ON public.cron_execution_logs FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_old_cron_logs();


--
-- Name: in_app_notifications trigger_cleanup_expired_notifications; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_cleanup_expired_notifications AFTER INSERT ON public.in_app_notifications FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_expired_notifications();


--
-- Name: businesses trigger_create_business_notification_settings; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_business_notification_settings AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.create_default_business_notification_settings();


--
-- Name: profiles trigger_create_user_notification_preferences; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_user_notification_preferences AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_default_user_notification_preferences();


--
-- Name: chat_messages trigger_delete_message_attachments; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_delete_message_attachments AFTER UPDATE OF deleted_at ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.delete_message_attachments();


--
-- Name: payment_methods trigger_ensure_single_default_payment_method; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_ensure_single_default_payment_method BEFORE INSERT OR UPDATE ON public.payment_methods FOR EACH ROW WHEN ((new.is_default = true)) EXECUTE FUNCTION public.ensure_single_default_payment_method();


--
-- Name: locations trigger_ensure_single_primary_location; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_ensure_single_primary_location BEFORE INSERT OR UPDATE OF is_primary ON public.locations FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_location();


--
-- Name: discount_code_uses trigger_increment_discount_code_uses; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_increment_discount_code_uses AFTER INSERT ON public.discount_code_uses FOR EACH ROW EXECUTE FUNCTION public.increment_discount_code_uses();


--
-- Name: job_applications trigger_increment_vacancy_applications; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_increment_vacancy_applications AFTER INSERT ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.increment_vacancy_applications_count();


--
-- Name: business_employees trigger_initialize_vacation_balance; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_initialize_vacation_balance AFTER INSERT ON public.business_employees FOR EACH ROW EXECUTE FUNCTION public.initialize_vacation_balance();


--
-- Name: location_expense_config trigger_location_expense_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_location_expense_config_updated_at BEFORE UPDATE ON public.location_expense_config FOR EACH ROW EXECUTE FUNCTION public.update_location_expense_config_updated_at();


--
-- Name: payment_methods trigger_log_payment_method_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_payment_method_changes AFTER INSERT OR DELETE OR UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.log_payment_method_changes();


--
-- Name: subscription_payments trigger_log_subscription_payment_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_subscription_payment_changes AFTER INSERT OR UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.log_subscription_payment_changes();


--
-- Name: chat_messages trigger_notify_new_chat_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_new_chat_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_chat_message();


--
-- Name: TRIGGER trigger_notify_new_chat_message ON chat_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trigger_notify_new_chat_message ON public.chat_messages IS 'Crea notificaciÃ³n in-app cuando se inserta un mensaje nuevo';


--
-- Name: public_holidays trigger_public_holidays_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_public_holidays_updated_at BEFORE UPDATE ON public.public_holidays FOR EACH ROW EXECUTE FUNCTION public.update_public_holidays_timestamp();


--
-- Name: appointments trigger_set_appointment_completed_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_appointment_completed_at BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_appointment_completed_at();


--
-- Name: appointments trigger_track_first_client; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_track_first_client AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.track_first_client();


--
-- Name: appointments trigger_update_business_activity_on_appointment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_business_activity_on_appointment AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_business_activity();


--
-- Name: business_notification_settings trigger_update_business_notification_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_business_notification_settings_updated_at BEFORE UPDATE ON public.business_notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_business_notification_settings_updated_at();


--
-- Name: business_resources trigger_update_business_resources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_business_resources_updated_at BEFORE UPDATE ON public.business_resources FOR EACH ROW EXECUTE FUNCTION public.update_business_resources_updated_at();


--
-- Name: chat_conversations trigger_update_chat_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_chat_updated_at();


--
-- Name: chat_messages trigger_update_chat_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.update_chat_updated_at();


--
-- Name: chat_participants trigger_update_chat_participants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_chat_participants_updated_at BEFORE UPDATE ON public.chat_participants FOR EACH ROW EXECUTE FUNCTION public.update_chat_updated_at();


--
-- Name: discount_codes trigger_update_discount_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_discount_codes_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION public.update_discount_codes_updated_at();


--
-- Name: job_applications trigger_update_job_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_job_applications_updated_at();


--
-- Name: job_vacancies trigger_update_job_vacancies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_job_vacancies_updated_at BEFORE UPDATE ON public.job_vacancies FOR EACH ROW EXECUTE FUNCTION public.update_job_vacancies_updated_at();


--
-- Name: payment_methods trigger_update_payment_methods_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_payment_methods_updated_at();


--
-- Name: payroll_configuration trigger_update_payroll_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payroll_config_updated_at BEFORE UPDATE ON public.payroll_configuration FOR EACH ROW EXECUTE FUNCTION public.update_payroll_config_updated_at();


--
-- Name: payroll_payments trigger_update_payroll_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payroll_payments_updated_at BEFORE UPDATE ON public.payroll_payments FOR EACH ROW EXECUTE FUNCTION public.update_payroll_payments_updated_at();


--
-- Name: recurring_expenses trigger_update_recurring_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_recurring_expenses_updated_at BEFORE UPDATE ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.update_recurring_expenses_updated_at();


--
-- Name: subscription_payments trigger_update_subscription_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_subscription_payments_updated_at BEFORE UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.update_subscription_payments_updated_at();


--
-- Name: user_notification_preferences trigger_update_user_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_user_notification_preferences_updated_at BEFORE UPDATE ON public.user_notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_user_notification_preferences_updated_at();


--
-- Name: employee_absences trigger_update_vacation_balance; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_vacation_balance AFTER INSERT OR UPDATE OF status ON public.employee_absences FOR EACH ROW EXECUTE FUNCTION public.update_vacation_balance_on_absence();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bug_reports update_bug_reports_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bug_reports_updated_at_trigger BEFORE UPDATE ON public.bug_reports FOR EACH ROW EXECUTE FUNCTION public.update_bug_reports_updated_at();


--
-- Name: appointments update_business_appointment_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_appointment_count_trigger AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_business_appointment_count();


--
-- Name: business_employees update_business_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_employees_updated_at BEFORE UPDATE ON public.business_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_business_review_stats_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_review_stats_trigger AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_business_review_stats();


--
-- Name: businesses update_businesses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_conversations update_chat_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_participants update_chat_participants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chat_participants_updated_at BEFORE UPDATE ON public.chat_participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: employee_services update_employee_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_employee_services_updated_at BEFORE UPDATE ON public.employee_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: error_logs update_error_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_error_logs_updated_at BEFORE UPDATE ON public.error_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: location_services update_location_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_location_services_updated_at BEFORE UPDATE ON public.location_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: locations update_locations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: messages update_message_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_message_search_vector_trigger BEFORE INSERT OR UPDATE OF body, metadata ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_message_search_vector();


--
-- Name: chat_messages update_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tax_configurations update_tax_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tax_configurations_updated_at BEFORE UPDATE ON public.tax_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tax_liabilities update_tax_liabilities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tax_liabilities_updated_at BEFORE UPDATE ON public.tax_liabilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: employee_services validate_employee_service_location_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_employee_service_location_trigger BEFORE INSERT OR UPDATE ON public.employee_services FOR EACH ROW EXECUTE FUNCTION public.validate_employee_service_location();


--
-- Name: business_roles validate_hierarchy_no_cycles_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_hierarchy_no_cycles_trigger BEFORE INSERT OR UPDATE OF reports_to ON public.business_roles FOR EACH ROW EXECUTE FUNCTION public.validate_hierarchy_no_cycles();


--
-- Name: reviews verify_review_on_insert_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER verify_review_on_insert_trigger BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.verify_review_on_insert();


--
-- Name: absence_approval_requests absence_approval_requests_absence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_approval_requests
    ADD CONSTRAINT absence_approval_requests_absence_id_fkey FOREIGN KEY (absence_id) REFERENCES public.employee_absences(id) ON DELETE CASCADE;


--
-- Name: absence_approval_requests absence_approval_requests_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_approval_requests
    ADD CONSTRAINT absence_approval_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_original_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_original_location_id_fkey FOREIGN KEY (original_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.business_resources(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: billing_audit_log billing_audit_log_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_audit_log
    ADD CONSTRAINT billing_audit_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: billing_audit_log billing_audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_audit_log
    ADD CONSTRAINT billing_audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id);


--
-- Name: bug_reports bug_reports_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bug_reports bug_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: business_categories business_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_categories
    ADD CONSTRAINT business_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.business_categories(id) ON DELETE SET NULL;


--
-- Name: business_closed_days business_closed_days_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_closed_days
    ADD CONSTRAINT business_closed_days_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_closed_days business_closed_days_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_closed_days
    ADD CONSTRAINT business_closed_days_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: business_closed_days business_closed_days_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_closed_days
    ADD CONSTRAINT business_closed_days_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: business_confirmation_policies business_confirmation_policies_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_confirmation_policies
    ADD CONSTRAINT business_confirmation_policies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_employees business_employees_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_employees business_employees_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: business_employees business_employees_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: business_employees business_employees_transfer_from_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_transfer_from_location_id_fkey FOREIGN KEY (transfer_from_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: business_employees business_employees_transfer_scheduled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_transfer_scheduled_by_fkey FOREIGN KEY (transfer_scheduled_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: business_employees business_employees_transfer_to_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_employees
    ADD CONSTRAINT business_employees_transfer_to_location_id_fkey FOREIGN KEY (transfer_to_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: business_favorites business_favorites_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_favorites
    ADD CONSTRAINT business_favorites_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_favorites business_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_favorites
    ADD CONSTRAINT business_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: business_notification_settings business_notification_settings_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_notification_settings
    ADD CONSTRAINT business_notification_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_plans business_plans_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plans
    ADD CONSTRAINT business_plans_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_resources business_resources_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_resources
    ADD CONSTRAINT business_resources_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_resources business_resources_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_resources
    ADD CONSTRAINT business_resources_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: business_roles business_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_roles
    ADD CONSTRAINT business_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- Name: business_roles business_roles_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_roles
    ADD CONSTRAINT business_roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_roles business_roles_reports_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_roles
    ADD CONSTRAINT business_roles_reports_to_fkey FOREIGN KEY (reports_to) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: business_roles business_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_roles
    ADD CONSTRAINT business_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: business_subcategories business_subcategories_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subcategories
    ADD CONSTRAINT business_subcategories_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_subcategories business_subcategories_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subcategories
    ADD CONSTRAINT business_subcategories_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.business_categories(id) ON DELETE CASCADE;


--
-- Name: businesses businesses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.business_categories(id) ON DELETE SET NULL;


--
-- Name: businesses businesses_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: calendar_sync_settings calendar_sync_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_sync_settings
    ADD CONSTRAINT calendar_sync_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: chat_conversations chat_conversations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: chat_participants chat_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_participants chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: chat_typing_indicators chat_typing_indicators_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_typing_indicators
    ADD CONSTRAINT chat_typing_indicators_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_typing_indicators chat_typing_indicators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_typing_indicators
    ADD CONSTRAINT chat_typing_indicators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: cities cities_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: discount_code_uses discount_code_uses_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_uses
    ADD CONSTRAINT discount_code_uses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: discount_code_uses discount_code_uses_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_uses
    ADD CONSTRAINT discount_code_uses_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE CASCADE;


--
-- Name: discount_code_uses discount_code_uses_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_uses
    ADD CONSTRAINT discount_code_uses_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;


--
-- Name: discount_code_uses discount_code_uses_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_uses
    ADD CONSTRAINT discount_code_uses_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id);


--
-- Name: discount_codes discount_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: document_types document_types_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- Name: employee_absences employee_absences_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_absences
    ADD CONSTRAINT employee_absences_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: employee_absences employee_absences_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_absences
    ADD CONSTRAINT employee_absences_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT employee_absences_employee_id_fkey ON employee_absences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT employee_absences_employee_id_fkey ON public.employee_absences IS 'Foreign key hacia profiles para JOIN en queries de ausencias';


--
-- Name: employee_join_requests employee_join_requests_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_join_requests
    ADD CONSTRAINT employee_join_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: employee_join_requests employee_join_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_join_requests
    ADD CONSTRAINT employee_join_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: employee_join_requests employee_join_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_join_requests
    ADD CONSTRAINT employee_join_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: employee_profiles employee_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: employee_requests employee_requests_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: employee_requests employee_requests_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.profiles(id);


--
-- Name: employee_requests employee_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: employee_services employee_services_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: employee_services employee_services_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: employee_services employee_services_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: employee_services employee_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: employee_time_off employee_time_off_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off
    ADD CONSTRAINT employee_time_off_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: employee_time_off employee_time_off_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off
    ADD CONSTRAINT employee_time_off_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: employee_time_off employee_time_off_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off
    ADD CONSTRAINT employee_time_off_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: employee_time_off employee_time_off_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off
    ADD CONSTRAINT employee_time_off_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);


--
-- Name: error_logs error_logs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: error_logs error_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: businesses fk_businesses_city_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT fk_businesses_city_id FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: businesses fk_businesses_country_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT fk_businesses_country_id FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE SET NULL;


--
-- Name: businesses fk_businesses_region_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT fk_businesses_region_id FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;


--
-- Name: chat_participants fk_last_read_message; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT fk_last_read_message FOREIGN KEY (last_read_message_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;


--
-- Name: in_app_notifications in_app_notifications_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: in_app_notifications in_app_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;


--
-- Name: job_applications job_applications_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: job_applications job_applications_selection_started_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_selection_started_by_fkey FOREIGN KEY (selection_started_by) REFERENCES auth.users(id);


--
-- Name: job_applications job_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_vacancy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_vacancy_id_fkey FOREIGN KEY (vacancy_id) REFERENCES public.job_vacancies(id) ON DELETE CASCADE;


--
-- Name: job_vacancies job_vacancies_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_vacancies
    ADD CONSTRAINT job_vacancies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: job_vacancies job_vacancies_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_vacancies
    ADD CONSTRAINT job_vacancies_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: location_expense_config location_expense_config_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_expense_config
    ADD CONSTRAINT location_expense_config_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: location_expense_config location_expense_config_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_expense_config
    ADD CONSTRAINT location_expense_config_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: location_media location_media_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_media
    ADD CONSTRAINT location_media_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: location_services location_services_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_services
    ADD CONSTRAINT location_services_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: location_services location_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_services
    ADD CONSTRAINT location_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: locations locations_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: login_logs login_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: messages messages_pinned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pinned_by_fkey FOREIGN KEY (pinned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: messages messages_reply_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: notification_log notification_log_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: notification_log notification_log_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: notification_log notification_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: payroll_configuration payroll_configuration_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_configuration
    ADD CONSTRAINT payroll_configuration_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: payroll_configuration payroll_configuration_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_configuration
    ADD CONSTRAINT payroll_configuration_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payroll_payments payroll_payments_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_payments
    ADD CONSTRAINT payroll_payments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: payroll_payments payroll_payments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_payments
    ADD CONSTRAINT payroll_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: permission_audit_log permission_audit_log_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: permission_audit_log permission_audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id);


--
-- Name: permission_audit_log permission_audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: permission_templates permission_templates_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_templates
    ADD CONSTRAINT permission_templates_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: permission_templates permission_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_templates
    ADD CONSTRAINT permission_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_free_trial_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_free_trial_business_id_fkey FOREIGN KEY (free_trial_business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: public_holidays public_holidays_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_holidays
    ADD CONSTRAINT public_holidays_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- Name: recurring_expenses recurring_expenses_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: recurring_expenses recurring_expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: recurring_expenses recurring_expenses_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: recurring_expenses recurring_expenses_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: regions regions_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- Name: resource_services resource_services_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_services
    ADD CONSTRAINT resource_services_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.business_resources(id) ON DELETE CASCADE;


--
-- Name: resource_services resource_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_services
    ADD CONSTRAINT resource_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_response_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_response_by_fkey FOREIGN KEY (response_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: services services_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: subscription_events subscription_events_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: subscription_events subscription_events_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;


--
-- Name: subscription_events subscription_events_triggered_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_triggered_by_user_id_fkey FOREIGN KEY (triggered_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: subscription_payments subscription_payments_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;


--
-- Name: subscription_payments subscription_payments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;


--
-- Name: tax_configurations tax_configurations_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_configurations
    ADD CONSTRAINT tax_configurations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: tax_liabilities tax_liabilities_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_liabilities
    ADD CONSTRAINT tax_liabilities_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: usage_metrics usage_metrics_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: usage_metrics usage_metrics_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;


--
-- Name: user_notification_preferences user_notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id);


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: vacation_balance vacation_balance_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacation_balance
    ADD CONSTRAINT vacation_balance_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: work_schedules work_schedules_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: employee_absences Admins can create absences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create absences" ON public.employee_absences FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: employee_absences Admins can update absence status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update absence status" ON public.employee_absences FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: absence_approval_requests Admins can update approval requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update approval requests" ON public.absence_approval_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = absence_approval_requests.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = absence_approval_requests.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: error_logs Admins can update error logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update error logs" ON public.error_logs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: vacation_balance Admins can update vacation balances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update vacation balances" ON public.vacation_balance FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = vacation_balance.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = vacation_balance.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: employee_absences Admins can view all absences in their business; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all absences in their business" ON public.employee_absences FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: error_logs Admins can view all error logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all error logs" ON public.error_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: login_logs Admins can view all login logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all login logs" ON public.login_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: vacation_balance Admins can view all vacation balances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all vacation balances" ON public.vacation_balance FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = vacation_balance.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: absence_approval_requests Admins can view approval requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view approval requests" ON public.absence_approval_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = absence_approval_requests.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: work_schedules Admins can view employee schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view employee schedules" ON public.work_schedules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.business_employees be
  WHERE ((be.employee_id = work_schedules.employee_id) AND (be.business_id IN ( SELECT businesses.id
           FROM public.businesses
          WHERE (businesses.owner_id = auth.uid())
        UNION
         SELECT business_roles.business_id
           FROM public.business_roles
          WHERE ((business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))))));


--
-- Name: public_holidays Allow admin manage holidays; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admin manage holidays" ON public.public_holidays USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())
 LIMIT 1)));


--
-- Name: business_subcategories Allow business owners to manage subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow business owners to manage subcategories" ON public.business_subcategories USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: business_categories Allow public read access to active categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to active categories" ON public.business_categories FOR SELECT USING ((is_active = true));


--
-- Name: business_subcategories Allow public read access to business subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to business subcategories" ON public.business_subcategories FOR SELECT USING (true);


--
-- Name: public_holidays Allow public read for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read for all users" ON public.public_holidays FOR SELECT USING (true);


--
-- Name: discount_codes Anyone can view active discount codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active discount codes" ON public.discount_codes FOR SELECT USING ((is_active = true));


--
-- Name: bug_reports Authenticated users can insert bug reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert bug reports" ON public.bug_reports FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: bug_reports Authenticated users can view own bug reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view own bug reports" ON public.bug_reports FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: business_resources Business admins can manage resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business admins can manage resources" ON public.business_resources USING ((business_id IN ( SELECT business_roles.business_id
   FROM public.business_roles
  WHERE ((business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text) AND (business_roles.is_active = true)))));


--
-- Name: billing_audit_log Business admins can view billing audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business admins can view billing audit log" ON public.billing_audit_log FOR SELECT USING (public.is_business_admin(business_id));


--
-- Name: payment_methods Business admins can view payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business admins can view payment methods" ON public.payment_methods FOR SELECT USING (public.is_business_admin(business_id));


--
-- Name: subscription_payments Business admins can view payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business admins can view payments" ON public.subscription_payments FOR SELECT USING (public.is_business_admin(business_id));


--
-- Name: subscription_events Business admins can view subscription events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business admins can view subscription events" ON public.subscription_events FOR SELECT USING (public.is_business_admin(business_id));


--
-- Name: usage_metrics Business admins can view usage metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business admins can view usage metrics" ON public.usage_metrics FOR SELECT USING (public.is_business_admin(business_id));


--
-- Name: payment_methods Business owners can delete payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can delete payment methods" ON public.payment_methods FOR DELETE USING (public.is_business_owner(business_id));


--
-- Name: recurring_expenses Business owners can delete recurring expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can delete recurring expenses" ON public.recurring_expenses FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))));


--
-- Name: payment_methods Business owners can insert payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can insert payment methods" ON public.payment_methods FOR INSERT WITH CHECK (public.is_business_owner(business_id));


--
-- Name: recurring_expenses Business owners can insert recurring expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can insert recurring expenses" ON public.recurring_expenses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))));


--
-- Name: bug_reports Business owners can manage all bug reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can manage all bug reports" ON public.bug_reports FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: payroll_configuration Business owners can manage payroll config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can manage payroll config" ON public.payroll_configuration USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = payroll_configuration.business_id) AND (businesses.owner_id = auth.uid())))));


--
-- Name: payroll_payments Business owners can manage payroll payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can manage payroll payments" ON public.payroll_payments USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = payroll_payments.business_id) AND (businesses.owner_id = auth.uid())))));


--
-- Name: resource_services Business owners can manage resource services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can manage resource services" ON public.resource_services USING ((resource_id IN ( SELECT business_resources.id
   FROM public.business_resources
  WHERE (business_resources.business_id IN ( SELECT businesses.id
           FROM public.businesses
          WHERE (businesses.owner_id = auth.uid()))))));


--
-- Name: business_resources Business owners can manage resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can manage resources" ON public.business_resources USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: employee_requests Business owners can respond to requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can respond to requests" ON public.employee_requests FOR UPDATE TO authenticated USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: bug_reports Business owners can update bug reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can update bug reports" ON public.bug_reports FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: payment_methods Business owners can update payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can update payment methods" ON public.payment_methods FOR UPDATE USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));


--
-- Name: recurring_expenses Business owners can update recurring expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can update recurring expenses" ON public.recurring_expenses FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))));


--
-- Name: payroll_configuration Business owners can view payroll config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can view payroll config" ON public.payroll_configuration FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = payroll_configuration.business_id) AND (businesses.owner_id = auth.uid())))));


--
-- Name: payroll_payments Business owners can view payroll payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can view payroll payments" ON public.payroll_payments FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = payroll_payments.business_id) AND (businesses.owner_id = auth.uid())))) OR (employee_id = auth.uid())));


--
-- Name: employee_requests Business owners can view requests for their businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can view requests for their businesses" ON public.employee_requests FOR SELECT TO authenticated USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: reviews Clients can create review for own appointment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can create review for own appointment" ON public.reviews FOR INSERT WITH CHECK (((auth.uid() = client_id) AND (auth.uid() IN ( SELECT appointments.client_id
   FROM public.appointments
  WHERE ((appointments.id = reviews.appointment_id) AND (appointments.status = 'completed'::public.appointment_status))))));


--
-- Name: reviews Clients can manage own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can manage own reviews" ON public.reviews USING ((auth.uid() = client_id));


--
-- Name: invoices Clients can read own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can read own invoices" ON public.invoices FOR SELECT USING ((auth.uid() = client_id));


--
-- Name: employee_time_off Employees can cancel own pending requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can cancel own pending requests" ON public.employee_time_off FOR UPDATE USING (((employee_id = auth.uid()) AND ((status)::text = 'pending'::text))) WITH CHECK ((((status)::text = 'cancelled'::text) AND (cancelled_at IS NOT NULL)));


--
-- Name: employee_absences Employees can create absence requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can create absence requests" ON public.employee_absences FOR INSERT WITH CHECK ((employee_id = auth.uid()));


--
-- Name: employee_time_off Employees can create time off requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can create time off requests" ON public.employee_time_off FOR INSERT WITH CHECK (((employee_id = auth.uid()) AND ((status)::text = 'pending'::text)));


--
-- Name: work_schedules Employees can delete own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can delete own schedules" ON public.work_schedules FOR DELETE USING ((auth.uid() = employee_id));


--
-- Name: work_schedules Employees can insert own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can insert own schedules" ON public.work_schedules FOR INSERT WITH CHECK ((auth.uid() = employee_id));


--
-- Name: location_services Employees can read business location services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can read business location services" ON public.location_services FOR SELECT USING ((auth.uid() IN ( SELECT be.employee_id
   FROM (public.business_employees be
     JOIN public.locations l ON ((be.business_id = l.business_id)))
  WHERE ((l.id = location_services.location_id) AND (be.status = 'approved'::public.employee_status)))));


--
-- Name: employee_services Employees can read own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can read own services" ON public.employee_services FOR SELECT USING ((auth.uid() = employee_id));


--
-- Name: reviews Employees can read reviews about them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can read reviews about them" ON public.reviews FOR SELECT USING ((auth.uid() = employee_id));


--
-- Name: work_schedules Employees can update own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can update own schedules" ON public.work_schedules FOR UPDATE USING ((auth.uid() = employee_id)) WITH CHECK ((auth.uid() = employee_id));


--
-- Name: employee_absences Employees can update their pending absences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can update their pending absences" ON public.employee_absences FOR UPDATE USING (((employee_id = auth.uid()) AND ((status)::text = 'pending'::text))) WITH CHECK ((employee_id = auth.uid()));


--
-- Name: vacation_balance Employees can update their vacation balance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can update their vacation balance" ON public.vacation_balance FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.business_employees
  WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.business_id = vacation_balance.business_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.business_employees
  WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.business_id = vacation_balance.business_id)))));


--
-- Name: work_schedules Employees can view own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view own schedules" ON public.work_schedules FOR SELECT USING ((auth.uid() = employee_id));


--
-- Name: employee_time_off Employees can view own time off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view own time off" ON public.employee_time_off FOR SELECT USING ((employee_id = auth.uid()));


--
-- Name: employee_absences Employees can view their own absences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view their own absences" ON public.employee_absences FOR SELECT USING ((employee_id = auth.uid()));


--
-- Name: vacation_balance Employees can view their own vacation balance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view their own vacation balance" ON public.vacation_balance FOR SELECT USING ((employee_id = auth.uid()));


--
-- Name: vacation_balance Employees can view their vacation balance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view their vacation balance" ON public.vacation_balance FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.business_employees
  WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.business_id = vacation_balance.business_id)))));


--
-- Name: invoice_items Items inherit invoice policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Items inherit invoice policy" ON public.invoice_items USING ((auth.uid() IN ( SELECT b.owner_id
   FROM (public.invoices i
     JOIN public.businesses b ON ((i.business_id = b.id)))
  WHERE (i.id = invoice_items.invoice_id))));


--
-- Name: employee_services Managers can read employee services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can read employee services" ON public.employee_services FOR SELECT USING ((auth.uid() IN ( SELECT business_employees.employee_id
   FROM public.business_employees
  WHERE ((business_employees.business_id = employee_services.business_id) AND (business_employees.role = 'manager'::text) AND (business_employees.status = 'approved'::public.employee_status)))));


--
-- Name: transactions Managers can read location transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can read location transactions" ON public.transactions FOR SELECT USING ((auth.uid() IN ( SELECT be.employee_id
   FROM public.business_employees be
  WHERE ((be.business_id = transactions.business_id) AND (be.role = 'manager'::text) AND (be.status = 'approved'::public.employee_status)))));


--
-- Name: employee_time_off Managers can review time off requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can review time off requests" ON public.employee_time_off FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.business_employees
  WHERE ((business_employees.business_id = employee_time_off.business_id) AND (business_employees.employee_id = auth.uid()) AND (business_employees.role = 'manager'::text) AND (business_employees.is_active = true) AND (business_employees.status = 'approved'::public.employee_status))))) WITH CHECK ((((status)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying])::text[])) AND (reviewed_at IS NOT NULL) AND (reviewed_by = auth.uid())));


--
-- Name: employee_time_off Managers can view business time off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view business time off" ON public.employee_time_off FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.business_employees
  WHERE ((business_employees.business_id = employee_time_off.business_id) AND (business_employees.employee_id = auth.uid()) AND (business_employees.role = 'manager'::text) AND (business_employees.is_active = true) AND (business_employees.status = 'approved'::public.employee_status)))));


--
-- Name: location_media Members can delete their location media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can delete their location media" ON public.location_media FOR DELETE USING (public.can_manage_location_media(location_id));


--
-- Name: location_media Members can insert location media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can insert location media" ON public.location_media FOR INSERT WITH CHECK (public.can_manage_location_media(location_id));


--
-- Name: location_media Members can update their location media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can update their location media" ON public.location_media FOR UPDATE USING (public.can_manage_location_media(location_id)) WITH CHECK (public.can_manage_location_media(location_id));


--
-- Name: system_config Only service role can modify system config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only service role can modify system config" ON public.system_config USING ((auth.role() = 'service_role'::text));


--
-- Name: system_config Only service role can read system config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only service role can read system config" ON public.system_config FOR SELECT USING ((auth.role() = 'service_role'::text));


--
-- Name: reviews Owners can manage business reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage business reviews" ON public.reviews USING ((auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = reviews.business_id))));


--
-- Name: employee_services Owners can manage employee services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage employee services" ON public.employee_services USING ((auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = employee_services.business_id))));


--
-- Name: invoices Owners can manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage invoices" ON public.invoices USING ((auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = invoices.business_id))));


--
-- Name: location_services Owners can manage location services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage location services" ON public.location_services USING ((auth.uid() IN ( SELECT b.owner_id
   FROM (public.businesses b
     JOIN public.locations l ON ((b.id = l.business_id)))
  WHERE (l.id = location_services.location_id))));


--
-- Name: tax_configurations Owners can manage tax configurations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage tax configurations" ON public.tax_configurations USING ((auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = tax_configurations.business_id))));


--
-- Name: tax_liabilities Owners can manage tax liabilities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage tax liabilities" ON public.tax_liabilities USING ((auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = tax_liabilities.business_id))));


--
-- Name: transactions Owners can manage transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage transactions" ON public.transactions USING ((auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = transactions.business_id))));


--
-- Name: employee_services Public can read active employee services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read active employee services" ON public.employee_services FOR SELECT USING ((is_active = true));


--
-- Name: location_services Public can read active location services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read active location services" ON public.location_services FOR SELECT USING ((is_active = true));


--
-- Name: reviews Public can read visible reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read visible reviews" ON public.reviews FOR SELECT USING ((is_visible = true));


--
-- Name: resource_services Public can view active resource services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active resource services" ON public.resource_services FOR SELECT USING ((is_active = true));


--
-- Name: business_resources Public can view active resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active resources" ON public.business_resources FOR SELECT USING ((is_active = true));


--
-- Name: work_schedules Public can view employee schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view employee schedules" ON public.work_schedules FOR SELECT USING (true);


--
-- Name: employee_profiles Public profiles visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles visible" ON public.employee_profiles FOR SELECT USING ((available_for_hire = true));


--
-- Name: business_plans Public read access to business_plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to business_plans" ON public.business_plans FOR SELECT USING (true);


--
-- Name: cities Public read access to cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to cities" ON public.cities FOR SELECT USING (true);


--
-- Name: countries Public read access to countries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to countries" ON public.countries FOR SELECT USING (true);


--
-- Name: document_types Public read access to document_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to document_types" ON public.document_types FOR SELECT USING (true);


--
-- Name: genders Public read access to genders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to genders" ON public.genders FOR SELECT USING (true);


--
-- Name: health_insurance Public read access to health_insurance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to health_insurance" ON public.health_insurance FOR SELECT USING (true);


--
-- Name: regions Public read access to regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to regions" ON public.regions FOR SELECT USING (true);


--
-- Name: error_logs Service can insert error logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert error logs" ON public.error_logs FOR INSERT WITH CHECK (true);


--
-- Name: login_logs Service can insert login logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert login logs" ON public.login_logs FOR INSERT WITH CHECK (true);


--
-- Name: discount_code_uses Service role can insert discount code uses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert discount code uses" ON public.discount_code_uses FOR INSERT WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: billing_audit_log Service role can insert into billing audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert into billing audit log" ON public.billing_audit_log FOR INSERT WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: subscription_events Service role can insert subscription events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert subscription events" ON public.subscription_events FOR INSERT WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: discount_codes Service role has full access to discount codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to discount codes" ON public.discount_codes USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: payment_methods Service role has full access to payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to payment methods" ON public.payment_methods USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: subscription_payments Service role has full access to payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to payments" ON public.subscription_payments USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: usage_metrics Service role has full access to usage metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to usage metrics" ON public.usage_metrics USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: absence_approval_requests System can create approval requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create approval requests" ON public.absence_approval_requests FOR INSERT WITH CHECK (true);


--
-- Name: notifications System can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: vacation_balance System can insert vacation balances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert vacation balances" ON public.vacation_balance FOR INSERT WITH CHECK (true);


--
-- Name: conversations Users can create conversations in their businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations in their businesses" ON public.conversations FOR INSERT WITH CHECK ((created_by = auth.uid()));


--
-- Name: employee_requests Users can create employee requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create employee requests" ON public.employee_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: business_favorites Users can delete their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own favorites" ON public.business_favorites FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: messages Users can delete their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING ((sender_id = auth.uid()));


--
-- Name: employee_profiles Users can insert own employee profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own employee profile" ON public.employee_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: business_favorites Users can insert their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own favorites" ON public.business_favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversation_members Users can join conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join conversations" ON public.conversation_members FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: conversation_members Users can leave conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave conversations" ON public.conversation_members FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: notifications Users can read own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: messages Users can send messages to their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR INSERT WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.conversation_members
  WHERE ((conversation_members.conversation_id = messages.conversation_id) AND (conversation_members.user_id = auth.uid()))))));


--
-- Name: conversations Users can update conversations they created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update conversations they created" ON public.conversations FOR UPDATE USING ((created_by = auth.uid())) WITH CHECK ((created_by = auth.uid()));


--
-- Name: employee_profiles Users can update own employee profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own employee profile" ON public.employee_profiles FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: conversation_members Users can update their own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own membership" ON public.conversation_members FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: messages Users can update their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING ((sender_id = auth.uid())) WITH CHECK ((sender_id = auth.uid()));


--
-- Name: conversations Users can view conversations they are members of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view conversations they are members of" ON public.conversations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversation_members
  WHERE ((conversation_members.conversation_id = conversations.id) AND (conversation_members.user_id = auth.uid())))));


--
-- Name: location_media Users can view location media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view location media" ON public.location_media FOR SELECT USING (true);


--
-- Name: conversation_members Users can view members of conversations they belong to; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view members of conversations they belong to" ON public.conversation_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversation_members cm
  WHERE ((cm.conversation_id = conversation_members.conversation_id) AND (cm.user_id = auth.uid())))));


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversation_members
  WHERE ((conversation_members.conversation_id = messages.conversation_id) AND (conversation_members.user_id = auth.uid())))));


--
-- Name: employee_profiles Users can view own employee profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own employee profile" ON public.employee_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: employee_requests Users can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requests" ON public.employee_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: recurring_expenses Users can view their business recurring expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their business recurring expenses" ON public.recurring_expenses FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.business_employees
  WHERE ((business_employees.business_id = recurring_expenses.business_id) AND (business_employees.employee_id = auth.uid()))))));


--
-- Name: discount_code_uses Users can view their own discount code uses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own discount code uses" ON public.discount_code_uses FOR SELECT USING (((used_by = auth.uid()) OR public.is_business_admin(business_id)));


--
-- Name: error_logs Users can view their own error logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own error logs" ON public.error_logs FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: business_favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorites" ON public.business_favorites FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: login_logs Users can view their own login logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own login logs" ON public.login_logs FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: absence_approval_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.absence_approval_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: business_closed_days admin_manage_closed_days; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_closed_days ON public.business_closed_days USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())
UNION
 SELECT business_roles.business_id
   FROM public.business_roles
  WHERE ((business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))) WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())
UNION
 SELECT business_roles.business_id
   FROM public.business_roles
  WHERE ((business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text)))));


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments appointments_business_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appointments_business_owner ON public.appointments USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = appointments.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: appointments appointments_client; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appointments_client ON public.appointments USING ((client_id = auth.uid()));


--
-- Name: appointments appointments_employee; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appointments_employee ON public.appointments USING ((employee_id = auth.uid()));


--
-- Name: billing_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: bug_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: business_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: business_closed_days; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_closed_days ENABLE ROW LEVEL SECURITY;

--
-- Name: business_confirmation_policies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_confirmation_policies ENABLE ROW LEVEL SECURITY;

--
-- Name: business_confirmation_policies business_confirmation_policies_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_confirmation_policies_business_access ON public.business_confirmation_policies USING ((business_id IN ( SELECT business_employees.business_id
   FROM public.business_employees
  WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.role = 'manager'::text) AND (business_employees.status = 'approved'::public.employee_status)))));


--
-- Name: business_confirmation_policies business_confirmation_policies_member_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_confirmation_policies_member_read ON public.business_confirmation_policies FOR SELECT USING ((business_id IN ( SELECT business_employees.business_id
   FROM public.business_employees
  WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.status = 'approved'::public.employee_status)))));


--
-- Name: business_employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_employees ENABLE ROW LEVEL SECURITY;

--
-- Name: business_employees business_employees_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_employees_self ON public.business_employees USING (((employee_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid()))))));


--
-- Name: business_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: business_notification_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_notification_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: business_notification_settings business_notification_settings_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_notification_settings_insert_policy ON public.business_notification_settings FOR INSERT WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: business_notification_settings business_notification_settings_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_notification_settings_select_policy ON public.business_notification_settings FOR SELECT USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())
UNION
 SELECT business_employees.business_id
   FROM public.business_employees
  WHERE (business_employees.employee_id = auth.uid()))));


--
-- Name: business_notification_settings business_notification_settings_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_notification_settings_update_policy ON public.business_notification_settings FOR UPDATE USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: business_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: business_resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: business_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: business_roles business_roles_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_roles_delete ON public.business_roles FOR DELETE USING (((public.is_business_owner(auth.uid(), business_id) AND (NOT ((user_id = auth.uid()) AND (role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM public.user_permissions up
  WHERE ((up.user_id = auth.uid()) AND (up.business_id = business_roles.business_id) AND (up.permission = 'permissions.revoke'::text) AND (up.is_active = true))))));


--
-- Name: business_roles business_roles_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_roles_insert ON public.business_roles FOR INSERT WITH CHECK ((public.is_business_owner(auth.uid(), business_id) OR ((role = 'employee'::text) AND (EXISTS ( SELECT 1
   FROM public.user_permissions up
  WHERE ((up.user_id = auth.uid()) AND (up.business_id = business_roles.business_id) AND (up.permission = 'permissions.assign_employee'::text) AND (up.is_active = true)))))));


--
-- Name: business_roles business_roles_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_roles_select ON public.business_roles FOR SELECT USING ((public.is_business_owner(auth.uid(), business_id) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.get_user_permissions(auth.uid(), business_roles.business_id) p(permission)
  WHERE (p.permission = 'permissions.view'::text)))));


--
-- Name: business_roles business_roles_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY business_roles_update ON public.business_roles FOR UPDATE USING ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.get_user_permissions(auth.uid(), business_roles.business_id) p(permission)
  WHERE (p.permission = 'permissions.modify'::text))))) WITH CHECK ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.get_user_permissions(auth.uid(), business_roles.business_id) p(permission)
  WHERE (p.permission = 'permissions.modify'::text)))));


--
-- Name: business_subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: businesses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

--
-- Name: businesses businesses_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY businesses_delete_policy ON public.businesses FOR DELETE USING ((owner_id = auth.uid()));


--
-- Name: businesses businesses_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY businesses_insert_policy ON public.businesses FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (owner_id = auth.uid())));


--
-- Name: POLICY businesses_insert_policy ON businesses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY businesses_insert_policy ON public.businesses IS 'Allows INSERT only when auth.uid() is not NULL and matches owner_id';


--
-- Name: businesses businesses_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY businesses_select_policy ON public.businesses FOR SELECT USING (((owner_id = auth.uid()) OR (is_active = true)));


--
-- Name: businesses businesses_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY businesses_update_policy ON public.businesses FOR UPDATE USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));


--
-- Name: calendar_sync_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_sync_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_sync_settings calendar_sync_settings_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_sync_settings_owner ON public.calendar_sync_settings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_typing_indicators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;

--
-- Name: cities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: countries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_conversations creator_delete_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY creator_delete_conversations ON public.chat_conversations FOR DELETE TO authenticated USING ((created_by = auth.uid()));


--
-- Name: business_employees del_business_employees_by_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY del_business_employees_by_owner ON public.business_employees FOR DELETE USING ((auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = business_employees.business_id))));


--
-- Name: employee_services del_employee_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY del_employee_services ON public.employee_services FOR DELETE USING (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));


--
-- Name: business_employees delete_business_employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_business_employees ON public.business_employees FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: locations delete_locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_locations ON public.locations FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: discount_code_uses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discount_code_uses ENABLE ROW LEVEL SECURITY;

--
-- Name: discount_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: document_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_absences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_join_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_join_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_join_requests employee_join_requests_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_delete_admin ON public.employee_join_requests FOR DELETE USING (((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.business_roles
  WHERE ((business_roles.business_id = employee_join_requests.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))));


--
-- Name: employee_join_requests employee_join_requests_insert_invite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_insert_invite ON public.employee_join_requests FOR INSERT WITH CHECK (((employee_id IS NULL) AND ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.business_roles
  WHERE ((business_roles.business_id = business_roles.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text)))))));


--
-- Name: employee_join_requests employee_join_requests_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_insert_own ON public.employee_join_requests FOR INSERT WITH CHECK ((auth.uid() = employee_id));


--
-- Name: employee_join_requests employee_join_requests_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_select_admin ON public.employee_join_requests FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.business_roles
  WHERE ((business_roles.business_id = employee_join_requests.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))));


--
-- Name: employee_join_requests employee_join_requests_select_invite_code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_select_invite_code ON public.employee_join_requests FOR SELECT USING (((invite_code IS NOT NULL) AND (employee_id IS NULL)));


--
-- Name: employee_join_requests employee_join_requests_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_select_own ON public.employee_join_requests FOR SELECT USING ((auth.uid() = employee_id));


--
-- Name: employee_join_requests employee_join_requests_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_update_admin ON public.employee_join_requests FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.business_roles
  WHERE ((business_roles.business_id = employee_join_requests.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))));


--
-- Name: employee_join_requests employee_join_requests_update_claim; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_join_requests_update_claim ON public.employee_join_requests FOR UPDATE USING (((invite_code IS NOT NULL) AND (employee_id IS NULL))) WITH CHECK (((employee_id = auth.uid()) AND (status = 'pending'::text) AND (invite_code IS NOT NULL)));


--
-- Name: employee_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_time_off; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_time_off ENABLE ROW LEVEL SECURITY;

--
-- Name: error_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: genders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.genders ENABLE ROW LEVEL SECURITY;

--
-- Name: health_insurance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.health_insurance ENABLE ROW LEVEL SECURITY;

--
-- Name: in_app_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: business_employees ins_business_employees_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_business_employees_self ON public.business_employees FOR INSERT WITH CHECK (((auth.uid() = employee_id) OR (auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = business_employees.business_id)))));


--
-- Name: employee_services ins_employee_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_employee_services ON public.employee_services FOR INSERT WITH CHECK (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));


--
-- Name: notifications ins_notifications_system; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_notifications_system ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: profiles ins_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_profiles ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: business_employees insert_business_employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_business_employees ON public.business_employees FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: locations insert_locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_locations ON public.locations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: job_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: job_applications job_applications_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_applications_delete_own ON public.job_applications FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: job_applications job_applications_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_applications_insert_own ON public.job_applications FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: job_applications job_applications_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_applications_select_policy ON public.job_applications FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))) OR (business_id IN ( SELECT business_employees.business_id
   FROM public.business_employees
  WHERE (business_employees.employee_id = auth.uid())))));


--
-- Name: job_applications job_applications_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_applications_update_own ON public.job_applications FOR UPDATE USING (((user_id = auth.uid()) OR (business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))))) WITH CHECK (((user_id = auth.uid()) OR (business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())))));


--
-- Name: job_vacancies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;

--
-- Name: job_vacancies job_vacancies_delete_business_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_vacancies_delete_business_owner ON public.job_vacancies FOR DELETE USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: job_vacancies job_vacancies_insert_business_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_vacancies_insert_business_owner ON public.job_vacancies FOR INSERT WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: job_vacancies job_vacancies_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_vacancies_select_all ON public.job_vacancies FOR SELECT USING ((((status)::text = ANY (ARRAY['active'::text, 'open'::text])) OR (business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())
UNION
 SELECT business_employees.business_id
   FROM public.business_employees
  WHERE (business_employees.employee_id = auth.uid())))));


--
-- Name: job_vacancies job_vacancies_update_business_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_vacancies_update_business_owner ON public.job_vacancies FOR UPDATE USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: location_expense_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_expense_config ENABLE ROW LEVEL SECURITY;

--
-- Name: location_expense_config location_expense_config_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_expense_config_admin_delete ON public.location_expense_config FOR DELETE USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: location_expense_config location_expense_config_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_expense_config_admin_insert ON public.location_expense_config FOR INSERT WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: location_expense_config location_expense_config_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_expense_config_admin_select ON public.location_expense_config FOR SELECT USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: location_expense_config location_expense_config_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_expense_config_admin_update ON public.location_expense_config FOR UPDATE USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: location_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_media ENABLE ROW LEVEL SECURITY;

--
-- Name: location_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_services ENABLE ROW LEVEL SECURITY;

--
-- Name: locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

--
-- Name: login_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_log notification_log_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_log_select_policy ON public.notification_log FOR SELECT USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid())
UNION
 SELECT business_employees.business_id
   FROM public.business_employees
  WHERE (business_employees.employee_id = auth.uid()))));


--
-- Name: notification_log notification_log_service_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_log_service_policy ON public.notification_log USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: services owners_manage_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY owners_manage_services ON public.services TO authenticated USING ((business_id IN ( SELECT businesses.id
   FROM public.businesses
  WHERE (businesses.owner_id = auth.uid()))));


--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll_configuration; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payroll_configuration ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: permission_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: permission_audit_log permission_audit_log_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permission_audit_log_insert ON public.permission_audit_log FOR INSERT WITH CHECK (true);


--
-- Name: permission_audit_log permission_audit_log_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permission_audit_log_select ON public.permission_audit_log FOR SELECT USING ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.user_permissions up
  WHERE ((up.user_id = auth.uid()) AND (up.business_id = permission_audit_log.business_id) AND (up.permission = 'permissions.view'::text) AND (up.is_active = true))))));


--
-- Name: permission_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: permission_templates permission_templates_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permission_templates_delete ON public.permission_templates FOR DELETE USING (((is_system_template = false) AND (public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.user_permissions up
  WHERE ((up.user_id = auth.uid()) AND (up.business_id = permission_templates.business_id) AND (up.permission = 'permissions.modify'::text) AND (up.is_active = true)))))));


--
-- Name: permission_templates permission_templates_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permission_templates_insert ON public.permission_templates FOR INSERT WITH CHECK ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.get_user_permissions(auth.uid(), permission_templates.business_id) p(permission)
  WHERE (p.permission = 'permissions.modify'::text)))));


--
-- Name: permission_templates permission_templates_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permission_templates_select ON public.permission_templates FOR SELECT USING (((is_system_template = true) OR public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.get_user_permissions(auth.uid(), permission_templates.business_id) p(permission)
  WHERE (p.permission = 'permissions.view'::text)))));


--
-- Name: permission_templates permission_templates_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permission_templates_update ON public.permission_templates FOR UPDATE USING (((is_system_template = false) AND (public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.get_user_permissions(auth.uid(), permission_templates.business_id) p(permission)
  WHERE (p.permission = 'permissions.modify'::text)))))) WITH CHECK (((is_system_template = false) AND (public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.get_user_permissions(auth.uid(), permission_templates.business_id) p(permission)
  WHERE (p.permission = 'permissions.modify'::text))))));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: public_holidays; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

--
-- Name: businesses public_read_active_businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_active_businesses ON public.businesses FOR SELECT USING ((is_active = true));


--
-- Name: services public_read_active_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_active_services ON public.services FOR SELECT USING ((is_active = true));


--
-- Name: business_closed_days public_read_closed_days; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_closed_days ON public.business_closed_days FOR SELECT USING (true);


--
-- Name: recurring_expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: regions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

--
-- Name: resource_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resource_services ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: business_employees sel_business_employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_business_employees ON public.business_employees FOR SELECT USING (((status = 'approved'::public.employee_status) AND (is_active = true)));


--
-- Name: employee_services sel_employee_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_employee_services ON public.employee_services FOR SELECT USING (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));


--
-- Name: locations sel_locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_locations ON public.locations FOR SELECT USING ((is_active = true));


--
-- Name: notifications sel_notifications_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_notifications_self ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles sel_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_profiles ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles sel_profiles_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_profiles_public_read ON public.profiles FOR SELECT USING ((is_active = true));


--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: services services_via_business; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY services_via_business ON public.services USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = services.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: subscription_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: system_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

--
-- Name: in_app_notifications system_insert_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY system_insert_notifications ON public.in_app_notifications FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: tax_configurations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_liabilities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_liabilities ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: business_employees upd_business_employees_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_business_employees_self ON public.business_employees FOR UPDATE USING (((auth.uid() = employee_id) OR (auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = business_employees.business_id))))) WITH CHECK (((auth.uid() = employee_id) OR (auth.uid() IN ( SELECT businesses.owner_id
   FROM public.businesses
  WHERE (businesses.id = business_employees.business_id)))));


--
-- Name: employee_services upd_employee_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_employee_services ON public.employee_services FOR UPDATE USING (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid())))))) WITH CHECK (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));


--
-- Name: notifications upd_notifications_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_notifications_self ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles upd_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_profiles ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: business_employees update_business_employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_business_employees ON public.business_employees FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: locations update_locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_locations ON public.locations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid())))));


--
-- Name: usage_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: user_notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_notification_preferences user_notification_preferences_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_notification_preferences_delete_own ON public.user_notification_preferences FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: user_notification_preferences user_notification_preferences_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_notification_preferences_insert_own ON public.user_notification_preferences FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_notification_preferences user_notification_preferences_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_notification_preferences_select_own ON public.user_notification_preferences FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_notification_preferences user_notification_preferences_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_notification_preferences_update_own ON public.user_notification_preferences FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permissions user_permissions_delete_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_permissions_delete_v2 ON public.user_permissions FOR DELETE USING ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.business_roles br
  WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));


--
-- Name: user_permissions user_permissions_insert_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_permissions_insert_v2 ON public.user_permissions FOR INSERT WITH CHECK ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.business_roles br
  WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));


--
-- Name: user_permissions user_permissions_select_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_permissions_select_v2 ON public.user_permissions FOR SELECT USING ((public.is_business_owner(auth.uid(), business_id) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.business_roles br
  WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));


--
-- Name: user_permissions user_permissions_update_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_permissions_update_v2 ON public.user_permissions FOR UPDATE USING ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.business_roles br
  WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true)))))) WITH CHECK ((public.is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1
   FROM public.business_roles br
  WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));


--
-- Name: chat_messages users_delete_own_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_delete_own_messages ON public.chat_messages FOR DELETE TO authenticated USING ((sender_id = auth.uid()));


--
-- Name: in_app_notifications users_delete_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_delete_own_notifications ON public.in_app_notifications FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: chat_participants users_delete_own_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_delete_own_participant ON public.chat_participants FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: chat_typing_indicators users_delete_typing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_delete_typing ON public.chat_typing_indicators FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: chat_conversations users_insert_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert_conversations ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));


--
-- Name: chat_messages users_insert_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert_messages ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (((sender_id = auth.uid()) AND public.user_is_in_conversation(conversation_id, auth.uid())));


--
-- Name: chat_participants users_insert_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert_participants ON public.chat_participants FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_participants.conversation_id) AND (chat_conversations.created_by = auth.uid()))))));


--
-- Name: chat_typing_indicators users_insert_typing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert_typing ON public.chat_typing_indicators FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND public.user_is_in_conversation(conversation_id, auth.uid())));


--
-- Name: chat_conversations users_select_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_conversations ON public.chat_conversations FOR SELECT TO authenticated USING (public.user_is_in_conversation(id, auth.uid()));


--
-- Name: chat_messages users_select_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_messages ON public.chat_messages FOR SELECT TO authenticated USING (public.user_is_in_conversation(conversation_id, auth.uid()));


--
-- Name: in_app_notifications users_select_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_own_notifications ON public.in_app_notifications FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: chat_participants users_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_participants ON public.chat_participants FOR SELECT TO authenticated USING (public.user_is_in_conversation(conversation_id, auth.uid()));


--
-- Name: chat_typing_indicators users_select_typing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_typing ON public.chat_typing_indicators FOR SELECT TO authenticated USING (public.user_is_in_conversation(conversation_id, auth.uid()));


--
-- Name: chat_conversations users_update_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_conversations ON public.chat_conversations FOR UPDATE USING (public.user_is_in_conversation(id, auth.uid())) WITH CHECK (public.user_is_in_conversation(id, auth.uid()));


--
-- Name: chat_messages users_update_own_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_own_messages ON public.chat_messages FOR UPDATE TO authenticated USING ((sender_id = auth.uid())) WITH CHECK ((sender_id = auth.uid()));


--
-- Name: in_app_notifications users_update_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_own_notifications ON public.in_app_notifications FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: chat_participants users_update_own_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_own_participant ON public.chat_participants FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: chat_typing_indicators users_update_typing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_typing ON public.chat_typing_indicators FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: vacation_balance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vacation_balance ENABLE ROW LEVEL SECURITY;

--
-- Name: work_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict RX7IrdKEo73XZ2VJYZXPakb7XuIEqAsDQnCqpFzRf7Hp559Wpw6Pq45NinjnlrW


