-- =============================================================================
-- Migration: 20260409000002_sync_dev_to_prod
-- Purpose: Sync DEV schema to PROD — make both environments identical
-- Date: 2026-04-09
-- Changes:
--   1. ALTER TYPE notification_type_enum: add appointment_reminder_24h, appointment_reminder_1h
--   2. ALTER TABLE businesses: add work_on_holidays column
--   3. ALTER TABLE locations: add work_on_holidays column
--   4. ALTER TABLE profiles: add 7 columns (phone OTP + free trial)
--   5. CREATE TABLE business_closed_days (with FK constraints, RLS)
--   6. CREATE OR REPLACE VIEW (8 views)
-- =============================================================================

-- ─── 1. ENUM: notification_type_enum — add missing values ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'appointment_reminder_24h'
  ) THEN
    ALTER TYPE notification_type_enum ADD VALUE 'appointment_reminder_24h';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'appointment_reminder_1h'
  ) THEN
    ALTER TYPE notification_type_enum ADD VALUE 'appointment_reminder_1h';
  END IF;
END;
$$;

-- ─── 2. businesses — add work_on_holidays ─────────────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS work_on_holidays BOOLEAN NOT NULL DEFAULT false;

-- ─── 3. locations — add work_on_holidays ──────────────────────────────────────
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS work_on_holidays BOOLEAN DEFAULT NULL;

-- ─── 4. profiles — add phone OTP + free trial columns ────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_otp_code        VARCHAR(6)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone_otp_expires_at  TIMESTAMPTZ  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone_otp_attempts    INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_verified        BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_used_free_trial   BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_trial_used_at    TIMESTAMPTZ  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS free_trial_business_id UUID        DEFAULT NULL;

-- ─── 5. business_closed_days — create table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_closed_days (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID        NOT NULL    REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_id UUID                    REFERENCES public.locations(id)  ON DELETE CASCADE,
  closed_date DATE        NOT NULL,
  reason      TEXT        DEFAULT NULL,
  created_by  UUID                    REFERENCES public.profiles(id)   ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL    DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_closed_days ENABLE ROW LEVEL SECURITY;

-- RLS: admins and owners can manage
CREATE POLICY "admin_manage_closed_days"
  ON public.business_closed_days
  FOR ALL
  TO public
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM public.business_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM public.business_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS: public read
CREATE POLICY "public_read_closed_days"
  ON public.business_closed_days
  FOR SELECT
  TO public
  USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_business_closed_days_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_closed_days_updated_at ON public.business_closed_days;
CREATE TRIGGER trg_business_closed_days_updated_at
  BEFORE UPDATE ON public.business_closed_days
  FOR EACH ROW EXECUTE FUNCTION public.update_business_closed_days_updated_at();

-- ─── 6. VIEWS ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.appointment_details AS
SELECT
  a.id,
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
  s.name           AS service_name,
  s.duration_minutes,
  s.price          AS service_price,
  c.full_name      AS client_name,
  c.email          AS client_email,
  c.phone          AS client_phone,
  e.full_name      AS employee_name,
  l.name           AS location_name,
  l.address        AS location_address,
  b.name           AS business_name
FROM appointments a
LEFT JOIN services  s ON a.service_id   = s.id
LEFT JOIN profiles  c ON a.client_id    = c.id
LEFT JOIN profiles  e ON a.employee_id  = e.id
LEFT JOIN locations l ON a.location_id  = l.id
LEFT JOIN businesses b ON a.business_id = b.id;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.business_stats AS
SELECT
  b.id   AS business_id,
  b.name AS business_name,
  COUNT(DISTINCT a.id) AS total_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'completed'::appointment_status  THEN a.id END) AS completed_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'cancelled'::appointment_status  THEN a.id END) AS cancelled_appointments,
  COUNT(DISTINCT a.client_id) AS total_clients,
  COALESCE(SUM(CASE WHEN a.status = 'completed'::appointment_status THEN a.price END), 0) AS total_revenue,
  COUNT(DISTINCT be.employee_id) AS total_employees
FROM businesses b
LEFT JOIN appointments      a  ON b.id = a.business_id
LEFT JOIN business_employees be ON b.id = be.business_id AND be.status = 'approved'::employee_status
GROUP BY b.id, b.name;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.employee_performance AS
SELECT
  e.id          AS employee_id,
  e.full_name   AS employee_name,
  e.email,
  e.avatar_url,
  be.business_id,
  b.name        AS business_name,
  be.location_id,
  l.name        AS location_name,
  be.role       AS "position",
  COUNT(DISTINCT es.service_id) AS services_offered,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = ANY(ARRAY['confirmed'::appointment_status,'completed'::appointment_status])) AS total_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed'::appointment_status)  AS completed_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled'::appointment_status)  AS cancelled_appointments,
  ROUND(
    (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed'::appointment_status))::numeric
    / NULLIF((COUNT(DISTINCT a.id) FILTER (WHERE a.status = ANY(ARRAY['confirmed'::appointment_status,'completed'::appointment_status])))::numeric, 0)
    * 100, 2
  ) AS completion_rate,
  COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating,
  COUNT(DISTINCT r.id) AS total_reviews,
  COALESCE(SUM(a.price)  FILTER (WHERE a.status = 'completed'::appointment_status), 0) AS total_revenue,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'::transaction_type AND t.category = ANY(ARRAY['salary'::transaction_category,'commission'::transaction_category])), 0) AS total_paid
FROM profiles e
JOIN business_employees be ON e.id = be.employee_id AND be.status = 'approved'::employee_status AND be.is_active = true
JOIN businesses         b  ON be.business_id = b.id
LEFT JOIN locations     l  ON be.location_id = l.id
LEFT JOIN employee_services es ON e.id = es.employee_id AND es.business_id = be.business_id AND es.is_active = true
LEFT JOIN appointments  a  ON e.id = a.employee_id AND a.business_id = be.business_id
LEFT JOIN reviews       r  ON e.id = r.employee_id
LEFT JOIN transactions  t  ON t.business_id = be.business_id AND t.employee_id = e.id
GROUP BY e.id, e.full_name, e.email, e.avatar_url, be.business_id, b.name, be.location_id, l.name, be.role;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.financial_summary AS
SELECT
  t.business_id,
  b.name AS business_name,
  date_trunc('month', t.transaction_date::timestamptz) AS month,
  SUM(CASE WHEN t.type = 'income'::transaction_type  THEN t.amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN t.type = 'expense'::transaction_type THEN t.amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN t.type = 'income'::transaction_type  THEN t.amount ELSE -t.amount END) AS net_profit,
  COUNT(DISTINCT CASE WHEN t.type = 'income'::transaction_type  THEN t.id END) AS income_count,
  COUNT(DISTINCT CASE WHEN t.type = 'expense'::transaction_type THEN t.id END) AS expense_count
FROM transactions t
JOIN businesses b ON t.business_id = b.id
GROUP BY t.business_id, b.name, date_trunc('month', t.transaction_date::timestamptz);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.fiscal_obligations_status AS
SELECT
  t.business_id,
  b.name   AS business_name,
  t.fiscal_period,
  COUNT(DISTINCT t.tax_type) AS different_tax_types,
  SUM(t.tax_amount)          AS total_tax_liability,
  MAX(t.transaction_date)    AS last_transaction_date,
  COUNT(*)                   AS total_transactions
FROM transactions t
JOIN businesses b ON t.business_id = b.id
WHERE t.tax_amount > 0
GROUP BY t.business_id, b.name, t.fiscal_period;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.location_services_availability AS
SELECT
  ls.location_id,
  l.name          AS location_name,
  l.business_id,
  b.name          AS business_name,
  ls.service_id,
  s.name          AS service_name,
  s.duration_minutes,
  s.price,
  ls.is_active,
  COUNT(DISTINCT es.employee_id) AS available_employees
FROM location_services ls
JOIN locations   l  ON ls.location_id = l.id
JOIN businesses  b  ON l.business_id  = b.id
JOIN services    s  ON ls.service_id  = s.id
LEFT JOIN employee_services es ON s.id = es.service_id AND es.is_active = true
WHERE ls.is_active = true
GROUP BY ls.location_id, l.name, l.business_id, b.name, ls.service_id, s.name, s.duration_minutes, s.price, ls.is_active;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.tax_report_by_period AS
SELECT
  t.business_id,
  b.name          AS business_name,
  t.fiscal_period,
  t.tax_type,
  COUNT(*)        AS transaction_count,
  SUM(t.amount)   AS total_amount,
  SUM(t.subtotal) AS total_subtotal,
  SUM(t.tax_amount) AS total_tax,
  AVG(t.tax_rate) AS avg_tax_rate
FROM transactions t
JOIN businesses b ON t.business_id = b.id
WHERE t.fiscal_period IS NOT NULL
GROUP BY t.business_id, b.name, t.fiscal_period, t.tax_type;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_unread_chat_email_stats AS
SELECT
  cp.user_id,
  u.email,
  u.full_name,
  COUNT(DISTINCT m.id)                    AS unread_message_count,
  COUNT(DISTINCT m.conversation_id)       AS conversations_with_unread,
  MIN(m.created_at)                       AS oldest_unread_message,
  MAX(m.created_at)                       AS newest_unread_message
FROM chat_participants cp
JOIN profiles u ON cp.user_id = u.id
LEFT JOIN messages m ON
  m.conversation_id = cp.conversation_id
  AND m.sender_id <> cp.user_id
  AND (m.read_by IS NULL OR NOT (m.read_by ? cp.user_id::text))
GROUP BY cp.user_id, u.email, u.full_name
HAVING COUNT(DISTINCT m.id) > 0;
