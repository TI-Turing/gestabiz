import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockRpc = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => { const __sb = { rpc: mockRpc, from: mockFrom }; return { supabase: __sb, default: __sb } })

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0 },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
  },
}))

import { useEmployeeBusinesses } from '../useEmployeeBusinesses'

const mockBusinesses = [
  { id: 'biz-1', name: 'Salón A', description: 'Test', logo_url: null },
  { id: 'biz-2', name: 'Clínica B', description: 'Test 2', logo_url: null },
]

describe('useEmployeeBusinesses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when employeeId is null', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinesses(null),
      { wrapper: Wrapper },
    )

    expect(result.current.businesses).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.isEmployeeOfAnyBusiness).toBe(false)
  })

  it('returns empty array when employeeId is undefined', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinesses(undefined),
      { wrapper: Wrapper },
    )

    expect(result.current.businesses).toEqual([])
    expect(result.current.isEmployeeOfAnyBusiness).toBe(false)
  })

  it('fetches businesses via RPC when available', async () => {
    mockRpc.mockResolvedValue({ data: mockBusinesses, error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinesses('emp-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.businesses).toHaveLength(2)
    expect(result.current.isEmployeeOfAnyBusiness).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('get_user_businesses', {
      p_user_id: 'emp-1',
      p_include_owner: true,
    })
  })

  it('falls back to queries when RPC fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'no rpc' } })

    // Mock business_employees query
    const empChain = mockSupabaseChain({
      data: [{ business_id: 'biz-1', businesses: mockBusinesses[0] }],
      error: null,
    })
    // Mock businesses (owned) query
    const ownedChain = mockSupabaseChain({
      data: [mockBusinesses[1]],
      error: null,
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      return callCount === 1 ? empChain : ownedChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinesses('emp-1', true),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.businesses.length).toBeGreaterThanOrEqual(1)
  })

  it('excludes owned businesses when includeIndependent is false', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'no rpc' } })

    const empChain = mockSupabaseChain({
      data: [{ business_id: 'biz-1', businesses: mockBusinesses[0] }],
      error: null,
    })
    mockFrom.mockReturnValue(empChain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinesses('emp-1', false),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockRpc).toHaveBeenCalledWith('get_user_businesses', {
      p_user_id: 'emp-1',
      p_include_owner: false,
    })
  })

  it('returns error message on failure', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc fail' } })

    const failChain = mockSupabaseChain({
      data: null,
      error: { message: 'DB error' },
    })
    mockFrom.mockReturnValue(failChain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinesses('emp-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
  })
})
