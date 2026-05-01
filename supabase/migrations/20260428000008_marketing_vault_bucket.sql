-- =====================================================
-- MIGRACIÓN: Bucket de Marketing Vault
-- Fecha: 2026-04-28
-- Descripción:
--   Crea el bucket privado business-marketing-vault para
--   almacenar assets de marketing de cada negocio.
--   Solo admins/empleados del negocio pueden leer/escribir
--   en su carpeta ({business_id}/...).
--   El módulo de gestión completo se implementará en otra sesión.
-- =====================================================

-- 1. Crear bucket (privado, 50MB máx por archivo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-marketing-vault',
  'business-marketing-vault',
  false,
  52428800,  -- 50 MB
  NULL       -- todos los tipos MIME permitidos
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política de lectura para empleados y owners del negocio
--    La carpeta raíz de cada negocio es su business_id
CREATE POLICY "marketing_vault_business_read"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'business-marketing-vault'
    AND (
      -- Empleado activo del negocio
      EXISTS (
        SELECT 1 FROM public.business_employees be
        WHERE be.employee_id = auth.uid()
          AND be.is_active = true
          AND (storage.foldername(name))[1] = be.business_id::text
      )
      OR
      -- Owner del negocio
      EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.owner_id = auth.uid()
          AND (storage.foldername(name))[1] = b.id::text
      )
    )
  );

-- 3. Política de escritura (INSERT) para owners y admins
CREATE POLICY "marketing_vault_business_write"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'business-marketing-vault'
    AND (
      EXISTS (
        SELECT 1 FROM public.business_roles br
        WHERE br.user_id = auth.uid()
          AND br.role = 'admin'
          AND (storage.foldername(name))[1] = br.business_id::text
      )
      OR
      EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.owner_id = auth.uid()
          AND (storage.foldername(name))[1] = b.id::text
      )
    )
  );

-- 4. Política de eliminación para owners y admins
CREATE POLICY "marketing_vault_business_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'business-marketing-vault'
    AND (
      EXISTS (
        SELECT 1 FROM public.business_roles br
        WHERE br.user_id = auth.uid()
          AND br.role = 'admin'
          AND (storage.foldername(name))[1] = br.business_id::text
      )
      OR
      EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.owner_id = auth.uid()
          AND (storage.foldername(name))[1] = b.id::text
      )
    )
  );
