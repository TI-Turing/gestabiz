import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// MOCKS — deben declararse antes de importar el módulo bajo test
// ============================================================================

const mockCaptureException = vi.fn()

vi.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}))

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import { queryClient, resetQueryClient } from '../queryClient'

// ============================================================================
// SUITE — Singleton queryClient
// ============================================================================

describe('queryClient singleton', () => {
  it('exporta un QueryClient', () => {
    expect(queryClient).toBeDefined()
    expect(typeof queryClient.getQueryCache).toBe('function')
    expect(typeof queryClient.getMutationCache).toBe('function')
  })

  it('staleTime por defecto es 5 minutos', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(1000 * 60 * 5)
  })

  it('retry por defecto es 1', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.retry).toBe(1)
  })

  it('refetchOnWindowFocus por defecto es false', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
  })
})

// ============================================================================
// SUITE — resetQueryClient
// ============================================================================

describe('resetQueryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Pre-populate cache so we can verify it gets cleared
    queryClient.setQueryData(['test-key'], { data: 'some-user-data' })
  })

  it('limpia la caché (los datos del usuario anterior no deben quedar)', () => {
    // Verificar que hay datos antes
    expect(queryClient.getQueryData(['test-key'])).toBeDefined()

    resetQueryClient()

    expect(queryClient.getQueryData(['test-key'])).toBeUndefined()
  })

  it('no lanza excepción al llamarse repetidamente', () => {
    expect(() => {
      resetQueryClient()
      resetQueryClient()
    }).not.toThrow()
  })
})

// ============================================================================
// SUITE — QueryCache onError: filtros de errores esperados
// ============================================================================

describe('QueryCache onError — errores esperados NO se envían a Sentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Dispara el handler onError del QueryCache simulando un error de query.
   * React Query llama este handler internamente; para tests lo invocamos
   * directamente accediendo al cache.
   */
  function triggerQueryCacheError(error: Error) {
    const cache = queryClient.getQueryCache()
    // @ts-expect-error — acceso interno para test
    const config = cache.config as { onError?: (err: Error, query: { queryKey: unknown[] }) => void }
    config.onError?.(error, { queryKey: ['test'] })
  }

  it('NO envía a Sentry errores JWT (esperados en sesión expirada)', () => {
    triggerQueryCacheError(new Error('JWT expired'))
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('NO envía a Sentry errores "not authenticated"', () => {
    triggerQueryCacheError(new Error('not authenticated'))
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('NO envía a Sentry errores PGRST116 (sin filas encontradas)', () => {
    triggerQueryCacheError(new Error('PGRST116: no rows found'))
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('SÍ envía a Sentry errores inesperados de red', () => {
    triggerQueryCacheError(new Error('Network request failed'))
    expect(mockCaptureException).toHaveBeenCalledOnce()
    expect(mockCaptureException.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(mockCaptureException.mock.calls[0][0].message).toBe('Network request failed')
  })

  it('SÍ envía a Sentry errores de base de datos no esperados', () => {
    triggerQueryCacheError(new Error('relation "nonexistent_table" does not exist'))
    expect(mockCaptureException).toHaveBeenCalledOnce()
  })
})

// ============================================================================
// SUITE — MutationCache onError: siempre envía a Sentry
// ============================================================================

describe('MutationCache onError — siempre envía a Sentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function triggerMutationCacheError(error: Error) {
    const cache = queryClient.getMutationCache()
    // @ts-expect-error — acceso interno para test
    const config = cache.config as {
      onError?: (err: Error, v: unknown, c: unknown, m: { options: { mutationKey?: unknown[] } }) => void
    }
    config.onError?.(error, undefined, undefined, { options: { mutationKey: ['test-mutation'] } })
  }

  it('envía a Sentry cualquier error de mutation', () => {
    triggerMutationCacheError(new Error('Insert failed'))
    expect(mockCaptureException).toHaveBeenCalledOnce()
    expect(mockCaptureException.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('envía errores non-Error convirtiendo a Error con mensaje', () => {
    const cache = queryClient.getMutationCache()
    // @ts-expect-error — acceso interno para test
    const config = cache.config as {
      onError?: (err: unknown, v: unknown, c: unknown, m: { options: Record<string, unknown> }) => void
    }
    config.onError?.({ message: 'plain object error' }, undefined, undefined, { options: {} })
    expect(mockCaptureException).toHaveBeenCalledOnce()
    const capturedError = mockCaptureException.mock.calls[0][0] as Error
    expect(capturedError).toBeInstanceOf(Error)
    expect(capturedError.message).toBe('plain object error')
  })
})
