-- ============================================================================
-- Migration: Business MercadoPago OAuth Connections (Plan B)
-- Stores MP OAuth credentials per business for marketplace 1:1 split payments.
-- Tokens are encrypted with pgcrypto using a vault key.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.business_mp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  mp_user_id text NOT NULL,
  mp_access_token_encrypted bytea NOT NULL,
  mp_refresh_token_encrypted bytea NOT NULL,
  mp_public_key text NOT NULL,
  mp_live_mode boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['offline_access','read','write'],
  connected_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  last_refreshed_at timestamptz,
  refresh_failure_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.business_mp_connections IS
  'Conexión OAuth MercadoPago por negocio. Tokens encriptados. Plan B: split payments 1:1 con marketplace_fee.';

COMMENT ON COLUMN public.business_mp_connections.mp_user_id IS
  'collector_id del negocio en MercadoPago. Usado para operaciones que requieren identificar al seller.';

COMMENT ON COLUMN public.business_mp_connections.mp_access_token_encrypted IS
  'Access token MP encriptado con pgcrypto + APP_ENCRYPTION_KEY (vault). Nunca exponer en SELECT.';

COMMENT ON COLUMN public.business_mp_connections.mp_live_mode IS
  'TRUE = producción, FALSE = sandbox. Determinado por el flow de OAuth usado.';

CREATE INDEX IF NOT EXISTS idx_mp_conn_business ON public.business_mp_connections(business_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mp_conn_expires ON public.business_mp_connections(expires_at) WHERE is_active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_business_mp_connections_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_mp_connections_updated_at ON public.business_mp_connections;
CREATE TRIGGER trg_business_mp_connections_updated_at
  BEFORE UPDATE ON public.business_mp_connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_business_mp_connections_updated_at();

-- ============================================================================
-- RLS: solo SELECT para owners/admins, mostrando metadata sin tokens.
-- INSERT/UPDATE/DELETE solo via service_role (Edge Functions OAuth).
-- ============================================================================

ALTER TABLE public.business_mp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_or_admin_can_view_mp_connection"
  ON public.business_mp_connections FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_roles br
      WHERE br.business_id = business_mp_connections.business_id
        AND br.user_id = auth.uid()
        AND br.role = 'admin'
    )
  );

-- View segura sin tokens — usada por el frontend para mostrar estado de conexión
CREATE OR REPLACE VIEW public.business_mp_connection_status
WITH (security_invoker = true) AS
SELECT
  id,
  business_id,
  mp_user_id,
  mp_public_key,
  mp_live_mode,
  expires_at,
  connected_at,
  disconnected_at,
  is_active,
  last_refreshed_at,
  CASE
    WHEN NOT is_active THEN 'disconnected'
    WHEN expires_at < now() THEN 'expired'
    WHEN expires_at < now() + interval '7 days' THEN 'expiring_soon'
    ELSE 'active'
  END as connection_status
FROM public.business_mp_connections;

COMMENT ON VIEW public.business_mp_connection_status IS
  'Vista segura sin tokens. Usada por el frontend para mostrar estado de conexión MP.';

-- ============================================================================
-- Helper: encriptar/desencriptar usando GUC app.encryption_key
-- La key se setea en supabase/config.toml como variable de entorno y se inyecta
-- via SET LOCAL app.encryption_key = current_setting('app.encryption_key')
-- ============================================================================

CREATE OR REPLACE FUNCTION public.encrypt_mp_token(p_token text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := current_setting('app.encryption_key', true);
  IF v_key IS NULL OR length(v_key) < 32 THEN
    RAISE EXCEPTION 'app.encryption_key not set or too short (min 32 chars)';
  END IF;
  RETURN pgp_sym_encrypt(p_token, v_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_mp_token(p_encrypted bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := current_setting('app.encryption_key', true);
  IF v_key IS NULL OR length(v_key) < 32 THEN
    RAISE EXCEPTION 'app.encryption_key not set or too short (min 32 chars)';
  END IF;
  RETURN pgp_sym_decrypt(p_encrypted, v_key);
END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_mp_token(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrypt_mp_token(bytea) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_mp_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_mp_token(bytea) TO service_role;

COMMENT ON FUNCTION public.encrypt_mp_token IS 'Encripta token MP. Solo service_role. Requiere app.encryption_key seteada.';
COMMENT ON FUNCTION public.decrypt_mp_token IS 'Desencripta token MP. Solo service_role. Requiere app.encryption_key seteada.';
