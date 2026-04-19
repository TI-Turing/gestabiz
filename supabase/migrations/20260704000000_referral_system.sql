-- =====================================================
-- MIGRACIÓN: Sistema de Referrals — Tablas y RLS
-- Fecha: 2026-07-04
-- Descripción:
--   1. user_payout_details — datos de pago del referrer (MercadoPago email + datos bancarios)
--   2. referral_codes     — cupones únicos generados por usuarios
--   3. referral_payouts   — transferencias ejecutadas vía MercadoPago
--   4. Feature flag       — referral_program_enabled = true en system_config
-- =====================================================

-- ─── 1. user_payout_details ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_payout_details (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT        NOT NULL,
  document_type   TEXT        NOT NULL CHECK (document_type IN ('CC', 'CE', 'PPT', 'NIT', 'PAS')),
  document_number TEXT        NOT NULL,
  mp_email        TEXT        NOT NULL,
  bank_name       TEXT,
  bank_account    TEXT,
  account_type    TEXT        CHECK (account_type IN ('savings', 'checking')),
  country         TEXT        NOT NULL DEFAULT 'CO',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_payout_details IS
  'Datos bancarios y de MercadoPago del usuario referrer para recibir comisiones.';
COMMENT ON COLUMN public.user_payout_details.mp_email IS
  'Email de la cuenta MercadoPago destino — obligatorio para MP Transfer API.';

-- ─── 2. referral_codes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 TEXT        UNIQUE NOT NULL,
  creator_user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by_business_id  UUID        REFERENCES public.businesses(id) ON DELETE SET NULL,
  used_by_user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status               TEXT        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'redeemed', 'expired', 'disabled')),
  redeemed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at           TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),
  discount_amount      INT         NOT NULL DEFAULT 15000,
  payout_amount        INT         NOT NULL DEFAULT 60000,
  CONSTRAINT uq_referral_per_pair UNIQUE (creator_user_id, used_by_business_id)
);

COMMENT ON TABLE public.referral_codes IS
  'Cupones de referral únicos. Un usuario solo puede referir a cada negocio una vez.';
COMMENT ON COLUMN public.referral_codes.discount_amount IS
  'Descuento que recibe el negocio referido al primer pago (COP).';
COMMENT ON COLUMN public.referral_codes.payout_amount IS
  'Comisión que recibe el referrer al confirmarse el pago (COP).';

-- ─── 3. referral_payouts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id        UUID        UNIQUE NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  subscription_payment_id TEXT,
  recipient_user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount                  INT         NOT NULL DEFAULT 60000,
  status                  TEXT        NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'processing', 'transferred', 'failed', 'manual_review')),
  mp_transfer_id          TEXT,
  paid_at                 TIMESTAMPTZ,
  attempt_count           INT         NOT NULL DEFAULT 0,
  last_error              TEXT,
  idempotency_key         TEXT        UNIQUE NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.referral_payouts IS
  'Transferencias de comisiones vía MercadoPago. UNIQUE en referral_code_id garantiza idempotencia.';
COMMENT ON COLUMN public.referral_payouts.idempotency_key IS
  'Derivado de referral_code_id::TEXT para prevenir doble pago ante webhooks duplicados.';

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payout_details_user
  ON public.user_payout_details(user_id);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code_active
  ON public.referral_codes(code) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_referral_codes_creator
  ON public.referral_codes(creator_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_codes_business
  ON public.referral_codes(used_by_business_id)
  WHERE used_by_business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_payouts_recipient
  ON public.referral_payouts(recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_payouts_pending
  ON public.referral_payouts(status, attempt_count)
  WHERE status IN ('pending', 'failed');

-- ─── Triggers updated_at ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_user_payout_details'
  ) THEN
    CREATE TRIGGER set_updated_at_user_payout_details
      BEFORE UPDATE ON public.user_payout_details
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_referral_payouts'
  ) THEN
    CREATE TRIGGER set_updated_at_referral_payouts
      BEFORE UPDATE ON public.referral_payouts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_payout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payouts    ENABLE ROW LEVEL SECURITY;

-- user_payout_details: cada usuario ve y gestiona sus propios datos
CREATE POLICY "upd_select_own" ON public.user_payout_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "upd_insert_own" ON public.user_payout_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "upd_update_own" ON public.user_payout_details
  FOR UPDATE USING (auth.uid() = user_id);

-- referral_codes: creador ve los suyos (INSERT solo vía RPC SECURITY DEFINER)
CREATE POLICY "rc_select_own" ON public.referral_codes
  FOR SELECT USING (auth.uid() = creator_user_id);

-- referral_payouts: destinatario ve los suyos (escritura solo service role vía RPC)
CREATE POLICY "rp_select_own" ON public.referral_payouts
  FOR SELECT USING (auth.uid() = recipient_user_id);

-- ─── Feature flag ─────────────────────────────────────────────────────────────
INSERT INTO public.system_config (key, value)
VALUES ('referral_program_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
