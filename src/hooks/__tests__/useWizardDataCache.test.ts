import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockRpc = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  default: { rpc: mockRpc, from: mockFrom },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/lib/queryConfig', () => ({
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
    KEYS: {
      WIZARD_DATA: (bId: string) => ['wizard-data', bId],
    },
  },
}))

import { useWizardDataCache } from '../useWizardDataCache'

const mockLocations = [
  { id: 'loc-1', name: 'Sede Norte', address: 'Calle 100', is_active: true },
]
const mockServices = [
  { id: 'svc-1', name: 'Corte', price: 30000, duration_minutes: 30 },
]

describe('useWizardDataCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null data when businessId is null', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWizardDataCache(null), {
      wrapper: Wrapper,
    })

    expect(result.current.locations).toBeNull()
    expect(result.current.services).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches data via RPC when available', async () => {
    mockRpc.mockResolvedValue({
      data: { locations: mockLocations, services: mockServices },
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWizardDataCache('biz-1'), {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.locations).toHaveLength(1)
    expect(result.current.services).toHaveLength(1)
    expect(result.current.error).toBeNull()
    expect(mockRpc).toHaveBeenCalledWith('get_wizard_business_data', {
      p_business_id: 'biz-1',
    })
  })

  it('falls back to parallel queries when RPC fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } })

    const locChain = mockSupabaseChain({ data: mockLocations, error: null })
    const svcChain = mockSupabaseChain({ data: mockServices, error: null })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      return callCount === 1 ? locChain : svcChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWizardDataCache('biz-1'), {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.locations).toHaveLength(1)
    expect(result.current.services).toHaveLength(1)
  })

  it('normalizes service duration field', async () => {
    mockRpc.mockResolvedValue({
      data: {
        locations: [],
        services: [{ id: 's1', name: 'Test', duration_minutes: 45 }],
      },
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWizardDataCache('biz-1'), {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.services![0]).toHaveProperty('duration', 45)
  })

  it('returns error message when query fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC fail' } })

    const failChain = mockSupabaseChain({
      data: null,
      error: { message: 'Locations: DB error' },
    })
    mockFrom.mockReturnValue(failChain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useWizardDataCache('biz-1'), {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
  })
})
