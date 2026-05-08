-- Migration: 20260707000001_fiscal_profile_fields.sql
-- Agrega campos de identificación de documento a profiles.
-- Obligatorio para facturación electrónica DIAN (tipo + número de documento).
-- phone ya existe pero se documenta como obligatorio a nivel de app.
-- Usuarios existentes: NULL transitorio; app muestra modal bloqueante para completar.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS document_type_id uuid,
    ADD COLUMN IF NOT EXISTS document_number character varying(30);

-- FK al catálogo de tipos de documento
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_document_type_id_fkey
    FOREIGN KEY (document_type_id) REFERENCES public.document_types(id)
    ON DELETE SET NULL;

-- Índice único parcial: evita duplicados de documento por tipo (solo cuando ambos están presentes)
CREATE UNIQUE INDEX idx_profiles_document_type_number
    ON public.profiles (document_type_id, document_number)
    WHERE document_type_id IS NOT NULL AND document_number IS NOT NULL;

-- Índice para búsqueda por número de documento
CREATE INDEX idx_profiles_document_number
    ON public.profiles USING btree (document_number)
    WHERE document_number IS NOT NULL;

COMMENT ON COLUMN public.profiles.document_type_id IS
    'FK a document_types. Tipo de documento de identidad: CC, NIT, CE, PA, TI, etc. '
    'Obligatorio para emitir facturas electrónicas DIAN. Nullable para usuarios existentes (migración gradual).';

COMMENT ON COLUMN public.profiles.document_number IS
    'Número de documento de identidad. Máx 30 chars para cubrir todos los tipos colombianos. '
    'Obligatorio para emitir facturas electrónicas DIAN. Nullable para usuarios existentes (migración gradual).';
