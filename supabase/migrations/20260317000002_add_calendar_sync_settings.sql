-- Migration: Add calendar_sync_settings table for persistent Google Calendar OAuth tokens
-- Replaces localStorage-only storage (useKV) with proper DB persistence

CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google'
    CHECK (provider IN ('google', 'outlook', 'apple')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  calendar_id TEXT NOT NULL DEFAULT '',
  access_token TEXT,
  refresh_token TEXT,
  sync_direction TEXT NOT NULL DEFAULT 'both'
    CHECK (sync_direction IN ('both', 'export_only', 'import_only')),
  auto_sync BOOLEAN NOT NULL DEFAULT true,
  last_sync TIMESTAMPTZ,
  sync_errors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- RLS: users can only manage their own settings
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_sync_settings_owner"
  ON calendar_sync_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_calendar_sync_settings_user_id
  ON calendar_sync_settings(user_id);
