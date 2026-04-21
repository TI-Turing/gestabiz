-- Migration: Change whatsapp_enabled DEFAULT to true
-- Context: New businesses were created with whatsapp_enabled = false because the DEFAULT was false.
--   The trigger create_default_business_notification_settings() inserts only (business_id),
--   so all other columns use their DEFAULT. Changing DEFAULT to true fixes new businesses.
--   UPDATE also enables WhatsApp for all existing businesses.

-- 1. Change column DEFAULT so new businesses get whatsapp_enabled = true
ALTER TABLE public.business_notification_settings
  ALTER COLUMN whatsapp_enabled SET DEFAULT true;

-- 2. Enable WhatsApp for all existing businesses
UPDATE public.business_notification_settings
SET whatsapp_enabled = true
WHERE whatsapp_enabled = false;
