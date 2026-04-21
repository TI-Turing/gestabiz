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

vi.mock('@/lib/errors', () => ({
  throwIfError: (error: unknown) => {
    if (error) throw error
  },
}))

vi.mock('@/lib/queryConfig', () => ({
  PAGINATION: { CONVERSATIONS: 50, MESSAGES: 50, NOTIFICATIONS: 50, TRANSACTIONS: 100 },
}))

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit', 'range']
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

describe('chatService.listConversations', () => {
  it('lista conversaciones del usuario con limit por defecto', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({ data: [{ conversation_id: 'c1', unread_count: 0 }], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await chatService.listConversations('u1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('chat_participants')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(chain.limit).toHaveBeenCalledWith(50)
    expect(result).toHaveLength(1)
  })

  it('respeta limit personalizado', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await chatService.listConversations('u1', 10)
    expect(chain.limit).toHaveBeenCalledWith(10)
  })

  it('retorna [] cuando data es null', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await chatService.listConversations('u1')
    expect(result).toEqual([])
  })
})

describe('chatService.listMessages', () => {
  it('lista mensajes paginados ordenados desc y los reversa al final', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({
      data: [
        { id: 'm3', created_at: '2026-04-21T12:00:00Z' },
        { id: 'm2', created_at: '2026-04-21T11:00:00Z' },
        { id: 'm1', created_at: '2026-04-21T10:00:00Z' },
      ],
      error: null,
    })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await chatService.listMessages('c1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('messages')
    expect(chain.eq).toHaveBeenCalledWith('conversation_id', 'c1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(chain.range).toHaveBeenCalledWith(0, 49)
    // Should be reversed: oldest first
    expect((result as Array<{ id: string }>)[0].id).toBe('m1')
    expect((result as Array<{ id: string }>)[2].id).toBe('m3')
  })

  it('respeta offset y limit custom en .range()', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await chatService.listMessages('c1', 20, 40)
    expect(chain.range).toHaveBeenCalledWith(40, 59)
  })
})

describe('chatService.sendMessage', () => {
  it('rechaza contenido vacío', async () => {
    const { chatService } = await import('@/lib/services/chat')

    await expect(
      chatService.sendMessage({ conversation_id: 'c1', sender_id: 'u1', content: '   ' })
    ).rejects.toThrow(/vacío/)
  })

  it('rechaza contenido > 5000 caracteres', async () => {
    const { chatService } = await import('@/lib/services/chat')

    await expect(
      chatService.sendMessage({
        conversation_id: 'c1',
        sender_id: 'u1',
        content: 'x'.repeat(5001),
      })
    ).rejects.toThrow(/demasiado largo/)
  })

  it('inserta mensaje con type=text por defecto y trim', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({ data: { id: 'm1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await chatService.sendMessage({
      conversation_id: 'c1',
      sender_id: 'u1',
      content: '  Hola  ',
    })

    const insertArg = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertArg.content).toBe('Hola')
    expect(insertArg.type).toBe('text')
    expect(insertArg.metadata).toEqual({})
  })

  it('respeta type y metadata personalizados', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({ data: { id: 'm1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await chatService.sendMessage({
      conversation_id: 'c1',
      sender_id: 'u1',
      content: 'photo',
      type: 'image',
      metadata: { url: 'x.jpg' },
    })

    const insertArg = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(insertArg.type).toBe('image')
    expect(insertArg.metadata).toEqual({ url: 'x.jpg' })
  })
})

describe('chatService.getOrCreateDirectConversation', () => {
  it('llama RPC get_or_create_direct_conversation con args', async () => {
    const { chatService } = await import('@/lib/services/chat')
    mocks.mockRpc.mockResolvedValue({ data: { id: 'conv-1' }, error: null })

    const result = await chatService.getOrCreateDirectConversation('u1', 'u2', 'b1')

    expect(mocks.mockRpc).toHaveBeenCalledWith('get_or_create_direct_conversation', {
      p_user1_id: 'u1',
      p_user2_id: 'u2',
      p_business_id: 'b1',
    })
    expect(result).toEqual({ id: 'conv-1' })
  })

  it('lanza error si RPC falla', async () => {
    const { chatService } = await import('@/lib/services/chat')
    mocks.mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

    await expect(chatService.getOrCreateDirectConversation('u1', 'u2', 'b1')).rejects.toBeTruthy()
  })
})

describe('chatService.markConversationAsRead', () => {
  it('actualiza unread_count=0 para conversación y usuario', async () => {
    const { chatService } = await import('@/lib/services/chat')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await chatService.markConversationAsRead('c1', 'u1')

    expect(chain.update).toHaveBeenCalledWith({ unread_count: 0 })
    expect(chain.eq).toHaveBeenCalledWith('conversation_id', 'c1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1')
  })
})
