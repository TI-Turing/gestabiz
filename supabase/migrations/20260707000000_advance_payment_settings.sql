-- ============================================================================
-- Migration: Advance Payment Settings on Businesses & Services
-- Adds business-level configuration for advance/deposit payments on bookings.
-- Part of Sistema de Pagos Anticipados (Plan B — Marketplace 1:1 OAuth).
-- ============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS advance_payment_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_payment_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_payment_percentage numeric(5,2) NOT NULL DEFAULT 0
    CHECK (advance_payment_percentage >= 0 AND advance_payment_percentage <= 100),
  ADD COLUMN IF NOT EXISTS cancellation_policy jsonb NOT NULL DEFAULT '{
    "full_refund_hours": 48,
    "partial_refund_hours": 24,
    "partial_refund_percentage": 50
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS payments_tos_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS payments_settlement_mode text NOT NULL DEFAULT 'standard'
    CHECK (payments_settlement_mode IN ('immediate', 'standard', 'deferred_14d'));

COMMENT ON COLUMN public.businesses.advance_payment_enabled IS
  'Si TRUE, el negocio permite cobro de anticipo al reservar citas. Requiere business_mp_connections activa.';

COMMENT ON COLUMN public.businesses.advance_payment_required IS
  'Si TRUE, no se puede agendar sin pagar el anticipo. Si FALSE, el cliente puede saltar el pago.';

COMMENT ON COLUMN public.businesses.advance_payment_percentage IS
  'Porcentaje del precio del servicio cobrado como anticipo (0-100). 0 = no se cobra anticipo.';

COMMENT ON COLUMN public.businesses.cancellation_policy IS
  'Política escalonada de devolución. JSON: {full_refund_hours, partial_refund_hours, partial_refund_percentage}';

COMMENT ON COLUMN public.businesses.payments_tos_accepted_at IS
  'Timestamp en que el owner aceptó los términos de cobro vía Gestabiz. NULL = no aceptado, no permitido cobrar.';

COMMENT ON COLUMN public.businesses.payments_settlement_mode IS
  'Modalidad MP de acreditación: immediate (5.99%) | standard (3.99%) | deferred_14d (2.99%).';

-- Override por servicio (opcional). NULL = usa el del negocio.
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS advance_payment_percentage numeric(5,2)
    CHECK (advance_payment_percentage IS NULL
      OR (advance_payment_percentage >= 0 AND advance_payment_percentage <= 100));

COMMENT ON COLUMN public.services.advance_payment_percentage IS
  'Override del % de anticipo del negocio para este servicio. NULL = usa businesses.advance_payment_percentage.';

-- Tabla auxiliar de tarifas MP (editable sin redeploy)
CREATE TABLE IF NOT EXISTS public.payment_gateway_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL,
  country text NOT NULL DEFAULT 'CO',
  settlement_mode text NOT NULL,
  rate_percentage numeric(5,4) NOT NULL,
  iva_percentage numeric(5,4) NOT NULL DEFAULT 0.19,
  fixed_fee numeric(12,2) NOT NULL DEFAULT 0,
  effective_from date NOT NULL,
  effective_to date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_gateway_fees_unique UNIQUE (gateway, country, settlement_mode, effective_from)
);

COMMENT ON TABLE public.payment_gateway_fees IS
  'Tarifas históricas y vigentes de pasarelas. Cuando MP cambia tarifas, se inserta nueva fila con effective_from y se cierra la anterior con effective_to.';

ALTER TABLE public.payment_gateway_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_payment_gateway_fees"
  ON public.payment_gateway_fees FOR SELECT
  USING (true);

-- Solo service_role puede modificar tarifas (no hay UI; cambios via SQL admin).
-- Sin políticas adicionales => RLS bloquea INSERT/UPDATE/DELETE para usuarios autenticados.

INSERT INTO public.payment_gateway_fees (gateway, country, settlement_mode, rate_percentage, effective_from, notes)
VALUES
  ('mercadopago', 'CO', 'immediate',    0.0599, '2026-01-01', 'MP Colombia 2026: acreditación inmediata, 5.99% + IVA 19%'),
  ('mercadopago', 'CO', 'standard',     0.0399, '2026-01-01', 'MP Colombia 2026: acreditación estándar 1-2 días, 3.99% + IVA 19%'),
  ('mercadopago', 'CO', 'deferred_14d', 0.0299, '2026-01-01', 'MP Colombia 2026: acreditación diferida 14 días, 2.99% + IVA 19%')
ON CONFLICT (gateway, country, settlement_mode, effective_from) DO NOTHING;
