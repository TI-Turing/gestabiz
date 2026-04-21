import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@sentry/react', () => ({
  withScope: vi.fn((cb: (scope: { setTag: ReturnType<typeof vi.fn>; setContext: ReturnType<typeof vi.fn> }) => void) => {
    cb({ setTag: vi.fn(), setContext: vi.fn() })
  }),
  captureException: vi.fn(),
}))

import {
  ServiceError,
  isServiceError,
  toServiceError,
  throwIfError,
  SUPABASE_ERROR_CODES,
} from '@/lib/errors'
import * as Sentry from '@sentry/react'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ServiceError', () => {
  it('crea con code y message', () => {
    const err = new ServiceError('FETCH_FAIL', 'No se pudo')
    expect(err.code).toBe('FETCH_FAIL')
    expect(err.message).toBe('No se pudo')
    expect(err.name).toBe('ServiceError')
    expect(err.pgError).toBeUndefined()
  })

  it('preserva pgError cuando se proporciona', () => {
    const pg = { code: SUPABASE_ERROR_CODES.NOT_FOUND, message: 'not found', details: '', hint: '' }
    const err = new ServiceError('NOT_FOUND', 'Recurso no existe', pg)
    expect(err.pgError).toEqual(pg)
  })

  it('isNotFound true cuando pgError es PGRST116', () => {
    const err = new ServiceError('X', 'Y', { code: SUPABASE_ERROR_CODES.NOT_FOUND, message: '' })
    expect(err.isNotFound).toBe(true)
    expect(err.isDuplicate).toBe(false)
    expect(err.isUnauthorized).toBe(false)
  })

  it('isDuplicate true cuando pgError es 23505', () => {
    const err = new ServiceError('X', 'Y', { code: SUPABASE_ERROR_CODES.DUPLICATE, message: '' })
    expect(err.isDuplicate).toBe(true)
  })

  it('isUnauthorized true para 42501 y PGRST301', () => {
    const a = new ServiceError('X', 'Y', { code: SUPABASE_ERROR_CODES.FORBIDDEN, message: '' })
    const b = new ServiceError('X', 'Y', { code: SUPABASE_ERROR_CODES.UNAUTHORIZED, message: '' })
    expect(a.isUnauthorized).toBe(true)
    expect(b.isUnauthorized).toBe(true)
  })
})

describe('isServiceError', () => {
  it('true para instancia de ServiceError', () => {
    expect(isServiceError(new ServiceError('X', 'Y'))).toBe(true)
  })

  it('false para Error genérico', () => {
    expect(isServiceError(new Error('plain'))).toBe(false)
  })

  it('false para null/undefined/objetos', () => {
    expect(isServiceError(null)).toBe(false)
    expect(isServiceError(undefined)).toBe(false)
    expect(isServiceError({ code: 'X' })).toBe(false)
  })
})

describe('toServiceError', () => {
  it('retorna mismo si ya es ServiceError', () => {
    const original = new ServiceError('X', 'Y')
    expect(toServiceError(original)).toBe(original)
  })

  it('convierte Error genérico con code UNKNOWN', () => {
    const result = toServiceError(new Error('boom'))
    expect(result).toBeInstanceOf(ServiceError)
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toBe('boom')
  })

  it('detecta PostgrestError', () => {
    const pg = { code: '23505', message: 'duplicate key', details: '', hint: '' }
    const result = toServiceError(pg)
    expect(result.code).toBe('23505')
    expect(result.message).toBe('duplicate key')
    expect(result.pgError).toEqual(pg)
  })

  it('usa fallbackMessage para tipos desconocidos', () => {
    const result = toServiceError('not an error', 'custom fallback')
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toBe('custom fallback')
  })

  it('usa fallback default cuando no se proporciona', () => {
    const result = toServiceError(123)
    expect(result.message).toBe('Error desconocido')
  })

  it('PostgrestError sin code usa PG_ERROR', () => {
    const pg = { code: null, message: 'sin code' }
    const result = toServiceError(pg)
    expect(result.code).toBe('PG_ERROR')
  })
})

describe('throwIfError', () => {
  it('no lanza ni captura cuando error es null', () => {
    expect(() => throwIfError(null, 'X', 'Y')).not.toThrow()
    expect(Sentry.withScope).not.toHaveBeenCalled()
  })

  it('lanza ServiceError cuando hay error', () => {
    const pg = { code: '23505', message: 'duplicate', details: '', hint: '' }
    expect(() => throwIfError(pg as never, 'INSERT_FAIL', 'No se pudo insertar')).toThrow(ServiceError)
  })

  it('captura a Sentry para errores no-NOT_FOUND', () => {
    const pg = { code: '23505', message: 'duplicate', details: '', hint: '' }
    try {
      throwIfError(pg as never, 'INSERT_FAIL', 'No se pudo insertar')
    } catch {
      // expected
    }
    expect(Sentry.withScope).toHaveBeenCalled()
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('NO captura a Sentry para NOT_FOUND (esperado)', () => {
    const pg = { code: SUPABASE_ERROR_CODES.NOT_FOUND, message: 'not found', details: '', hint: '' }
    try {
      throwIfError(pg as never, 'GET_ONE', 'No encontrado')
    } catch {
      // expected
    }
    expect(Sentry.withScope).not.toHaveBeenCalled()
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('error lanzado preserva code y pgError', () => {
    const pg = { code: '42501', message: 'forbidden', details: '', hint: '' }
    try {
      throwIfError(pg as never, 'PERMISSION_DENIED', 'Sin permisos')
      expect.fail('debió lanzar')
    } catch (err) {
      const se = err as ServiceError
      expect(se.code).toBe('PERMISSION_DENIED')
      expect(se.message).toBe('Sin permisos')
      expect(se.isUnauthorized).toBe(true)
    }
  })
})
