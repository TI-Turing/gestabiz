-- Cambiar el DEFAULT de reminder_times de 1h (60 min) a 2h (120 min)
-- Los nuevos negocios quedarán con recordatorios a 24h y 2h antes de la cita

ALTER TABLE public.business_notification_settings
  ALTER COLUMN reminder_times SET DEFAULT ARRAY[1440, 120];
