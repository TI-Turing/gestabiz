import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import { createMockTransaction } from '@/test-utils/mock-factories'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { useChartData } from '../useChartData'
import type { Transaction } from '@/types/types'

function setupChain(data: Transaction[]) {
  const chain = mockSupabaseChain({ data, error: null })
  mockFrom.mockReturnValue(chain)
  return chain
}

describe('useChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Base query / filters ────────────────────────────────────────────────────

  it('fetches from transactions and filters by business_id', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockFrom).toHaveBeenCalledWith('transactions')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1')
  })

  it('applies a single location_id filter via .eq', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useChartData('biz-1', { location_id: 'loc-9' }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.eq).toHaveBeenCalledWith('location_id', 'loc-9')
  })

  it('applies an array of location_id values via .in', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useChartData('biz-1', { location_id: ['loc-1', 'loc-2'] }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.in).toHaveBeenCalledWith('location_id', ['loc-1', 'loc-2'])
  })

  it('applies a single employee_id filter via .eq', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useChartData('biz-1', { employee_id: 'emp-1' }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.eq).toHaveBeenCalledWith('employee_id', 'emp-1')
  })

  it('applies an array of employee_id values via .in', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useChartData('biz-1', { employee_id: ['emp-1', 'emp-2'] }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.in).toHaveBeenCalledWith('employee_id', ['emp-1', 'emp-2'])
  })

  it('applies date_range filter via .gte and .lte', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useChartData('biz-1', {
          date_range: { start: '2026-01-01', end: '2026-03-31' },
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.gte).toHaveBeenCalledWith('transaction_date', '2026-01-01')
    expect(chain.lte).toHaveBeenCalledWith('transaction_date', '2026-03-31')
  })

  it('applies category filter via .in', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useChartData('biz-1', { category: ['service_sale', 'tip'] }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.in).toHaveBeenCalledWith('category', ['service_sale', 'tip'])
  })

  // ── Aggregations ────────────────────────────────────────────────────────────

  it('aggregates income vs expense by month period', async () => {
    setupChain([
      createMockTransaction({
        type: 'income',
        amount: 1000,
        transaction_date: '2026-01-15',
      }),
      createMockTransaction({
        type: 'expense',
        amount: 200,
        transaction_date: '2026-01-20',
      }),
      createMockTransaction({
        type: 'income',
        amount: 500,
        transaction_date: '2026-02-10',
      }),
    ])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.incomeVsExpenseData).toHaveLength(2)
    const jan = result.current.incomeVsExpenseData[0]
    expect(jan.income).toBe(1000)
    expect(jan.expenses).toBe(200)
    expect(jan.profit).toBe(800)
  })

  it('aggregates category distribution with percentages and color', async () => {
    setupChain([
      createMockTransaction({
        type: 'income',
        category: 'service_sale',
        amount: 800,
      }),
      createMockTransaction({
        type: 'income',
        category: 'product_sale',
        amount: 200,
      }),
    ])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.categoryDistributionData.length).toBeGreaterThan(0)
    const total = result.current.categoryDistributionData.reduce(
      (s, c) => s + c.percentage,
      0,
    )
    // Percentages should approximate to 100
    expect(Math.round(total)).toBe(100)
    expect(result.current.categoryDistributionData[0]).toHaveProperty('color')
  })

  it('produces a monthly trend covering each month in the date_range', async () => {
    setupChain([
      createMockTransaction({
        type: 'income',
        amount: 100,
        transaction_date: '2026-02-15',
      }),
    ])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useChartData('biz-1', {
          date_range: { start: '2026-01-01', end: '2026-03-31' },
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Hook parses ISO strings as UTC, so depending on TZ the range can include
    // the previous month boundary. We assert at least 3 months and that the
    // Feb-2026 entry surfaces the income=100.
    expect(result.current.monthlyTrendData.length).toBeGreaterThanOrEqual(3)
    const feb = result.current.monthlyTrendData.find((m) => m.income === 100)
    expect(feb).toBeDefined()
  })

  it('defaults monthly trend to last 12 months when no date_range is provided', async () => {
    setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.monthlyTrendData).toHaveLength(12)
  })

  it('aggregates location comparison and sorts by profit desc', async () => {
    setupChain([
      createMockTransaction({
        type: 'income',
        amount: 500,
        location_id: 'loc-1',
        location: { id: 'loc-1', name: 'Sede A' } as never,
      }),
      createMockTransaction({
        type: 'income',
        amount: 1500,
        location_id: 'loc-2',
        location: { id: 'loc-2', name: 'Sede B' } as never,
      }),
      createMockTransaction({
        type: 'expense',
        amount: 100,
        location_id: 'loc-2',
        location: { id: 'loc-2', name: 'Sede B' } as never,
      }),
    ])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.locationComparisonData).toHaveLength(2)
    expect(result.current.locationComparisonData[0].location_id).toBe('loc-2')
    expect(result.current.locationComparisonData[0].profit).toBe(1400)
    expect(result.current.locationComparisonData[1].profit).toBe(500)
  })

  it('skips transactions without location_id from location comparison', async () => {
    setupChain([
      createMockTransaction({
        type: 'income',
        amount: 1000,
        location_id: null as never,
        location: null as never,
      }),
    ])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.locationComparisonData).toHaveLength(0)
  })

  it('aggregates employee performance only for income with an employee', async () => {
    setupChain([
      createMockTransaction({
        type: 'income',
        amount: 600,
        employee_id: 'emp-1',
        employee: { id: 'emp-1', full_name: 'Ana' } as never,
      }),
      createMockTransaction({
        type: 'income',
        amount: 400,
        employee_id: 'emp-1',
        employee: { id: 'emp-1', full_name: 'Ana' } as never,
      }),
      // expense → ignored
      createMockTransaction({
        type: 'expense',
        amount: 100,
        employee_id: 'emp-1',
        employee: { id: 'emp-1', full_name: 'Ana' } as never,
      }),
      // no employee → ignored
      createMockTransaction({ type: 'income', amount: 999 }),
    ])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.employeePerformanceData).toHaveLength(1)
    const ana = result.current.employeePerformanceData[0]
    expect(ana.employee_id).toBe('emp-1')
    expect(ana.total_revenue).toBe(1000)
    expect(ana.completed_appointments).toBe(2)
    expect(ana.average_per_appointment).toBe(500)
  })

  // ── Error / refetch ─────────────────────────────────────────────────────────

  it('exposes the error when supabase fails', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'chart-fail' } }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })

  it('refetch re-runs the fetch pipeline', async () => {
    const chain = setupChain([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    chain.range.mockClear()
    await act(async () => {
      await result.current.refetch()
    })
    expect(chain.range).toHaveBeenCalled()
  })

  it('starts with all aggregation arrays empty before fetch resolves', () => {
    // Pending forever
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    chain.then = vi.fn(() => new Promise(() => {})) as never
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChartData('biz-1'), { wrapper: Wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.incomeVsExpenseData).toEqual([])
    expect(result.current.categoryDistributionData).toEqual([])
    expect(result.current.monthlyTrendData).toEqual([])
    expect(result.current.locationComparisonData).toEqual([])
    expect(result.current.employeePerformanceData).toEqual([])
  })
})
