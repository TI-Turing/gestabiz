import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { from: (...args: unknown[]) => mocks.mockFrom(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'gte', 'lte']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.then = (resolve: (v: unknown) => unknown) => resolve(resolvedValue)
  return self
}

beforeEach(() => {
  mocks.mockFrom.mockReset()
})

describe('statsService.getDashboardStats', () => {
  it('retorna stats vacíos cuando no hay appointments', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const aptChain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValueOnce(aptChain)

    const result = await statsService.getDashboardStats({ businessId: 'b1' })

    expect(mocks.mockFrom).toHaveBeenCalledWith('appointments')
    expect(aptChain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(result.total_appointments).toBe(0)
    expect(result.completed_appointments).toBe(0)
    expect(result.revenue_total).toBe(0)
    expect(result.average_appointment_value).toBe(0)
    expect(result.popular_services).toEqual([])
  })

  it('lanza error cuando query de appointments falla', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const aptChain = buildChain({ data: null, error: { message: 'denied' } })
    mocks.mockFrom.mockReturnValueOnce(aptChain)

    await expect(statsService.getDashboardStats({ businessId: 'b1' })).rejects.toBeTruthy()
  })

  it('agrega counts por status correctamente', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const appointments = [
      { service_id: 's1', start_time: '2026-04-21T10:00:00Z', status: 'completed', price: 100, employee_id: 'e1', location_id: 'loc1' },
      { service_id: 's1', start_time: '2026-04-21T11:00:00Z', status: 'completed', price: 50, employee_id: 'e1', location_id: 'loc1' },
      { service_id: 's2', start_time: '2026-04-21T12:00:00Z', status: 'cancelled', price: 0, employee_id: 'e2', location_id: 'loc2' },
      { service_id: 's2', start_time: '2026-04-21T13:00:00Z', status: 'no_show', price: 0, employee_id: 'e2', location_id: 'loc2' },
      { service_id: 's1', start_time: '2026-04-21T14:00:00Z', status: 'scheduled', price: 0, employee_id: 'e1', location_id: 'loc1' },
    ]
    const aptChain = buildChain({ data: appointments, error: null })
    const servicesChain = buildChain({ data: [{ id: 's1', name: 'Corte' }, { id: 's2', name: 'Tinte' }], error: null })
    const profilesChain = buildChain({ data: [{ id: 'e1', full_name: 'Ana' }, { id: 'e2', full_name: 'Bob' }], error: null })
    const locationsChain = buildChain({ data: [{ id: 'loc1', name: 'Sede 1' }, { id: 'loc2', name: 'Sede 2' }], error: null })

    mocks.mockFrom
      .mockReturnValueOnce(aptChain)
      .mockReturnValueOnce(servicesChain)
      .mockReturnValueOnce(profilesChain)
      .mockReturnValueOnce(locationsChain)

    const result = await statsService.getDashboardStats({ businessId: 'b1' })

    expect(result.total_appointments).toBe(5)
    expect(result.completed_appointments).toBe(2)
    expect(result.cancelled_appointments).toBe(1)
    expect(result.no_show_appointments).toBe(1)
    expect(result.scheduled_appointments).toBe(1)
    expect(result.revenue_total).toBe(150)
    expect(result.average_appointment_value).toBe(75)

    // Popular services: s1 has 3, s2 has 2
    expect(result.popular_services[0]).toEqual({ service: 'Corte', count: 3, revenue: 150 })
    expect(result.popular_services[1]).toEqual({ service: 'Tinte', count: 2, revenue: 0 })

    // Employee performance: e1 has 3 (2 completed, $150), e2 has 2 (0 completed, $0)
    expect(result.employee_performance).toHaveLength(2)
    expect(result.employee_performance[0]).toMatchObject({
      employee_name: 'Ana',
      total_appointments: 3,
      completed_appointments: 2,
      revenue: 150,
    })

    // Location performance
    expect(result.location_performance[0]).toMatchObject({
      location_name: 'Sede 1',
      total_appointments: 3,
      revenue: 150,
    })
  })

  it('resuelve businessIds desde ownerId cuando no hay businessId', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const businessesChain = buildChain({ data: [{ id: 'b1' }, { id: 'b2' }], error: null })
    const aptChain = buildChain({ data: [], error: null })

    mocks.mockFrom
      .mockReturnValueOnce(businessesChain)
      .mockReturnValueOnce(aptChain)

    await statsService.getDashboardStats({ ownerId: 'owner-1' })

    expect(mocks.mockFrom).toHaveBeenNthCalledWith(1, 'businesses')
    expect(businessesChain.eq).toHaveBeenCalledWith('owner_id', 'owner-1')
    expect(mocks.mockFrom).toHaveBeenNthCalledWith(2, 'appointments')
    expect(aptChain.in).toHaveBeenCalledWith('business_id', ['b1', 'b2'])
  })

  it('resuelve businessIds desde employeeId con status approved', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const employeeChain = buildChain({ data: [{ business_id: 'b1' }], error: null })
    const aptChain = buildChain({ data: [], error: null })

    mocks.mockFrom
      .mockReturnValueOnce(employeeChain)
      .mockReturnValueOnce(aptChain)

    await statsService.getDashboardStats({ employeeId: 'emp-1' })

    expect(mocks.mockFrom).toHaveBeenNthCalledWith(1, 'business_employees')
    expect(employeeChain.eq).toHaveBeenCalledWith('employee_id', 'emp-1')
    expect(employeeChain.eq).toHaveBeenCalledWith('status', 'approved')
    expect(aptChain.in).toHaveBeenCalledWith('business_id', ['b1'])
  })

  it('lanza error si resolveBusinessIds desde ownerId falla', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const businessesChain = buildChain({ data: null, error: { message: 'fail' } })
    mocks.mockFrom.mockReturnValueOnce(businessesChain)

    await expect(statsService.getDashboardStats({ ownerId: 'owner-1' })).rejects.toBeTruthy()
  })

  it('respeta dateRange custom', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const aptChain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValueOnce(aptChain)

    await statsService.getDashboardStats({
      businessId: 'b1',
      dateRange: { start: '2026-01-01T00:00:00Z', end: '2026-01-31T23:59:59Z' },
    })

    expect(aptChain.gte).toHaveBeenCalledWith('start_time', '2026-01-01T00:00:00Z')
    expect(aptChain.lte).toHaveBeenCalledWith('start_time', '2026-01-31T23:59:59Z')
  })

  it('usa employee_id como fallback cuando no hay user_id en aggregateEmployee', async () => {
    const { statsService } = await import('@/lib/services/stats')
    const appointments = [
      { service_id: null, start_time: '2026-04-21T10:00:00Z', status: 'completed', price: 100, location_id: null },
    ]
    const aptChain = buildChain({ data: appointments, error: null })
    mocks.mockFrom.mockReturnValueOnce(aptChain)

    const result = await statsService.getDashboardStats({ businessId: 'b1' })

    // service_id null → no popular_services entry; location_id null → no location_performance; employee_id missing → none
    expect(result.popular_services).toEqual([])
    expect(result.location_performance).toEqual([])
    expect(result.employee_performance).toEqual([])
    // popular_times still aggregated by hour
    expect(result.popular_times).toHaveLength(1)
  })
})
