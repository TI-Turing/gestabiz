-- Disable JWT verification for mercadopago-webhook function permanently
-- This needs to be done after every redeploy as Supabase re-enables it automatically

-- Check current status
SELECT function_name, requires_auth 
FROM edge_functions 
WHERE function_name = 'mercadopago-webhook';

-- Disable JWT verification (no authentication required for webhook)
-- Note: This setting may need to be reapplied after function redeploys
-- To apply via CLI: npx supabase functions deploy mercadopago-webhook --no-verify-jwt
-- Or via Dashboard: Edge Functions → mercadopago-webhook → Settings → Toggle "Verify JWT" OFF

-- Alternative approach: Use a POST-DEPLOY hook to disable JWT
-- This is configuration-based rather than schema-based
