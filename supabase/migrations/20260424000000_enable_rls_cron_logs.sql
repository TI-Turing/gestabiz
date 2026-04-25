-- ============================================================================
-- Migration: Enable RLS on cron_execution_logs
-- Author:    Claude Code (Stabilization sprint — Abril 2026)
-- Ref:       Obsidian/Gestabiz/Contexto/auditoria-completa-abril-2026.md §1.1
-- Purpose:   Cerrar gap de seguridad — la tabla cron_execution_logs era la
--            única de 73 en producción sin RLS, lo que permitía a cualquier
--            rol autenticado leer información interna de cron jobs vía
--            PostgREST.
--
--            Solo el service_role debe poder leer/escribir esta tabla.
--            El pg_cron job que la alimenta corre con el rol postgres
--            internamente (BYPASSRLS), así que tampoco necesita policies.
-- ============================================================================

ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY;

-- Service-role full access (implícito cuando la tabla tiene RLS + ninguna policy
-- para roles autenticados, pero declaramos explícito para claridad).
DROP POLICY IF EXISTS cron_logs_service_role_all ON public.cron_execution_logs;
CREATE POLICY cron_logs_service_role_all
    ON public.cron_execution_logs
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Explicit deny para los roles estándar — PostgREST ve la tabla pero sin policy
-- para authenticated/anon, ninguna fila será visible. Documentamos el intento.
REVOKE ALL ON public.cron_execution_logs FROM anon;
REVOKE ALL ON public.cron_execution_logs FROM authenticated;

COMMENT ON POLICY cron_logs_service_role_all ON public.cron_execution_logs IS
    'Solo service_role puede leer/escribir logs de cron. Los cron jobs usan rol postgres (BYPASSRLS) internamente.';
