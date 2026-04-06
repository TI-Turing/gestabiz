-- Migration: add_billing_cron_jobs
-- Registers pg_cron jobs for:
--   1. send-renewal-reminder  — runs daily at 09:00 UTC
--   2. process-expired-plans  — runs daily at 00:05 UTC
--
-- Prerequisites: pg_cron and pg_net extensions must be enabled.
-- vault.decrypted_secrets must have a secret named 'SUPABASE_SERVICE_ROLE_KEY'.
-- In PROD, replace the URL below with the PROD project URL.
--
-- To apply:
--   npx supabase db push --dns-resolver https --yes --project-ref emknatoknbomvmyumqju

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing jobs if present (idempotent re-run safety)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-renewal-reminder-daily') THEN
    PERFORM cron.unschedule('send-renewal-reminder-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-expired-plans-daily') THEN
    PERFORM cron.unschedule('process-expired-plans-daily');
  END IF;
END
$$;

-- Cron 1: send-renewal-reminder — every day at 09:00 UTC
-- Replace 'https://emknatoknbomvmyumqju.supabase.co' with actual PROD URL if different.
SELECT cron.schedule(
  'send-renewal-reminder-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emknatoknbomvmyumqju.supabase.co/functions/v1/send-renewal-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cron 2: process-expired-plans — every day at 00:05 UTC
SELECT cron.schedule(
  'process-expired-plans-daily',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://emknatoknbomvmyumqju.supabase.co/functions/v1/process-expired-plans',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb
  );
  $$
);
