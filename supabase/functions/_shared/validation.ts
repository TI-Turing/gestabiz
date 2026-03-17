/**
 * _shared/validation.ts
 * Validaciones de entrada compartidas entre Edge Functions
 */

/** Regex E.164: +<código_país><número> con 7-15 dígitos totales */
const E164_REGEX = /^\+[1-9]\d{6,14}$/

/**
 * Valida y normaliza un número de teléfono al formato E.164.
 * Limpia espacios, guiones, paréntesis y puntos antes de validar.
 * @returns El número limpio si es válido, o null si no lo es.
 */
export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-().]/g, '')
  if (!E164_REGEX.test(cleaned) || cleaned.length > 16) return null
  return cleaned
}

/** Regex de email RFC5322 (simplificado pero robusto) */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Valida que un string sea un email válido (RFC5322, máx 254 caracteres).
 */
export function validateEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.length <= 254 && EMAIL_REGEX.test(email)
}
