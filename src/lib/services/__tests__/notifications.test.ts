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
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.then = (resolve: (v: unknown) => unknown) => resolve(resolvedValue)
  return self
}

beforeEach(() => {
  mocks.mockFrom.mockReset()
})

describe('notificationsService.listByUser', () => {
  it('lista notificaciones de un usuario ordenadas desc con limit por defecto', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: [{ id: 'n1' }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await notificationsService.listByUser('u1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('in_app_notifications')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(50)
    expect(result).toHaveLength(1)
  })

  it('respeta limit personalizado', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await notificationsService.listByUser('u1', 10)
    expect(chain.limit).toHaveBeenCalledWith(10)
  })

  it('retorna [] cuando data es null', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await notificationsService.listByUser('u1')
    expect(result).toEqual([])
  })

  it('lanza error si supabase devuelve error', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: null, error: { message: 'fail' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(notificationsService.listByUser('u1')).rejects.toBeTruthy()
  })
})

describe('notificationsService.markAsRead', () => {
  it('actualiza status a read filtrando por id', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await notificationsService.markAsRead('n1')
    expect(chain.update).toHaveBeenCalledWith({ status: 'read' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'n1')
  })

  it('lanza error si update falla', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: null, error: { message: 'no row' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(notificationsService.markAsRead('n1')).rejects.toBeTruthy()
  })
})

describe('notificationsService.markAllAsRead', () => {
  it('actualiza todas las unread a read para el usuario', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await notificationsService.markAllAsRead('u1')
    expect(chain.update).toHaveBeenCalledWith({ status: 'read' })
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(chain.eq).toHaveBeenCalledWith('status', 'unread')
  })
})

describe('notificationsService.delete', () => {
  it('elimina por id', async () => {
    const { notificationsService } = await import('@/lib/services/notifications')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await notificationsService.delete('n1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'n1')
  })
})
