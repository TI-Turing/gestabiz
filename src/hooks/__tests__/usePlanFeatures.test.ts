import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

const mockMaybeSingle = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
  default: { from: mockFrom },
}))

// Helper: creates a chainable mock whose terminal `maybeSingle()` resolves to `resolved`
function makeChain(resolved: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = [
    'select', 'eq', 'in', 'neq', 'order', 'limit', 'filter', 'match',
  ]
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain['maybeSingle'] = mockMaybeSingle.mockResolvedValue(resolved)
  return chain
}

import { usePlanFeatures } from '../usePlanFeatures'

describe('usePlanFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is not loading and returns free plan when businessId is null', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures(null), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.planId).toBe('free')
  })

  it('defaults to free plan when no business_plans record is found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.planId).toBe('free')
  })

  it('maps legacy "inicio" plan_type to "basico"', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { plan_type: 'inicio', status: 'active' }, error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.planId).toBe('basico')
  })

  it('maps legacy "profesional" plan_type to "pro"', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { plan_type: 'profesional', status: 'active' }, error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.planId).toBe('pro')
  })

  it('maps direct "pro" plan_type correctly', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { plan_type: 'pro', status: 'active' }, error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.planId).toBe('pro')
  })

  it('defaults to free plan on Supabase error', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: { message: 'permission denied' } }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.planId).toBe('free')
  })

  it('hasModule returns true for module accessible on current plan', async () => {
    // basico plan has 'employees' module
    mockFrom.mockReturnValue(
      makeChain({ data: { plan_type: 'basico', status: 'active' }, error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasModule('employees')).toBe(true)
  })

  it('hasModule returns true for modules always available on free plan', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: null }), // no plan → free
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // 'appointments' is always available
    expect(result.current.hasModule('appointments')).toBe(true)
    // 'employees' is not in free plan
    expect(result.current.hasModule('employees')).toBe(false)
  })

  it('quotaInfo returns isAtLimit=true when current >= limit', async () => {
    // free plan has locations limit of 1
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const info = result.current.quotaInfo('locations', 1)
    expect(info.isAtLimit).toBe(true)
    expect(info.remaining).toBe(0)
  })

  it('quotaInfo returns isAtLimit=false when current < limit', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const info = result.current.quotaInfo('locations', 0)
    expect(info.isAtLimit).toBe(false)
    expect(info.remaining).toBeGreaterThan(0)
  })

  it('quotaInfo returns unlimited (limit=null) for pro plan', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { plan_type: 'pro', status: 'active' }, error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // pro plan has null (unlimited) appointments, not locations (which is 10)
    const info = result.current.quotaInfo('appointments', 999)
    expect(info.limit).toBeNull()
    expect(info.isAtLimit).toBe(false)
    expect(info.remaining).toBeNull()
  })

  it('upgradePlan is null when on highest plan', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { plan_type: 'pro', status: 'active' }, error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePlanFeatures('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.upgradePlan).toBeUndefined()
  })
})
