import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { from: (...args: unknown[]) => mocks.mockFrom(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@/lib/normalizers', () => ({
  normalizeBusiness: (row: Record<string, unknown> | null) =>
    row ? { ...row, normalized: true } : null,
}))

vi.mock('@/lib/errors', () => ({
  throwIfError: (error: unknown) => {
    if (error) throw error
  },
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

describe('businessesService._buildDbUpdates', () => {
  it('mapea campos escalares definidos a null cuando son undefined→null', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const result = businessesService._buildDbUpdates({
      name: 'Mi Negocio',
      phone: null as unknown as string,
      legal_entity_type: 'company',
    } as never)
    expect(result.name).toBe('Mi Negocio')
    expect(result.phone).toBeNull()
    expect(result.legal_entity_type).toBe('company')
  })

  it('omite campos no presentes', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const result = businessesService._buildDbUpdates({ name: 'X' } as never)
    expect('phone' in result).toBe(false)
    expect('email' in result).toBe(false)
  })

  it('mapea is_active boolean', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const result = businessesService._buildDbUpdates({ is_active: false } as never)
    expect(result.is_active).toBe(false)
  })

  it('mapea business_hours y settings como Json', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const hours = { monday: '9-17' }
    const settings = { theme: 'dark' }
    const result = businessesService._buildDbUpdates({
      business_hours: hours,
      settings,
    } as never)
    expect(result.business_hours).toEqual(hours)
    expect(result.settings).toEqual(settings)
  })
})

describe('businessesService.list', () => {
  it('filtra por activeOnly=true por defecto y ordena por created_at desc', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: [{ id: '1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await businessesService.list({ ownerId: 'u1' })

    expect(mocks.mockFrom).toHaveBeenCalledWith('businesses')
    expect(chain.eq).toHaveBeenCalledWith('owner_id', 'u1')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('usa .in() cuando ids tiene elementos', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await businessesService.list({ ids: ['a', 'b'] })

    expect(chain.in).toHaveBeenCalledWith('id', ['a', 'b'])
  })

  it('omite is_active filter cuando activeOnly=false', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await businessesService.list({ ownerId: 'u1', activeOnly: false })

    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls.find(c => c[0] === 'is_active')).toBeUndefined()
  })

  it('aplica normalize a cada row', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: [{ id: '1' }, { id: '2' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await businessesService.list()
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ normalized: true })
  })
})

describe('businessesService.listByEmployee', () => {
  it('consulta business_employees con status=approved', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({
      data: [{ businesses: { id: 'b1' } }, { businesses: null }],
      error: null,
    })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await businessesService.listByEmployee('emp-1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('business_employees')
    expect(chain.eq).toHaveBeenCalledWith('employee_id', 'emp-1')
    expect(chain.eq).toHaveBeenCalledWith('status', 'approved')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'b1', normalized: true })
  })
})

describe('businessesService.get', () => {
  it('obtiene negocio por id y normaliza', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: { id: 'b1', name: 'X' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await businessesService.get('b1')

    expect(chain.eq).toHaveBeenCalledWith('id', 'b1')
    expect(chain.single).toHaveBeenCalled()
    expect(result).toMatchObject({ id: 'b1', normalized: true })
  })
})

describe('businessesService.create', () => {
  it('inserta con slug generado y defaults', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({
      data: { id: 'b1', name: 'Café Día á la Niño' },
      error: null,
    })
    mocks.mockFrom.mockReturnValue(chain)

    await businessesService.create({
      name: 'Café Día á la Niño',
      owner_id: 'u1',
    } as never)

    const insertArg = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertArg.name).toBe('Café Día á la Niño')
    expect(insertArg.slug).toBe('cafe-dia-a-la-nino') // slugify removes accents
    expect(insertArg.resource_model).toBe('professional')
    expect(insertArg.legal_entity_type).toBe('individual')
    expect(insertArg.is_active).toBe(true)
    expect(insertArg.owner_id).toBe('u1')
  })

  it('respeta resource_model y legal_entity_type proporcionados', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: { id: 'b1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await businessesService.create({
      name: 'Hotel',
      owner_id: 'u1',
      resource_model: 'physical_resource',
      legal_entity_type: 'company',
    } as never)

    const insertArg = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertArg.resource_model).toBe('physical_resource')
    expect(insertArg.legal_entity_type).toBe('company')
  })
})

describe('businessesService.update', () => {
  it('actualiza usando _buildDbUpdates', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: { id: 'b1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await businessesService.update('b1', { name: 'Nuevo' })

    const updateArg = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateArg.name).toBe('Nuevo')
    expect(chain.eq).toHaveBeenCalledWith('id', 'b1')
  })
})

describe('businessesService.remove', () => {
  it('elimina por id', async () => {
    const { businessesService } = await import('@/lib/services/businesses')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await businessesService.remove('b1')

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'b1')
  })
})
