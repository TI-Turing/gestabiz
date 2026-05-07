-- ============================================================================
-- Migration: Appointment Payment Fields & Audit Log
-- Adds deposit fields to appointments + auditable event log + helper enum.
-- ============================================================================

-- Enum dedicado para deposit_status (más seguro que TEXT con CHECK).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deposit_status') THEN
    CREATE TYPE public.deposit_status AS ENUM (
      'not_required',
      'pending',
      'paid',
      'refunded',
      'partial_refund',
      'failed'
    );
  END IF;
END$$;

-- Extiende appointments con metadata del anticipo
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS deposit_required numeric(12,2),
  ADD COLUMN IF NOT EXISTS deposit_paid numeric(12,2),
  ADD COLUMN IF NOT EXISTS deposit_status public.deposit_status DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS mp_preference_id text,
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS gateway_fee numeric(12,2),
  ADD COLUMN IF NOT EXISTS platform_fee numeric(12,2),
  ADD COLUMN IF NOT EXISTS net_to_business numeric(12,2),
  ADD COLUMN IF NOT EXISTS deposit_refund_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS deposit_refunded_at timestamptz;

COMMENT ON COLUMN public.appointments.deposit_required IS
  'Monto del anticipo que se debió pagar. Calculado desde service.price * porcentaje al crear la cita.';

COMMENT ON COLUMN public.appointments.deposit_paid IS
  'Monto efectivamente recibido por MP (puede diferir si hubo cambio de precio).';

COMMENT ON COLUMN public.appointments.deposit_status IS
  'Estado del anticipo. not_required = el negocio no exige cobro. pending = esperando pago. paid = confirmado por webhook. refunded = devuelto 100%. partial_refund = devuelto parcial. failed = pago rechazado.';

COMMENT ON COLUMN public.appointments.hold_expires_at IS
  'TTL del slot mientras el cliente paga (15 min). Si expira sin payment, se libera el slot vía cron.';

COMMENT ON COLUMN public.appointments.gateway_fee IS
  'Comisión MercadoPago capturada (incluye IVA). Calculada desde payment_gateway_fees vigente.';

COMMENT ON COLUMN public.appointments.platform_fee IS
  'Comisión Gestabiz (5% del anticipo recibido). Cobrada vía marketplace_fee de MP.';

COMMENT ON COLUMN public.appointments.net_to_business IS
  'Monto neto que recibe el negocio después de gateway_fee y platform_fee.';

CREATE INDEX IF NOT EXISTS idx_appointments_hold_expires
  ON public.appointments(hold_expires_at)
  WHERE deposit_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_appointments_mp_payment
  ON public.appointments(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- ============================================================================
-- Log auditable de movimientos (cargos + reembolsos + chargebacks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointment_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'deposit_charged',
    'deposit_refunded',
    'chargeback',
    'manual_adjustment',
    'hold_expired',
    'webhook_received'
  )),
  amount numeric(12,2) NOT NULL,
  gateway text NOT NULL DEFAULT 'mercadopago',
  gateway_reference text,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  idempotency_key text UNIQUE,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.appointment_payment_events IS
  'Log auditable de todos los movimientos de dinero por cita. Append-only. Usado para conciliación y disputas.';

CREATE INDEX IF NOT EXISTS idx_apt_payment_events_apt
  ON public.appointment_payment_events(appointment_id);

CREATE INDEX IF NOT EXISTS idx_apt_payment_events_type
  ON public.appointment_payment_events(event_type, created_at DESC);

ALTER TABLE public.appointment_payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_admin_or_client_can_read_apt_events"
  ON public.appointment_payment_events FOR SELECT
  USING (
    appointment_id IN (
      SELECT a.id FROM public.appointments a
      WHERE a.client_id = auth.uid()
        OR a.business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
        OR a.business_id IN (
          SELECT business_id FROM public.business_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
  );

-- INSERT solo via service_role (Edge Functions). Sin políticas adicionales.
