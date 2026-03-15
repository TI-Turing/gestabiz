/**
 * Error types centralizados para la capa de servicios
 *
 * Uso:
 * ```ts
 * import { ServiceError, isServiceError, toServiceError } from '@/lib/errors'
 *
 * // Lanzar desde un servicio
 * if (error) throw new ServiceError('FETCH_FAILED', 'No se pudieron cargar las citas', error)
 *
 * // Capturar en un hook
 * } catch (err) {
 *   const svcError = toServiceError(err)
 *   toast.error(svcError.message)
 * }
 * ```
 */

import type { PostgrestError } from '@supabase/supabase-js'

// ── Códigos de error conocidos de Supabase/PostgreSQL ───────────────────────
export const SUPABASE_ERROR_CODES = {
  NOT_FOUND: 'PGRST116',       // .single() sin resultados
  DUPLICATE: '23505',           // UNIQUE constraint violation
  FK_VIOLATION: '23503',        // Foreign key constraint violation
  NOT_NULL: '23502',            // NOT NULL constraint violation
  UNAUTHORIZED: 'PGRST301',     // JWT expired / unauthorized
  FORBIDDEN: '42501',           // Insufficient privilege (RLS)
} as const

export type SupabaseErrorCode = (typeof SUPABASE_ERROR_CODES)[keyof typeof SUPABASE_ERROR_CODES]

// ── ServiceError ─────────────────────────────────────────────────────────────

export class ServiceError extends Error {
  public readonly code: string
  public readonly pgError?: PostgrestError

  constructor(code: string, message: string, pgError?: PostgrestError | unknown) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    if (pgError && typeof pgError === 'object' && 'code' in pgError) {
      this.pgError = pgError as PostgrestError
    }
  }

  /** True si el error original es un "not found" de Supabase (.single() sin resultados) */
  get isNotFound(): boolean {
    return this.pgError?.code === SUPABASE_ERROR_CODES.NOT_FOUND
  }

  /** True si se violó una restricción UNIQUE (duplicado) */
  get isDuplicate(): boolean {
    return this.pgError?.code === SUPABASE_ERROR_CODES.DUPLICATE
  }

  /** True si el usuario no tiene permisos (RLS o JWT) */
  get isUnauthorized(): boolean {
    return (
      this.pgError?.code === SUPABASE_ERROR_CODES.UNAUTHORIZED ||
      this.pgError?.code === SUPABASE_ERROR_CODES.FORBIDDEN
    )
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Verifica si un error es una instancia de ServiceError */
export function isServiceError(err: unknown): err is ServiceError {
  return err instanceof ServiceError
}

/**
 * Convierte cualquier error a ServiceError con mensaje legible.
 * Úsalo en los catch de los hooks para garantizar tipado uniforme.
 */
export function toServiceError(err: unknown, fallbackMessage = 'Error desconocido'): ServiceError {
  if (err instanceof ServiceError) return err

  if (err instanceof Error) {
    return new ServiceError('UNKNOWN', err.message)
  }

  // PostgrestError de Supabase (llega sin instanciar como Error)
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const pgErr = err as PostgrestError
    return new ServiceError(pgErr.code ?? 'PG_ERROR', pgErr.message, pgErr)
  }

  return new ServiceError('UNKNOWN', fallbackMessage)
}

/**
 * Lanza ServiceError si el resultado de Supabase contiene un error.
 * Uso directo en servicios para reducir boilerplate:
 *
 * ```ts
 * const { data, error } = await supabase.from('businesses').select(...)
 * throwIfError(error, 'FETCH_BUSINESSES', 'No se pudieron cargar los negocios')
 * return data
 * ```
 */
export function throwIfError(
  error: PostgrestError | null,
  code: string,
  message: string,
): void {
  if (error) throw new ServiceError(code, message, error)
}
