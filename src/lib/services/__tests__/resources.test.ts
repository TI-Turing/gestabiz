import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = {
    from: (...args: unknown[]) => mocks.mockFrom(...args),
    rpc: (...args: unknown[]) => mocks.mockRpc(...args),
  }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'gte', 'lte', 'order']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.single = vi.fn().mockResolvedValue(resolvedValue)
  self.then = (resolve: (v: unknown) => unknown) => resolve(resolvedValue)
  return self
}

beforeEach(() => {
  mocks.mockFrom.mockReset()
  mocks.mockRpc.mockReset()
})

describe('resourcesService.getByBusinessId', () => {
  it('lista recursos del negocio activos ordenados por name', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: [{ id: 'r1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await resourcesService.getByBusinessId('b1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('business_resources')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    expect(chain.order).toHaveBeenCalledWith('name')
    expect(result).toHaveLength(1)
  })

  it('retorna [] cuando data es null', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await resourcesService.getByBusinessId('b1')
    expect(result).toEqual([])
  })

  it('lanza error cuando supabase falla', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: null, error: { message: 'fail' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(resourcesService.getByBusinessId('b1')).rejects.toBeTruthy()
  })
})

describe('resourcesService.getByLocationId', () => {
  it('filtra por location_id y is_active', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await resourcesService.getByLocationId('loc-1')
    expect(chain.eq).toHaveBeenCalledWith('location_id', 'loc-1')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
  })
})

describe('resourcesService.getByType', () => {
  it('filtra por business_id, resource_type y is_active', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await resourcesService.getByType('b1', 'room')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.eq).toHaveBeenCalledWith('resource_type', 'room')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
  })
})

describe('resourcesService.getById', () => {
  it('obtiene por id usando .single()', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: { id: 'r1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await resourcesService.getById('r1')
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
    expect(chain.single).toHaveBeenCalled()
    expect(result).toEqual({ id: 'r1' })
  })
})

describe('resourcesService.create', () => {
  it('inserta recurso y retorna creado', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: { id: 'r1', name: 'Sala' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await resourcesService.create({ name: 'Sala' } as never)
    expect(chain.insert).toHaveBeenCalledWith({ name: 'Sala' })
    expect(result).toEqual({ id: 'r1', name: 'Sala' })
  })
})

describe('resourcesService.update', () => {
  it('actualiza por id', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: { id: 'r1', name: 'Nuevo' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await resourcesService.update('r1', { name: 'Nuevo' } as never)
    expect(chain.update).toHaveBeenCalledWith({ name: 'Nuevo' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
    expect(result).toEqual({ id: 'r1', name: 'Nuevo' })
  })
})

describe('resourcesService.delete (soft delete)', () => {
  it('marca is_active=false', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await resourcesService.delete('r1')
    expect(chain.update).toHaveBeenCalledWith({ is_active: false })
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
  })
})

describe('resourcesService.deletePermanently', () => {
  it('hace delete real por id', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await resourcesService.deletePermanently('r1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
  })
})

describe('resourcesService.getAvailability', () => {
  it('consulta appointments por resource_id, status pendientes y rango', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({
      data: [{ start_time: '2026-04-21T10:00:00Z', end_time: '2026-04-21T11:00:00Z', status: 'confirmed' }],
      error: null,
    })
    mocks.mockFrom.mockReturnValue(chain)

    const start = new Date('2026-04-20T00:00:00Z')
    const end = new Date('2026-04-30T00:00:00Z')
    const result = await resourcesService.getAvailability('r1', start, end)

    expect(mocks.mockFrom).toHaveBeenCalledWith('appointments')
    expect(chain.eq).toHaveBeenCalledWith('resource_id', 'r1')
    expect(chain.in).toHaveBeenCalledWith('status', ['pending', 'confirmed'])
    expect(chain.gte).toHaveBeenCalledWith('start_time', start.toISOString())
    expect(chain.lte).toHaveBeenCalledWith('start_time', end.toISOString())
    expect(result).toHaveLength(1)
  })

  it('retorna [] cuando data es null', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await resourcesService.getAvailability('r1', new Date(), new Date())
    expect(result).toEqual([])
  })
})

describe('resourcesService.isAvailable', () => {
  it('llama RPC is_resource_available y retorna boolean', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    mocks.mockRpc.mockResolvedValue({ data: true, error: null })

    const result = await resourcesService.isAvailable(
      'r1',
      new Date('2026-04-21T10:00:00Z'),
      new Date('2026-04-21T11:00:00Z')
    )

    expect(mocks.mockRpc).toHaveBeenCalledWith('is_resource_available', expect.objectContaining({
      p_resource_id: 'r1',
      p_exclude_appointment_id: null,
    }))
    expect(result).toBe(true)
  })

  it('pasa excludeAppointmentId cuando se proporciona', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    mocks.mockRpc.mockResolvedValue({ data: false, error: null })

    await resourcesService.isAvailable('r1', new Date(), new Date(), 'apt-99')
    const args = mocks.mockRpc.mock.calls[0][1]
    expect(args.p_exclude_appointment_id).toBe('apt-99')
  })
})

describe('resourcesService.assignServices', () => {
  it('elimina existentes e inserta nuevos con custom_price', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const deleteChain = buildChain({ data: null, error: null })
    const insertChain = buildChain({ data: null, error: null })
    mocks.mockFrom
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain)

    await resourcesService.assignServices('r1', ['s1', 's2'], { s1: 100 })

    expect(deleteChain.delete).toHaveBeenCalled()
    expect(deleteChain.eq).toHaveBeenCalledWith('resource_id', 'r1')
    const insertedRecords = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertedRecords).toHaveLength(2)
    expect(insertedRecords[0]).toEqual({
      resource_id: 'r1',
      service_id: 's1',
      custom_price: 100,
      is_active: true,
    })
    expect(insertedRecords[1].custom_price).toBeNull()
  })
})

describe('resourcesService.getServices', () => {
  it('filtra por resource_id e is_active', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    const chain = buildChain({ data: [{ id: 'rs1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await resourcesService.getServices('r1')
    expect(chain.eq).toHaveBeenCalledWith('resource_id', 'r1')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
  })
})

describe('resourcesService.getStats', () => {
  it('llama RPC get_resource_stats', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    mocks.mockRpc.mockResolvedValue({
      data: { total_bookings: 5, upcoming_bookings: 2, completed_bookings: 3, revenue_total: 100, revenue_this_month: 50 },
      error: null,
    })

    const result = await resourcesService.getStats('r1')
    expect(mocks.mockRpc).toHaveBeenCalledWith('get_resource_stats', { p_resource_id: 'r1' })
    expect(result.total_bookings).toBe(5)
  })

  it('retorna defaults cuando data es null', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    mocks.mockRpc.mockResolvedValue({ data: null, error: null })

    const result = await resourcesService.getStats('r1')
    expect(result).toEqual({
      total_bookings: 0,
      upcoming_bookings: 0,
      completed_bookings: 0,
      revenue_total: 0,
      revenue_this_month: 0,
    })
  })
})

describe('resourcesService.refreshAvailability', () => {
  it('llama RPC refresh_resource_availability', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    mocks.mockRpc.mockResolvedValue({ data: null, error: null })

    await resourcesService.refreshAvailability()
    expect(mocks.mockRpc).toHaveBeenCalledWith('refresh_resource_availability')
  })

  it('lanza error si RPC falla', async () => {
    const { resourcesService } = await import('@/lib/services/resources')
    mocks.mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

    await expect(resourcesService.refreshAvailability()).rejects.toBeTruthy()
  })
})
