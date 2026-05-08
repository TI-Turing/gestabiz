-- Migration: 20260707000002_dian_electronic_invoicing.sql
-- Schema para integración de Facturación Electrónica DIAN vía Matias API.
-- Multi-tenant: cada negocio se habilita individualmente ante DIAN.
-- Solo disponible para planes Pro y Empresarial.

-- ============================================================
-- 1. ENUMs
-- ============================================================

CREATE TYPE public.dian_environment AS ENUM ('sandbox', 'production');

CREATE TYPE public.electronic_invoice_status AS ENUM (
    'pending',          -- Enviada a Matias, esperando CUFE de DIAN
    'accepted',         -- DIAN aceptó, CUFE asignado
    'rejected',         -- DIAN rechazó (error en datos o técnico)
    'failed_permanent', -- Máx reintentos agotados, requiere intervención manual
    'cancelled'         -- Anulada mediante nota crédito
);

CREATE TYPE public.electronic_invoice_document_type AS ENUM (
    'invoice',      -- Factura electrónica de venta (FV)
    'pos',          -- Documento equivalente POS electrónico (DS)
    'credit_note'   -- Nota crédito (NC)
);

-- ============================================================
-- 2. business_dian_software — Configuración Matias/DIAN del negocio
-- ============================================================

CREATE TABLE public.business_dian_software (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    environment public.dian_environment DEFAULT 'sandbox' NOT NULL,
    -- Token de autenticación Matias API (PAT — Personal Access Token)
    -- SEGURIDAD: almacenado encriptado con pgsodium/Vault. Nunca exponer en frontend.
    matias_pat_token_encrypted text,
    -- Certificado digital .p12 (path en Storage bucket privado, encriptado AES-256)
    certificate_storage_path text,
    certificate_password_encrypted text,
    -- Fecha de expiración del certificado (extraída al validar el .p12)
    certificate_expires_at timestamp with time zone,
    -- Software ID propio en DIAN (solo Ruta 1 — empresarial avanzado; NULL = usa Software ID de Matias)
    own_software_id text,
    own_software_pin_encrypted text,
    -- Estado de habilitación
    is_enrolled boolean DEFAULT false NOT NULL,
    enrolled_at timestamp with time zone,
    -- Datos adicionales del negocio para DIAN (complementan businesses.*)
    dv smallint,                              -- Dígito de verificación del NIT
    type_organization_id smallint,            -- 1=Jurídica, 2=Natural
    tax_responsibilities jsonb DEFAULT '[]'::jsonb, -- Array códigos DIAN: ["O-13","O-15","R-99-PN"]
    ciiu_code character varying(10),          -- Actividad económica CIIU
    municipality_dian_code character varying(10), -- Código DANE del municipio
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT business_dian_software_pkey PRIMARY KEY (id),
    CONSTRAINT business_dian_software_business_id_key UNIQUE (business_id)
    -- Un solo registro de software por negocio (uno activo a la vez)
);

ALTER TABLE ONLY public.business_dian_software
    ADD CONSTRAINT business_dian_software_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

CREATE INDEX idx_business_dian_software_business_id
    ON public.business_dian_software USING btree (business_id);

-- ============================================================
-- 3. business_dian_resolution — Resoluciones de numeración DIAN
-- ============================================================
-- Un negocio puede tener múltiples resoluciones a lo largo del tiempo.
-- Solo una puede estar activa (is_active = true).

CREATE TABLE public.business_dian_resolution (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    -- Datos del Formulario 1876 emitido por DIAN
    resolution_number text NOT NULL,          -- Número de resolución DIAN
    prefix character varying(10),             -- Prefijo autorizado (ej. "FE", puede ser vacío)
    from_number integer NOT NULL,             -- Rango desde
    to_number integer NOT NULL,               -- Rango hasta
    current_number integer NOT NULL,          -- Número actual (incrementa en cada emisión)
    -- technical_key: clave técnica DIAN para firmar facturas
    -- SEGURIDAD: encriptado en reposo
    technical_key_encrypted text NOT NULL,
    valid_from date NOT NULL,                 -- Inicio vigencia (del Form 1876)
    valid_to date NOT NULL,                   -- Fin vigencia (máx 2 años desde DIAN)
    is_active boolean DEFAULT true NOT NULL,  -- Solo una resolución activa por negocio
    -- Para documento POS (resolución separada si aplica)
    document_type public.electronic_invoice_document_type DEFAULT 'invoice' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT business_dian_resolution_pkey PRIMARY KEY (id),
    CONSTRAINT business_dian_resolution_range_check CHECK (from_number <= to_number),
    CONSTRAINT business_dian_resolution_current_check CHECK (
        current_number >= from_number AND current_number <= to_number + 1
    )
);

ALTER TABLE ONLY public.business_dian_resolution
    ADD CONSTRAINT business_dian_resolution_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Solo una resolución activa por negocio y tipo de documento
CREATE UNIQUE INDEX idx_business_dian_resolution_active
    ON public.business_dian_resolution (business_id, document_type)
    WHERE is_active = true;

CREATE INDEX idx_business_dian_resolution_business_id
    ON public.business_dian_resolution USING btree (business_id);

-- ============================================================
-- 4. electronic_invoices — Registro maestro de documentos DIAN
-- ============================================================

CREATE TABLE public.electronic_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    -- Solo uno de estos puede estar presente (cita O transacción)
    appointment_id uuid,
    transaction_id uuid,
    -- Cliente (puede ser NULL si se facturó a Consumidor Final)
    client_id uuid,
    document_type public.electronic_invoice_document_type NOT NULL,
    -- Numeración del documento
    prefix character varying(10),
    document_number integer NOT NULL,
    full_document_number text,               -- Prefijo + número formateado para display
    -- Identificación DIAN
    cufe text,                               -- UUID DIAN para facturas (Código Único de Factura Electrónica)
    cude text,                               -- UUID DIAN para POS
    -- Estado y ciclo de vida
    status public.electronic_invoice_status DEFAULT 'pending' NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamp with time zone,
    error_message text,
    -- Respuesta completa de Matias/DIAN (para auditoría)
    matias_response jsonb,
    dian_response jsonb,
    -- Archivos firmados (paths en bucket 'electronic-invoices' privado)
    xml_storage_path text,
    pdf_storage_path text,
    -- Para notas crédito: referencia a la factura que anula
    parent_invoice_id uuid,
    credit_note_reason text,                 -- '01-Devolución parcial', '02-Anulación', etc.
    -- Monto total de la factura (COP)
    total_amount numeric(15, 2) NOT NULL,
    -- Datos del adquiriente (snapshot al momento de emisión, para auditoría)
    buyer_snapshot jsonb,
    -- Timestamps
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT electronic_invoices_pkey PRIMARY KEY (id)
);

-- Idempotencia: una cita o transacción solo puede generar UNA factura (o una NC de anulación total)
CREATE UNIQUE INDEX idx_electronic_invoices_appointment_idempotency
    ON public.electronic_invoices (business_id, appointment_id)
    WHERE appointment_id IS NOT NULL AND document_type = 'invoice';

CREATE UNIQUE INDEX idx_electronic_invoices_transaction_idempotency
    ON public.electronic_invoices (business_id, transaction_id)
    WHERE transaction_id IS NOT NULL AND document_type = 'invoice';

-- Una NC de anulación total por factura original
CREATE UNIQUE INDEX idx_electronic_invoices_credit_note_full_cancellation
    ON public.electronic_invoices (parent_invoice_id)
    WHERE document_type = 'credit_note' AND credit_note_reason LIKE '02%';

-- Índices de consulta
CREATE INDEX idx_electronic_invoices_business_id
    ON public.electronic_invoices USING btree (business_id);

CREATE INDEX idx_electronic_invoices_client_id
    ON public.electronic_invoices USING btree (client_id)
    WHERE client_id IS NOT NULL;

CREATE INDEX idx_electronic_invoices_status
    ON public.electronic_invoices USING btree (business_id, status);

CREATE INDEX idx_electronic_invoices_retry
    ON public.electronic_invoices USING btree (next_retry_at)
    WHERE status IN ('pending', 'rejected') AND next_retry_at IS NOT NULL;

-- FKs
ALTER TABLE ONLY public.electronic_invoices
    ADD CONSTRAINT electronic_invoices_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.electronic_invoices
    ADD CONSTRAINT electronic_invoices_appointment_id_fkey
    FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.electronic_invoices
    ADD CONSTRAINT electronic_invoices_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.electronic_invoices
    ADD CONSTRAINT electronic_invoices_parent_invoice_id_fkey
    FOREIGN KEY (parent_invoice_id) REFERENCES public.electronic_invoices(id) ON DELETE SET NULL;

-- ============================================================
-- 5. RLS
-- ============================================================

ALTER TABLE public.business_dian_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_dian_resolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_invoices ENABLE ROW LEVEL SECURITY;

-- Solo admins/owners del negocio pueden ver y gestionar config DIAN
CREATE POLICY "Business admins can manage DIAN software config"
    ON public.business_dian_software
    FOR ALL
    USING (
        business_id IN (
            SELECT br.business_id FROM public.business_roles br
            WHERE br.user_id = auth.uid() AND br.role IN ('admin', 'owner')
        )
        OR
        business_id IN (
            SELECT b.id FROM public.businesses b WHERE b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to dian software"
    ON public.business_dian_software FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Resoluciones: admins pueden ver y gestionar
CREATE POLICY "Business admins can manage DIAN resolutions"
    ON public.business_dian_resolution
    FOR ALL
    USING (
        business_id IN (
            SELECT br.business_id FROM public.business_roles br
            WHERE br.user_id = auth.uid() AND br.role IN ('admin', 'owner')
        )
        OR
        business_id IN (
            SELECT b.id FROM public.businesses b WHERE b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to dian resolutions"
    ON public.business_dian_resolution FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Facturas: admins del negocio pueden ver/gestionar; cliente solo ve las suyas
CREATE POLICY "Business admins can manage electronic invoices"
    ON public.electronic_invoices
    FOR ALL
    USING (
        business_id IN (
            SELECT br.business_id FROM public.business_roles br
            WHERE br.user_id = auth.uid() AND br.role IN ('admin', 'owner')
        )
        OR
        business_id IN (
            SELECT b.id FROM public.businesses b WHERE b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Clients can view their own invoices"
    ON public.electronic_invoices
    FOR SELECT
    USING (client_id = auth.uid());

CREATE POLICY "Employees with billing.view_invoices can see invoices"
    ON public.electronic_invoices
    FOR SELECT
    USING (
        business_id IN (
            SELECT up.business_id FROM public.user_permissions up
            WHERE up.user_id = auth.uid()
              AND up.permission = 'billing.view_invoices'
              AND up.is_active = true
        )
    );

CREATE POLICY "Service role full access to electronic invoices"
    ON public.electronic_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 6. Función para incrementar current_number con lock (evita race conditions)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_next_invoice_number(p_resolution_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current integer;
    v_to integer;
BEGIN
    -- Lock pesimista sobre la fila de resolución
    SELECT current_number, to_number
    INTO v_current, v_to
    FROM public.business_dian_resolution
    WHERE id = p_resolution_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Resolución DIAN no encontrada o no activa: %', p_resolution_id;
    END IF;

    IF v_current > v_to THEN
        RAISE EXCEPTION 'Rango de numeración DIAN agotado para resolución %', p_resolution_id;
    END IF;

    -- Incrementar
    UPDATE public.business_dian_resolution
    SET current_number = current_number + 1,
        updated_at = NOW()
    WHERE id = p_resolution_id;

    RETURN v_current;
END;
$$;

COMMENT ON FUNCTION public.get_next_invoice_number(uuid) IS
    'Obtiene y reserva el siguiente número de factura disponible en una resolución DIAN. '
    'Usa lock pesimista (FOR UPDATE) para evitar duplicados bajo concurrencia.';

-- ============================================================
-- 7. Storage bucket para XML/PDF firmados (5 años retención)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'electronic-invoices',
    'electronic-invoices',
    false,  -- PRIVADO — acceso solo via Edge Function con verificación de permisos
    10485760, -- 10 MB máx por archivo
    ARRAY['application/xml', 'application/pdf', 'text/xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS del bucket: solo service_role puede subir/leer directamente
-- El frontend usa signed URLs generadas por Edge Functions
CREATE POLICY "Service role manages electronic invoice files"
    ON storage.objects FOR ALL TO service_role
    USING (bucket_id = 'electronic-invoices')
    WITH CHECK (bucket_id = 'electronic-invoices');

-- ============================================================
-- 8. Comentarios
-- ============================================================

COMMENT ON TABLE public.business_dian_software IS
    'Configuración de habilitación DIAN y Matias API por negocio. '
    'Campos *_encrypted almacenan valores AES-256 encriptados con pgsodium/Vault. '
    'NUNCA exponer tokens o certificados en el frontend.';

COMMENT ON TABLE public.business_dian_resolution IS
    'Resoluciones de numeración emitidas por DIAN (Formulario 1876). '
    'Solo una resolución activa (is_active=true) por negocio+tipo. '
    'current_number incrementa con get_next_invoice_number() usando lock pesimista.';

COMMENT ON TABLE public.electronic_invoices IS
    'Registro maestro de documentos electrónicos DIAN emitidos (FV, POS, NC). '
    'DIAN exige conservación mínima 5 años: nunca borrar físicamente. '
    'buyer_snapshot persiste datos del comprador al momento de emisión para auditoría.';
