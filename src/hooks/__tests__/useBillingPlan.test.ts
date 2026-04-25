import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

import { useBillingPlan } from '../useBillingPlan'

// Helpers to build query chain mocks

function makePlanChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'limit']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain['maybeSingle'] = vi.fn().mockResolvedValue(resolved)
  return chain
}

function makeCountChain(count: number) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'gte', 'lte', 'lt', 'gt']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  // count queries resolve directly (no terminal method needed beyond chaining)
  chain['then'] = (resolve: (value: unknown) => void) =>
    resolve({ data: null, count, error: null })
  return chain
}

const mockPlan = {
  id: 'plan-1',
  business_id: 'biz-1',
  plan_type: 'basico',
  status: 'active',
  start_date: '2026-01-01T00:00:00Z',
  end_date: '2027-01-01T00:00:00Z',
  billing_cycle: 'monthly',
  auto_renew: true,
  payment_gateway: 'stripe',
  canceled_at: null,
}

describe('useBillingPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not fetch and sets isLoading=false when businessId is null', async () => {
    const { result } = renderHook(() => useBillingPlan(null))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.plan).toBeNull()
    expect(result.current.usage).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns plan and usage stats on successful fetch', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makePlanChain({ data: mockPlan, error: null })
      }
      // usage count calls (appointments, notification_log x2)
      return makeCountChain(callCount === 2 ? 5 : callCount === 3 ? 10 : 3)
    })

    const { result } = renderHook(() => useBillingPlan('biz-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.plan?.plan_type).toBe('basico')
    expect(result.current.plan?.status).toBe('active')
    expect(result.current.usage).toBeTruthy()
    expect(result.current.usage?.appointmentsThisPeriod).toBe(5)
    expect(result.current.usage?.emailsSent).toBe(10)
    expect(result.current.usage?.whatsappSent).toBe(3)
  })

  it('sets plan=null and usage=null when no plan record found', async () => {
    mockFrom.mockReturnValue(makePlanChain({ data: null, error: null }))

    const { result } = renderHook(() => useBillingPlan('biz-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.plan).toBeNull()
    expect(result.current.usage).toBeNull()
  })

  it('sets plan=null on plan fetch error', async () => {
    mockFrom.mockReturnValue(
      makePlanChain({ data: null, error: { message: 'permission denied' } }),
    )

    const { result } = renderHook(() => useBillingPlan('biz-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.plan).toBeNull()
    expect(result.current.usage).toBeNull()
  })

  it('daysRemaining is 0 when end_date is in the past', async () => {
    const expiredPlan = { ...mockPlan, end_date: '2020-01-01T00:00:00Z' }
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makePlanChain({ data: expiredPlan, error: null })
      return makeCountChain(0)
    })

    const { result } = renderHook(() => useBillingPlan('biz-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usage?.daysRemaining).toBe(0)
  })

  it('refetch triggers a re-fetch of the plan', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount % 4 === 1) return makePlanChain({ data: mockPlan, error: null })
      return makeCountChain(0)
    })

    const { result } = renderHook(() => useBillingPlan('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const prevCallCount = callCount
    act(() => {
      result.current.refetch()
    })

    await waitFor(() => expect(callCount).toBeGreaterThan(prevCallCount))
  })

  it('cancelPlan throws when businessId is null', async () => {
    const { result } = renderHook(() => useBillingPlan(null))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(result.current.cancelPlan()).rejects.toThrow('businessId is required')
  })
})
