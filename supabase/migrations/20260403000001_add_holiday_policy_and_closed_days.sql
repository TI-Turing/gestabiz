-- ============================================================
-- MIGRACIÓN: Sistema de Festivos y Días Cerrados
-- Fecha: 2026-04-03
-- Descripción:
--   1. work_on_holidays en businesses (política global del negocio)
--   2. work_on_holidays en locations (override por sede; NULL = heredar del negocio)
--   3. Tabla business_closed_days: días específicos cerrados por negocio/sede
-- ============================================================

-- 1. Campo work_on_holidays en businesses (default FALSE = festivos son días cerrados)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS work_on_holidays BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Campo work_on_holidays en locations (NULL = hereda del negocio)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS work_on_holidays BOOLEAN DEFAULT NULL;

-- 3. Tabla de días cerrados específicos
CREATE TABLE IF NOT EXISTS business_closed_days (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
  -- NULL en location_id = aplica a TODAS las sedes del negocio
  closed_date     DATE NOT NULL,
  reason          TEXT,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_business_closed_day UNIQUE (business_id, location_id, closed_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_closed_days_business_id
  ON business_closed_days (business_id);

CREATE INDEX IF NOT EXISTS idx_business_closed_days_location_id
  ON business_closed_days (location_id);

CREATE INDEX IF NOT EXISTS idx_business_closed_days_date
  ON business_closed_days (closed_date);

CREATE INDEX IF NOT EXISTS idx_business_closed_days_business_date
  ON business_closed_days (business_id, closed_date);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_business_closed_days_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_closed_days_updated_at ON business_closed_days;
CREATE TRIGGER trg_business_closed_days_updated_at
  BEFORE UPDATE ON business_closed_days
  FOR EACH ROW EXECUTE FUNCTION update_business_closed_days_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE business_closed_days ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquier persona puede ver los días cerrados (necesario para el wizard de reservas)
CREATE POLICY "public_read_closed_days"
  ON business_closed_days FOR SELECT
  USING (true);

-- Escritura: solo owners y admins del negocio
CREATE POLICY "admin_manage_closed_days"
  ON business_closed_days FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Comentarios descriptivos
-- ============================================================

COMMENT ON COLUMN businesses.work_on_holidays IS
  'Si TRUE, el negocio atiende en festivos públicos. Las sedes pueden sobreescribir este valor.';

COMMENT ON COLUMN locations.work_on_holidays IS
  'Override por sede. NULL = hereda business.work_on_holidays. TRUE = abre en festivos. FALSE = cierra.';

COMMENT ON TABLE business_closed_days IS
  'Días específicos en que el negocio o una sede en particular no atiende (fuera de festivos regulares).';

COMMENT ON COLUMN business_closed_days.location_id IS
  'Si es NULL, el cierre aplica a TODAS las sedes. Si tiene valor, aplica solo a esa sede.';
