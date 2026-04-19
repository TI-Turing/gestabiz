-- Fix 1: columna payment_gateway faltante en subscription_payments (causaba 400 en BillingDashboard)
ALTER TABLE public.subscription_payments
    ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'mercadopago';

-- Fix 2: get_subscription_dashboard referenciaba columnas price/currency/limits
-- que no existen en business_plans. Se derivan del plan_type.
CREATE OR REPLACE FUNCTION public.get_subscription_dashboard(p_business_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_result          JSON;
    v_plan            business_plans%ROWTYPE;
    v_usage           usage_metrics%ROWTYPE;
    v_payments        JSON;
    v_payment_methods JSON;
    v_subscription    JSON;
    v_usage_metrics   JSON;
    v_amount          INTEGER;
    v_max_locations   INTEGER;
    v_max_employees   INTEGER;
    v_max_appts       INTEGER;
    v_max_clients     INTEGER;
    v_max_services    INTEGER;
BEGIN
    -- Verificar acceso
    IF NOT (
        EXISTS (SELECT 1 FROM businesses WHERE id = p_business_id AND owner_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM business_employees WHERE business_id = p_business_id AND employee_id = auth.uid() AND role IN ('admin', 'manager'))
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Obtener plan activo
    SELECT * INTO v_plan
    FROM business_plans
    WHERE business_id = p_business_id
      AND status IN ('active', 'trialing', 'past_due', 'paused')
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'subscription',    NULL,
            'paymentMethods',  '[]'::json,
            'recentPayments',  '[]'::json,
            'upcomingInvoice', NULL,
            'usageMetrics',    NULL
        );
    END IF;

    -- Derivar precio mensual del plan_type
    -- Soporta nombres nuevos (basico/pro) y legacy (inicio/profesional)
    v_amount := CASE v_plan.plan_type
        WHEN 'basico'      THEN 89900
        WHEN 'inicio'      THEN 89900
        WHEN 'pro'         THEN 159900
        WHEN 'profesional' THEN 159900
        WHEN 'empresarial' THEN 299900
        WHEN 'corporativo' THEN 299900
        ELSE 0
    END;

    -- Derivar límites del plan_type
    v_max_locations := CASE
        WHEN v_plan.plan_type IN ('basico', 'inicio')           THEN 3
        WHEN v_plan.plan_type IN ('pro', 'profesional')         THEN 10
        WHEN v_plan.plan_type IN ('empresarial', 'corporativo') THEN 50
        ELSE 1
    END;

    v_max_employees := CASE
        WHEN v_plan.plan_type IN ('basico', 'inicio')           THEN 6
        WHEN v_plan.plan_type IN ('pro', 'profesional')         THEN 15
        WHEN v_plan.plan_type IN ('empresarial', 'corporativo') THEN 100
        ELSE 3
    END;

    v_max_appts    := NULL;
    v_max_clients  := NULL;
    v_max_services := NULL;

    -- Construir subscription
    v_subscription := json_build_object(
        'id',                 v_plan.id,
        'businessId',         v_plan.business_id,
        'planType',           v_plan.plan_type,
        'billingCycle',       COALESCE(v_plan.billing_cycle, 'monthly'),
        'status',             v_plan.status,
        'currentPeriodStart', v_plan.start_date,
        'currentPeriodEnd',   v_plan.end_date,
        'trialEndsAt',        v_plan.trial_ends_at,
        'canceledAt',         v_plan.canceled_at,
        'cancellationReason', v_plan.cancellation_reason,
        'pausedAt',           v_plan.paused_at,
        'amount',             v_amount,
        'currency',           'COP'
    );

    -- Métodos de pago
    SELECT COALESCE(json_agg(json_build_object(
        'id',       pm.id,
        'type',     pm.type,
        'brand',    pm.brand,
        'last4',    pm.last4,
        'expMonth', pm.exp_month,
        'expYear',  pm.exp_year,
        'isActive', pm.is_default
    )), '[]'::json) INTO v_payment_methods
    FROM payment_methods pm
    WHERE pm.business_id = p_business_id
      AND pm.is_active = true;

    -- Últimos 10 pagos
    SELECT COALESCE(json_agg(json_build_object(
        'id',            sp.id,
        'amount',        sp.amount,
        'currency',      sp.currency,
        'status',        sp.status,
        'paidAt',        sp.paid_at,
        'failureReason', sp.failure_reason,
        'invoiceUrl',    sp.metadata->>'invoice_pdf'
    )), '[]'::json) INTO v_payments
    FROM (
        SELECT * FROM subscription_payments
        WHERE business_id = p_business_id
        ORDER BY created_at DESC
        LIMIT 10
    ) sp;

    -- Métricas de uso
    SELECT * INTO v_usage
    FROM usage_metrics
    WHERE business_id = p_business_id
    ORDER BY metric_date DESC
    LIMIT 1;

    IF FOUND THEN
        v_usage_metrics := json_build_object(
            'locations',    json_build_object('current', v_usage.locations_count,    'limit', v_max_locations),
            'employees',    json_build_object('current', v_usage.employees_count,    'limit', v_max_employees),
            'appointments', json_build_object('current', v_usage.appointments_count, 'limit', v_max_appts),
            'clients',      json_build_object('current', v_usage.clients_count,      'limit', v_max_clients),
            'services',     json_build_object('current', v_usage.services_count,     'limit', v_max_services)
        );
    END IF;

    RETURN json_build_object(
        'subscription',    v_subscription,
        'paymentMethods',  v_payment_methods,
        'recentPayments',  v_payments,
        'upcomingInvoice', NULL,
        'usageMetrics',    v_usage_metrics
    );
END;
$$;
