-- =====================================================
-- MIGRACIÓN: RPCs para Sistema de Referrals
-- Fecha: 2026-07-04
-- Todas las funciones son SECURITY DEFINER para manejar
-- RLS de system_config y referral_codes de forma segura.
-- =====================================================

-- ─── 1. get_referral_feature_enabled ─────────────────────────────────────────
-- Cualquier usuario autenticado puede llamar esto para saber si el feature está activo.
CREATE OR REPLACE FUNCTION public.get_referral_feature_enabled()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag TEXT;
BEGIN
  SELECT value INTO v_flag FROM public.system_config WHERE key = 'referral_program_enabled';
  RETURN COALESCE(v_flag = 'true', FALSE);
END;
$$;

COMMENT ON FUNCTION public.get_referral_feature_enabled IS
  'Retorna TRUE si el programa de referrals está activo. SECURITY DEFINER para acceder a system_config.';

-- ─── 2. create_referral_code ─────────────────────────────────────────────────
-- Genera un código único de 8 caracteres para el usuario.
-- Retorna el código existente si ya tiene uno activo.
CREATE OR REPLACE FUNCTION public.create_referral_code(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feature_enabled BOOLEAN;
  v_has_payout      BOOLEAN;
  v_existing_code   TEXT;
  v_existing_exp    TIMESTAMPTZ;
  v_new_code        TEXT;
  v_expires_at      TIMESTAMPTZ;
  v_attempt         INT := 0;
BEGIN
  -- Check feature flag
  SELECT (value = 'true') INTO v_feature_enabled
  FROM public.system_config WHERE key = 'referral_program_enabled';

  IF NOT COALESCE(v_feature_enabled, FALSE) THEN
    RETURN json_build_object('error', 'El programa de referrals no está activo actualmente');
  END IF;

  -- Check payout details exist
  SELECT EXISTS(
    SELECT 1 FROM public.user_payout_details WHERE user_id = p_user_id
  ) INTO v_has_payout;

  IF NOT v_has_payout THEN
    RETURN json_build_object('error', 'Debes configurar tus datos de pago primero');
  END IF;

  -- Return existing active code if any
  SELECT code, expires_at INTO v_existing_code, v_existing_exp
  FROM public.referral_codes
  WHERE creator_user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_code IS NOT NULL THEN
    RETURN json_build_object(
      'code', v_existing_code,
      'expires_at', v_existing_exp,
      'already_existed', TRUE
    );
  END IF;

  -- Generate unique 8-char uppercase code
  LOOP
    v_new_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = v_new_code);
    v_attempt := v_attempt + 1;
    IF v_attempt > 10 THEN
      RETURN json_build_object('error', 'Error generando código único, intenta de nuevo');
    END IF;
  END LOOP;

  v_expires_at := now() + INTERVAL '90 days';

  INSERT INTO public.referral_codes (code, creator_user_id, expires_at)
  VALUES (v_new_code, p_user_id, v_expires_at);

  RETURN json_build_object(
    'code', v_new_code,
    'expires_at', v_expires_at,
    'already_existed', FALSE
  );
END;
$$;

COMMENT ON FUNCTION public.create_referral_code IS
  'Genera o retorna el código de referral activo del usuario. Requiere user_payout_details previo.';

-- ─── 3. apply_referral_code ──────────────────────────────────────────────────
-- Valida un código de referral para un negocio dado.
-- Usa SELECT FOR UPDATE para prevenir race conditions.
-- NO marca redeemed — eso ocurre en mark_referral_redeemed (webhook).
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_business_id UUID, p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref          public.referral_codes%ROWTYPE;
  v_owner_id     UUID;
  v_has_paid     BOOLEAN;
BEGIN
  -- Lock row to serialize concurrent applications
  SELECT * INTO v_ref
  FROM public.referral_codes
  WHERE code = UPPER(TRIM(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('isValid', FALSE, 'message', 'Código no encontrado');
  END IF;

  IF v_ref.status != 'active' THEN
    RETURN json_build_object('isValid', FALSE, 'message',
      CASE v_ref.status
        WHEN 'redeemed' THEN 'Este cupón ya fue utilizado'
        WHEN 'expired'  THEN 'Este cupón ha expirado'
        WHEN 'disabled' THEN 'Este cupón no está disponible'
        ELSE 'Cupón inválido'
      END);
  END IF;

  IF v_ref.expires_at < now() THEN
    UPDATE public.referral_codes SET status = 'expired' WHERE id = v_ref.id;
    RETURN json_build_object('isValid', FALSE, 'message', 'Este cupón ha expirado');
  END IF;

  -- Get business owner
  SELECT owner_id INTO v_owner_id FROM public.businesses WHERE id = p_business_id;
  IF NOT FOUND THEN
    RETURN json_build_object('isValid', FALSE, 'message', 'Negocio no encontrado');
  END IF;

  -- No auto-referral
  IF v_ref.creator_user_id = v_owner_id THEN
    RETURN json_build_object('isValid', FALSE, 'message', 'No puedes usar tu propio cupón');
  END IF;

  -- Business must never have paid
  SELECT EXISTS(
    SELECT 1 FROM public.business_plans
    WHERE business_id = p_business_id
      AND status IN ('active', 'canceled', 'past_due')
  ) INTO v_has_paid;

  IF v_has_paid THEN
    RETURN json_build_object('isValid', FALSE, 'message', 'Este cupón solo aplica para nuevos suscriptores');
  END IF;

  RETURN json_build_object(
    'isValid',        TRUE,
    'discountAmount', v_ref.discount_amount,
    'payoutAmount',   v_ref.payout_amount,
    'referralCodeId', v_ref.id,
    'finalAmount',    89900 - v_ref.discount_amount,
    'message',        'Cupón válido — ahorras $' || v_ref.discount_amount::TEXT || ' COP'
  );
END;
$$;

COMMENT ON FUNCTION public.apply_referral_code IS
  'Valida un cupón de referral para un negocio. Retorna isValid + discount info. Sin side effects.';

-- ─── 4. mark_referral_redeemed ───────────────────────────────────────────────
-- Llamado por el webhook de MercadoPago (service role) cuando se confirma el pago.
-- Crea el payout en estado pending. Es idempotente.
CREATE OR REPLACE FUNCTION public.mark_referral_redeemed(
  p_code_id     UUID,
  p_business_id UUID,
  p_user_id     UUID,
  p_payment_id  TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id    UUID;
  v_payout_amount INT;
  v_payout_id     UUID;
BEGIN
  -- Get creator and payout amount (only if still active)
  SELECT creator_user_id, payout_amount INTO v_creator_id, v_payout_amount
  FROM public.referral_codes
  WHERE id = p_code_id AND status = 'active';

  IF NOT FOUND THEN
    -- Already redeemed — return existing payout id (idempotent)
    SELECT id INTO v_payout_id FROM public.referral_payouts WHERE referral_code_id = p_code_id;
    RETURN json_build_object('payoutId', v_payout_id, 'alreadyProcessed', TRUE);
  END IF;

  -- Mark code as redeemed
  UPDATE public.referral_codes
  SET status              = 'redeemed',
      redeemed_at         = now(),
      used_by_business_id = p_business_id,
      used_by_user_id     = p_user_id
  WHERE id = p_code_id;

  -- Create payout row (ON CONFLICT DO NOTHING = idempotente)
  INSERT INTO public.referral_payouts (
    referral_code_id,
    subscription_payment_id,
    recipient_user_id,
    amount,
    status,
    idempotency_key
  ) VALUES (
    p_code_id,
    p_payment_id,
    v_creator_id,
    v_payout_amount,
    'pending',
    p_code_id::TEXT
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_payout_id;

  -- If conflict occurred, fetch existing id
  IF v_payout_id IS NULL THEN
    SELECT id INTO v_payout_id
    FROM public.referral_payouts WHERE idempotency_key = p_code_id::TEXT;
  END IF;

  RETURN json_build_object('payoutId', v_payout_id, 'alreadyProcessed', FALSE);
END;
$$;

COMMENT ON FUNCTION public.mark_referral_redeemed IS
  'Marca cupón como canjeado y crea payout en estado pending. Idempotente. Llamado por webhook.';
