-- =============================================================================
-- Migration: Allow nullable client_id in appointments (Admin Booking)
-- Purpose: Enable admins to create appointments for walk-in/guest clients
--          who may not have a registered profile in the system.
-- =============================================================================

-- 1. Drop the NOT NULL constraint on client_id
ALTER TABLE public.appointments ALTER COLUMN client_id DROP NOT NULL;

-- 2. Add guest_client_info JSONB column for walk-in clients without a profile
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS guest_client_info JSONB DEFAULT NULL;

COMMENT ON COLUMN public.appointments.guest_client_info IS
  'Client info for walk-in appointments without registered profile: {name, phone, email}';

-- 3. Add CHECK constraint: every appointment must have either a registered client or guest info
ALTER TABLE public.appointments ADD CONSTRAINT chk_client_or_guest
  CHECK (client_id IS NOT NULL OR guest_client_info IS NOT NULL);

-- 4. Add index for querying guest appointments
CREATE INDEX IF NOT EXISTS idx_appointments_guest_client_info
  ON public.appointments USING gin (guest_client_info)
  WHERE guest_client_info IS NOT NULL;
