-- Galería de imágenes para recursos físicos (máximo 6 por recurso)
CREATE TABLE IF NOT EXISTS public.resource_images (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id    uuid        NOT NULL REFERENCES public.business_resources(id) ON DELETE CASCADE,
  image_url      text        NOT NULL,
  display_order  int         NOT NULL DEFAULT 0,
  alt_text       text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resource_images_display_order_check CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_resource_images_resource_order
  ON public.resource_images(resource_id, display_order);

ALTER TABLE public.resource_images ENABLE ROW LEVEL SECURITY;

-- Lectura pública (perfil público del negocio)
CREATE POLICY "resource_images_public_read" ON public.resource_images
  FOR SELECT USING (true);

-- Escritura solo para owner/admin del negocio
CREATE POLICY "resource_images_admin_write" ON public.resource_images
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM   public.business_resources br
      JOIN   public.businesses b ON b.id = br.business_id
      WHERE  br.id = resource_images.resource_id
        AND (
          b.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.business_roles
            WHERE  business_id = b.id
              AND  user_id     = auth.uid()
              AND  role        = 'admin'
          )
        )
    )
  );

-- Trigger: máximo 6 imágenes por recurso
CREATE OR REPLACE FUNCTION public.enforce_max_resource_images()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT count(*)
    FROM   public.resource_images
    WHERE  resource_id = NEW.resource_id
  ) >= 6 THEN
    RAISE EXCEPTION 'Máximo 6 imágenes por recurso';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_resource_images ON public.resource_images;
CREATE TRIGGER trg_enforce_max_resource_images
  BEFORE INSERT ON public.resource_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_resource_images();

-- Video corto para recursos
ALTER TABLE public.business_resources
  ADD COLUMN IF NOT EXISTS video_url              text,
  ADD COLUMN IF NOT EXISTS video_duration_seconds int
    CHECK (video_duration_seconds IS NULL OR video_duration_seconds <= 15);

COMMENT ON COLUMN public.business_resources.video_url IS
  'URL del video promocional del recurso (máximo 15 segundos).';
COMMENT ON COLUMN public.business_resources.video_duration_seconds IS
  'Duración del video en segundos. Máximo 15.';
