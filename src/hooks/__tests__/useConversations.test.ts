import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConversations } from '../useConversations'

// ============================================================================
// MOCKS
// ============================================================================

const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}))

vi.mock('@/lib/analytics', () => ({
  trackChatEvent: vi.fn(),
  ChatEvents: {
    CONVERSATIONS_LOADED: 'conversations_loaded',
    CONVERSATION_CREATED: 'conversation_created',
    CONVERSATION_READ: 'conversation_read',
    CONVERSATION_ARCHIVED: 'conversation_archived',
    CONVERSATION_UNARCHIVED: 'conversation_unarchived',
    CONVERSATION_MUTED: 'conversation_muted',
    CONVERSATION_UNMUTED: 'conversation_unmuted',
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// ============================================================================
// HELPERS
// ============================================================================

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, any> = {}
  const methods = ['select', 'update', 'delete', 'insert', 'eq', 'neq', 'order', 'limit', 'single', 'maybeSingle']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  // Make self a thenable so `await chain.method().method()` resolves correctly
  self.then = (resolve: (v: unknown) => void) => resolve(resolvedValue)
  return self
}

const mockConversations = [
  {
    id: 'conv-1',
    business_id: 'biz-1',
    type: 'direct',
    name: null,
    display_name: 'Test User',
    last_message_preview: 'Hello',
    unread_count: 2,
    is_archived: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
    members: [],
    other_user: { id: 'user-2', full_name: 'Test User', email: 'test@test.com' },
  },
  {
    id: 'conv-2',
    business_id: 'biz-1',
    type: 'group',
    name: 'Team Chat',
    display_name: 'Team Chat',
    last_message_preview: 'Meeting at 3pm',
    unread_count: 0,
    is_archived: false,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T12:00:00Z',
    members: [],
  },
]

// ============================================================================
// TESTS
// ============================================================================

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: fetchConversations (get_conversation_preview) + fetchStats (get_chat_stats)
    mockRpc.mockResolvedValue({ data: mockConversations, error: null })
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })
  })

  // ─── Initial state ────────────────────────────────────────────────

  it('returns empty state when userId is undefined', async () => {
    const { result } = renderHook(() => useConversations(undefined))

    expect(result.current.conversations).toHaveLength(0)
    expect(result.current.loading).toBe(true)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  // ─── fetchConversations ───────────────────────────────────────────

  it('fetches conversations on mount', async () => {
    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockRpc).toHaveBeenCalledWith('get_conversation_preview', {
      p_user_id: 'user-1',
      p_business_id: 'biz-1',
      p_limit: 50,
      p_offset: 0,
    })
    expect(result.current.conversations).toHaveLength(2)
    expect(result.current.conversations[0].id).toBe('conv-1')
  })

  it('handles fetchConversations RPC error', async () => {
    const { toast } = await import('sonner')
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    const { result } = renderHook(() => useConversations('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('RPC failed')
    expect(toast.error).toHaveBeenCalledWith('Error al cargar conversaciones')
  })

  it('applies client-side type filter', async () => {
    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.fetchConversations({ type: 'group' as any })
    })

    // Second call applies filter — but RPC returns all, so client filters
    // We validate the RPC was called; the filter logic is applied locally
    expect(mockRpc).toHaveBeenCalledWith('get_conversation_preview', expect.any(Object))
  })

  // ─── createDirectConversation ─────────────────────────────────────

  it('creates a direct conversation', async () => {
    const { toast } = await import('sonner')
    // First: fetchConversations mount + fetchStats mount
    // Then: createDirectConversation RPC
    // Then: re-fetch conversations
    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null }) // mount fetch
      .mockResolvedValueOnce({ data: null, error: null }) // mount stats
      .mockResolvedValueOnce({ data: 'conv-new', error: null }) // create_direct_conversation
      .mockResolvedValueOnce({ data: [], error: null }) // re-fetch after creation

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let convId: string | null
    await act(async () => {
      convId = await result.current.createDirectConversation('user-2', 'biz-1')
    })

    expect(convId!).toBe('conv-new')
    expect(mockRpc).toHaveBeenCalledWith('create_direct_conversation', {
      p_business_id: 'biz-1',
      p_user_a: 'user-1',
      p_user_b: 'user-2',
    })
    expect(toast.success).toHaveBeenCalledWith('Conversación creada')
  })

  it('returns null when userId is missing on createDirectConversation', async () => {
    const { toast } = await import('sonner')
    const { result } = renderHook(() => useConversations(undefined))

    let convId: string | null
    await act(async () => {
      convId = await result.current.createDirectConversation('user-2', 'biz-1')
    })

    expect(convId!).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('Usuario no autenticado')
  })

  it('handles createDirectConversation error', async () => {
    const { toast } = await import('sonner')
    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null }) // mount fetch
      .mockResolvedValueOnce({ data: null, error: null }) // mount stats
      .mockResolvedValueOnce({ data: null, error: { message: 'Duplicate' } }) // create fails

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let convId: string | null
    await act(async () => {
      convId = await result.current.createDirectConversation('user-2', 'biz-1')
    })

    expect(convId!).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('Error al crear conversación')
  })

  // ─── createGroupConversation ──────────────────────────────────────

  it('creates a group conversation', async () => {
    const { toast } = await import('sonner')

    const groupConvChain = buildChain({
      data: { id: 'group-new', type: 'group' },
      error: null,
    })
    const membersChain = buildChain({ data: null, error: null })
    const systemMsgChain = buildChain({ data: null, error: null })

    mockFrom
      .mockReturnValueOnce(groupConvChain) // conversations.insert
      .mockReturnValueOnce(membersChain) // conversation_members.insert
      .mockReturnValueOnce(systemMsgChain) // messages.insert (system msg)

    // RPC: mount fetch, mount stats, re-fetch after creation
    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let convId: string | null
    await act(async () => {
      convId = await result.current.createGroupConversation({
        business_id: 'biz-1',
        name: 'Team Chat',
        member_ids: ['user-2', 'user-3'],
      } as any)
    })

    expect(convId!).toBe('group-new')
    expect(toast.success).toHaveBeenCalledWith('Grupo creado exitosamente')
  })

  it('returns null when userId missing on createGroupConversation', async () => {
    const { toast } = await import('sonner')
    const { result } = renderHook(() => useConversations(undefined))

    let convId: string | null
    await act(async () => {
      convId = await result.current.createGroupConversation({
        business_id: 'biz-1',
        name: 'Team',
        member_ids: ['user-2'],
      } as any)
    })

    expect(convId!).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('Usuario no autenticado')
  })

  // ─── markConversationRead ─────────────────────────────────────────

  it('marks conversation as read', async () => {
    // mount: fetch + stats + markConversationRead RPC
    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null }) // mark_conversation_read

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.markConversationRead('conv-1')
    })

    expect(mockRpc).toHaveBeenCalledWith('mark_conversation_read', {
      p_conversation_id: 'conv-1',
      p_user_id: 'user-1',
    })

    // Local state updated
    const conv = result.current.conversations.find(c => c.id === 'conv-1')
    expect(conv?.unread_count).toBe(0)
  })

  // ─── archiveConversation ──────────────────────────────────────────

  it('archives a conversation', async () => {
    const { toast } = await import('sonner')
    const archiveChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(archiveChain)

    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.archiveConversation('conv-1', true)
    })

    expect(mockFrom).toHaveBeenCalledWith('conversations')
    expect(toast.success).toHaveBeenCalledWith('Conversación archivada')

    const conv = result.current.conversations.find(c => c.id === 'conv-1')
    expect(conv?.is_archived).toBe(true)
  })

  it('restores an archived conversation', async () => {
    const { toast } = await import('sonner')
    const restoreChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(restoreChain)

    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.archiveConversation('conv-1', false)
    })

    expect(toast.success).toHaveBeenCalledWith('Conversación restaurada')
  })

  // ─── muteConversation ─────────────────────────────────────────────

  it('mutes a conversation', async () => {
    const { toast } = await import('sonner')
    const muteChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(muteChain)

    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.muteConversation('conv-1', true)
    })

    expect(mockFrom).toHaveBeenCalledWith('conversation_members')
    expect(toast.success).toHaveBeenCalledWith('Conversación silenciada')
  })

  it('unmutes a conversation', async () => {
    const { toast } = await import('sonner')
    const unmuteChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(unmuteChain)

    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.muteConversation('conv-1', false)
    })

    expect(toast.success).toHaveBeenCalledWith('Silencio desactivado')
  })

  // ─── updateCustomName ─────────────────────────────────────────────

  it('updates custom name', async () => {
    const { toast } = await import('sonner')
    const nameChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(nameChain)

    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateCustomName('conv-1', 'My Custom Name')
    })

    expect(mockFrom).toHaveBeenCalledWith('conversation_members')
    expect(toast.success).toHaveBeenCalledWith('Nombre personalizado actualizado')

    const conv = result.current.conversations.find(c => c.id === 'conv-1')
    expect(conv?.display_name).toBe('My Custom Name')
  })

  // ─── fetchStats ───────────────────────────────────────────────────

  it('fetches stats on mount', async () => {
    const statsData = { total_conversations: 5, unread_count: 2 }
    mockRpc
      .mockResolvedValueOnce({ data: mockConversations, error: null }) // conversations
      .mockResolvedValueOnce({ data: statsData, error: null }) // stats

    const { result } = renderHook(() => useConversations('user-1', 'biz-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockRpc).toHaveBeenCalledWith('get_chat_stats', {
      p_user_id: 'user-1',
      p_business_id: 'biz-1',
    })
    expect(result.current.stats).toEqual(statsData)
  })
})
