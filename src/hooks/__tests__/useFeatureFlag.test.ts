import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ──────────────────────────────────────────────────────────────────────────────
// MOCKS
// ──────────────────────────────────────────────────────────────────────────────

const mockRPC = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = { rpc: mockRPC }
  return { supabase: __sb, default: __sb }
})

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
  },
}))

// ──────────────────────────────────────────────────────────────────────────────
// Importar hook DESPUÉS de los mocks
// ──────────────────────────────────────────────────────────────────────────────

import { useFeatureFlag } from '../useFeatureFlag'

// ──────────────────────────────────────────────────────────────────────────────
// SUITE
// ──────────────────────────────────────────────────────────────────────────────

describe('useFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── referral_program_enabled ──────────────────────────────────────────────

  describe('flag: referral_program_enabled', () => {
    it('retorna true cuando la RPC retorna true', async () => {
      mockRPC.mockResolvedValue({ data: true, error: null })
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('referral_program_enabled'), {
        wrapper: Wrapper,
      })

      await waitFor(() => expect(result.current).toBe(true))
      expect(mockRPC).toHaveBeenCalledWith('get_referral_feature_enabled')
    })

    it('retorna false cuando la RPC retorna false', async () => {
      mockRPC.mockResolvedValue({ data: false, error: null })
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('referral_program_enabled'), {
        wrapper: Wrapper,
      })

      await waitFor(() => expect(result.current).toBe(false))
    })

    it('retorna false cuando la RPC retorna null', async () => {
      mockRPC.mockResolvedValue({ data: null, error: null })
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('referral_program_enabled'), {
        wrapper: Wrapper,
      })

      await waitFor(() => expect(result.current).toBe(false))
    })

    it('retorna false cuando la RPC retorna un error', async () => {
      mockRPC.mockResolvedValue({ data: null, error: new Error('DB error') })
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('referral_program_enabled'), {
        wrapper: Wrapper,
      })

      await waitFor(() => expect(result.current).toBe(false))
    })

    it('retorna false cuando la RPC lanza una excepción', async () => {
      mockRPC.mockRejectedValue(new Error('Network error'))
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('referral_program_enabled'), {
        wrapper: Wrapper,
      })

      await waitFor(() => expect(result.current).toBe(false))
    })
  })

  // ── Flags desconocidos ────────────────────────────────────────────────────

  describe('flags desconocidos', () => {
    it('retorna false para un flag desconocido sin llamar a Supabase', async () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('unknown_flag'), {
        wrapper: Wrapper,
      })

      // Sin esperar llamada async
      await new Promise((r) => setTimeout(r, 30))

      expect(result.current).toBe(false)
      expect(mockRPC).not.toHaveBeenCalled()
    })

    it('retorna false para flag vacío', async () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag(''), { wrapper: Wrapper })

      await new Promise((r) => setTimeout(r, 30))
      expect(result.current).toBe(false)
    })

    it('retorna false para flag con espacio extra', async () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('  referral_program_enabled  '), {
        wrapper: Wrapper,
      })

      await new Promise((r) => setTimeout(r, 30))
      // Flag con espacios no matchea el case exacto
      expect(result.current).toBe(false)
    })

    it('retorna false para flag new_feature_2025', async () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useFeatureFlag('new_feature_2025'), {
        wrapper: Wrapper,
      })

      await new Promise((r) => setTimeout(r, 30))
      expect(result.current).toBe(false)
      expect(mockRPC).not.toHaveBeenCalled()
    })
  })

  // ── Tipo de retorno ───────────────────────────────────────────────────────

  it('siempre retorna un booleano', async () => {
    mockRPC.mockResolvedValue({ data: true, error: null })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFeatureFlag('referral_program_enabled'), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(typeof result.current).toBe('boolean'))
  })
})
