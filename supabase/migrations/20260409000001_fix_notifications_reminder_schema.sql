-- =============================================================================
-- Migration: Fix notifications schema for process-reminders Edge Function
-- Date: 2026-04-09
-- Reason: Production error "column appointments.title does not exist"
--
-- Root cause: The process-reminders Edge Function was deployed to PROD with
-- an old version that queried appointments.title (which no longer exists).
-- Additionally, the notifications table in PROD is missing columns and enum
-- values that the current function version requires.
--
-- Changes:
--   1. Add reminder_24h, reminder_1h, reminder_2h to notification_type enum
--   2. Add delivery_method, status, error_message columns to notifications
--
-- Idempotent: safe to run on DEV (already has these) and PROD (will apply)
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Extend notification_type enum with reminder values
--    (used by process-reminders when inserting into notifications table)
-- -----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'reminder_24h'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'reminder_24h';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'reminder_1h'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'reminder_1h';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'reminder_2h'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'reminder_2h';
  END IF;
END
$$;

-- -----------------------------------------------------------------------
-- 2. Add missing columns to notifications table
--    (required by the current process-reminders function version)
-- -----------------------------------------------------------------------

-- delivery_method: how the notification was sent ('email' | 'whatsapp' | 'sms')
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS delivery_method TEXT;

-- status: tracks notification delivery state ('queued' | 'sent' | 'failed')
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued';

-- error_message: stores failure reason if delivery fails
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- -----------------------------------------------------------------------
-- 3. Create index on status for efficient querying of queued notifications
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON public.notifications (status)
  WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_appointment_type
  ON public.notifications (appointment_id, type)
  WHERE appointment_id IS NOT NULL;
