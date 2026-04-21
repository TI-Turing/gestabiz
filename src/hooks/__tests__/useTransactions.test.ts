import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import { createMockTransaction } from '@/test-utils/mock-factories'
import { toast } from 'sonner'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/queryConfig', () => ({
  default: {
    FREQUENT: { staleTime: 0, gcTime: 0 },
    STABLE: { staleTime: 0, gcTime: 0 },
  },
  QUERY_CONFIG: {
    FREQUENT: { staleTime: 0, gcTime: 0 },
    STABLE: { staleTime: 0, gcTime: 0 },
  },
}))

import { useTransactions } from '../useTransactions'
import type { Transaction, TransactionFilters } from '@/types/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Mocks `supabase.from(table)` to route to different chains per table.
 * Defaults: 'transactions' returns the data chain; 'recurring_expenses' returns empty.
 */
function mockFromRouter(routes: {
  transactions?: ReturnType<typeof mockSupabaseChain>
  recurring_expenses?: ReturnType<typeof mockSupabaseChain>
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'transactions') {
      return routes.transactions ?? mockSupabaseChain({ data: [] as Transaction[], error: null })
    }
    if (table === 'recurring_expenses') {
      return routes.recurring_expenses ?? mockSupabaseChain({ data: [], error: null })
    }
    return mockSupabaseChain({ data: [] as unknown[], error: null })
  })
}

const baseFilters: TransactionFilters = { business_id: 'biz-1' }

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Query enable/disable ────────────────────────────────────────────────────

  it('does not fetch when no business_id is provided', async () => {
    mockFromRouter({})
    const { Wrapper } = createWrapper()
    renderHook(() => useTransactions(undefined), { wrapper: Wrapper })

    await new Promise((r) => setTimeout(r, 20))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches when business_id is provided', async () => {
    mockFromRouter({})
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockFrom).toHaveBeenCalledWith('transactions')
  })

  // ── Filters ─────────────────────────────────────────────────────────────────

  it('applies business_id filter via .eq', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1')
  })

  it('applies location_id filter via .or (location or null)', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useTransactions({ business_id: 'biz-1', location_id: 'loc-9' }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(chain.or).toHaveBeenCalledWith('location_id.eq.loc-9,location_id.is.null')
  })

  it('applies type filter via .in', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useTransactions({ business_id: 'biz-1', type: ['income', 'expense'] }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(chain.in).toHaveBeenCalledWith('type', ['income', 'expense'])
  })

  it('applies category filter via .in', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useTransactions({ business_id: 'biz-1', category: ['service_sale'] }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(chain.in).toHaveBeenCalledWith('category', ['service_sale'])
  })

  it('applies is_verified filter via .eq', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useTransactions({ business_id: 'biz-1', is_verified: true }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(chain.eq).toHaveBeenCalledWith('is_verified', true)
  })

  it('applies amount range filter via .gte and .lte', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useTransactions({ business_id: 'biz-1', min_amount: 1000, max_amount: 5000 }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(chain.gte).toHaveBeenCalledWith('amount', 1000)
    expect(chain.lte).toHaveBeenCalledWith('amount', 5000)
  })

  it('applies date_range filter via .gte and .lte on transaction_date', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useTransactions({
          business_id: 'biz-1',
          date_range: { start: '2026-01-01', end: '2026-01-31' },
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(chain.gte).toHaveBeenCalledWith('transaction_date', '2026-01-01')
    expect(chain.lte).toHaveBeenCalledWith('transaction_date', '2026-01-31')
  })

  // ── Summary calculations ────────────────────────────────────────────────────

  it('calculates summary income/expenses/net_profit/count from transactions', async () => {
    const data: Transaction[] = [
      createMockTransaction({ type: 'income', amount: 1000 }),
      createMockTransaction({ type: 'income', amount: 500 }),
      createMockTransaction({ type: 'expense', amount: 200 }),
    ]
    mockFromRouter({ transactions: mockSupabaseChain({ data, error: null }) })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.summary).toEqual({
      total_income: 1500,
      total_expenses: 200,
      net_profit: 1300,
      transaction_count: 3,
    })
  })

  it('adds recurring_expenses total into total_expenses', async () => {
    const data: Transaction[] = [createMockTransaction({ type: 'expense', amount: 100 })]
    mockFromRouter({
      transactions: mockSupabaseChain({ data, error: null }),
      recurring_expenses: mockSupabaseChain({
        data: [{ amount: 250 }, { amount: 150 }] as Array<{ amount: number }>,
        error: null,
      }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.summary.total_expenses).toBe(500)
    expect(result.current.summary.net_profit).toBe(-500)
  })

  it('returns empty summary defaults when there is no data yet', () => {
    // Pending forever
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    chain.then = vi.fn(() => new Promise(() => {})) as never
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })

    expect(result.current.transactions).toEqual([])
    expect(result.current.summary).toEqual({
      total_income: 0,
      total_expenses: 0,
      net_profit: 0,
      transaction_count: 0,
    })
  })

  it('propagates supabase error into the error field', async () => {
    mockFromRouter({
      transactions: mockSupabaseChain({ data: null, error: { message: 'boom' } }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeTruthy()
    expect(result.current.transactions).toEqual([])
  })

  // ── Mutations: create ───────────────────────────────────────────────────────

  it('createTransaction calls insert with mapped payload and shows success toast', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const insertChain = mockSupabaseChain({
      data: createMockTransaction({ id: 'tx-new' }),
      error: null,
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      // For mutations the same .from('transactions') is reused after the data fetch.
      // Toggle: first call returns dataChain, subsequent return insertChain.
      const callIdx = (mockFrom as unknown as { mock: { calls: unknown[] } }).mock.calls.filter(
        (c: unknown) => Array.isArray(c) && (c as unknown[])[0] === 'transactions',
      ).length
      return callIdx <= 1 ? dataChain : insertChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createTransaction(
        'biz-1',
        'income',
        'service_sale',
        50000,
        'Venta',
        { location_id: 'loc-1', payment_method: 'cash' },
      )
    })

    expect(insertChain.insert).toHaveBeenCalled()
    const payload = insertChain.insert.mock.calls[0][0]
    expect(payload).toMatchObject({
      business_id: 'biz-1',
      type: 'income',
      category: 'service_sale',
      amount: 50000,
      currency: 'COP',
      description: 'Venta',
      location_id: 'loc-1',
      payment_method: 'cash',
      is_verified: false,
    })
    expect(payload.transaction_date).toBeTruthy()
    expect(toast.success).toHaveBeenCalledWith('Transacción creada exitosamente')
  })

  it('createTransaction shows error toast on failure', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const insertChain = mockSupabaseChain({ data: null, error: { message: 'fail-create' } })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : insertChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(
        result.current.createTransaction('biz-1', 'income', 'service_sale', 1000),
      ).rejects.toBeTruthy()
    })

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('fail-create'))
  })

  // ── Mutations: update ───────────────────────────────────────────────────────

  it('updateTransaction calls update + eq(id) and shows success toast', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const updateChain = mockSupabaseChain({ data: null, error: null })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : updateChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateTransaction('tx-1', { amount: 999, description: 'nuevo' })
    })

    expect(updateChain.update).toHaveBeenCalledWith({ amount: 999, description: 'nuevo' })
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'tx-1')
    expect(toast.success).toHaveBeenCalledWith('Transacción actualizada exitosamente')
  })

  // ── Mutations: verify ───────────────────────────────────────────────────────

  it('verifyTransaction sets is_verified=true with verified_by and verified_at', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const verifyChain = mockSupabaseChain({ data: null, error: null })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : verifyChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.verifyTransaction('tx-1', 'admin-1')
    })

    const payload = verifyChain.update.mock.calls[0][0]
    expect(payload).toMatchObject({ is_verified: true, verified_by: 'admin-1' })
    expect(payload.verified_at).toBeTruthy()
    expect(verifyChain.eq).toHaveBeenCalledWith('id', 'tx-1')
    expect(toast.success).toHaveBeenCalledWith('Transacción verificada')
  })

  // ── Mutations: delete ───────────────────────────────────────────────────────

  it('deleteTransaction calls delete + eq(id) and shows success toast', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const deleteChain = mockSupabaseChain({ data: null, error: null })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : deleteChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteTransaction('tx-1')
    })

    expect(deleteChain.delete).toHaveBeenCalled()
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'tx-1')
    expect(toast.success).toHaveBeenCalledWith('Transacción eliminada')
  })

  it('deleteTransaction shows error toast on failure', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const deleteChain = mockSupabaseChain({ data: null, error: { message: 'no-delete' } })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : deleteChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.deleteTransaction('tx-1')).rejects.toBeTruthy()
    })

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('no-delete'))
  })

  // ── Mutations: createFiscalTransaction ──────────────────────────────────────

  it('createFiscalTransaction computes fiscal_period from transaction_date', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const insertChain = mockSupabaseChain({ data: { id: 'tx-fiscal' }, error: null })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : insertChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createFiscalTransaction({
        business_id: 'biz-1',
        type: 'income',
        category: 'service_sale',
        subtotal: 100000,
        tax_type: 'iva',
        tax_rate: 0.19,
        tax_amount: 19000,
        total_amount: 119000,
        transaction_date: '2026-04-15',
      })
    })

    const payload = insertChain.insert.mock.calls[0][0]
    expect(payload.fiscal_period).toBe('2026-04')
    expect(payload.subtotal).toBe(100000)
    expect(payload.tax_type).toBe('iva')
    expect(payload.is_tax_deductible).toBe(true) // default
  })

  it('createFiscalTransaction defaults transaction_date to today and is_tax_deductible to true', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const insertChain = mockSupabaseChain({ data: { id: 'tx-f' }, error: null })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : insertChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createFiscalTransaction({
        business_id: 'biz-1',
        type: 'expense',
        category: 'rent',
        subtotal: 1000,
        total_amount: 1000,
      })
    })

    const payload = insertChain.insert.mock.calls[0][0]
    const today = new Date().toISOString().split('T')[0]
    expect(payload.transaction_date).toBe(today)
    expect(payload.fiscal_period).toBe(today.slice(0, 7))
    expect(payload.is_tax_deductible).toBe(true)
  })

  it('createFiscalTransaction respects explicit is_tax_deductible=false', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const insertChain = mockSupabaseChain({ data: { id: 'tx-f' }, error: null })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : insertChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createFiscalTransaction({
        business_id: 'biz-1',
        type: 'expense',
        category: 'rent',
        subtotal: 1000,
        total_amount: 1000,
        is_tax_deductible: false,
      })
    })

    const payload = insertChain.insert.mock.calls[0][0]
    expect(payload.is_tax_deductible).toBe(false)
  })

  // ── Utility: getTransactionsByDateRange ─────────────────────────────────────

  it('getTransactionsByDateRange queries with .gte/.lte and returns data', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const rangeChain = mockSupabaseChain({
      data: [createMockTransaction({ id: 'tx-r' })],
      error: null,
    })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : rangeChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let returned: unknown[] = []
    await act(async () => {
      returned = await result.current.getTransactionsByDateRange('2026-01-01', '2026-01-31')
    })

    expect(rangeChain.gte).toHaveBeenCalledWith('transaction_date', '2026-01-01')
    expect(rangeChain.lte).toHaveBeenCalledWith('transaction_date', '2026-01-31')
    expect(returned).toHaveLength(1)
  })

  it('getTransactionsByDateRange throws when supabase returns an error', async () => {
    const dataChain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    const rangeChain = mockSupabaseChain({ data: null, error: { message: 'range-fail' } })
    let callsToTx = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_expenses') return mockSupabaseChain({ data: [], error: null })
      callsToTx++
      return callsToTx <= 1 ? dataChain : rangeChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.getTransactionsByDateRange('2026-01-01', '2026-01-31'),
    ).rejects.toBeTruthy()
  })

  // ── Refetch ─────────────────────────────────────────────────────────────────

  it('refetch is exposed and re-runs the query', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTransactions(baseFilters), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(typeof result.current.refetch).toBe('function')

    chain.select.mockClear()
    await act(async () => {
      await result.current.refetch()
    })
    expect(chain.select).toHaveBeenCalled()
  })

  // ── Query key isolation ────────────────────────────────────────────────────

  it('changes in filters trigger a new fetch (different cache key)', async () => {
    const chain = mockSupabaseChain({ data: [] as Transaction[], error: null })
    mockFromRouter({ transactions: chain })

    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      (props: { filters: TransactionFilters }) => useTransactions(props.filters),
      { wrapper: Wrapper, initialProps: { filters: baseFilters } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    const firstCalls = mockFrom.mock.calls.length

    rerender({ filters: { ...baseFilters, type: ['income'] } })
    await waitFor(() => expect(mockFrom.mock.calls.length).toBeGreaterThan(firstCalls))
  })
})
