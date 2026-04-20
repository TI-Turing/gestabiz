import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// MOCKS
// ============================================================================

const mockFrom = vi.fn()
const mockInvoke = vi.fn()
const mockStartSpan = vi.fn((_opts: unknown, fn: () => unknown) => fn())

const supabaseMock = {
  from: (...args: unknown[]) => mockFrom(...args),
  functions: {
    invoke: (...args: unknown[]) => mockInvoke(...args),
  },
}

vi.mock('@/lib/supabase', () => ({
  supabase: supabaseMock,
  default: supabaseMock,
}))

vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
  startSpan: (...args: unknown[]) => mockStartSpan(...args as Parameters<typeof mockStartSpan>),
  captureException: vi.fn(),
}))

vi.mock('@/lib/normalizers', () => ({
  normalizeAppointment: (row: Record<string, unknown>) => ({ ...row }),
  toDbAppointmentStatus: (s: string) => s,
}))

// ============================================================================
// HELPERS
// ============================================================================

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const chainMethods = [
    'select', 'update', 'delete', 'insert', 'eq', 'neq',
    'in', 'not', 'is', 'lt', 'gt', 'lte', 'gte', 'order',
    'limit', 'range',
  ]
  for (const m of chainMethods) {
    ;(self as Record<string, unknown>)[m] = vi.fn().mockReturnValue(self)
  }
  ;(self as Record<string, unknown>).single = vi.fn().mockResolvedValue(resolvedValue)
  ;(self as Record<string, unknown>).maybeSingle = vi.fn().mockResolvedValue(resolvedValue)
  // Para await directo sobre el query
  ;(self as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) => resolve(resolvedValue)
  return self
}

beforeEach(() => {
  mockFrom.mockReset()
  mockInvoke.mockReset()
  mockStartSpan.mockClear()
})

// ============================================================================
// TESTS
// ============================================================================

describe('appointmentsService.list', () => {
  it('aplica filtros businessId/employeeId/clientId', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.list({
      businessId: 'b1',
      employeeId: 'e1',
      clientId: 'c1',
    })

    expect(mockFrom).toHaveBeenCalledWith('appointments')
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.eq).toHaveBeenCalledWith('employee_id', 'e1')
    expect(chain.eq).toHaveBeenCalledWith('client_id', 'c1')
  })

  it('aplica dateRange con gte/lte', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.list({ dateRange: { start: '2025-01-01', end: '2025-01-31' } })

    expect(chain.gte).toHaveBeenCalledWith('start_time', '2025-01-01')
    expect(chain.lte).toHaveBeenCalledWith('start_time', '2025-01-31')
  })

  it('aplica status con .in()', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.list({ status: ['scheduled', 'confirmed'] })

    expect(chain.in).toHaveBeenCalledWith('status', ['scheduled', 'confirmed'])
  })

  it('aplica orden ascendente por defecto', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.list()

    expect(chain.order).toHaveBeenCalledWith('start_time', { ascending: true })
  })

  it('aplica orden descendente', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.list({ order: 'desc' })

    expect(chain.order).toHaveBeenCalledWith('start_time', { ascending: false })
  })

  it('aplica limit cuando no hay offset', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.list({ limit: 25 })

    expect(chain.limit).toHaveBeenCalledWith(25)
  })

  it('aplica range cuando hay offset', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.list({ offset: 10, limit: 5 })

    expect(chain.range).toHaveBeenCalledWith(10, 14)
  })

  it('lanza si la query devuelve error', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: null, error: { message: 'fail' } })
    mockFrom.mockReturnValue(chain)

    await expect(appointmentsService.list()).rejects.toBeDefined()
  })

  it('retorna array normalizado', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [{ id: 'a' }, { id: 'b' }], error: null })
    mockFrom.mockReturnValue(chain)

    const result = await appointmentsService.list()
    expect(result).toHaveLength(2)
  })
})

describe('appointmentsService.get', () => {
  it('llama eq(id) y single', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: { id: 'a1' }, error: null })
    mockFrom.mockReturnValue(chain)

    const r = await appointmentsService.get('a1')
    expect(chain.eq).toHaveBeenCalledWith('id', 'a1')
    expect(chain.single).toHaveBeenCalled()
    expect(r).toBeTruthy()
  })

  it('lanza error si falla', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: null, error: { message: 'nope' } })
    mockFrom.mockReturnValue(chain)

    await expect(appointmentsService.get('a1')).rejects.toBeDefined()
  })
})

describe('appointmentsService.remove', () => {
  it('llama delete().eq(id)', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentsService.remove('a1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'a1')
  })

  it('lanza error si delete falla', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: null, error: { message: 'fail' } })
    mockFrom.mockReturnValue(chain)

    await expect(appointmentsService.remove('a1')).rejects.toBeDefined()
  })
})

describe('appointmentsService._buildDbUpdates', () => {
  it('mapea description a notes y notes a client_notes', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const result = appointmentsService._buildDbUpdates({
      description: 'desc',
      notes: 'client n',
    })
    expect(result.notes).toBe('desc')
    expect(result.client_notes).toBe('client n')
  })

  it('prefiere employee_id sobre user_id', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const result = appointmentsService._buildDbUpdates({
      employee_id: 'e1',
      user_id: 'u1',
    })
    expect(result.employee_id).toBe('e1')
  })

  it('usa user_id solo si employee_id ausente', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const result = appointmentsService._buildDbUpdates({ user_id: 'u1' })
    expect(result.employee_id).toBe('u1')
  })

  it('convierte location_id null cuando se pasa null', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const result = appointmentsService._buildDbUpdates({ location_id: null as unknown as string })
    expect(result.location_id).toBeNull()
  })

  it('omite campos no proporcionados', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const result = appointmentsService._buildDbUpdates({})
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('mapea reminder_sent y price', async () => {
    const { appointmentsService } = await import('@/lib/services/appointments')
    const result = appointmentsService._buildDbUpdates({
      reminder_sent: true,
      price: 50000,
      currency: 'COP',
    })
    expect(result.reminder_sent).toBe(true)
    expect(result.price).toBe(50000)
    expect(result.currency).toBe('COP')
  })
})

describe('appointmentDetailsService.list', () => {
  it('consulta tabla appointment_details', async () => {
    const { appointmentDetailsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentDetailsService.list()
    expect(mockFrom).toHaveBeenCalledWith('appointment_details')
  })

  it('aplica filtros básicos', async () => {
    const { appointmentDetailsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    await appointmentDetailsService.list({ businessId: 'b1', clientId: 'c1' })
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.eq).toHaveBeenCalledWith('client_id', 'c1')
  })

  it('mapea campos extra (service_name, employee_name, location_name)', async () => {
    const { appointmentDetailsService } = await import('@/lib/services/appointments')
    const chain = buildChain({
      data: [{ id: 'a1', service_name: 'Corte', employee_name: 'Ana', location_name: 'Sede 1', business_name: 'Biz', service_price: 100 }],
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    const result = await appointmentDetailsService.list()
    expect(result[0].service_name).toBe('Corte')
    expect(result[0].employee_name).toBe('Ana')
    expect(result[0].location_name).toBe('Sede 1')
    expect(result[0].business_name).toBe('Biz')
    expect(result[0].service_price).toBe(100)
  })
})

describe('appointmentDetailsService.get', () => {
  it('consulta por id', async () => {
    const { appointmentDetailsService } = await import('@/lib/services/appointments')
    const chain = buildChain({ data: { id: 'a1', service_name: 'X' }, error: null })
    mockFrom.mockReturnValue(chain)

    const r = await appointmentDetailsService.get('a1')
    expect(chain.eq).toHaveBeenCalledWith('id', 'a1')
    expect(r?.service_name).toBe('X')
  })
})
