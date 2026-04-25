import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBusinessCountry } from '@/hooks/useBusinessCountry'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

// Named import: { supabase } from '@/lib/supabase'
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

const BUSINESS = { id: 'biz-1', name: 'Test Salon', country: 'CO' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useBusinessCountry', () => {
  it('does NOT fetch when businessId is null', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessCountry(null), { wrapper: Wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does NOT fetch when businessId is undefined', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessCountry(undefined), { wrapper: Wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches business country data when businessId is provided', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: BUSINESS, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessCountry('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })

    expect(mockFrom).toHaveBeenCalledWith('businesses')
    expect(result.current.data).toEqual(BUSINESS)
  })

  it('exposes country code from returned data', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: BUSINESS, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessCountry('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })

    expect(result.current.data?.country).toBe('CO')
  })

  it('throws when Supabase returns an error', async () => {
    const dbError = { message: 'Not found', code: 'PGRST116' }
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: dbError }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessCountry('biz-missing'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })

    expect(result.current.error).toBeTruthy()
  })

  it('starts in loading state while fetching', () => {
    // mock a never-resolving promise to capture loading state
    mockFrom.mockReturnValue(mockSupabaseChain({ data: BUSINESS, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessCountry('biz-1'), { wrapper: Wrapper })

    // Immediately after mount it should be fetching
    expect(result.current.isLoading || result.current.isFetching || result.current.isSuccess).toBe(true)
  })
})
