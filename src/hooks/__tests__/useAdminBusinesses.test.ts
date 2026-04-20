import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import { createMockBusiness } from '@/test-utils/mock-factories'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0 },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
  },
}))

import { useAdminBusinesses } from '../useAdminBusinesses'

describe('useAdminBusinesses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array immediately when userId is undefined', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAdminBusinesses(undefined), { wrapper: Wrapper })

    expect(result.current.businesses).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does not trigger a query when userId is undefined (enabled: false)', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useAdminBusinesses(undefined), { wrapper: Wrapper })

    await new Promise((r) => setTimeout(r, 20))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('queries businesses owned by the user when userId is provided', async () => {
    const ownedBusiness = createMockBusiness({
      id: 'biz-1',
      name: 'Salón A',
      owner_id: 'admin-1',
    })
    const eqMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [ownedBusiness], error: null }),
    })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    mockFrom.mockReturnValue({ select: selectMock })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAdminBusinesses('admin-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockFrom).toHaveBeenCalledWith('businesses')
    expect(eqMock).toHaveBeenCalledWith('owner_id', 'admin-1')
    expect(result.current.businesses).toHaveLength(1)
    expect(result.current.businesses[0].id).toBe('biz-1')
  })

  it('returns the array sorted by created_at desc (RPC contract)', async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [
        createMockBusiness({ id: 'biz-2' }),
        createMockBusiness({ id: 'biz-1' }),
      ],
      error: null,
    })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqMock }) })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAdminBusinesses('admin-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.businesses.map((b) => b.id)).toEqual(['biz-2', 'biz-1'])
  })

  it('returns an empty array when supabase responds with null data', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: null, error: null })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: orderMock }) }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAdminBusinesses('admin-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.businesses).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('exposes the error message when supabase fails', async () => {
    const orderMock = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error('boom') })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: orderMock }) }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAdminBusinesses('admin-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('boom')
    expect(result.current.businesses).toEqual([])
  })

  it('starts in loading state when userId is provided', async () => {
    // Never-resolving promise to keep query in pending state
    const orderMock = vi.fn().mockReturnValue(new Promise(() => {}))
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: orderMock }) }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAdminBusinesses('admin-1'), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
  })

  it('refetch is a stable function that re-triggers the query', async () => {
    const orderMock = vi
      .fn()
      .mockResolvedValueOnce({ data: [createMockBusiness({ id: 'biz-1' })], error: null })
      .mockResolvedValueOnce({
        data: [
          createMockBusiness({ id: 'biz-1' }),
          createMockBusiness({ id: 'biz-2' }),
        ],
        error: null,
      })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: orderMock }) }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAdminBusinesses('admin-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.businesses).toHaveLength(1))

    expect(typeof result.current.refetch).toBe('function')
    await result.current.refetch()
    await waitFor(() => expect(result.current.businesses).toHaveLength(2))
  })
})

// Silence unused-import warning for mockSupabaseChain (kept for downstream tests).
void mockSupabaseChain
