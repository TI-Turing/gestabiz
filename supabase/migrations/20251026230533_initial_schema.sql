-- ============================================================
-- SCHEMA INICIAL — Gestabiz DEV
-- Generado: 2026-03-23T16:24:22.510Z
-- Proyecto: dkancockzvcqorqbwtyh (gestabiz-dev)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
-- uuid-ossp: ya instalado por Supabase en schema extensions. Usar gen_random_uuid() en su lugar.

-- Custom Types / Enums
CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'in_progress'
);
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
CREATE TYPE public.conversation_role AS ENUM (
  'member',
  'admin',
  'owner'
);
CREATE TYPE public.conversation_type AS ENUM (
  'direct',
  'group'
);
CREATE TYPE public.delivery_status_enum AS ENUM (
  'sending',
  'sent',
  'delivered',
  'read',
  'failed'
);
CREATE TYPE public.employee_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);
CREATE TYPE public.invoice_status AS ENUM (
  'draft',
  'issued',
  'paid',
  'overdue',
  'cancelled',
  'credit_note'
);
CREATE TYPE public.legal_entity_type AS ENUM (
  'company',
  'individual'
);
CREATE TYPE public.message_type AS ENUM (
  'text',
  'image',
  'file',
  'system'
);
CREATE TYPE public.notification_channel AS ENUM (
  'email',
  'sms',
  'whatsapp',
  'in_app'
);
CREATE TYPE public.notification_status AS ENUM (
  'unread',
  'read',
  'archived'
);
CREATE TYPE public.notification_type AS ENUM (
  'appointment_reminder',
  'appointment_cancelled',
  'appointment_confirmed',
  'system'
);
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
  'business_unconfigured'
);
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'paid',
  'refunded'
);
CREATE TYPE public.resource_model AS ENUM (
  'professional',
  'physical_resource',
  'hybrid',
  'group_class'
);
CREATE TYPE public.tax_regime AS ENUM (
  'simple',
  'common',
  'special'
);
CREATE TYPE public.tax_type AS ENUM (
  'iva_0',
  'iva_5',
  'iva_19',
  'ica',
  'retention',
  'none'
);
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
CREATE TYPE public.transaction_type AS ENUM (
  'income',
  'expense'
);
CREATE TYPE public.user_role AS ENUM (
  'client',
  'employee',
  'admin'
);

-- Tables
CREATE TABLE IF NOT EXISTS public.absence_approval_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    absence_id uuid NOT NULL,
    business_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    assigned_to uuid,
    status varchar(20) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamptz,
    decision varchar(20),
    decision_notes text,
    created_at timestamptz DEFAULT now(),
    notified_at timestamptz,
    PRIMARY KEY (id),
    CONSTRAINT absence_approval_requests_unique UNIQUE (absence_id),
    CONSTRAINT absence_approval_requests_decision_check CHECK (((decision)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT absence_approval_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'escalated'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    service_id uuid NOT NULL,
    client_id uuid NOT NULL,
    employee_id uuid,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status public.appointment_status DEFAULT 'pending'::appointment_status NOT NULL,
    notes text,
    client_notes text,
    price numeric(10,2),
    currency text DEFAULT 'MXN'::text,
    payment_status public.payment_status DEFAULT 'pending'::payment_status,
    reminder_sent bool DEFAULT false NOT NULL,
    cancelled_at timestamptz,
    cancelled_by uuid,
    cancel_reason text,
    is_location_exception bool DEFAULT false NOT NULL,
    original_location_id uuid,
    resource_id uuid,
    confirmed bool DEFAULT false,
    confirmation_sent_at timestamptz,
    confirmation_deadline timestamptz,
    confirmation_token text,
    auto_no_show_at timestamptz,
    confirmed_at timestamptz,
    gross_amount numeric(12,2),
    commission_amount numeric(12,2),
    net_amount numeric(12,2),
    other_deductions numeric(12,2) DEFAULT 0,
    completed_at timestamptz,
    PRIMARY KEY (id),
    CONSTRAINT appointments_confirmation_token_key UNIQUE (confirmation_token),
    CONSTRAINT appointments_check CHECK ((end_time > start_time)),
    CONSTRAINT check_appointment_has_assignee CHECK (((employee_id IS NOT NULL) OR (resource_id IS NOT NULL)))
);

CREATE TABLE IF NOT EXISTS public.billing_audit_log (
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
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT billing_audit_log_action_check CHECK ((action = ANY (ARRAY['payment_method_added'::text, 'payment_method_removed'::text, 'payment_method_updated'::text, 'subscription_created'::text, 'subscription_upgraded'::text, 'subscription_downgraded'::text, 'subscription_canceled'::text, 'subscription_paused'::text, 'subscription_resumed'::text, 'payment_succeeded'::text, 'payment_failed'::text, 'discount_code_applied'::text, 'plan_limit_exceeded'::text, 'plan_limit_warning'::text]))),
    CONSTRAINT billing_audit_log_performed_by_source_check CHECK ((performed_by_source = ANY (ARRAY['user'::text, 'system'::text, 'stripe_webhook'::text, 'admin'::text])))
);

CREATE TABLE IF NOT EXISTS public.bug_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity text NOT NULL,
    url text,
    user_agent text,
    browser text,
    os text,
    viewport_width int4,
    viewport_height int4,
    screenshot_url text,
    console_logs text,
    network_logs text,
    environment text DEFAULT 'production'::text,
    app_version text,
    tags text[] DEFAULT '{}'::text[],
    status text DEFAULT 'open'::text,
    assigned_to uuid,
    resolution_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    steps_to_reproduce text,
    category text,
    affected_page text,
    browser_version text,
    device_type text,
    screen_resolution text,
    priority text DEFAULT 'normal'::text,
    PRIMARY KEY (id),
    CONSTRAINT bug_reports_environment_check CHECK ((environment = ANY (ARRAY['development'::text, 'staging'::text, 'production'::text]))),
    CONSTRAINT bug_reports_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT bug_reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'wont_fix'::text, 'duplicate'::text])))
);

CREATE TABLE IF NOT EXISTS public.business_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    name varchar(100) NOT NULL,
    slug varchar(100) NOT NULL,
    description text,
    icon_name varchar(50),
    is_active bool DEFAULT true NOT NULL,
    sort_order int4 DEFAULT 0,
    parent_id uuid,
    PRIMARY KEY (id),
    CONSTRAINT business_categories_name_key UNIQUE (name),
    CONSTRAINT business_categories_slug_key UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.business_confirmation_policies (
    id uuid DEFAULT (md5(((random())::text || (clock_timestamp())::text)))::uuid NOT NULL,
    business_id uuid NOT NULL,
    confirmation_method text DEFAULT 'email'::text NOT NULL,
    email_enabled bool DEFAULT true,
    email_hours_before int4 DEFAULT 24,
    email_template_subject text DEFAULT 'Confirma tu cita - {{business_name}}'::text,
    email_template_body text DEFAULT 'Hola {{client_name}}, tienes una cita programada para {{appointment_date}} a las {{appointment_time}}. Por favor confirma tu asistencia.'::text,
    payment_enabled bool DEFAULT false,
    payment_percentage numeric(5,2) DEFAULT 0.00,
    payment_hours_before int4 DEFAULT 24,
    auto_no_show_enabled bool DEFAULT true,
    auto_no_show_minutes_after int4 DEFAULT 10,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT business_confirmation_policies_business_id_key UNIQUE (business_id),
    CONSTRAINT business_confirmation_policies_auto_no_show_minutes_after_check CHECK ((auto_no_show_minutes_after >= 0)),
    CONSTRAINT business_confirmation_policies_confirmation_method_check CHECK ((confirmation_method = ANY (ARRAY['email'::text, 'payment'::text, 'both'::text]))),
    CONSTRAINT business_confirmation_policies_email_hours_before_check CHECK ((email_hours_before >= 0)),
    CONSTRAINT business_confirmation_policies_payment_hours_before_check CHECK ((payment_hours_before >= 0)),
    CONSTRAINT business_confirmation_policies_payment_percentage_check CHECK (((payment_percentage >= (0)::numeric) AND (payment_percentage <= (100)::numeric)))
);

CREATE TABLE IF NOT EXISTS public.business_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    role text DEFAULT 'employee'::text,
    status public.employee_status DEFAULT 'pending'::employee_status NOT NULL,
    hired_at timestamptz,
    is_active bool DEFAULT true NOT NULL,
    location_id uuid,
    salary_base numeric(12,2),
    salary_type varchar(20) DEFAULT 'monthly'::character varying,
    social_security_contribution numeric(12,2) DEFAULT 0,
    health_contribution numeric(12,2) DEFAULT 0,
    pension_contribution numeric(12,2) DEFAULT 0,
    contract_type varchar(50) DEFAULT 'indefinido'::character varying,
    employee_type text DEFAULT 'service_provider'::text,
    offers_services bool DEFAULT true NOT NULL,
    job_title varchar(100),
    hire_date date DEFAULT CURRENT_DATE,
    termination_date timestamptz,
    lunch_break_start time DEFAULT '12:00:00'::time without time zone,
    lunch_break_end time DEFAULT '13:00:00'::time without time zone,
    has_lunch_break bool DEFAULT true,
    allow_client_messages bool DEFAULT true,
    transfer_from_location_id uuid,
    transfer_to_location_id uuid,
    transfer_effective_date timestamptz,
    transfer_notice_period_days int4 DEFAULT 7,
    transfer_scheduled_at timestamptz,
    transfer_scheduled_by uuid,
    transfer_status text,
    vacation_days_accrued int4 DEFAULT 0,
    setup_completed bool DEFAULT false NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT business_employees_business_id_employee_id_key UNIQUE (business_id, employee_id),
    CONSTRAINT business_employees_employee_type_check CHECK ((employee_type = ANY (ARRAY['service_provider'::text, 'support_staff'::text, 'location_manager'::text, 'team_lead'::text]))),
    CONSTRAINT business_employees_role_check CHECK ((role = ANY (ARRAY['employee'::text, 'manager'::text]))),
    CONSTRAINT business_employees_transfer_status_check CHECK ((transfer_status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT check_transfer_effective_date_future CHECK (((transfer_effective_date IS NULL) OR (transfer_effective_date > now()) OR (transfer_status = 'completed'::text))),
    CONSTRAINT check_transfer_notice_period CHECK (((transfer_notice_period_days IS NULL) OR ((transfer_notice_period_days >= 7) AND (transfer_notice_period_days <= 30)))),
    CONSTRAINT check_transfer_pending_complete CHECK ((((transfer_status = 'pending'::text) AND (transfer_from_location_id IS NOT NULL) AND (transfer_to_location_id IS NOT NULL) AND (transfer_effective_date IS NOT NULL)) OR (transfer_status <> 'pending'::text) OR (transfer_status IS NULL)))
);

CREATE TABLE IF NOT EXISTS public.business_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT unique_user_business_favorite UNIQUE (user_id, business_id)
);

CREATE TABLE IF NOT EXISTS public.business_notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    email_enabled bool DEFAULT true NOT NULL,
    sms_enabled bool DEFAULT false NOT NULL,
    whatsapp_enabled bool DEFAULT false NOT NULL,
    channel_priority notification_channel[] DEFAULT ARRAY['whatsapp'::notification_channel, 'email'::notification_channel, 'sms'::notification_channel],
    reminder_times int4[] DEFAULT ARRAY[1440, 60],
    notification_types jsonb DEFAULT '{"daily_digest": {"enabled": false, "channels": ["email"]}, "employee_request": {"enabled": true, "channels": ["email"]}, "appointment_reminder": {"enabled": true, "channels": ["email", "whatsapp"]}, "appointment_rescheduled": {"enabled": true, "channels": ["email", "whatsapp"]}, "appointment_cancellation": {"enabled": true, "channels": ["email", "sms", "whatsapp"]}, "appointment_confirmation": {"enabled": true, "channels": ["email", "whatsapp"]}}'::jsonb,
    email_from_name varchar(255),
    email_from_address varchar(255),
    twilio_phone_number varchar(50),
    whatsapp_phone_number varchar(50),
    send_notifications_from time DEFAULT '08:00:00'::time without time zone,
    send_notifications_until time DEFAULT '22:00:00'::time without time zone,
    timezone varchar(50) DEFAULT 'America/Bogota'::character varying,
    use_fallback bool DEFAULT true NOT NULL,
    max_retry_attempts int4 DEFAULT 3,
    PRIMARY KEY (id),
    CONSTRAINT business_notification_settings_business_id_key UNIQUE (business_id)
);

CREATE TABLE IF NOT EXISTS public.business_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    plan_type text NOT NULL,
    status text DEFAULT 'active'::text,
    start_date timestamptz DEFAULT now(),
    end_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    billing_cycle text DEFAULT 'monthly'::text,
    auto_renew bool DEFAULT true,
    discount_code text,
    trial_ends_at timestamptz,
    grace_period_ends_at timestamptz,
    paused_at timestamptz,
    canceled_at timestamptz,
    cancellation_reason text,
    PRIMARY KEY (id),
    CONSTRAINT business_plans_stripe_subscription_id_key UNIQUE (stripe_subscription_id),
    CONSTRAINT business_plans_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT business_plans_plan_type_check CHECK ((plan_type = ANY (ARRAY['inicio'::text, 'profesional'::text, 'empresarial'::text, 'corporativo'::text]))),
    CONSTRAINT business_plans_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'expired'::text, 'canceled'::text, 'suspended'::text, 'trialing'::text, 'past_due'::text, 'paused'::text])))
);

CREATE TABLE IF NOT EXISTS public.business_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    name varchar(200) NOT NULL,
    resource_type varchar(50) NOT NULL,
    description text,
    capacity int4,
    is_active bool DEFAULT true NOT NULL,
    available_hours jsonb,
    image_url text,
    amenities text[],
    price_per_hour numeric(10,2),
    price_per_day numeric(10,2),
    currency varchar(3) DEFAULT 'COP'::character varying,
    max_simultaneous_bookings int4 DEFAULT 1,
    PRIMARY KEY (id),
    CONSTRAINT business_resources_business_id_name_key UNIQUE (business_id, name),
    CONSTRAINT business_resources_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT business_resources_max_simultaneous_bookings_check CHECK ((max_simultaneous_bookings > 0)),
    CONSTRAINT business_resources_price_per_day_check CHECK ((price_per_day >= (0)::numeric)),
    CONSTRAINT business_resources_price_per_hour_check CHECK ((price_per_hour >= (0)::numeric)),
    CONSTRAINT business_resources_resource_type_check CHECK (((resource_type)::text = ANY ((ARRAY['room'::character varying, 'table'::character varying, 'court'::character varying, 'studio'::character varying, 'meeting_room'::character varying, 'desk'::character varying, 'equipment'::character varying, 'vehicle'::character varying, 'space'::character varying, 'lane'::character varying, 'field'::character varying, 'station'::character varying, 'parking_spot'::character varying, 'bed'::character varying, 'other'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.business_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    employee_type text,
    assigned_by uuid,
    assigned_at timestamptz DEFAULT now() NOT NULL,
    is_active bool DEFAULT true NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    hierarchy_level int4 DEFAULT 4,
    reports_to uuid,
    PRIMARY KEY (id),
    CONSTRAINT business_roles_business_id_user_id_role_key UNIQUE (business_id, user_id, role),
    CONSTRAINT business_roles_employee_type_check CHECK ((employee_type = ANY (ARRAY['service_provider'::text, 'support_staff'::text, NULL::text]))),
    CONSTRAINT business_roles_hierarchy_level_check CHECK (((hierarchy_level >= 0) AND (hierarchy_level <= 4))),
    CONSTRAINT business_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'employee'::text])))
);

CREATE TABLE IF NOT EXISTS public.business_subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    subcategory_id uuid NOT NULL,
    description text,
    PRIMARY KEY (id),
    CONSTRAINT business_subcategories_business_id_subcategory_id_key UNIQUE (business_id, subcategory_id)
);

CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
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
    is_active bool DEFAULT true NOT NULL,
    total_reviews int4 DEFAULT 0 NOT NULL,
    average_rating numeric(3,2) DEFAULT 0 NOT NULL,
    total_appointments int4 DEFAULT 0 NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    invitation_code varchar(6),
    last_activity_at timestamptz DEFAULT now(),
    first_client_at timestamptz,
    category public.business_category DEFAULT 'other'::business_category,
    legal_entity_type public.legal_entity_type DEFAULT 'individual'::legal_entity_type,
    tax_id varchar(50),
    legal_name text,
    registration_number varchar(100),
    category_id uuid,
    search_vector tsvector,
    tax_regime public.tax_regime DEFAULT 'common'::tax_regime,
    fiscal_responsibilities jsonb DEFAULT '{"ica": false, "iva": true, "retention": false}'::jsonb,
    banner_url text,
    slug text NOT NULL,
    meta_title text,
    meta_description text,
    meta_keywords text[],
    og_image_url text,
    is_public bool DEFAULT true,
    vacation_days_per_year int4 DEFAULT 15,
    allow_same_day_absence bool DEFAULT true,
    require_absence_approval bool DEFAULT true,
    max_advance_vacation_request_days int4 DEFAULT 90,
    resource_model public.resource_model DEFAULT 'professional'::resource_model NOT NULL,
    region_id uuid,
    city_id uuid,
    country_id uuid,
    is_configured bool DEFAULT false NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT businesses_invitation_code_key UNIQUE (invitation_code),
    CONSTRAINT businesses_slug_unique UNIQUE (slug),
    CONSTRAINT businesses_average_rating_check CHECK (((average_rating >= (0)::numeric) AND (average_rating <= (5)::numeric)))
);

CREATE TABLE IF NOT EXISTS public.calendar_sync_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text DEFAULT 'google'::text NOT NULL,
    enabled bool DEFAULT true NOT NULL,
    calendar_id text DEFAULT ''::text NOT NULL,
    access_token text,
    refresh_token text,
    sync_direction text DEFAULT 'both'::text NOT NULL,
    auto_sync bool DEFAULT true NOT NULL,
    last_sync timestamptz,
    sync_errors text[] DEFAULT '{}'::text[],
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT calendar_sync_settings_user_id_provider_key UNIQUE (user_id, provider),
    CONSTRAINT calendar_sync_settings_provider_check CHECK ((provider = ANY (ARRAY['google'::text, 'outlook'::text, 'apple'::text]))),
    CONSTRAINT calendar_sync_settings_sync_direction_check CHECK ((sync_direction = ANY (ARRAY['both'::text, 'export_only'::text, 'import_only'::text])))
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text,
    created_by uuid,
    business_id uuid,
    last_message_at timestamptz DEFAULT now() NOT NULL,
    last_message_preview text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    is_archived bool DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (id),
    CONSTRAINT chat_conversations_type_check CHECK ((type = ANY (ARRAY['direct'::text, 'group'::text])))
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    attachments jsonb,
    sent_at timestamptz DEFAULT now() NOT NULL,
    delivered_at timestamptz,
    read_by jsonb DEFAULT '[]'::jsonb,
    reply_to_id uuid,
    edited_at timestamptz,
    deleted_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chat_messages_check CHECK (((content <> ''::text) OR (attachments IS NOT NULL))),
    CONSTRAINT chat_messages_type_check CHECK ((type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'system'::text])))
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamptz DEFAULT now() NOT NULL,
    left_at timestamptz,
    last_read_at timestamptz,
    last_read_message_id uuid,
    unread_count int4 DEFAULT 0 NOT NULL,
    is_muted bool DEFAULT false NOT NULL,
    is_pinned bool DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chat_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id),
    CONSTRAINT chat_participants_check CHECK (((left_at IS NULL) OR (left_at > joined_at)))
);

CREATE TABLE IF NOT EXISTS public.chat_typing_indicators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamptz DEFAULT now() NOT NULL,
    expires_at timestamptz DEFAULT (now() + '00:00:10'::interval) NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chat_typing_indicators_conversation_id_user_id_key UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.cities (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    region_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamptz DEFAULT now() NOT NULL,
    role public.conversation_role DEFAULT 'member'::conversation_role NOT NULL,
    muted bool DEFAULT false NOT NULL,
    notifications_enabled bool DEFAULT true NOT NULL,
    custom_name text,
    last_read_at timestamptz,
    last_seen_at timestamptz,
    unread_count int4 DEFAULT 0 NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    type public.conversation_type DEFAULT 'direct'::conversation_type NOT NULL,
    name text,
    description text,
    avatar_url text,
    created_by uuid NOT NULL,
    is_archived bool DEFAULT false NOT NULL,
    last_message_at timestamptz,
    last_message_preview text,
    PRIMARY KEY (id),
    CONSTRAINT conversations_name_check CHECK ((((type = 'group'::conversation_type) AND (name IS NOT NULL)) OR ((type = 'direct'::conversation_type) AND (name IS NULL))))
);

CREATE TABLE IF NOT EXISTS public.countries (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    code varchar(10) NOT NULL,
    phone_prefix varchar(10) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT countries_code_key UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public.cron_execution_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    job_name text NOT NULL,
    status text NOT NULL,
    message text,
    execution_time_ms int4,
    details jsonb,
    PRIMARY KEY (id),
    CONSTRAINT cron_execution_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'warning'::text])))
);

CREATE TABLE IF NOT EXISTS public.discount_code_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    discount_code_id uuid NOT NULL,
    business_id uuid NOT NULL,
    plan_id uuid,
    discount_amount numeric(10,2) NOT NULL,
    original_amount numeric(10,2) NOT NULL,
    final_amount numeric(10,2) NOT NULL,
    used_at timestamptz DEFAULT now(),
    used_by uuid,
    PRIMARY KEY (id),
    CONSTRAINT discount_code_uses_business_code_unique UNIQUE (discount_code_id, business_id),
    CONSTRAINT discount_code_uses_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT discount_code_uses_final_amount_check CHECK ((final_amount >= (0)::numeric)),
    CONSTRAINT discount_code_uses_original_amount_check CHECK ((original_amount > (0)::numeric))
);

CREATE TABLE IF NOT EXISTS public.discount_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    max_uses int4,
    current_uses int4 DEFAULT 0,
    min_amount numeric(10,2),
    eligible_plans text[],
    valid_from timestamptz DEFAULT now(),
    valid_until timestamptz,
    is_active bool DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    PRIMARY KEY (id),
    CONSTRAINT discount_codes_code_key UNIQUE (code),
    CONSTRAINT discount_codes_current_uses_check CHECK ((current_uses >= 0)),
    CONSTRAINT discount_codes_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text]))),
    CONSTRAINT discount_codes_discount_value_check CHECK ((discount_value > (0)::numeric)),
    CONSTRAINT discount_codes_max_uses_check CHECK ((max_uses > 0)),
    CONSTRAINT discount_codes_min_amount_check CHECK ((min_amount > (0)::numeric)),
    CONSTRAINT discount_codes_percentage_limit CHECK ((((discount_type = 'percentage'::text) AND (discount_value <= (100)::numeric)) OR (discount_type = 'fixed_amount'::text))),
    CONSTRAINT discount_codes_valid_dates CHECK (((valid_until IS NULL) OR (valid_until > valid_from)))
);

CREATE TABLE IF NOT EXISTS public.document_types (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    abbreviation varchar(10) NOT NULL,
    country_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employee_absences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    absence_type varchar(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status varchar(20) DEFAULT 'pending'::character varying NOT NULL,
    reason text NOT NULL,
    employee_notes text,
    admin_notes text,
    approved_by uuid,
    approved_at timestamptz,
    appointments_cancelled_count int4 DEFAULT 0,
    appointments_cancelled_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT employee_absences_absence_type_check CHECK (((absence_type)::text = ANY ((ARRAY['vacation'::character varying, 'emergency'::character varying, 'sick_leave'::character varying, 'personal'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT employee_absences_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT valid_date_range CHECK ((end_date >= start_date))
);

CREATE TABLE IF NOT EXISTS public.employee_join_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid,
    business_id uuid NOT NULL,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    invite_code text,
    invite_code_expires_at timestamptz,
    reviewed_by uuid,
    reviewed_at timestamptz,
    rejection_reason text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT employee_join_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);

CREATE TABLE IF NOT EXISTS public.employee_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    professional_summary text,
    years_of_experience int4 DEFAULT 0,
    specializations text[] DEFAULT '{}'::text[],
    languages text[] DEFAULT '{}'::text[],
    certifications jsonb DEFAULT '[]'::jsonb,
    portfolio_url text,
    linkedin_url text,
    github_url text,
    available_for_hire bool DEFAULT true,
    preferred_work_type text,
    expected_salary_min int4,
    expected_salary_max int4,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT employee_profiles_user_id_key UNIQUE (user_id),
    CONSTRAINT employee_profiles_preferred_work_type_check CHECK ((preferred_work_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'freelance'::text, 'any'::text]))),
    CONSTRAINT employee_profiles_years_of_experience_check CHECK (((years_of_experience >= 0) AND (years_of_experience <= 50)))
);

CREATE TABLE IF NOT EXISTS public.employee_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    invitation_code varchar(6) NOT NULL,
    status varchar(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    responded_at timestamptz,
    responded_by uuid,
    message text,
    PRIMARY KEY (id),
    CONSTRAINT employee_requests_business_id_user_id_status_key UNIQUE (business_id, user_id, status),
    CONSTRAINT employee_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.employee_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    employee_id uuid NOT NULL,
    service_id uuid NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid NOT NULL,
    expertise_level int4 DEFAULT 3,
    is_active bool DEFAULT true NOT NULL,
    commission_percentage numeric(5,2),
    notes text,
    PRIMARY KEY (id),
    CONSTRAINT unique_employee_service UNIQUE (employee_id, service_id, business_id),
    CONSTRAINT employee_services_commission_percentage_check CHECK (((commission_percentage >= (0)::numeric) AND (commission_percentage <= (100)::numeric))),
    CONSTRAINT employee_services_expertise_level_check CHECK (((expertise_level >= 1) AND (expertise_level <= 5)))
);

CREATE TABLE IF NOT EXISTS public.employee_time_off (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    employee_id uuid NOT NULL,
    business_id uuid NOT NULL,
    location_id uuid,
    type varchar(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days int4,
    status varchar(20) DEFAULT 'pending'::character varying NOT NULL,
    employee_notes text,
    manager_notes text,
    rejection_reason text,
    requested_at timestamptz DEFAULT now() NOT NULL,
    reviewed_at timestamptz,
    reviewed_by uuid,
    cancelled_at timestamptz,
    PRIMARY KEY (id),
    CONSTRAINT employee_time_off_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT employee_time_off_type_check CHECK (((type)::text = ANY ((ARRAY['vacation'::character varying, 'sick_leave'::character varying, 'personal'::character varying, 'unpaid'::character varying, 'bereavement'::character varying, 'maternity'::character varying, 'paternity'::character varying])::text[]))),
    CONSTRAINT valid_date_range CHECK ((end_date >= start_date)),
    CONSTRAINT valid_total_days CHECK (((total_days > 0) AND (total_days <= 365)))
);

CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    timestamp timestamptz DEFAULT now() NOT NULL,
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
    resolved bool DEFAULT false,
    resolved_by uuid,
    resolved_at timestamptz,
    resolution_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT error_logs_environment_check CHECK ((environment = ANY (ARRAY['development'::text, 'staging'::text, 'production'::text]))),
    CONSTRAINT error_logs_level_check CHECK ((level = ANY (ARRAY['debug'::text, 'info'::text, 'warning'::text, 'error'::text, 'fatal'::text]))),
    CONSTRAINT error_logs_source_check CHECK ((source = ANY (ARRAY['frontend-web'::text, 'frontend-mobile'::text, 'frontend-extension'::text, 'edge-function'::text, 'database'::text, 'cron-job'::text])))
);

CREATE TABLE IF NOT EXISTS public.genders (
    id uuid NOT NULL,
    name varchar(100) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT genders_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.health_insurance (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT health_insurance_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type_enum NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    status public.notification_status DEFAULT 'unread'::notification_status NOT NULL,
    priority int4 DEFAULT 0 NOT NULL,
    action_url text,
    business_id uuid,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    read_at timestamptz,
    archived_at timestamptz,
    expires_at timestamptz,
    PRIMARY KEY (id),
    CONSTRAINT priority_range CHECK (((priority >= 0) AND (priority <= 3))),
    CONSTRAINT valid_timestamps CHECK ((((read_at IS NULL) OR (read_at >= created_at)) AND ((archived_at IS NULL) OR (archived_at >= created_at)) AND ((expires_at IS NULL) OR (expires_at > created_at))))
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    tax_type public.tax_type DEFAULT 'iva_19'::tax_type,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    subtotal numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    service_id uuid,
    sort_order int4 DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT invoice_items_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT invoice_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    invoice_number varchar(50) NOT NULL,
    invoice_prefix varchar(10),
    invoice_sequence int4 NOT NULL,
    status public.invoice_status DEFAULT 'draft'::invoice_status NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    paid_date date,
    client_id uuid,
    client_name varchar(255) NOT NULL,
    client_tax_id varchar(50),
    client_address text,
    client_email varchar(255),
    client_phone varchar(20),
    subtotal numeric(12,2) NOT NULL,
    discount numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    currency varchar(3) DEFAULT 'COP'::character varying NOT NULL,
    iva_amount numeric(12,2) DEFAULT 0,
    ica_amount numeric(12,2) DEFAULT 0,
    retention_amount numeric(12,2) DEFAULT 0,
    appointment_id uuid,
    transaction_id uuid,
    notes text,
    terms text,
    cufe varchar(100),
    qr_code text,
    xml_url text,
    pdf_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (id),
    CONSTRAINT unique_invoice_number UNIQUE (business_id, invoice_number),
    CONSTRAINT invoices_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT invoices_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT invoices_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT invoices_total_amount_check CHECK ((total_amount >= (0)::numeric))
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    vacancy_id uuid NOT NULL,
    user_id uuid NOT NULL,
    business_id uuid NOT NULL,
    status varchar(50) DEFAULT 'pending'::character varying,
    cover_letter text,
    available_from date,
    availability_notes text,
    reviewed_at timestamptz,
    reviewed_by uuid,
    interview_scheduled_at timestamptz,
    decision_at timestamptz,
    decision_notes text,
    rating int4,
    admin_notes text,
    availability jsonb,
    cv_url text,
    expected_salary numeric(12,2),
    selection_started_at timestamptz,
    selection_started_by uuid,
    PRIMARY KEY (id),
    CONSTRAINT job_applications_vacancy_id_user_id_key UNIQUE (vacancy_id, user_id),
    CONSTRAINT job_applications_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

CREATE TABLE IF NOT EXISTS public.job_vacancies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    title varchar(255) NOT NULL,
    description text NOT NULL,
    requirements text,
    responsibilities text,
    benefits text[],
    position_type varchar(50) DEFAULT 'full_time'::character varying,
    experience_required varchar(50),
    salary_min numeric(10,2),
    salary_max numeric(10,2),
    currency varchar(3) DEFAULT 'COP'::character varying,
    location_id uuid,
    remote_allowed bool DEFAULT false,
    required_services uuid[] DEFAULT ARRAY[]::uuid[],
    preferred_services uuid[] DEFAULT ARRAY[]::uuid[],
    status varchar(50) DEFAULT 'open'::character varying,
    published_at timestamptz,
    expires_at timestamptz,
    filled_at timestamptz,
    views_count int4 DEFAULT 0,
    applications_count int4 DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    work_schedule jsonb,
    number_of_positions int4 DEFAULT 1,
    location_city text,
    location_address text,
    experience_level text,
    slots int4 DEFAULT 1,
    commission_based bool DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT job_vacancies_experience_level_check CHECK ((experience_level = ANY (ARRAY['entry'::text, 'mid'::text, 'senior'::text, 'expert'::text]))),
    CONSTRAINT job_vacancies_number_of_positions_check CHECK ((number_of_positions > 0)),
    CONSTRAINT job_vacancies_slots_check CHECK ((slots > 0))
);

CREATE TABLE IF NOT EXISTS public.location_expense_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    location_id uuid NOT NULL,
    business_id uuid NOT NULL,
    rent_amount numeric(12,2) DEFAULT 0,
    rent_due_day int4 DEFAULT 1,
    landlord_name varchar(200),
    landlord_contact varchar(100),
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
    is_active bool DEFAULT true NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT location_expense_config_location_id_key UNIQUE (location_id),
    CONSTRAINT location_expense_config_rent_due_day_check CHECK (((rent_due_day >= 1) AND (rent_due_day <= 31)))
);

CREATE TABLE IF NOT EXISTS public.location_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id uuid NOT NULL,
    type varchar(50) NOT NULL,
    url text NOT NULL,
    description text,
    is_banner bool DEFAULT false,
    is_primary bool DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT location_media_type_check CHECK (((type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.location_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    location_id uuid NOT NULL,
    service_id uuid NOT NULL,
    is_active bool DEFAULT true NOT NULL,
    notes text,
    PRIMARY KEY (id),
    CONSTRAINT unique_location_service UNIQUE (location_id, service_id)
);

CREATE TABLE IF NOT EXISTS public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
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
    is_active bool DEFAULT true NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    business_hours jsonb DEFAULT '{"friday": {"open": "09:00", "close": "18:00", "closed": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": true}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false}, "saturday": {"open": "09:00", "close": "14:00", "closed": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false}}'::jsonb,
    description text,
    google_maps_url text,
    dane_code varchar(10),
    ica_rate numeric(5,4) DEFAULT 0.00,
    ica_enabled bool DEFAULT false,
    is_primary bool DEFAULT false NOT NULL,
    email text,
    opens_at time,
    closes_at time,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.login_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    timestamp timestamptz DEFAULT now() NOT NULL,
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
    is_suspicious bool DEFAULT false,
    suspicious_reason text,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT login_logs_device_check CHECK ((device = ANY (ARRAY['desktop'::text, 'mobile'::text, 'tablet'::text, 'unknown'::text]))),
    CONSTRAINT login_logs_method_check CHECK ((method = ANY (ARRAY['password'::text, 'google'::text, 'magic_link'::text, 'extension'::text, 'password_reset'::text]))),
    CONSTRAINT login_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failure'::text, 'blocked'::text])))
);

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    edited_at timestamptz,
    conversation_id uuid NOT NULL,
    sender_id uuid,
    type public.message_type DEFAULT 'text'::message_type NOT NULL,
    body text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    reply_to uuid,
    is_pinned bool DEFAULT false NOT NULL,
    pinned_by uuid,
    pinned_at timestamptz,
    is_deleted bool DEFAULT false NOT NULL,
    deleted_by uuid,
    deleted_at timestamptz,
    search_vector tsvector,
    delivery_status public.delivery_status_enum DEFAULT 'sent'::delivery_status_enum NOT NULL,
    read_by jsonb DEFAULT '[]'::jsonb,
    PRIMARY KEY (id),
    CONSTRAINT messages_body_or_metadata_check CHECK (((body IS NOT NULL) OR (metadata <> '{}'::jsonb))),
    CONSTRAINT messages_pinned_check CHECK ((((is_pinned = true) AND (pinned_by IS NOT NULL) AND (pinned_at IS NOT NULL)) OR (is_pinned = false))),
    CONSTRAINT messages_read_by_is_array CHECK ((jsonb_typeof(read_by) = 'array'::text))
);

CREATE TABLE IF NOT EXISTS public.notification_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    appointment_id uuid,
    user_id uuid,
    notification_type public.notification_type_enum NOT NULL,
    channel public.notification_channel NOT NULL,
    recipient_name varchar(255),
    recipient_contact varchar(255) NOT NULL,
    subject varchar(500),
    message text NOT NULL,
    status varchar(50) DEFAULT 'pending'::character varying NOT NULL,
    sent_at timestamptz,
    delivered_at timestamptz,
    external_id varchar(255),
    error_message text,
    retry_count int4 DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    appointment_id uuid,
    read bool DEFAULT false NOT NULL,
    sent_via_email bool DEFAULT false NOT NULL,
    sent_via_push bool DEFAULT false NOT NULL,
    scheduled_for timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    stripe_payment_method_id text NOT NULL,
    type text DEFAULT 'card'::text NOT NULL,
    brand text,
    last4 text NOT NULL,
    exp_month int4,
    exp_year int4,
    country text,
    funding text,
    is_default bool DEFAULT false,
    is_active bool DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    PRIMARY KEY (id),
    CONSTRAINT payment_methods_stripe_payment_method_id_key UNIQUE (stripe_payment_method_id),
    CONSTRAINT payment_methods_exp_month_check CHECK (((exp_month >= 1) AND (exp_month <= 12))),
    CONSTRAINT payment_methods_exp_year_check CHECK ((exp_year >= 2024)),
    CONSTRAINT payment_methods_type_check CHECK ((type = ANY (ARRAY['card'::text, 'bank_account'::text])))
);

CREATE TABLE IF NOT EXISTS public.payroll_configuration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    commission_rate numeric(5,2) DEFAULT 0,
    commission_base text DEFAULT 'appointments'::text,
    calculate_prestaciones bool DEFAULT true,
    cesantias_enabled bool DEFAULT true,
    prima_enabled bool DEFAULT true,
    vacaciones_enabled bool DEFAULT true,
    intereses_cesantias_enabled bool DEFAULT true,
    other_deductions jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT payroll_configuration_business_id_employee_id_key UNIQUE (business_id, employee_id),
    CONSTRAINT payroll_configuration_commission_base_check CHECK ((commission_base = ANY (ARRAY['appointments'::text, 'transactions'::text, 'both'::text]))),
    CONSTRAINT payroll_configuration_commission_rate_check CHECK (((commission_rate >= (0)::numeric) AND (commission_rate <= (100)::numeric)))
);

CREATE TABLE IF NOT EXISTS public.payroll_payments (
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
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT payroll_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])))
);

CREATE TABLE IF NOT EXISTS public.permission_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    permission text,
    old_value text,
    new_value text,
    performed_by uuid NOT NULL,
    performed_at timestamptz DEFAULT now() NOT NULL,
    notes text,
    PRIMARY KEY (id),
    CONSTRAINT permission_audit_log_action_check CHECK ((action = ANY (ARRAY['grant'::text, 'revoke'::text, 'modify'::text, 'assign_role'::text, 'remove_role'::text])))
);

CREATE TABLE IF NOT EXISTS public.permission_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name text NOT NULL,
    description text,
    role text NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system_template bool DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT permission_templates_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'employee'::text])))
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    role public.user_role DEFAULT 'client'::user_role NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active bool DEFAULT true NOT NULL,
    search_vector tsvector,
    deactivated_at timestamptz,
    PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.public_holidays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id uuid NOT NULL,
    name varchar(255) NOT NULL,
    holiday_date date NOT NULL,
    is_recurring bool DEFAULT true,
    description text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT unique_country_holiday UNIQUE (country_id, holiday_date)
);

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    recurrence_frequency text NOT NULL,
    next_payment_date date NOT NULL,
    last_payment_date date,
    is_active bool DEFAULT true NOT NULL,
    payment_method text,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    location_id uuid,
    employee_id uuid,
    created_by uuid,
    name varchar(200),
    currency varchar(3) DEFAULT 'COP'::character varying,
    recurrence_day int4,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_automated bool DEFAULT false,
    total_paid numeric(12,2) DEFAULT 0,
    payments_count int4 DEFAULT 0,
    category public.transaction_category DEFAULT 'other_expense'::transaction_category NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_recurring_expenses_employee_payroll UNIQUE (business_id, employee_id, category),
    CONSTRAINT recurring_expenses_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT recurring_expenses_frequency_check CHECK ((recurrence_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text]))),
    CONSTRAINT recurring_expenses_recurrence_day_check CHECK (((recurrence_day >= 1) AND (recurrence_day <= 31)))
);

CREATE TABLE IF NOT EXISTS public.regions (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    country_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.resource_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    resource_id uuid NOT NULL,
    service_id uuid NOT NULL,
    custom_price numeric(10,2),
    is_active bool DEFAULT true NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT resource_services_resource_id_service_id_key UNIQUE (resource_id, service_id),
    CONSTRAINT resource_services_custom_price_check CHECK ((custom_price >= (0)::numeric))
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    appointment_id uuid NOT NULL,
    client_id uuid NOT NULL,
    employee_id uuid,
    rating int4 NOT NULL,
    comment text,
    response text,
    response_at timestamptz,
    response_by uuid,
    is_visible bool DEFAULT true NOT NULL,
    is_verified bool DEFAULT false NOT NULL,
    helpful_count int4 DEFAULT 0 NOT NULL,
    review_type text DEFAULT 'business'::text NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_type_check CHECK ((review_type = ANY (ARRAY['business'::text, 'employee'::text])))
);

CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes int4 NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    category text,
    is_active bool DEFAULT true NOT NULL,
    search_vector tsvector,
    tax_type public.tax_type DEFAULT 'iva_19'::tax_type,
    product_code varchar(20),
    is_taxable bool DEFAULT true,
    image_url text,
    commission_percentage numeric(5,2),
    PRIMARY KEY (id),
    CONSTRAINT services_commission_percentage_check CHECK (((commission_percentage >= (0)::numeric) AND (commission_percentage <= (100)::numeric))),
    CONSTRAINT services_duration_minutes_check CHECK ((duration_minutes > 0)),
    CONSTRAINT services_price_check CHECK ((price >= (0)::numeric))
);

CREATE TABLE IF NOT EXISTS public.subscription_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    plan_id uuid,
    event_type text NOT NULL,
    triggered_by text,
    triggered_by_user_id uuid,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT subscription_events_event_type_check CHECK ((event_type = ANY (ARRAY['created'::text, 'activated'::text, 'upgraded'::text, 'downgraded'::text, 'renewed'::text, 'paused'::text, 'resumed'::text, 'canceled'::text, 'suspended'::text, 'expired'::text, 'payment_failed'::text, 'payment_succeeded'::text, 'trial_started'::text, 'trial_will_end'::text, 'trial_ended'::text, 'limit_warning'::text, 'limit_exceeded'::text, 'invoice_upcoming'::text]))),
    CONSTRAINT subscription_events_triggered_by_check CHECK ((triggered_by = ANY (ARRAY['user'::text, 'system'::text, 'stripe_webhook'::text, 'admin'::text, 'cron'::text])))
);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
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
    retry_count int4 DEFAULT 0,
    next_retry_at timestamptz,
    paid_at timestamptz,
    refunded_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (id),
    CONSTRAINT subscription_payments_stripe_invoice_id_key UNIQUE (stripe_invoice_id),
    CONSTRAINT subscription_payments_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id),
    CONSTRAINT subscription_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT subscription_payments_retry_count_check CHECK (((retry_count >= 0) AND (retry_count <= 3))),
    CONSTRAINT subscription_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'refunded'::text, 'disputed'::text, 'canceled'::text])))
);

CREATE TABLE IF NOT EXISTS public.system_config (
    key text NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public.tax_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    tax_regime public.tax_regime DEFAULT 'common'::tax_regime NOT NULL,
    is_iva_responsible bool DEFAULT true NOT NULL,
    is_ica_responsible bool DEFAULT false NOT NULL,
    is_retention_agent bool DEFAULT false NOT NULL,
    dian_code varchar(50),
    activity_code varchar(10),
    default_iva_rate numeric(5,2) DEFAULT 19.00,
    ica_rate numeric(5,4) DEFAULT 0.00,
    retention_rate numeric(5,2) DEFAULT 0.00,
    accountant_name varchar(255),
    accountant_email varchar(255),
    accountant_phone varchar(20),
    accountant_license varchar(50),
    invoice_prefix varchar(10) DEFAULT 'F'::character varying,
    invoice_next_number int4 DEFAULT 1,
    invoice_resolution_number varchar(50),
    invoice_resolution_date date,
    invoice_resolution_valid_until date,
    settings jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (id),
    CONSTRAINT tax_configurations_business_id_key UNIQUE (business_id),
    CONSTRAINT tax_configurations_default_iva_rate_check CHECK (((default_iva_rate >= (0)::numeric) AND (default_iva_rate <= (100)::numeric))),
    CONSTRAINT tax_configurations_ica_rate_check CHECK (((ica_rate >= (0)::numeric) AND (ica_rate <= (100)::numeric))),
    CONSTRAINT tax_configurations_retention_rate_check CHECK (((retention_rate >= (0)::numeric) AND (retention_rate <= (100)::numeric)))
);

CREATE TABLE IF NOT EXISTS public.tax_liabilities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    business_id uuid NOT NULL,
    liability_type varchar(50) NOT NULL,
    period varchar(7) NOT NULL,
    due_date date NOT NULL,
    filed_date date,
    calculated_amount numeric(12,2) DEFAULT 0,
    filed_amount numeric(12,2),
    paid_amount numeric(12,2) DEFAULT 0,
    status varchar(20) DEFAULT 'pending'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
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
    is_verified bool DEFAULT false NOT NULL,
    verified_by uuid,
    verified_at timestamptz,
    subtotal numeric(12,2),
    tax_type public.tax_type DEFAULT 'none'::tax_type,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2),
    is_tax_deductible bool DEFAULT true,
    invoice_id uuid,
    fiscal_period varchar(7),
    PRIMARY KEY (id),
    CONSTRAINT transactions_amount_check CHECK ((amount >= (0)::numeric))
);

CREATE TABLE IF NOT EXISTS public.usage_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    plan_id uuid,
    metric_date date DEFAULT CURRENT_DATE NOT NULL,
    locations_count int4 DEFAULT 0,
    employees_count int4 DEFAULT 0,
    appointments_count int4 DEFAULT 0,
    clients_count int4 DEFAULT 0,
    services_count int4 DEFAULT 0,
    storage_mb numeric(10,2) DEFAULT 0,
    is_over_limit bool DEFAULT false,
    limit_exceeded_resources text[],
    usage_percentage jsonb DEFAULT '{}'::jsonb,
    calculated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT usage_metrics_business_date_unique UNIQUE (business_id, metric_date),
    CONSTRAINT usage_metrics_appointments_count_check CHECK ((appointments_count >= 0)),
    CONSTRAINT usage_metrics_clients_count_check CHECK ((clients_count >= 0)),
    CONSTRAINT usage_metrics_employees_count_check CHECK ((employees_count >= 0)),
    CONSTRAINT usage_metrics_locations_count_check CHECK ((locations_count >= 0)),
    CONSTRAINT usage_metrics_services_count_check CHECK ((services_count >= 0)),
    CONSTRAINT usage_metrics_storage_mb_check CHECK ((storage_mb >= (0)::numeric))
);

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    email_enabled bool DEFAULT true NOT NULL,
    sms_enabled bool DEFAULT false NOT NULL,
    whatsapp_enabled bool DEFAULT false NOT NULL,
    email_verified bool DEFAULT false NOT NULL,
    phone_verified bool DEFAULT false NOT NULL,
    whatsapp_verified bool DEFAULT false NOT NULL,
    notification_preferences jsonb DEFAULT '{"security_alert": {"sms": true, "email": true, "whatsapp": true}, "appointment_reminder": {"sms": false, "email": true, "whatsapp": true}, "appointment_cancellation": {"sms": true, "email": true, "whatsapp": true}, "appointment_confirmation": {"sms": false, "email": true, "whatsapp": true}, "appointment_new_employee": {"sms": false, "email": true, "whatsapp": true}, "job_application_accepted": {"sms": true, "email": true, "whatsapp": true}, "job_application_rejected": {"sms": false, "email": true, "whatsapp": false}, "employee_request_accepted": {"sms": false, "email": true, "whatsapp": true}, "employee_request_rejected": {"sms": false, "email": true, "whatsapp": false}, "job_application_interview": {"sms": true, "email": true, "whatsapp": true}}'::jsonb,
    do_not_disturb_enabled bool DEFAULT false,
    do_not_disturb_start time DEFAULT '22:00:00'::time without time zone,
    do_not_disturb_end time DEFAULT '08:00:00'::time without time zone,
    daily_digest_enabled bool DEFAULT false,
    daily_digest_time time DEFAULT '18:00:00'::time without time zone,
    weekly_summary_enabled bool DEFAULT false,
    weekly_summary_day int4 DEFAULT 1,
    in_app_enabled bool DEFAULT true NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT user_notification_preferences_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    permission text NOT NULL,
    granted_by uuid,
    granted_at timestamptz DEFAULT now() NOT NULL,
    expires_at timestamptz,
    is_active bool DEFAULT true NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT user_permissions_business_id_user_id_permission_key UNIQUE (business_id, user_id, permission)
);

CREATE TABLE IF NOT EXISTS public.vacation_balance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    year int4 NOT NULL,
    total_days_available int4 DEFAULT 0 NOT NULL,
    days_used int4 DEFAULT 0 NOT NULL,
    days_pending int4 DEFAULT 0 NOT NULL,
    days_remaining int4,
    hire_anniversary_date date,
    balance_reset_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT vacation_balance_unique UNIQUE (business_id, employee_id, year),
    CONSTRAINT days_non_negative CHECK (((days_used >= 0) AND (days_pending >= 0)))
);

CREATE TABLE IF NOT EXISTS public.work_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    day_of_week int4 NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_working bool DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT work_schedules_employee_id_day_of_week_key UNIQUE (employee_id, day_of_week),
    CONSTRAINT work_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);

-- Foreign Keys
ALTER TABLE public.absence_approval_requests ADD CONSTRAINT absence_approval_requests_absence_id_fkey FOREIGN KEY (absence_id) REFERENCES public.employee_absences(id) ON DELETE CASCADE;
ALTER TABLE public.absence_approval_requests ADD CONSTRAINT absence_approval_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_original_location_id_fkey FOREIGN KEY (original_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.business_resources(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE public.billing_audit_log ADD CONSTRAINT billing_audit_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_categories ADD CONSTRAINT business_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.business_categories(id) ON DELETE SET NULL;
ALTER TABLE public.business_confirmation_policies ADD CONSTRAINT business_confirmation_policies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_employees ADD CONSTRAINT business_employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_employees ADD CONSTRAINT business_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.business_employees ADD CONSTRAINT business_employees_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.business_employees ADD CONSTRAINT business_employees_transfer_from_location_id_fkey FOREIGN KEY (transfer_from_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.business_employees ADD CONSTRAINT business_employees_transfer_to_location_id_fkey FOREIGN KEY (transfer_to_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.business_favorites ADD CONSTRAINT business_favorites_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_notification_settings ADD CONSTRAINT business_notification_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_plans ADD CONSTRAINT business_plans_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_resources ADD CONSTRAINT business_resources_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_resources ADD CONSTRAINT business_resources_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.business_roles ADD CONSTRAINT business_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);
ALTER TABLE public.business_roles ADD CONSTRAINT business_roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_roles ADD CONSTRAINT business_roles_reports_to_fkey FOREIGN KEY (reports_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.business_roles ADD CONSTRAINT business_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.business_subcategories ADD CONSTRAINT business_subcategories_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_subcategories ADD CONSTRAINT business_subcategories_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.business_categories(id) ON DELETE CASCADE;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.business_categories(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.businesses ADD CONSTRAINT fk_businesses_city_id FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD CONSTRAINT fk_businesses_country_id FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD CONSTRAINT fk_businesses_region_id FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;
ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.chat_participants ADD CONSTRAINT chat_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
ALTER TABLE public.chat_participants ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.chat_participants ADD CONSTRAINT fk_last_read_message FOREIGN KEY (last_read_message_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;
ALTER TABLE public.chat_typing_indicators ADD CONSTRAINT chat_typing_indicators_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
ALTER TABLE public.chat_typing_indicators ADD CONSTRAINT chat_typing_indicators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.cities ADD CONSTRAINT cities_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.discount_code_uses ADD CONSTRAINT discount_code_uses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.discount_code_uses ADD CONSTRAINT discount_code_uses_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE CASCADE;
ALTER TABLE public.discount_code_uses ADD CONSTRAINT discount_code_uses_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;
ALTER TABLE public.document_types ADD CONSTRAINT document_types_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;
ALTER TABLE public.employee_absences ADD CONSTRAINT employee_absences_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.employee_absences ADD CONSTRAINT employee_absences_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.employee_join_requests ADD CONSTRAINT employee_join_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.employee_profiles ADD CONSTRAINT employee_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.employee_requests ADD CONSTRAINT employee_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.employee_requests ADD CONSTRAINT employee_requests_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.profiles(id);
ALTER TABLE public.employee_requests ADD CONSTRAINT employee_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.employee_services ADD CONSTRAINT employee_services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.employee_services ADD CONSTRAINT employee_services_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.employee_services ADD CONSTRAINT employee_services_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE public.employee_services ADD CONSTRAINT employee_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE public.employee_time_off ADD CONSTRAINT employee_time_off_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.employee_time_off ADD CONSTRAINT employee_time_off_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.employee_time_off ADD CONSTRAINT employee_time_off_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.employee_time_off ADD CONSTRAINT employee_time_off_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);
ALTER TABLE public.in_app_notifications ADD CONSTRAINT in_app_notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_vacancy_id_fkey FOREIGN KEY (vacancy_id) REFERENCES public.job_vacancies(id) ON DELETE CASCADE;
ALTER TABLE public.job_vacancies ADD CONSTRAINT job_vacancies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.job_vacancies ADD CONSTRAINT job_vacancies_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.location_expense_config ADD CONSTRAINT location_expense_config_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.location_expense_config ADD CONSTRAINT location_expense_config_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE public.location_media ADD CONSTRAINT location_media_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE public.location_services ADD CONSTRAINT location_services_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE public.location_services ADD CONSTRAINT location_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE public.locations ADD CONSTRAINT locations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD CONSTRAINT messages_pinned_by_fkey FOREIGN KEY (pinned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.notification_log ADD CONSTRAINT notification_log_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.notification_log ADD CONSTRAINT notification_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_configuration ADD CONSTRAINT payroll_configuration_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_configuration ADD CONSTRAINT payroll_configuration_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_payments ADD CONSTRAINT payroll_payments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_payments ADD CONSTRAINT payroll_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.permission_audit_log ADD CONSTRAINT permission_audit_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.permission_audit_log ADD CONSTRAINT permission_audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id);
ALTER TABLE public.permission_audit_log ADD CONSTRAINT permission_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.permission_templates ADD CONSTRAINT permission_templates_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.permission_templates ADD CONSTRAINT permission_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.public_holidays ADD CONSTRAINT public_holidays_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;
ALTER TABLE public.recurring_expenses ADD CONSTRAINT recurring_expenses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.recurring_expenses ADD CONSTRAINT recurring_expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.recurring_expenses ADD CONSTRAINT recurring_expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.recurring_expenses ADD CONSTRAINT recurring_expenses_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.regions ADD CONSTRAINT regions_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;
ALTER TABLE public.resource_services ADD CONSTRAINT resource_services_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.business_resources(id) ON DELETE CASCADE;
ALTER TABLE public.resource_services ADD CONSTRAINT resource_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_response_by_fkey FOREIGN KEY (response_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD CONSTRAINT services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.subscription_events ADD CONSTRAINT subscription_events_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.subscription_events ADD CONSTRAINT subscription_events_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;
ALTER TABLE public.subscription_payments ADD CONSTRAINT subscription_payments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.subscription_payments ADD CONSTRAINT subscription_payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;
ALTER TABLE public.subscription_payments ADD CONSTRAINT subscription_payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;
ALTER TABLE public.tax_configurations ADD CONSTRAINT tax_configurations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.tax_liabilities ADD CONSTRAINT tax_liabilities_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.business_plans(id) ON DELETE SET NULL;
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id);
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.vacation_balance ADD CONSTRAINT vacation_balance_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Functions
CREATE OR REPLACE FUNCTION public.is_business_owner(p_user_id uuid, p_business_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id 
    AND owner_id = p_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_business_member(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      SELECT EXISTS (
        SELECT 1 FROM public.business_employees be
        WHERE be.business_id = bid AND be.employee_id = auth.uid() AND be.status = 'approved'
      );
    $function$;

CREATE OR REPLACE FUNCTION public.is_business_admin(p_business_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Dueño
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
$function$;

CREATE OR REPLACE FUNCTION public.is_business_favorite(p_business_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM business_favorites
    WHERE user_id = auth.uid() AND business_id = p_business_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public._check_permission_manager(p_business_id uuid, p_caller_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.apply_discount_code(p_business_id uuid, p_code text, p_plan_type text, p_amount numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
    v_discount discount_codes%ROWTYPE;
    v_discount_amount DECIMAL(10,2);
    v_final_amount DECIMAL(10,2);
    v_valid BOOLEAN;
BEGIN
    -- Validar código
    v_valid := is_discount_code_valid(p_code, p_plan_type, p_amount);
    
    IF NOT v_valid THEN
        v_result := json_build_object(
            'valid', false,
            'message', 'Invalid or expired discount code'
        );
        RETURN v_result;
    END IF;
    
    -- Obtener información del descuento
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
$function$;

CREATE OR REPLACE FUNCTION public.approve_employee_request(request_id uuid, admin_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.assign_user_permission(p_business_id uuid, p_user_id uuid, p_permission text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.audit_business_roles_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.audit_user_permissions_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_permissions_to_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_permission TEXT;
  v_count INT := 0;
BEGIN
  -- Solo aplicar si es un admin (role = 'admin')
  IF NEW.role != 'admin' THEN
    RETURN NEW;
  END IF;

  RAISE NOTICE '🔐 Auto-asignando permisos a admin % del negocio %', NEW.user_id, NEW.business_id;

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

  RAISE NOTICE '  ✅ Asignados % permisos al admin %', v_count, NEW.user_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_permissions_to_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_permission TEXT;
  v_permissions_count INT := 0;
BEGIN
  RAISE NOTICE '🔐 Auto-asignando permisos a owner % del negocio %', NEW.owner_id, NEW.id;

  -- Lista completa de permisos que se asignan a owners (79 permisos totales)
  -- Agrupados por categoría para mejor legibilidad
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
      
      -- Sales (1) - NUEVO (Ventas Rápidas)
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
      NEW.owner_id, -- Auto-granted por creación de negocio
      true,
      NOW(),
      'Auto-asignado al crear negocio (trigger: auto_assign_permissions_to_owner)'
    )
    ON CONFLICT (user_id, business_id, permission) DO NOTHING;

    GET DIAGNOSTICS v_permissions_count = ROW_COUNT;
    
    IF v_permissions_count > 0 THEN
      RAISE NOTICE '  ✓ Permiso asignado: %', v_permission;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Total de permisos asignados a owner % en negocio %', NEW.owner_id, NEW.id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_generate_invitation_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_insert_admin_as_employee()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_insert_owner_to_business_employees()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_insert_owner_to_business_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_reject_candidates_on_vacancy_filled()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_vacancy RECORD;
  v_accepted_count INTEGER;
BEGIN
  -- Solo procesar cuando cambia a accepted
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    
    -- Obtener información de la vacante
    SELECT * INTO v_vacancy
    FROM job_vacancies
    WHERE id = NEW.vacancy_id;
    
    -- Contar cuántos candidatos han sido aceptados
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
      
      -- Rechazar automáticamente a todos los candidatos en proceso
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
$function$;

CREATE OR REPLACE FUNCTION public.bulk_assign_permissions_from_template(p_business_id uuid, p_user_id uuid, p_template_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.bulk_assign_permissions_from_template(p_business_id uuid, p_user_id uuid, p_template_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.bulk_mark_read(p_conversation_id uuid, p_user_id uuid)
 RETURNS TABLE(updated_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Marcar todos los mensajes como leídos
  WITH updated_messages AS (
    UPDATE messages
    SET read_by = CASE
      -- Si el usuario ya está en read_by, no duplicar
      WHEN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(read_by) AS elem
        WHERE elem->>'user_id' = p_user_id::text
      ) THEN read_by
      -- Si no está, agregarlo
      ELSE read_by || jsonb_build_object(
        'user_id', p_user_id,
        'read_at', NOW()
      )
    END
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_deleted = FALSE
      -- Solo actualizar si no ha sido leído
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
$function$;

CREATE OR REPLACE FUNCTION public.bulk_mark_read(p_user_id uuid, p_conversation_ids uuid[])
 RETURNS TABLE(conversation_id uuid, previous_unread integer, updated boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.bulk_revoke_user_permissions(p_business_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.businesses_search_vector_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'C');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_absence_days(p_start_date date, p_end_date date)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN (p_end_date - p_start_date) + 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_appointment_amounts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_employee_occupancy(p_user_id uuid, p_business_id uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_employee_occupancy(p_employee_id uuid, p_business_id uuid, p_start_date date, p_end_date date)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  v_total_hours_worked NUMERIC := 0;
  v_total_hours_available NUMERIC := 0;
  v_occupancy_config JSONB;
  v_daily_hours NUMERIC;
  v_exclude_days TEXT[];
  v_operating_days INTEGER;
BEGIN
  -- Obtener configuración de ocupación del negocio
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

  -- Extraer valores de configuración
  v_daily_hours := COALESCE((v_occupancy_config->>'daily_hours')::NUMERIC, 8);
  v_exclude_days := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(v_occupancy_config->'exclude_days')),
    ARRAY['sunday']::TEXT[]
  );

  -- Calcular horas trabajadas (suma de duración de citas completadas)
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600.0
  ), 0)
  INTO v_total_hours_worked
  FROM appointments a
  WHERE a.employee_id = p_employee_id
    AND a.business_id = p_business_id
    AND a.status = 'completed'
    AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date;

  -- Calcular días operativos (excluyendo días configurados)
  SELECT COUNT(*)
  INTO v_operating_days
  FROM generate_series(p_start_date, p_end_date, '1 day'::INTERVAL) AS day
  WHERE LOWER(TO_CHAR(day, 'Day')) NOT LIKE ANY(
    SELECT '%' || LOWER(TRIM(d)) || '%' FROM UNNEST(v_exclude_days) AS d
  );

  -- Calcular horas disponibles
  v_total_hours_available := v_operating_days * v_daily_hours;

  -- Calcular porcentaje de ocupación
  IF v_total_hours_available > 0 THEN
    RETURN ROUND((v_total_hours_worked / v_total_hours_available) * 100, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_employee_rating_by_business(p_user_id uuid, p_business_id uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    ROUND(AVG(rating)::NUMERIC, 2),
    0
  )
  FROM reviews
  WHERE employee_id = p_user_id
    AND business_id = p_business_id
    AND is_visible = true;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_employee_rating_by_business(p_employee_id uuid, p_business_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_employee_revenue(p_employee_id uuid, p_business_id uuid, p_start_date date, p_end_date date)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_employee_revenue(p_user_id uuid, p_business_id uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_usage_metrics(p_business_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    
    -- Placeholder para storage (requiere integración con Supabase Storage)
    v_storage_mb := 0;
    
    -- TODO: Comparar con límites del plan
    v_is_over_limit := false;
    v_exceeded := ARRAY[]::TEXT[];
    
    -- Insertar o actualizar métrica
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
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_location_media(p_location_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    WHERE l.id = p_location_id
      AND (
        public.is_business_admin(l.business_id) OR public.is_business_member(l.business_id)
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_service_media(p_service_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.services s
    WHERE s.id = p_service_id
      AND (
        public.is_business_admin(s.business_id)
        OR public.is_business_member(s.business_id)
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(p_token text, p_reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_appointment_conflict()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_max_subcategories()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  subcategory_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subcategory_count
  FROM business_subcategories
  WHERE business_id = NEW.business_id;
  
  IF subcategory_count >= 3 THEN
    RAISE EXCEPTION 'Un negocio puede tener máximo 3 subcategorías';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_completed_transfer()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si el traslado se marca como completado, actualizar location_id
  IF NEW.transfer_status = 'completed' AND OLD.transfer_status = 'pending' THEN
    NEW.location_id := NEW.transfer_to_location_id;
    
    -- Limpiar campos de transición (opcional, lo haremos en edge function)
    -- NEW.transfer_from_location_id := NULL;
    -- NEW.transfer_to_location_id := NULL;
    -- NEW.transfer_effective_date := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM in_app_notifications
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_typing_indicators()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM chat_typing_indicators
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_cron_logs()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM public.cron_execution_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(days_old integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_attachments()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.configure_cron_secrets()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Solo retornar instrucciones, NO ejecutar ALTER DATABASE
  -- (requiere permisos de superusuario)
  RETURN 'Ejecuta manualmente: ALTER DATABASE postgres SET app.supabase_url = ''https://dkancockzvcqorqbwtyh.supabase.co''; y ALTER DATABASE postgres SET app.supabase_service_role_key = ''YOUR_KEY_HERE'';';
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_appointment_by_token(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.count_candidates_in_selection(p_vacancy_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_appointment_reminders()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only create reminders for confirmed appointments
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        -- 24 hour reminder
        INSERT INTO public.notifications (user_id, type, title, message, appointment_id, scheduled_for)
        VALUES (
            NEW.client_id,
            'appointment_reminder',
            'Recordatorio de cita - 24 horas',
            'Tienes una cita programada para mañana',
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
$function$;

CREATE OR REPLACE FUNCTION public.create_appointment_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_default_business_notification_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.business_notification_settings (business_id)
  VALUES (NEW.id)
  ON CONFLICT (business_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_user_notification_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_in_app_notification(p_user_id uuid, p_type notification_type_enum, p_title text, p_message text, p_action_url text DEFAULT NULL::text, p_priority integer DEFAULT 0, p_business_id uuid DEFAULT NULL::uuid, p_appointment_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.deactivate_user_account(user_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    notes = COALESCE(notes || E'\n', '') || 'Cancelada automáticamente: cuenta desactivada'
  WHERE 
    client_id = user_id_param 
    AND status = 'pending'
    AND start_time > NOW();

  -- Cancelar todas las citas futuras del usuario como empleado
  UPDATE appointments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes || E'\n', '') || 'Cancelada automáticamente: empleado desactivó cuenta'
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
$function$;

CREATE OR REPLACE FUNCTION public.debug_sorted_businesses_count(p_client_id uuid, p_preferred_city_name text)
 RETURNS integer
 LANGUAGE sql
AS $function$
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
      COALESCE(bl.location_city, 'Sin ubicación') AS city
    FROM businesses b
    INNER JOIN unique_businesses ub ON b.id = ub.id
    LEFT JOIN business_locations bl ON b.id = bl.business_id
    ORDER BY b.average_rating DESC NULLS LAST, b.total_reviews DESC
    LIMIT 6
  )
  SELECT COUNT(*)::INT FROM sorted_businesses;
$function$;

CREATE OR REPLACE FUNCTION public.debug_suggestions_jsonb(p_client_id uuid, p_preferred_city_name text)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
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
      COALESCE(bl.location_city, 'Sin ubicación') AS city
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
$function$;

CREATE OR REPLACE FUNCTION public.debug_unique_businesses_count(p_client_id uuid, p_preferred_city_name text)
 RETURNS integer
 LANGUAGE sql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.delete_message_attachments()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  attachment JSONB;
  file_path TEXT;
BEGIN
  -- Solo ejecutar si deleted_at cambió de NULL a timestamp
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
$function$;

CREATE OR REPLACE FUNCTION public.enforce_owner_hierarchy()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_primary_location()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.extract_storage_entity_id(object_path text)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  path_parts text[];
  entity_id text;
BEGIN
  -- Split path by '/'
  path_parts := string_to_array(object_path, '/');
  
  -- El ID de la entidad está en la primera posición
  -- Ejemplo: 550e8400-e29b-41d4-a716-446655440000/logo.png
  -- path_parts[1] = entity_id
  IF array_length(path_parts, 1) >= 1 THEN
    entity_id := path_parts[1];
    
    -- Validar que es un UUID válido
    IF entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RETURN entity_id::uuid;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_confirmation_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN md5(random()::text || clock_timestamp()::text || random()::text) || md5(random()::text || clock_timestamp()::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invitation_code()
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_recurring_expense_transaction(p_recurring_expense_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  
  -- Crear transacción
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_unique_slug(business_name text, business_city text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_business_hierarchy(p_business_id uuid, p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date date DEFAULT CURRENT_DATE, p_filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(employee_id uuid, business_id uuid, full_name text, email text, avatar_url text, phone text, hierarchy_level integer, reports_to uuid, supervisor_name text, role text, employee_type text, job_title text, location_id uuid, location_name text, is_active boolean, hired_at timestamp with time zone, salary_base numeric, salary_type character varying, total_appointments integer, completed_appointments integer, cancelled_appointments integer, average_rating numeric, total_reviews integer, occupancy_rate numeric, gross_revenue numeric, services_offered jsonb, direct_reports_count integer, all_reports_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH RECURSIVE employee_data AS (
    SELECT 
      br.user_id,
      br.business_id as biz_id,    -- ⭐ AGREGADO
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
    ed.biz_id as business_id,         -- ⭐ AGREGADO
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
    ed.hired_at,                      -- ⭐ CORREGIDO (TIMESTAMP)
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
$function$;

CREATE OR REPLACE FUNCTION public.get_business_locations_with_city_names(p_business_id uuid)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, business_id uuid, name text, address text, city text, city_name text, state text, country text, postal_code text, latitude numeric, longitude numeric, phone text, email text, is_active boolean, opens_at time without time zone, closes_at time without time zone, business_hours jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_businesses_in_city(p_city_name text DEFAULT NULL::text, p_region_name text DEFAULT NULL::text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, name text, logo_url text, average_rating numeric, category_name text, review_count bigint, city text, address text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    -- Búsqueda exacta por ciudad
    (p_city_name IS NOT NULL AND LOWER(l.city) = LOWER(p_city_name))
    -- O por región/estado si la ciudad no coincide
    OR (p_city_name IS NULL AND p_region_name IS NOT NULL AND LOWER(COALESCE(l.state, '')) = LOWER(p_region_name))
  )
  AND b.average_rating >= 3.5
  GROUP BY b.id, b.name, b.logo_url, b.average_rating, c.name, l.city, l.address
  ORDER BY b.average_rating DESC NULLS LAST, COUNT(DISTINCT r.id) DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_chat_stats(p_user_id uuid, p_business_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_conversations bigint, unread_conversations bigint, total_unread_messages bigint, messages_sent_today bigint, messages_received_today bigint, active_conversations_today bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_client_dashboard_data(p_client_id uuid, p_preferred_city_name text DEFAULT NULL::text, p_preferred_region_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_client_dashboard_data_debug(p_client_id uuid, p_preferred_city_name text DEFAULT NULL::text, p_preferred_region_name text DEFAULT NULL::text)
 RETURNS TABLE(total_businesses bigint, medellin_businesses bigint, filtered_count bigint)
 LANGUAGE sql
AS $function$
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
    COUNT(CASE WHEN UPPER(city_name) = 'MEDELLÍN' THEN 1 END) as medellin_businesses,
    COUNT(CASE 
      WHEN (
        (p_preferred_city_name IS NOT NULL AND UPPER(city_name) = UPPER(p_preferred_city_name))
      ) THEN 1 
    END) as filtered_count
  FROM location_stats;
$function$;

CREATE OR REPLACE FUNCTION public.get_client_dashboard_data_test(p_client_id uuid, p_preferred_city_name text DEFAULT NULL::text, p_preferred_region_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_client_favorite_business(p_client_id uuid)
 RETURNS TABLE(id uuid, name text, logo_url text, average_rating numeric, category_name text, review_count bigint, last_appointment_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_clients_with_unread_messages(p_minutes_threshold integer DEFAULT 15)
 RETURNS TABLE(user_id uuid, email text, full_name text, unread_count bigint, oldest_unread_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
      -- Excluir usuarios que deshabilitaron email para chat_message específicamente
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
$function$;

CREATE OR REPLACE FUNCTION public.get_conversation_members(p_conversation_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, email text, avatar_url text, role conversation_role, joined_at timestamp with time zone, last_read_at timestamp with time zone, last_seen_at timestamp with time zone, unread_count integer, muted boolean, notifications_enabled boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_conversation_preview(p_user_id uuid, p_business_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(conversation_id uuid, conversation_type conversation_type, conversation_name text, conversation_avatar_url text, business_id uuid, business_name text, last_message_at timestamp with time zone, last_message_preview text, last_message_sender_name text, unread_count integer, is_muted boolean, is_archived boolean, member_count bigint, other_user_id uuid, other_user_name text, other_user_avatar text, custom_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_conversations_with_participants(p_user_id uuid)
 RETURNS TABLE(id uuid, type text, title text, created_by uuid, business_id uuid, last_message_at timestamp with time zone, last_message_preview text, created_at timestamp with time zone, updated_at timestamp with time zone, is_archived boolean, metadata jsonb, unread_count integer, is_pinned boolean, is_muted boolean, other_user_id uuid, other_user_full_name text, other_user_email text, other_user_avatar_url text, last_message_sender_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
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
    -- Sender del mensaje más reciente
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
  -- Último mensaje no eliminado (LATERAL para eficiencia con índice)
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
$function$;

CREATE OR REPLACE FUNCTION public.get_direct_reports(p_user_id uuid, p_business_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, email text, hierarchy_level integer, job_title text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_employee_business_details(p_employee_id uuid, p_business_id uuid)
 RETURNS TABLE(business_id uuid, business_name text, business_description text, logo_url text, phone text, email text, website text, address text, city text, state text, country text, average_rating numeric, total_reviews integer, category_name character varying, location_id uuid, location_name text, location_address text, role text, employee_type text, job_title character varying, salary_base numeric, salary_type character varying, contract_type character varying, hire_date date, is_active boolean, employee_avg_rating numeric, employee_total_reviews bigint, services_count bigint, completed_appointments bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_expense_summary_by_category(p_business_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(category transaction_category, total_amount numeric, transaction_count bigint, avg_amount numeric, max_amount numeric, min_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_matching_vacancies(p_user_id uuid, p_city text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(vacancy_id uuid, title character varying, description text, position_type character varying, work_schedule jsonb, number_of_positions integer, remote_allowed boolean, experience_required character varying, salary_min numeric, salary_max numeric, required_services uuid[], location_city text, location_address text, benefits text[], published_at timestamp with time zone, business_id uuid, business_name text, business_city text, applications_count bigint, match_score integer)
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_messages_paginated(p_conversation_id uuid, p_before_id uuid DEFAULT NULL::uuid, p_after_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(message_id uuid, sender_id uuid, sender_name text, sender_avatar text, body text, type message_type, metadata jsonb, created_at timestamp with time zone, edited_at timestamp with time zone, reply_to uuid, is_pinned boolean, reply_to_body text, reply_to_sender_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(p_user1_id uuid, p_user2_id uuid, p_business_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Buscar conversación existente entre los dos usuarios
  SELECT DISTINCT c.id INTO v_conversation_id
  FROM chat_conversations c
  INNER JOIN chat_participants p1 ON c.id = p1.conversation_id AND p1.user_id = p_user1_id
  INNER JOIN chat_participants p2 ON c.id = p2.conversation_id AND p2.user_id = p_user2_id
  WHERE c.type = 'direct'
    AND p1.left_at IS NULL
    AND p2.left_at IS NULL
    AND (p_business_id IS NULL OR c.business_id = p_business_id)
  LIMIT 1;

  -- Si no existe, crear nueva conversación
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
$function$;

CREATE OR REPLACE FUNCTION public.get_pinned_messages(p_conversation_id uuid)
 RETURNS TABLE(message_id uuid, sender_id uuid, sender_name text, sender_avatar text, body text, type message_type, metadata jsonb, created_at timestamp with time zone, pinned_at timestamp with time zone, pinned_by uuid, pinned_by_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_reporting_chain(p_user_id uuid, p_business_id uuid)
 RETURNS TABLE(level integer, user_id uuid, full_name text, hierarchy_level integer, job_title text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_resource_stats(p_resource_id uuid)
 RETURNS TABLE(total_bookings bigint, upcoming_bookings bigint, completed_bookings bigint, revenue_total numeric, revenue_this_month numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_subscription_dashboard(p_business_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

    -- Obtener métodos de pago
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

    -- Obtener últimos 10 pagos
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

    -- Obtener métricas de uso más recientes
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
$function$;

CREATE OR REPLACE FUNCTION public.get_supabase_service_role_key()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Intentar obtener desde configuración personalizada
  RETURN current_setting('app.settings.service_role_key', true);
EXCEPTION WHEN OTHERS THEN
  -- Si no está configurada, retornar NULL
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_supabase_url()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Intentar obtener desde configuración personalizada
  RETURN current_setting('app.settings.supabase_url', true);
EXCEPTION WHEN OTHERS THEN
  -- Si no está configurada, usar la URL por defecto del proyecto
  RETURN 'https://dkancockzvcqorqbwtyh.supabase.co';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_transfer_impact(p_business_employee_id uuid, p_effective_date timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
AS $function$
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

  -- Contar citas a cancelar (después de fecha efectiva)
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
$function$;

CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_unread_count_no_chat(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM public.in_app_notifications
    WHERE 
        user_id = p_user_id 
        AND status = 'unread'
        AND type != 'chat_message'; -- ✅ Tipo correcto

    RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_unread_messages_count(p_conversation_id uuid, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_businesses(p_user_id uuid, p_include_owner boolean DEFAULT true)
 RETURNS TABLE(id uuid, name text, description text, logo_url text, phone text, email text, address text, city text, state text)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_favorite_businesses()
 RETURNS TABLE(id uuid, name text, description text, logo_url text, banner_url text, address text, city text, phone text, average_rating numeric, review_count bigint, is_active boolean, favorited_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid, p_business_id uuid)
 RETURNS TABLE(permission text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions_fast(p_user_id uuid, p_business_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_wizard_business_data(p_business_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.has_permission_fast(p_user_id uuid, p_business_id uuid, p_permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- Check usando materialized view (80% más rápido)
  SELECT permissions @> ARRAY[p_permission]
  INTO v_has_permission
  FROM user_active_permissions
  WHERE user_id = p_user_id
    AND business_id = p_business_id;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_discount_code_uses()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE discount_codes
    SET current_uses = current_uses + 1
    WHERE id = NEW.discount_code_id;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_unread_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Actualizar last_read_at del SENDER (marca como leído para quien envía)
  UPDATE conversation_members
  SET last_read_at = NEW.created_at
  WHERE conversation_id = NEW.conversation_id
    AND user_id = NEW.sender_id;
  
  -- Incrementar unread_count de TODOS LOS DEMÁS MIEMBROS
  UPDATE conversation_members
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_vacancy_applications_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE job_vacancies 
  SET applications_count = applications_count + 1
  WHERE id = NEW.vacancy_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_vacation_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_business_vacation_days INT;
  v_current_year INT;
  v_balance_record RECORD;
BEGIN
  -- Obtener días de vacaciones anuales de la configuración del negocio
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
$function$;

CREATE OR REPLACE FUNCTION public.invoke_appointment_status_updater()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- ✅ Leer service_role_key desde Vault (NO desde current_setting)
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

  -- Log de éxito
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
$function$;

CREATE OR REPLACE FUNCTION public.invoke_process_reminders()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  request_id bigint;
  service_key text;
BEGIN
  -- ✅ Leer service_role_key desde Vault (NO desde current_setting)
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

  -- Log de éxito
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
$function$;

CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM businesses
        WHERE id = p_business_id
        AND owner_id = auth.uid()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_business_owner_for_storage(p_business_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id
    AND owner_id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_discount_code_valid(p_code text, p_plan_type text DEFAULT NULL::text, p_amount numeric DEFAULT NULL::numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_employee_available_for_appointment(p_employee_id uuid, p_business_id uuid, p_location_id uuid, p_appointment_date timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
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

  -- Si no existe el empleado o no está activo
  IF v_employee IS NULL OR NOT v_employee.is_active THEN
    RETURN FALSE;
  END IF;

  -- Si no hay traslado programado, validar sede normal
  IF v_employee.transfer_status IS NULL OR v_employee.transfer_status != 'pending' THEN
    RETURN v_employee.location_id = p_location_id;
  END IF;

  -- Si hay traslado pendiente, aplicar lógica especial
  IF v_employee.transfer_status = 'pending' THEN
    -- Regla 1: Cita ANTES de fecha efectiva → debe ser en sede ANTERIOR
    IF p_appointment_date < v_employee.transfer_effective_date THEN
      RETURN v_employee.location_id = p_location_id;
    END IF;

    -- Regla 2: Cita DESPUÉS O EN fecha efectiva → debe ser en sede NUEVA
    IF p_appointment_date >= v_employee.transfer_effective_date THEN
      RETURN v_employee.transfer_to_location_id = p_location_id;
    END IF;
  END IF;

  -- Default: no disponible
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_employee_available_on_date(p_employee_id uuid, p_business_id uuid, p_check_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_location_owner_for_storage(p_location_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.locations l
    JOIN public.businesses b ON b.id = l.business_id
    WHERE l.id = p_location_id
      AND b.owner_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_resource_available(p_resource_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_error_event(p_source text DEFAULT 'frontend-web'::text, p_level text DEFAULT 'error'::text, p_message text DEFAULT 'Unknown error'::text, p_stack_trace text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_session_id text DEFAULT NULL::text, p_component text DEFAULT NULL::text, p_context jsonb DEFAULT '{}'::jsonb, p_environment text DEFAULT 'production'::text, p_error_hash text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_error_id UUID;
  v_error_hash TEXT;
  v_recent_count INTEGER;
BEGIN
  -- Validar parámetros requeridos
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

  -- Rate limiting: max 100 errores idénticos por hora
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
$function$;

CREATE OR REPLACE FUNCTION public.log_login_event(p_email text DEFAULT 'unknown@example.com'::text, p_status text DEFAULT 'success'::text, p_method text DEFAULT 'password'::text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_login_id UUID;
  v_device TEXT;
  v_browser TEXT;
  v_os TEXT;
  v_is_suspicious BOOLEAN := FALSE;
  v_suspicious_reason TEXT := NULL;
  v_recent_failures INTEGER;
BEGIN
  -- Validar parámetros requeridos
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

  -- Detección de actividad sospechosa
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
$function$;

CREATE OR REPLACE FUNCTION public.log_payment_method_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_subscription_payment_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.mark_message_as_read(p_message_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_read_by JSONB;
  v_already_read BOOLEAN;
BEGIN
  -- Obtener read_by actual
  SELECT read_by INTO v_read_by
  FROM messages
  WHERE id = p_message_id;
  
  -- Verificar si ya fue leído por este usuario
  SELECT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(v_read_by) AS elem
    WHERE elem->>'user_id' = p_user_id::text
  ) INTO v_already_read;
  
  -- Si no ha sido leído, agregarlo
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
$function$;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id uuid, p_user_id uuid, p_message_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  
  -- 3. Actualizar read_by en TODOS los mensajes de la conversación
  --    que aún no han sido marcados como leídos por este usuario
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
$function$;

CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(p_user_id uuid, p_notification_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.mark_notifications_email_sent(p_user_id uuid, p_notification_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_appointment_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_business_name TEXT;
    v_service_name TEXT;
    v_client_name TEXT;
    v_employee_name TEXT;
    v_appointment_time TEXT;
    v_business_owner_id UUID;
BEGIN
    -- Obtener información del negocio
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
    -- CAMBIO: priority de 2 → 1 (normal, no urgente)
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
                    'Tu cita de ' || v_service_name || ' con ' || v_employee_name || ' en ' || v_business_name || ' está programada para el ' || v_appointment_time
                WHEN v_service_name IS NOT NULL THEN
                    'Tu cita de ' || v_service_name || ' en ' || v_business_name || ' está programada para el ' || v_appointment_time
                ELSE
                    'Tu cita en ' || v_business_name || ' está programada para el ' || v_appointment_time
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

    -- 3. NOTIFICAR AL DUEÑO DEL NEGOCIO (si es diferente del empleado y del cliente)
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_business_on_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'Nueva aplicación recibida',
    COALESCE(v_applicant_name, 'Un candidato') || ' ha aplicado a la vacante "' || COALESCE(v_vacancy_title, 'sin título') || '"',
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_chat_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

    -- Obtener título de la conversación (si existe)
    SELECT title INTO v_conversation_title
    FROM public.chat_conversations
    WHERE id = NEW.conversation_id;

    -- Preview del mensaje (máximo 100 caracteres)
    v_message_preview := substring(NEW.content, 1, 100);
    IF length(NEW.content) > 100 THEN
        v_message_preview := v_message_preview || '...';
    END IF;

    -- Crear notificación para cada participante (excepto el sender)
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
        -- Crear notificación in-app usando la función helper
        -- ✅ FIX: Usar 'chat_message' (tipo correcto del enum)
        PERFORM create_in_app_notification(
            p_user_id := v_participant.user_id,
            p_type := 'chat_message',  -- ✅ Tipo correcto
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Crear notificación para cada participante
  IF v_recipient_ids IS NOT NULL THEN
    FOREACH v_recipient_id IN ARRAY v_recipient_ids
    LOOP
      PERFORM create_in_app_notification(
        p_user_id := v_recipient_id,
        p_type := 'chat_message',
        p_title := COALESCE(v_sender_name, 'Alguien') || ' te envió un mensaje',
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
$function$;

CREATE OR REPLACE FUNCTION public.process_due_recurring_expenses()
 RETURNS TABLE(expense_id uuid, transaction_id uuid, expense_name text, amount numeric, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_expense recurring_expenses%ROWTYPE;
  v_transaction_id UUID;
  v_expense_name TEXT;
BEGIN
  -- Iterar sobre egresos recurrentes que están listos para pago
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
      
      -- Generar transacción
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
$function$;

CREATE OR REPLACE FUNCTION public.profiles_search_vector_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'B');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.project_future_expenses(p_business_id uuid, p_months integer DEFAULT 3)
 RETURNS TABLE(month_year text, projected_amount numeric, breakdown jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.purge_old_logs(days_to_keep integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.reactivate_user_account(user_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.refresh_appointments_with_relations()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY appointments_with_relations;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_ratings_stats()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY business_ratings_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_ratings_stats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_resource_availability()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY resource_availability;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_user_active_permissions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Refresh CONCURRENTLY para no bloquear lecturas
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_active_permissions;
  
  RAISE NOTICE 'user_active_permissions refreshed at %', NOW();
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error refreshing user_active_permissions: %', SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_vacancy_selection_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vacancy_selection_stats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_employee_request(request_id uuid, admin_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.reset_billing_test_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    
    -- Reset códigos de descuento de dev
    UPDATE discount_codes
    SET current_uses = 0
    WHERE code IN ('DEVTEST', 'TRIAL60');
    
    RAISE NOTICE 'Billing test data reset successfully';
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_user_permission(p_business_id uuid, p_user_id uuid, p_permission text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.safe_update_hierarchy_level(p_user_id uuid, p_business_id uuid, p_new_level integer)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validación de nivel
  IF p_new_level < 0 OR p_new_level > 4 THEN
    RETURN QUERY SELECT FALSE::boolean, 'Nivel inválido: ' || p_new_level || '. Debe estar entre 0 y 4.'::text;
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

  RETURN QUERY SELECT TRUE::boolean, 'Nivel jerárquico actualizado exitosamente'::text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_businesses(search_query text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, name text, description text, logo_url text, category_id uuid, average_rating numeric, review_count bigint, rank real)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.search_messages(p_conversation_id uuid, p_query text, p_limit integer DEFAULT 50)
 RETURNS TABLE(message_id uuid, sender_id uuid, sender_name text, sender_avatar text, body text, type message_type, created_at timestamp with time zone, rank real)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.search_professionals(search_query text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, bio text, avatar_url text, average_rating numeric, review_count bigint, rank real)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.search_services(search_query text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, name text, description text, price numeric, duration_minutes integer, business_id uuid, business_name text, average_rating numeric, rank real)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id uuid, p_sender_id uuid, p_content text, p_type text DEFAULT 'text'::text, p_attachments jsonb DEFAULT NULL::jsonb, p_reply_to_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

  -- Actualizar última mensaje en conversación
  UPDATE chat_conversations
  SET 
    last_message_at = now(),
    last_message_preview = CASE 
      WHEN p_type = 'text' THEN left(p_content, 100)
      WHEN p_type = 'image' THEN '📷 Imagen'
      WHEN p_type = 'file' THEN '📎 Archivo'
      ELSE '💬 Mensaje'
    END,
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Incrementar contador de no leídos para otros participantes
  UPDATE chat_participants
  SET 
    unread_count = unread_count + 1,
    updated_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id
    AND left_at IS NULL;

  RETURN v_message_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.services_search_vector_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.category, '')), 'C');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_appointment_completed_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.set_appointment_confirmation_deadline(p_appointment_id uuid, p_hours integer DEFAULT 24)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.set_fiscal_period()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.fiscal_period := TO_CHAR(NEW.transaction_date, 'YYYY-MM');
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_business_favorite(p_business_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.track_first_client()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update first_client_at if this is the first client appointment
  UPDATE businesses 
  SET first_client_at = NOW() 
  WHERE id = NEW.business_id 
    AND first_client_at IS NULL
    AND NEW.status IN ('confirmed', 'completed');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_notify_business_unconfigured()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Solo procesar notificaciones de tipo business_unconfigured
  IF NEW.type != 'business_unconfigured' THEN
    RETURN NEW;
  END IF;

  -- Obtener URL de Supabase desde configuración
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  
  -- Si no hay URL configurada, usar valor por defecto (development)
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'http://localhost:54321';
  END IF;

  -- Usar pg_cron o pg_net para llamar a la Edge Function
  -- Nota: Esto requiere extensión pg_net instalada en Supabase
  -- Por ahora, la Edge Function será llamada manualmente o via webhook HTTP
  
  -- Alternativa: Insertar en tabla de queue para procesamiento asíncrono
  -- INSERT INTO notification_queue (notification_id, function_name, payload, created_at)
  -- VALUES (NEW.id, 'notify-business-unconfigured', row_to_json(NEW), NOW());

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_refresh_ratings_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Llamar a la función de refresco de forma asíncrona (pg_background)
  -- Por ahora, simplemente marcar que se necesita refresco
  -- En producción, usar un cron job o pg_cron
  PERFORM refresh_ratings_stats();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_set_confirmation_deadline()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only set for new appointments in 'pending' status
    IF NEW.status = 'pending' AND OLD IS NULL THEN
        PERFORM set_appointment_confirmation_deadline(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_employee_service()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_employee_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    PERFORM public.update_business_configuration(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_location()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_business_configuration(OLD.business_id);
    RETURN OLD;
  ELSE
    PERFORM public.update_business_configuration(NEW.business_id);
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_location_service()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_resource_service()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_resource_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    PERFORM public.update_business_configuration(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_business_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE businesses 
  SET last_activity_at = NOW() 
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_business_appointment_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        UPDATE businesses
        SET total_appointments = total_appointments + 1
        WHERE id = NEW.business_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_business_configuration(p_business_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_is_configured BOOLEAN;
  v_old_configured BOOLEAN;
  v_owner_id UUID;
BEGIN
  -- Obtener estado anterior y owner
  SELECT is_configured, owner_id INTO v_old_configured, v_owner_id
  FROM public.businesses
  WHERE id = p_business_id;

  -- Calcular nueva configuración
  v_is_configured := public.validate_business_configuration(p_business_id);

  -- Actualizar solo si cambió el estado
  IF v_is_configured != v_old_configured THEN
    UPDATE public.businesses
    SET is_configured = v_is_configured,
        updated_at = NOW()
    WHERE id = p_business_id;

    -- Si cambió de TRUE → FALSE, crear notificación in-app
    IF v_old_configured = true AND v_is_configured = false THEN
      INSERT INTO public.in_app_notifications (
        user_id,
        type,
        title,
        message,
        data,
        read,
        created_at
      ) VALUES (
        v_owner_id,
        'business_unconfigured',
        'Negocio no disponible al público',
        'Tu negocio ya no está visible para clientes porque faltan configuraciones requeridas (sedes activas, servicios o empleados/recursos asignados).',
        jsonb_build_object('business_id', p_business_id),
        false,
        NOW()
      );
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_business_notification_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_business_resources_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_business_review_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_chat_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = SUBSTRING(NEW.body FROM 1 FOR 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_discount_codes_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_employee_join_requests_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_employee_profile_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_hierarchy_level_v4(uuid, uuid, integer)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id alias for $1;
  v_business_id alias for $2;
  v_new_level alias for $3;
BEGIN
  -- Validaciones
  IF v_new_level < 0 OR v_new_level > 4 THEN
    RETURN QUERY SELECT FALSE, 'Nivel inválido: ' || v_new_level::text;
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
$function$;

CREATE OR REPLACE FUNCTION public.update_job_applications_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_job_vacancies_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_location_expense_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_message_delivery_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Si se marca un mensaje como leído (read_by actualizado)
  IF NEW.read_by IS DISTINCT FROM OLD.read_by THEN
    -- Contar cuántos miembros hay en la conversación (excluyendo sender)
    DECLARE
      total_members INTEGER;
      read_count INTEGER;
    BEGIN
      -- Total de miembros excluyendo sender
      SELECT COUNT(*) INTO total_members
      FROM conversation_members
      WHERE conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id;
      
      -- Cuántos han leído
      read_count := jsonb_array_length(NEW.read_by);
      
      -- Actualizar estado según lecturas
      IF read_count >= total_members THEN
        NEW.delivery_status := 'read';
      ELSIF read_count > 0 THEN
        NEW.delivery_status := 'delivered';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_message_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.body, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.metadata->>'file_name', '')), 'B');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_payment_methods_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_payroll_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_payroll_payments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_public_holidays_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_recurring_expenses_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_payments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_typing_indicator(p_conversation_id uuid, p_user_id uuid, p_is_typing boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Usuario no es participante de la conversación';
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_notification_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vacation_balance_on_absence()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_work_schedules_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_access_conversation_attachments(object_path text, user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.user_has_hierarchy_permission(p_business_id uuid, p_permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.user_is_in_conversation(conv_id uuid, user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar si el usuario es participante de la conversación
  -- Sin usar RLS policies (SECURITY DEFINER ejecuta con privilegios del creador)
  RETURN EXISTS (
    SELECT 1 
    FROM chat_participants
    WHERE conversation_id = conv_id
      AND user_id = user_id_param
      AND left_at IS NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_application_status_transition()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- No permitir cambiar de rejected/accepted a in_selection_process
  IF OLD.status IN ('rejected', 'accepted', 'withdrawn') 
     AND NEW.status = 'in_selection_process' THEN
    RAISE EXCEPTION 'No se puede iniciar proceso de selección con candidato en estado %', OLD.status;
  END IF;
  
  -- Si cambia a in_selection_process, asegurar que se llenen los campos de tracking
  IF NEW.status = 'in_selection_process' AND OLD.status != 'in_selection_process' THEN
    IF NEW.selection_started_at IS NULL THEN
      NEW.selection_started_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_business_configuration(p_business_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

  -- VALIDACIÓN 1: Tiene al menos 1 sede activa
  SELECT EXISTS(
    SELECT 1 FROM public.locations
    WHERE business_id = p_business_id
    AND is_active = true
    LIMIT 1
  ) INTO v_has_active_locations;

  IF NOT v_has_active_locations THEN
    RETURN false;
  END IF;

  -- VALIDACIÓN 2: Las sedes activas tienen servicios asociados
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

  -- VALIDACIÓN 3: Los servicios tienen empleados o recursos asignados
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
      -- Requiere recursos físicos asignados a servicios
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
      -- Requiere al menos 1 empleado O 1 recurso físico
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
      -- Clases grupales no requieren empleados/recursos específicos
      -- Solo necesita sedes activas + servicios
      v_has_assignees := true;

    ELSE
      v_has_assignees := false;
  END CASE;

  RETURN v_has_assignees;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_direct_conversation_members()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_employee_service_location()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Verificar que el servicio esté disponible en la sede
    IF NOT EXISTS (
        SELECT 1 FROM location_services 
        WHERE location_id = NEW.location_id 
        AND service_id = NEW.service_id 
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Service is not available at this location';
    END IF;
    
    -- Verificar que el empleado esté asignado al negocio y sede
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_hierarchy_no_cycles()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
    RAISE EXCEPTION 'Un empleado no puede reportar a sí mismo';
  END IF;

  v_current_id := NEW.reports_to;
  
  WHILE v_current_id IS NOT NULL AND v_depth < v_max_depth LOOP
    IF v_current_id = NEW.user_id THEN
      RAISE EXCEPTION 'Se detectó un ciclo en la jerarquía';
    END IF;

    SELECT reports_to INTO v_current_id
    FROM business_roles
    WHERE user_id = v_current_id
      AND business_id = NEW.business_id
      AND is_active = true;

    v_depth := v_depth + 1;
  END LOOP;

  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'La jerarquía excede la profundidad máxima permitida';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_plan_limits(p_business_id uuid, p_resource text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        -- Obtener conteo actual según el tipo de recurso
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
        
        -- Placeholder: límites hardcodeados según plan_type
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
$function$;

CREATE OR REPLACE FUNCTION public.verify_review_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Auto-verificar si la cita fue completada
    NEW.is_verified := EXISTS (
        SELECT 1 FROM appointments 
        WHERE id = NEW.appointment_id 
        AND status = 'completed'
    );
    
    RETURN NEW;
END;
$function$;
