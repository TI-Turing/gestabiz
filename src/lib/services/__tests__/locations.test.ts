import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { from: (...args: unknown[]) => mocks.mockFrom(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@/lib/normalizers', () => ({
  normalizeLocation: (row: Record<string, unknown>) => ({ ...row }),
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

describe('locationsService.list', () => {
  it('filtra por activeOnly por defecto', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: [{ id: '1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await locationsService.list({ businessId: 'b1' })

    expect(mocks.mockFrom).toHaveBeenCalledWith('locations')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(chain.order).toHaveBeenCalledWith('name')
  })

  it('omite filtro is_active cuando activeOnly=false', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await locationsService.list({ businessId: 'b1', activeOnly: false })

    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls.find(c => c[0] === 'is_active')).toBeUndefined()
  })

  it('usa .in() cuando businessIds tiene elementos', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await locationsService.list({ businessIds: ['a', 'b'] })

    expect(chain.in).toHaveBeenCalledWith('business_id', ['a', 'b'])
  })

  it('prefiere businessIds sobre businessId', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await locationsService.list({ businessId: 'x', businessIds: ['a'] })

    expect(chain.in).toHaveBeenCalledWith('business_id', ['a'])
    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls.find(c => c[0] === 'business_id')).toBeUndefined()
  })

  it('retorna array normalizado', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: [{ id: '1', name: 'Sede 1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await locationsService.list({})

    expect(result).toEqual([{ id: '1', name: 'Sede 1' }])
  })

  it('retorna [] cuando data es null', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await locationsService.list({})

    expect(result).toEqual([])
  })

  it('lanza error si la query falla', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: null, error: new Error('db down') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(locationsService.list({})).rejects.toThrow('db down')
  })
})

describe('locationsService.get', () => {
  it('consulta por id con .single()', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: { id: 'l1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await locationsService.get('l1')

    expect(chain.eq).toHaveBeenCalledWith('id', 'l1')
    expect(chain.single).toHaveBeenCalled()
    expect(result).toEqual({ id: 'l1' })
  })

  it('lanza error si falla', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: null, error: new Error('not found') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(locationsService.get('x')).rejects.toThrow('not found')
  })
})

describe('locationsService.create', () => {
  it('inserta payload y retorna sede normalizada', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: { id: 'new', name: 'Nueva' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const payload = { name: 'Nueva', business_id: 'b1' } as Parameters<typeof locationsService.create>[0]
    const result = await locationsService.create(payload)

    expect(chain.insert).toHaveBeenCalledWith(payload)
    expect(chain.select).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
    expect(result).toEqual({ id: 'new', name: 'Nueva' })
  })

  it('lanza error si insert falla', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: null, error: new Error('rls') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(
      locationsService.create({} as Parameters<typeof locationsService.create>[0])
    ).rejects.toThrow('rls')
  })
})

describe('locationsService.update', () => {
  it('actualiza por id y retorna sede normalizada', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: { id: 'l1', name: 'Actualizada' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await locationsService.update('l1', { name: 'Actualizada' })

    expect(chain.update).toHaveBeenCalledWith({ name: 'Actualizada' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'l1')
    expect(result).toEqual({ id: 'l1', name: 'Actualizada' })
  })
})

describe('locationsService.remove', () => {
  it('elimina por id', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await locationsService.remove('l1')

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'l1')
  })

  it('lanza error si delete falla', async () => {
    const { locationsService } = await import('@/lib/services/locations')
    const chain = buildChain({ data: null, error: new Error('fk') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(locationsService.remove('l1')).rejects.toThrow('fk')
  })
})
