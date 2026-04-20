import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => { const __sb = { from: mockFrom }; return { supabase: __sb, default: __sb } })

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { useCountries, useGenders, useDocumentTypes } from '../useCatalogs'

describe('useCatalogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear module-level cache — re-import would be needed for full cache test
  })

  describe('useCountries', () => {
    it('fetches countries from Supabase', async () => {
      const mockCountries = [
        { id: 'co', name: 'Colombia', code: 'CO', phone_prefix: '+57' },
        { id: 'mx', name: 'México', code: 'MX', phone_prefix: '+52' },
      ]

      mockFrom.mockReturnValue(
        mockSupabaseChain({ data: mockCountries, error: null }),
      )

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useCountries(), {
        wrapper: Wrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.countries).toHaveLength(2)
      expect(result.current.countries[0].name).toBe('Colombia')
      expect(result.current.error).toBeNull()
    })

    it('handles fetch errors', async () => {
      mockFrom.mockReturnValue(
        mockSupabaseChain({ data: null, error: { message: 'Network error' } }),
      )

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useCountries(), {
        wrapper: Wrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('useGenders', () => {
    it('fetches genders from Supabase', async () => {
      const mockGenders = [
        { id: 'M', name: 'Masculino', abbreviation: 'M' },
        { id: 'F', name: 'Femenino', abbreviation: 'F' },
      ]

      mockFrom.mockReturnValue(
        mockSupabaseChain({ data: mockGenders, error: null }),
      )

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useGenders(), {
        wrapper: Wrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.genders).toHaveLength(2)
    })
  })

  describe('useDocumentTypes', () => {
    it('fetches document types from Supabase', async () => {
      const mockDocTypes = [
        { id: 'cc', name: 'Cédula de Ciudadanía', abbreviation: 'CC', country_id: 'co' },
        { id: 'nit', name: 'NIT', abbreviation: 'NIT', country_id: 'co', is_for_company: true },
      ]

      mockFrom.mockReturnValue(
        mockSupabaseChain({ data: mockDocTypes, error: null }),
      )

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useDocumentTypes(), {
        wrapper: Wrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.documentTypes).toHaveLength(2)
    })
  })
})
