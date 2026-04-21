import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { from: (...args: unknown[]) => mocks.mockFrom(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@/lib/errors', () => ({
  throwIfError: (error: unknown) => {
    if (error) throw error
  },
}))

vi.mock('@/lib/queryConfig', () => ({
  PAGINATION: { NOTIFICATIONS: 50, TRANSACTIONS: 100 },
}))

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'gte', 'lte', 'or', 'order', 'limit']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.single = vi.fn().mockResolvedValue(resolvedValue)
  self.then = (resolve: (v: unknown) => unknown) => resolve(resolvedValue)
  return self
}

beforeEach(() => {
  mocks.mockFrom.mockReset()
})

describe('transactionsService.list', () => {
  it('lista sin filtros, ordena por transaction_date desc, limit 100', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: [{ id: 't1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await transactionsService.list()

    expect(mocks.mockFrom).toHaveBeenCalledWith('transactions')
    expect(chain.order).toHaveBeenCalledWith('transaction_date', { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(100)
    expect(result).toHaveLength(1)
  })

  it('aplica filtro business_id, type, category y date_range', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.list({
      business_id: 'b1',
      type: ['income', 'expense'] as never,
      category: ['service_sale'] as never,
      date_range: { start: '2026-01-01', end: '2026-12-31' },
    } as never)

    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.in).toHaveBeenCalledWith('type', ['income', 'expense'])
    expect(chain.in).toHaveBeenCalledWith('category', ['service_sale'])
    expect(chain.gte).toHaveBeenCalledWith('transaction_date', '2026-01-01')
    expect(chain.lte).toHaveBeenCalledWith('transaction_date', '2026-12-31')
  })

  it('aplica filtro location_id usando .or() incluyendo null', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.list({ location_id: 'loc-1' } as never)
    expect(chain.or).toHaveBeenCalledWith('location_id.eq.loc-1,location_id.is.null')
  })

  it('aplica filtros de monto min y max', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.list({ min_amount: 100, max_amount: 500 } as never)
    expect(chain.gte).toHaveBeenCalledWith('amount', 100)
    expect(chain.lte).toHaveBeenCalledWith('amount', 500)
  })

  it('aplica filtro is_verified booleano', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.list({ is_verified: true } as never)
    expect(chain.eq).toHaveBeenCalledWith('is_verified', true)
  })

  it('lanza error en list cuando supabase falla', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: null, error: { message: 'fail' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(transactionsService.list()).rejects.toBeTruthy()
  })
})

describe('transactionsService.listRecurringExpenses', () => {
  it('filtra por business_id y is_active=true', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: [{ id: 'r1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await transactionsService.listRecurringExpenses('b1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('recurring_expenses')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    expect(result).toHaveLength(1)
  })

  it('retorna [] cuando data es null', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await transactionsService.listRecurringExpenses('b1')
    expect(result).toEqual([])
  })
})

describe('transactionsService.create', () => {
  it('inserta con currency=COP por defecto, metadata={} y is_verified=false', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: { id: 't1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.create({
      business_id: 'b1',
      type: 'income' as never,
      category: 'service_sale' as never,
      amount: 50000,
    })

    const insertArg = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertArg.business_id).toBe('b1')
    expect(insertArg.amount).toBe(50000)
    expect(insertArg.currency).toBe('COP')
    expect(insertArg.is_verified).toBe(false)
    expect(insertArg.metadata).toEqual({})
    expect(insertArg.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('respeta currency, transaction_date y metadata custom', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: { id: 't1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.create({
      business_id: 'b1',
      type: 'expense' as never,
      category: 'rent' as never,
      amount: 1000,
      currency: 'USD',
      transaction_date: '2026-04-01',
      metadata: { note: 'X' },
    })

    const insertArg = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertArg.currency).toBe('USD')
    expect(insertArg.transaction_date).toBe('2026-04-01')
    expect(insertArg.metadata).toEqual({ note: 'X' })
  })
})

describe('transactionsService.update', () => {
  it('actualiza por id', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.update('t1', { amount: 200 })
    expect(chain.update).toHaveBeenCalledWith({ amount: 200 })
    expect(chain.eq).toHaveBeenCalledWith('id', 't1')
  })
})

describe('transactionsService.verify', () => {
  it('marca is_verified=true con verified_by y verified_at', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.verify('t1', 'admin-1')
    const updArg = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updArg.is_verified).toBe(true)
    expect(updArg.verified_by).toBe('admin-1')
    expect(typeof updArg.verified_at).toBe('string')
    expect(chain.eq).toHaveBeenCalledWith('id', 't1')
  })
})

describe('transactionsService.delete', () => {
  it('elimina por id', async () => {
    const { transactionsService } = await import('@/lib/services/transactions')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await transactionsService.delete('t1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 't1')
  })
})
