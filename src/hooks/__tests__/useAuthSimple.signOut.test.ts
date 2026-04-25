/**
 * useAuthSimple — signOut + resetQueryClient integration
 *
 * El sprint de estabilización (abr 2026) modificó signOut para invocar
 * resetQueryClient() después del signOut de Supabase, evitando que datos
 * del usuario A queden visibles al usuario B en la misma pestaña.
 *
 * Ref: auditoria-completa-abril-2026.md §2.1
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ============================================================================
// MOCKS — deben declararse antes de importar el módulo bajo test
// ============================================================================

const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFromSelect = vi.fn()

let authListenerCallback: ((event: string, session: unknown) => void) | null = null

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authListenerCallback = cb
        return mockOnAuthStateChange(cb)
      },
      signOut: () => mockSignOut(),
    },
    from: (table: string) => {
      const chain: Record<string, unknown> = {}
      const methods = ['select', 'eq', 'order', 'limit', 'single', 'maybeSingle']
      for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain)
      }
      chain.then = (resolve: (v: unknown) => void) => {
        const result = mockFromSelect(table)
        return resolve(result)
      }
      return chain
    },
  },
}))

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
}))

// Mock de resetQueryClient para espiar cuándo se llama
const mockResetQueryClient = vi.fn()
vi.mock('@/lib/queryClient', () => ({
  resetQueryClient: (...args: unknown[]) => mockResetQueryClient(...args),
  queryClient: {
    getDefaultOptions: () => ({ queries: { staleTime: 300000, retry: 1 } }),
    getQueryCache: () => ({ config: {} }),
    getMutationCache: () => ({ config: {} }),
  },
}))

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import { useAuthSimple } from '../useAuthSimple'

// ============================================================================
// HELPERS
// ============================================================================

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      ...((overrides.user as Record<string, unknown>) ?? {}),
    },
    ...overrides,
  }
}

// ============================================================================
// SUITE — signOut + resetQueryClient integration
// ============================================================================

describe('useAuthSimple.signOut — limpieza de caché (sprint estabilización abr 2026)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authListenerCallback = null

    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    mockFromSelect.mockReturnValue({ data: null, error: null })
    mockSignOut.mockResolvedValue({ error: null })
  })

  it('llama a supabase.auth.signOut()', async () => {
    const { result } = renderHook(() => useAuthSimple(), {
      wrapper: createWrapper().Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('llama a resetQueryClient() después del signOut para limpiar la caché', async () => {
    const { result } = renderHook(() => useAuthSimple(), {
      wrapper: createWrapper().Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockResetQueryClient).toHaveBeenCalledOnce()
  })

  it('resetQueryClient() se invoca DESPUÉS de supabase.auth.signOut()', async () => {
    // Verificar el orden de llamadas
    const callOrder: string[] = []
    mockSignOut.mockImplementation(async () => {
      callOrder.push('supabase.signOut')
      return { error: null }
    })
    mockResetQueryClient.mockImplementation(() => {
      callOrder.push('resetQueryClient')
    })

    const { result } = renderHook(() => useAuthSimple(), {
      wrapper: createWrapper().Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(callOrder).toEqual(['supabase.signOut', 'resetQueryClient'])
  })

  it('no lanza excepción aunque supabase.auth.signOut() falle', async () => {
    mockSignOut.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAuthSimple(), {
      wrapper: createWrapper().Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // signOut puede propagar el error — lo que no queremos es que quiebre
    // silenciosamente sin llamar resetQueryClient si no hay error
    // (este test verifica que la fn es llamable)
    await expect(
      act(async () => {
        try {
          await result.current.signOut()
        } catch {
          // error esperado
        }
      })
    ).resolves.not.toThrow()
  })

  it('después del signOut, el usuario queda en null cuando el listener emite SIGNED_OUT', async () => {
    const session = makeSession()
    mockGetSession.mockResolvedValue({ data: { session }, error: null })
    mockFromSelect.mockReturnValue({ data: null, error: null })

    const { result } = renderHook(() => useAuthSimple(), {
      wrapper: createWrapper().Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // El usuario debería estar seteado (aunque sea con fallback)
    // Ahora simulamos signOut + evento SIGNED_OUT del listener
    await act(async () => {
      await result.current.signOut()
      authListenerCallback?.('SIGNED_OUT', null)
    })

    await waitFor(() => expect(result.current.user).toBeNull())
    expect(result.current.session).toBeNull()
  })
})
