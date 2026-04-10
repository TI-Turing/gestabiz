-- ============================================================
-- PROD Catch-up: Convert plain columns to GENERATED columns
-- and fix constraints that differ from DEV schema
-- ============================================================
-- Differences found via pg_dump comparison (PROD vs DEV):
--   1. employee_time_off.total_days  → should be GENERATED ALWAYS AS
--   2. vacation_balance.days_remaining → should be GENERATED ALWAYS AS
--   3. uq_recurring_expenses_employee_payroll → missing NULLS NOT DISTINCT
-- ============================================================

-- 1. Fix employee_time_off.total_days (GENERATED column)
--    DEV: total_days integer GENERATED ALWAYS AS (((end_date - start_date) + 1)) STORED
--    PROD: total_days integer (plain — not auto-calculated)

ALTER TABLE public.employee_time_off
  DROP CONSTRAINT IF EXISTS valid_total_days;

ALTER TABLE public.employee_time_off
  DROP COLUMN IF EXISTS total_days;

ALTER TABLE public.employee_time_off
  ADD COLUMN total_days integer GENERATED ALWAYS AS (((end_date - start_date) + 1)) STORED;

ALTER TABLE public.employee_time_off
  ADD CONSTRAINT valid_total_days CHECK (((total_days > 0) AND (total_days <= 365)));


-- 2. Fix vacation_balance.days_remaining (GENERATED column)
--    DEV: days_remaining integer GENERATED ALWAYS AS (((total_days_available - days_used) - days_pending)) STORED
--    PROD: days_remaining integer (plain — not auto-calculated)

ALTER TABLE public.vacation_balance
  DROP COLUMN IF EXISTS days_remaining;

ALTER TABLE public.vacation_balance
  ADD COLUMN days_remaining integer GENERATED ALWAYS AS (((total_days_available - days_used) - days_pending)) STORED;


-- 3. Fix uq_recurring_expenses_employee_payroll (add NULLS NOT DISTINCT)
--    DEV:  UNIQUE NULLS NOT DISTINCT (business_id, employee_id, category)
--    PROD: UNIQUE (business_id, employee_id, category)
--    Effect: ensures only one NULL employee_id per business_id+category combination

ALTER TABLE public.recurring_expenses
  DROP CONSTRAINT IF EXISTS uq_recurring_expenses_employee_payroll;

ALTER TABLE public.recurring_expenses
  ADD CONSTRAINT uq_recurring_expenses_employee_payroll
  UNIQUE NULLS NOT DISTINCT (business_id, employee_id, category);
