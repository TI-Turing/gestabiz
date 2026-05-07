-- ============================================================================
-- Migration: RPCs para cálculo de fees y limpieza de holds expirados
-- ============================================================================

-- ----------------------------------------------------------------------------
-- compute_appointment_fees(business_id, service_id, override_price)
-- Calcula breakdown de fees para una cita. Usado por frontend (preview) y EFs.
-- Retorna jsonb con todos los campos.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.compute_appointment_fees(
  p_business_id uuid,
  p_service_id uuid,
  p_override_price numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_business RECORD;
  v_service RECORD;
  v_fee_config RECORD;
  v_service_price numeric;
  v_deposit_pct numeric;
  v_deposit_amount numeric;
  v_gateway_rate numeric;
  v_iva_rate numeric;
  v_gateway_fee numeric;
  v_platform_fee_rate constant numeric := 0.05; -- 5% Gestabiz
  v_platform_fee numeric;
  v_net_to_business numeric;
  v_remaining_balance numeric;
BEGIN
  SELECT
    advance_payment_enabled,
    advance_payment_required,
    advance_payment_percentage,
    payments_settlement_mode
  INTO v_business
  FROM public.businesses
  WHERE id = p_business_id;

  IF v_business IS NULL THEN
    RAISE EXCEPTION 'Business not found: %', p_business_id;
  END IF;

  SELECT price, advance_payment_percentage AS service_pct
  INTO v_service
  FROM public.services
  WHERE id = p_service_id AND business_id = p_business_id;

  IF v_service IS NULL THEN
    RAISE EXCEPTION 'Service not found or not in business: %', p_service_id;
  END IF;

  v_service_price := COALESCE(p_override_price, v_service.price, 0);

  -- Si negocio no tiene anticipos habilitados o servicio es gratis, retornar 0
  IF NOT v_business.advance_payment_enabled OR v_service_price <= 0 THEN
    RETURN jsonb_build_object(
      'service_price', v_service_price,
      'deposit_required', 0,
      'deposit_percentage', 0,
      'gateway_fee', 0,
      'platform_fee', 0,
      'net_to_business', 0,
      'remaining_balance', v_service_price,
      'is_required', false,
      'is_enabled', false,
      'currency', 'COP'
    );
  END IF;

  -- Override por servicio si está definido
  v_deposit_pct := COALESCE(v_service.service_pct, v_business.advance_payment_percentage, 0);
  v_deposit_amount := round(v_service_price * v_deposit_pct / 100.0, 2);

  IF v_deposit_amount <= 0 THEN
    RETURN jsonb_build_object(
      'service_price', v_service_price,
      'deposit_required', 0,
      'deposit_percentage', v_deposit_pct,
      'gateway_fee', 0,
      'platform_fee', 0,
      'net_to_business', 0,
      'remaining_balance', v_service_price,
      'is_required', false,
      'is_enabled', true,
      'currency', 'COP'
    );
  END IF;

  -- Buscar tarifa MP vigente
  SELECT rate_percentage, iva_percentage
  INTO v_fee_config
  FROM public.payment_gateway_fees
  WHERE gateway = 'mercadopago'
    AND country = 'CO'
    AND settlement_mode = v_business.payments_settlement_mode
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Default conservador si no encuentra config
  v_gateway_rate := COALESCE(v_fee_config.rate_percentage, 0.0399);
  v_iva_rate := COALESCE(v_fee_config.iva_percentage, 0.19);

  -- Comisión MP = deposit * rate * (1 + IVA)
  v_gateway_fee := round(v_deposit_amount * v_gateway_rate * (1 + v_iva_rate), 2);

  -- Comisión Gestabiz = 5% del anticipo recibido
  v_platform_fee := round(v_deposit_amount * v_platform_fee_rate, 2);

  v_net_to_business := v_deposit_amount - v_gateway_fee - v_platform_fee;
  v_remaining_balance := v_service_price - v_deposit_amount;

  RETURN jsonb_build_object(
    'service_price', v_service_price,
    'deposit_required', v_deposit_amount,
    'deposit_percentage', v_deposit_pct,
    'gateway_fee', v_gateway_fee,
    'gateway_rate', v_gateway_rate,
    'iva_rate', v_iva_rate,
    'platform_fee', v_platform_fee,
    'platform_fee_rate', v_platform_fee_rate,
    'net_to_business', v_net_to_business,
    'remaining_balance', v_remaining_balance,
    'is_required', v_business.advance_payment_required,
    'is_enabled', true,
    'settlement_mode', v_business.payments_settlement_mode,
    'currency', 'COP'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.compute_appointment_fees(uuid, uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_appointment_fees(uuid, uuid, numeric) TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.compute_appointment_fees IS
  'Calcula breakdown completo de fees para una cita. Usado por frontend (preview en wizard/services) y por EFs (cobro real).';

-- ----------------------------------------------------------------------------
-- release_expired_holds()
-- Libera slots de citas con hold expirado sin pago confirmado.
-- Llamado por cron cada 5 min.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.release_expired_holds()
RETURNS TABLE (released_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count int;
BEGIN
  WITH expired AS (
    UPDATE public.appointments
    SET
      status = 'cancelled',
      deposit_status = 'failed',
      cancelled_at = now(),
      cancel_reason = 'Hold expirado: pago de anticipo no completado en 15 min'
    WHERE deposit_status = 'pending'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < now()
      AND status IN ('pending', 'confirmed')
    RETURNING id, business_id, deposit_required
  )
  INSERT INTO public.appointment_payment_events (
    appointment_id, event_type, amount, gateway, status, metadata
  )
  SELECT id, 'hold_expired', COALESCE(deposit_required, 0), 'mercadopago', 'completed',
    jsonb_build_object('reason', 'hold_ttl_exceeded', 'released_at', now())
  FROM expired;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.release_expired_holds() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_holds() TO service_role;

COMMENT ON FUNCTION public.release_expired_holds IS
  'Libera holds expirados (>15 min sin pago). Llamado por cron 5 min vía EF release-expired-appointment-holds.';

-- ----------------------------------------------------------------------------
-- compute_refund_amount(appointment_id)
-- Calcula cuánto se devuelve al cancelar según política escalonada.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.compute_refund_amount(p_appointment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_apt RECORD;
  v_policy jsonb;
  v_full_hours numeric;
  v_partial_hours numeric;
  v_partial_pct numeric;
  v_hours_until numeric;
  v_refund_pct numeric;
  v_refund_amount numeric;
  v_tier text;
BEGIN
  SELECT
    a.id, a.start_time, a.deposit_paid, a.deposit_status,
    b.cancellation_policy
  INTO v_apt
  FROM public.appointments a
  JOIN public.businesses b ON b.id = a.business_id
  WHERE a.id = p_appointment_id;

  IF v_apt IS NULL THEN
    RAISE EXCEPTION 'Appointment not found: %', p_appointment_id;
  END IF;

  IF v_apt.deposit_status != 'paid' OR COALESCE(v_apt.deposit_paid, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'refund_amount', 0,
      'refund_percentage', 0,
      'tier', 'no_deposit',
      'eligible', false
    );
  END IF;

  v_policy := COALESCE(v_apt.cancellation_policy, '{}'::jsonb);
  v_full_hours := COALESCE((v_policy->>'full_refund_hours')::numeric, 48);
  v_partial_hours := COALESCE((v_policy->>'partial_refund_hours')::numeric, 24);
  v_partial_pct := COALESCE((v_policy->>'partial_refund_percentage')::numeric, 50);

  v_hours_until := EXTRACT(EPOCH FROM (v_apt.start_time - now())) / 3600.0;

  IF v_hours_until >= v_full_hours THEN
    v_refund_pct := 100;
    v_tier := 'full';
  ELSIF v_hours_until >= v_partial_hours THEN
    v_refund_pct := v_partial_pct;
    v_tier := 'partial';
  ELSE
    v_refund_pct := 0;
    v_tier := 'none';
  END IF;

  v_refund_amount := round(v_apt.deposit_paid * v_refund_pct / 100.0, 2);

  RETURN jsonb_build_object(
    'refund_amount', v_refund_amount,
    'refund_percentage', v_refund_pct,
    'tier', v_tier,
    'eligible', v_refund_pct > 0,
    'deposit_paid', v_apt.deposit_paid,
    'hours_until_start', round(v_hours_until, 2),
    'policy', v_policy
  );
END;
$$;

REVOKE ALL ON FUNCTION public.compute_refund_amount(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_refund_amount(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.compute_refund_amount IS
  'Calcula monto de devolución para cancelación según política escalonada del negocio.';
