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

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'ilike', 'order']
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

describe('clientsService.list', () => {
  it('lista clientes sin filtros y ordena por name', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: [{ id: '1' }, { id: '2' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await clientsService.list()

    expect(mocks.mockFrom).toHaveBeenCalledWith('clients')
    expect(chain.order).toHaveBeenCalledWith('name')
    expect(result).toHaveLength(2)
  })

  it('filtra por businessId cuando se proporciona', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await clientsService.list({ businessId: 'biz-1' })

    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1')
  })

  it('aplica búsqueda ilike por name', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await clientsService.list({ search: 'Juan' })

    expect(chain.ilike).toHaveBeenCalledWith('name', '%Juan%')
  })

  it('lanza error cuando supabase devuelve error', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: null, error: { message: 'fail' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(clientsService.list()).rejects.toBeTruthy()
  })

  it('retorna [] cuando data es null', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await clientsService.list()
    expect(result).toEqual([])
  })
})

describe('clientsService.get', () => {
  it('obtiene cliente por id usando .single()', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: { id: 'c1', name: 'Ana' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await clientsService.get('c1')

    expect(chain.eq).toHaveBeenCalledWith('id', 'c1')
    expect(chain.single).toHaveBeenCalled()
    expect(result).toEqual({ id: 'c1', name: 'Ana' })
  })

  it('lanza error en get si supabase falla', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: null, error: { message: 'not found' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(clientsService.get('x')).rejects.toBeTruthy()
  })
})

describe('clientsService.create', () => {
  it('inserta y retorna cliente creado', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: { id: 'c1', name: 'Pedro' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await clientsService.create({ name: 'Pedro' } as never)

    expect(chain.insert).toHaveBeenCalledWith({ name: 'Pedro' })
    expect(result).toEqual({ id: 'c1', name: 'Pedro' })
  })
})

describe('clientsService.update', () => {
  it('actualiza por id y retorna actualizado', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: { id: 'c1', name: 'Updated' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await clientsService.update('c1', { name: 'Updated' })

    expect(chain.update).toHaveBeenCalledWith({ name: 'Updated' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'c1')
    expect(result).toEqual({ id: 'c1', name: 'Updated' })
  })
})

describe('clientsService.remove', () => {
  it('elimina por id', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await clientsService.remove('c1')

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'c1')
  })

  it('lanza error si remove falla', async () => {
    const { clientsService } = await import('@/lib/services/clients')
    const chain = buildChain({ data: null, error: { message: 'fk_violation' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(clientsService.remove('c1')).rejects.toBeTruthy()
  })
})
