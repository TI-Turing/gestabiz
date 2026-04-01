-- =============================================================================
-- Migration: PROD Cron Jobs (pg_cron + pg_net)
-- Idempotent: unschedule existing + reschedule with PROD URLs
--
-- PREREQUISITE: Store the Supabase anon key in Vault before running this migration:
--   SELECT vault.create_secret(
--     '<SUPABASE_ANON_KEY>',  -- replace with actual key from Dashboard > Settings > API
--     'supabase_anon_key'
--   );
--   Or via Supabase Dashboard > Database > Vault > Add secret (name: supabase_anon_key)
-- =============================================================================

-- Unschedule existing jobs (idempotent)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('appointment-status-updater', 'process-appointment-reminders');

-- Schedule appointment status updater (every 30 min)
-- Reads anon key from Supabase Vault at runtime — no secrets in source code
SELECT cron.schedule(
  'appointment-status-updater',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url:='https://emknatoknbomvmyumqju.supabase.co/functions/v1/appointment-status-updater',
    headers:=format(
      '{"Content-Type":"application/json","Authorization":"Bearer %s"}',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)
    )::jsonb,
    body:='{}'::jsonb
  )$$
);

-- Schedule appointment reminders processor (every 30 min)
SELECT cron.schedule(
  'process-appointment-reminders',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url:='https://emknatoknbomvmyumqju.supabase.co/functions/v1/process-reminders',
    headers:=format(
      '{"Content-Type":"application/json","Authorization":"Bearer %s"}',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)
    )::jsonb,
    body:='{}'::jsonb
  )$$
);
