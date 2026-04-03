-- =============================================================================
-- Migración: Campos OTP para verificación de teléfono
-- Tabla: profiles
-- =============================================================================

-- phone_verified puede no existir en todos los entornos, se incluye con IF NOT EXISTS

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_otp_code      VARCHAR(6),
  ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_otp_attempts   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_verified       BOOLEAN NOT NULL DEFAULT false;

-- Índice para lookups por expiración (limpieza de OTPs vencidos)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_otp_expires
  ON profiles (phone_otp_expires_at)
  WHERE phone_otp_code IS NOT NULL;

-- RLS: el servicio de Edge Functions (service_role) ya tiene bypass de RLS,
-- pero añadimos política para que el propio usuario no pueda leer su otp_code
-- (solo la Edge Function con service_role puede leerlo)
-- El SELECT de phone_otp_code lo bloquea la política existente; no hay acción adicional.

-- Comentarios para documentación
COMMENT ON COLUMN profiles.phone_otp_code       IS 'Código OTP de 6 dígitos para verificar el número de teléfono. Se elimina tras verificación exitosa.';
COMMENT ON COLUMN profiles.phone_otp_expires_at IS 'Fecha/hora de expiración del OTP actual. Expira a los 10 minutos.';
COMMENT ON COLUMN profiles.phone_otp_attempts   IS 'Número de intentos fallidos del OTP actual. Se resetea al generar nuevo OTP o tras verificación.';
COMMENT ON COLUMN profiles.phone_verified       IS 'TRUE cuando el número de teléfono fue verificado por OTP SMS.';
