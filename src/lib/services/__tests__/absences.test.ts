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

function buildChain(resolvedValue: { data?: unknown; error: unknown; count?: number | null }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'gte', 'lte', 'neq', 'order']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.then = (resolve: (v: unknown) => unknown) => resolve(resolvedValue)
  return self
}

beforeEach(() => {
  mocks.mockFrom.mockReset()
})

describe('absencesService.listByEmployee', () => {
  it('filtra por employee_id y business_id, ordena desc', async () => {
    const { absencesService } = await import('@/lib/services/absences')
    const chain = buildChain({ data: [{ id: 'a1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await absencesService.listByEmployee('e1', 'b1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('employee_absences')
    expect(chain.eq).toHaveBeenCalledWith('employee_id', 'e1')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toHaveLength(1)
  })

  it('retorna [] cuando data es null', async () => {
    const { absencesService } = await import('@/lib/services/absences')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await absencesService.listByEmployee('e1', 'b1')
    expect(result).toEqual([])
  })

  it('lanza error si supabase falla', async () => {
    const { absencesService } = await import('@/lib/services/absences')
    const chain = buildChain({ data: null, error: { message: 'fail' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(absencesService.listByEmployee('e1', 'b1')).rejects.toBeTruthy()
  })
})

describe('absencesService.listByBusiness', () => {
  it('filtra solo por business_id', async () => {
    const { absencesService } = await import('@/lib/services/absences')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await absencesService.listByBusiness('b1')

    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

describe('absencesService.countAffectedAppointments', () => {
  it('cuenta citas no canceladas en el rango', async () => {
    const { absencesService } = await import('@/lib/services/absences')
    const chain = buildChain({ count: 3, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await absencesService.countAffectedAppointments('e1', 'b1', '2026-04-21', '2026-04-25')

    expect(mocks.mockFrom).toHaveBeenCalledWith('appointments')
    expect(chain.select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    expect(chain.eq).toHaveBeenCalledWith('employee_id', 'e1')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.gte).toHaveBeenCalledWith('start_time', '2026-04-21')
    expect(chain.lte).toHaveBeenCalledWith('start_time', '2026-04-25')
    expect(chain.neq).toHaveBeenCalledWith('status', 'cancelled')
    expect(result).toBe(3)
  })

  it('retorna 0 cuando count es null', async () => {
    const { absencesService } = await import('@/lib/services/absences')
    const chain = buildChain({ count: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await absencesService.countAffectedAppointments('e1', 'b1', 'a', 'b')
    expect(result).toBe(0)
  })
})

describe('absencesService.getAffectedAppointments', () => {
  it('obtiene appointments afectados con joins', async () => {
    const { absencesService } = await import('@/lib/services/absences')
    const chain = buildChain({ data: [{ id: 'apt-1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await absencesService.getAffectedAppointments('e1', 'b1', 'a', 'b')

    expect(chain.eq).toHaveBeenCalledWith('employee_id', 'e1')
    expect(chain.neq).toHaveBeenCalledWith('status', 'cancelled')
    expect(result).toHaveLength(1)
  })
})
