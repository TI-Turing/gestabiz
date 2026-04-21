import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

import {
  useBusinessTaxConfig,
  usePrefetchTaxConfig,
  useInvalidateTaxConfig,
} from '../useBusinessTaxConfig'

const mockTaxConfig = {
  id: 'tx-1',
  business_id: 'biz-1',
  iva_rate: 0.19,
  ica_rate: 0.0066,
  retention_rate: 0.025,
  applies_iva: true,
  applies_ica: true,
  applies_retention: false,
}

describe('useBusinessTaxConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null and does not fetch when businessId is undefined', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig(undefined), { wrapper: Wrapper })

    expect(result.current.config).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns null and does not fetch when businessId is empty string', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('   '), { wrapper: Wrapper })

    expect(result.current.config).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches tax config from tax_configurations when businessId is provided', async () => {
    const chain = mockSupabaseChain({ data: mockTaxConfig, error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFrom).toHaveBeenCalledWith('tax_configurations')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1')
    expect(chain.maybeSingle).toHaveBeenCalled()
    expect(result.current.config).toEqual(mockTaxConfig)
  })

  it('returns null when no config exists for the business', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.config).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('exposes the error when supabase fails', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: { message: 'fetch-failed' } }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('biz-1'), { wrapper: Wrapper })

    // Hook sets retry: 2 → up to 3 attempts with exponential backoff
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 15000 })
    expect(result.current.error).toBeTruthy()
    expect(result.current.config).toBeNull()
  }, 20000)

  it('trims whitespace in businessId before querying', async () => {
    const chain = mockSupabaseChain({ data: mockTaxConfig, error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('  biz-1  '), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1')
  })

  it('updateConfig calls upsert with business_id, updates and updated_at', async () => {
    const fetchChain = mockSupabaseChain({ data: mockTaxConfig, error: null })
    const upsertChain = mockSupabaseChain({ data: null, error: null })
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      callIdx++
      return callIdx === 1 ? fetchChain : upsertChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateConfig({ iva_rate: 0.05 })
    })

    expect(upsertChain.upsert).toHaveBeenCalled()
    const payload = upsertChain.upsert.mock.calls[0][0]
    expect(payload).toMatchObject({
      business_id: 'biz-1',
      iva_rate: 0.05,
    })
    expect(payload.updated_at).toBeTruthy()
  })

  it('updateConfig throws when there is no businessId', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig(undefined), { wrapper: Wrapper })

    await expect(result.current.updateConfig({ iva_rate: 0.19 })).rejects.toThrow(
      /businessId is required/i,
    )
  })

  it('updateConfig propagates supabase upsert errors', async () => {
    const fetchChain = mockSupabaseChain({ data: mockTaxConfig, error: null })
    const upsertChain = mockSupabaseChain({ data: null, error: { message: 'upsert-fail' } })
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      callIdx++
      return callIdx === 1 ? fetchChain : upsertChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.updateConfig({ iva_rate: 0 })).rejects.toBeTruthy()
    })
  })

  it('refetch is exposed and re-runs the query', async () => {
    const chain = mockSupabaseChain({ data: mockTaxConfig, error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessTaxConfig('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(typeof result.current.refetch).toBe('function')
    chain.select.mockClear()
    await act(async () => {
      await result.current.refetch()
    })
    expect(chain.select).toHaveBeenCalled()
  })
})

describe('usePrefetchTaxConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a callable that triggers a query for the given businessId', async () => {
    const chain = mockSupabaseChain({ data: mockTaxConfig, error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePrefetchTaxConfig(), { wrapper: Wrapper })

    expect(typeof result.current).toBe('function')
    await act(async () => {
      result.current('biz-9')
      // Yield to allow queryClient.prefetchQuery to fire
      await new Promise((r) => setTimeout(r, 30))
    })
    expect(mockFrom).toHaveBeenCalledWith('tax_configurations')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-9')
  })
})

describe('useInvalidateTaxConfig', () => {
  it('returns a callable function', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useInvalidateTaxConfig(), { wrapper: Wrapper })
    expect(typeof result.current).toBe('function')
    // Calling with and without businessId must not throw
    expect(() => result.current('biz-1')).not.toThrow()
    expect(() => result.current()).not.toThrow()
  })
})
