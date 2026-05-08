-- Migration: 20260707000000_habeas_data_consents.sql
-- Ley 1581/2012 (Habeas Data Colombia): tabla de consentimientos de tratamiento de datos.
-- Registra autorización previa, expresa e informada del titular antes de recoger sus datos.

-- ============================================================
-- 1. Tabla de consentimientos
-- ============================================================

CREATE TABLE public.data_processing_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    purpose text NOT NULL,
    -- 'account': registro general / 'electronic_invoicing': datos fiscales para FE / 'marketing': comunicaciones
    policy_version text NOT NULL DEFAULT '1.0',
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address inet,
    user_agent text,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT data_processing_consents_pkey PRIMARY KEY (id),
    CONSTRAINT data_processing_consents_purpose_check CHECK (
        purpose IN ('account', 'electronic_invoicing', 'marketing')
    )
);

-- Un usuario no puede tener el mismo consentimiento activo dos veces para la misma versión de política
CREATE UNIQUE INDEX data_processing_consents_user_purpose_version_active_idx
    ON public.data_processing_consents (user_id, purpose, policy_version)
    WHERE revoked_at IS NULL;

-- FK a profiles
ALTER TABLE ONLY public.data_processing_consents
    ADD CONSTRAINT data_processing_consents_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Índice para consultas por usuario
CREATE INDEX idx_data_processing_consents_user_id
    ON public.data_processing_consents USING btree (user_id);

-- ============================================================
-- 2. RLS
-- ============================================================

ALTER TABLE public.data_processing_consents ENABLE ROW LEVEL SECURITY;

-- El usuario solo ve y gestiona sus propios consentimientos
CREATE POLICY "Users can manage their own consents"
    ON public.data_processing_consents
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Service role tiene acceso total (edge functions ARCO, auditoría)
CREATE POLICY "Service role has full access to consents"
    ON public.data_processing_consents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 3. Comentarios
-- ============================================================

COMMENT ON TABLE public.data_processing_consents IS
    'Registro de autorizaciones de tratamiento de datos personales (Ley 1581/2012 - Habeas Data Colombia). '
    'Cada fila representa un consentimiento otorgado por un usuario para un propósito específico. '
    'revoked_at != NULL indica que el consentimiento fue revocado (derecho de cancelación/oposición).';

COMMENT ON COLUMN public.data_processing_consents.purpose IS
    'Finalidad del tratamiento: account (registro), electronic_invoicing (facturación DIAN), marketing.';

COMMENT ON COLUMN public.data_processing_consents.policy_version IS
    'Versión de la Política de Tratamiento de Datos aceptada. Al cambiar la política, version se incrementa y los usuarios deben re-aceptar.';

COMMENT ON COLUMN public.data_processing_consents.ip_address IS
    'IP desde donde se otorgó el consentimiento. Evidencia para cumplimiento.';

COMMENT ON COLUMN public.data_processing_consents.revoked_at IS
    'Timestamp de revocación. NULL = consentimiento activo. Ejercicio del derecho de cancelación/oposición (ARCO).';
