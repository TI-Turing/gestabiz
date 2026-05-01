-- ============================================================================
-- Migration: webhook_idempotency_keys
-- Author:    Claude Code (Stabilization sprint — Abril 2026)
-- Ref:       Obsidian/Gestabiz/Contexto/auditoria-completa-abril-2026.md §1.2
-- Purpose:   Los webhooks de Stripe/PayU/MercadoPago validan firma pero NO
--            verifican idempotencia. Un retry del proveedor (o un atacante
--            que capture un payload firmado) reprocesaría el evento y puede
--            duplicar pagos, suscripciones o upgrades.
--
--            Esta tabla guarda los event_id ya procesados. El helper
--            supabase/functions/_shared/idempotency.ts hace INSERT ON CONFLICT
--            DO NOTHING y devuelve si fue first-seen. Si no lo es, el webhook
--            responde 200 con {status:"duplicate"} sin tocar nada más.
--
--            Retención: se mantienen 90 días via cron. Pasado ese lapso,
--            los proveedores ya no reintentan, así que el riesgo de replay
--            se reduce al window de 90 días.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_idempotency_keys (
    provider text NOT NULL CHECK (provider IN ('stripe', 'payu', 'mercadopago')),
    event_id text NOT NULL,
    received_at timestamp with time zone NOT NULL DEFAULT now(),
    response_status integer,
    payload_hash text,
    PRIMARY KEY (provider, event_id)
);

COMMENT ON TABLE public.webhook_idempotency_keys IS
    'Event IDs ya procesados por webhooks de pago. Protege contra replay attacks y retries duplicados de los proveedores.';
COMMENT ON COLUMN public.webhook_idempotency_keys.payload_hash IS
    'SHA-256 del payload original (opcional) — permite detectar si un mismo event_id llega con distintos contenidos.';

CREATE INDEX IF NOT EXISTS idx_webhook_idemp_received_at
    ON public.webhook_idempotency_keys (received_at DESC);

-- RLS: solo service_role. Las Edge Functions (que corren con service_role
-- via createClient con SUPABASE_SERVICE_ROLE_KEY) son las únicas que tocan
-- esta tabla.
ALTER TABLE public.webhook_idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_idemp_service_role_all ON public.webhook_idempotency_keys;
CREATE POLICY webhook_idemp_service_role_all
    ON public.webhook_idempotency_keys
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON public.webhook_idempotency_keys FROM anon;
REVOKE ALL ON public.webhook_idempotency_keys FROM authenticated;

-- ----------------------------------------------------------------------------
-- Limpieza automática: eventos de más de 90 días son eliminados.
-- Se programa con pg_cron en un statement separado para que sea idempotente
-- si el cron ya existía.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_webhook_idempotency_keys()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted int;
BEGIN
    DELETE FROM public.webhook_idempotency_keys
    WHERE received_at < now() - interval '90 days';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    INSERT INTO public.cron_execution_logs (job_name, status, message, details)
    VALUES (
        'cleanup_webhook_idempotency_keys',
        'success',
        format('%s filas eliminadas', v_deleted),
        jsonb_build_object('deleted_count', v_deleted)
    );
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.cron_execution_logs (job_name, status, message)
    VALUES ('cleanup_webhook_idempotency_keys', 'failed', SQLERRM);
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.cleanup_webhook_idempotency_keys() IS
    'Elimina idempotency keys de más de 90 días. Registra ejecución en cron_execution_logs.';

-- Programación vía pg_cron (idempotente). Ejecuta 1x al día a las 3:30 AM UTC.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('cleanup-webhook-idempotency-keys')
        WHERE EXISTS (
            SELECT 1 FROM cron.job WHERE jobname = 'cleanup-webhook-idempotency-keys'
        );

        PERFORM cron.schedule(
            'cleanup-webhook-idempotency-keys',
            '30 3 * * *',
            $cron$SELECT public.cleanup_webhook_idempotency_keys();$cron$
        );
    END IF;
END
$$;
