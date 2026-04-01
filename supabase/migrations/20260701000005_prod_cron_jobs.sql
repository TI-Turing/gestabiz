-- =============================================================================
-- Migration: PROD Cron Jobs (pg_cron + pg_net)
-- Idempotent: unschedule existing + reschedule with PROD URLs
-- =============================================================================

-- Unschedule existing jobs (idempotent)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('appointment-status-updater', 'process-appointment-reminders');

-- Schedule appointment status updater (every 30 min)
SELECT cron.schedule(
  'appointment-status-updater',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url:='https://emknatoknbomvmyumqju.supabase.co/functions/v1/appointment-status-updater',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVta25hdG9rbmJvbXZteXVtcWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjU0MzksImV4cCI6MjA4OTg0MTQzOX0.d7gfIEqi7e53RpuHnGH6-kDEBsRgx3K-HKmqwJkNGQs"}'::jsonb,
    body:='{}'::jsonb
  )$$
);

-- Schedule appointment reminders processor (every 30 min)
SELECT cron.schedule(
  'process-appointment-reminders',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url:='https://emknatoknbomvmyumqju.supabase.co/functions/v1/process-reminders',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVta25hdG9rbmJvbXZteXVtcWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjU0MzksImV4cCI6MjA4OTg0MTQzOX0.d7gfIEqi7e53RpuHnGH6-kDEBsRgx3K-HKmqwJkNGQs"}'::jsonb,
    body:='{}'::jsonb
  )$$
);
