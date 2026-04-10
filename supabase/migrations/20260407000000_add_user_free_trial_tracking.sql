-- Migration: add_user_free_trial_tracking
-- Tracks whether a user (owner) has already consumed their one-time free trial
-- of the Plan Básico. Stored at the USER level (profiles), not per business.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_used_free_trial    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_trial_used_at     timestamptz,
  ADD COLUMN IF NOT EXISTS free_trial_business_id uuid
    REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Partial index: only indexes eligible users (has_used_free_trial = false).
-- Once a user activates the trial the row is removed from the index automatically.
CREATE INDEX IF NOT EXISTS idx_profiles_trial_eligible
  ON public.profiles (id)
  WHERE has_used_free_trial = false;

COMMENT ON COLUMN public.profiles.has_used_free_trial    IS 'True once the user has activated their one-time free trial of Plan Básico. Never reset to false.';
COMMENT ON COLUMN public.profiles.free_trial_used_at     IS 'Timestamp when the free trial was activated.';
COMMENT ON COLUMN public.profiles.free_trial_business_id IS 'The business where the free trial was activated. SET NULL if the business is deleted.';
