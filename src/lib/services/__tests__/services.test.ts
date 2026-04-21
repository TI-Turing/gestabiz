import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { from: (...args: unknown[]) => mocks.mockFrom(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@/lib/normalizers', () => ({
  normalizeService: (row: Record<string, unknown>) => ({ ...row }),
}))

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order']
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

describe('servicesService.list', () => {
  it('filtra por is_active=true por defecto', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: [{ id: 's1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.list({ businessId: 'b1' })

    expect(mocks.mockFrom).toHaveBeenCalledWith('services')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.order).toHaveBeenCalledWith('name')
  })

  it('omite is_active cuando activeOnly=false', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.list({ activeOnly: false })

    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls.find(c => c[0] === 'is_active')).toBeUndefined()
  })

  it('usa .in() con businessIds', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.list({ businessIds: ['b1', 'b2'] })

    expect(chain.in).toHaveBeenCalledWith('business_id', ['b1', 'b2'])
  })

  it('lanza error si query falla', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: null, error: new Error('boom') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(servicesService.list({})).rejects.toThrow('boom')
  })

  it('retorna [] cuando data es null', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await servicesService.list({})
    expect(result).toEqual([])
  })
})

describe('servicesService.get', () => {
  it('consulta por id', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: { id: 's1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await servicesService.get('s1')
    expect(chain.eq).toHaveBeenCalledWith('id', 's1')
    expect(result).toEqual({ id: 's1' })
  })

  it('lanza error si falla', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: null, error: new Error('x') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(servicesService.get('s1')).rejects.toThrow('x')
  })
})

describe('servicesService.create', () => {
  it('mapea duration a duration_minutes y aplica defaults', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: { id: 'new' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.create({
      business_id: 'b1',
      name: 'Corte',
      duration: 30,
      price: 50000,
      is_active: true,
    } as Parameters<typeof servicesService.create>[0])

    const insertCall = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertCall.duration_minutes).toBe(30)
    expect(insertCall.currency).toBe('COP')
    expect(insertCall.description).toBeNull()
    expect(insertCall.category).toBeNull()
    expect(insertCall.name).toBe('Corte')
  })

  it('usa currency proporcionado si existe', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: { id: 'new' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.create({
      business_id: 'b1',
      name: 'X',
      duration: 60,
      price: 100,
      currency: 'USD',
      is_active: true,
    } as Parameters<typeof servicesService.create>[0])

    const insertCall = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertCall.currency).toBe('USD')
  })
})

describe('servicesService.update', () => {
  it('mapea duration a duration_minutes', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: { id: 's1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.update('s1', { duration: 45 })

    const updateCall = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.duration_minutes).toBe(45)
    expect(updateCall.name).toBeUndefined()
  })

  it('omite campos no proporcionados', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: { id: 's1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.update('s1', { name: 'Nuevo' })

    const updateCall = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.name).toBe('Nuevo')
    expect(updateCall.duration_minutes).toBeUndefined()
    expect(updateCall.price).toBeUndefined()
  })

  it('aplica defaults para currency null y description null', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: { id: 's1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.update('s1', { currency: undefined, description: undefined })

    const updateCall = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.currency).toBeUndefined()
    expect(updateCall.description).toBeUndefined()
  })
})

describe('servicesService.remove', () => {
  it('elimina por id', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await servicesService.remove('s1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 's1')
  })

  it('lanza error si delete falla', async () => {
    const { servicesService } = await import('@/lib/services/services')
    const chain = buildChain({ data: null, error: new Error('fk') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(servicesService.remove('s1')).rejects.toThrow('fk')
  })
})
