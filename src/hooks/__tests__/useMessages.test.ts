import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMessages } from '../useMessages'

// ============================================================================
// MOCKS
// ============================================================================

const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()
const mockFunctionsInvoke = vi.fn()

vi.mock('@/lib/supabase', () => { const __sb = {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
  }; return { supabase: __sb, default: __sb } })

vi.mock('@/lib/analytics', () => ({
  trackChatEvent: vi.fn(),
  ChatEvents: {
    MESSAGE_SENT: 'message_sent',
    MESSAGE_EDITED: 'message_edited',
    MESSAGE_DELETED: 'message_deleted',
    CONVERSATION_OPENED: 'conversation_opened',
    SEARCH_PERFORMED: 'search_performed',
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

const mockMessagesData = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    type: 'text',
    body: 'Hello',
    metadata: {},
    reply_to: null,
    is_pinned: false,
    is_deleted: false,
    created_at: '2025-01-01T12:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
    sender: { id: 'user-2', full_name: 'Test', email: 'test@example.com', avatar_url: null },
    delivery_status: 'delivered',
    read_by: [],
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    type: 'text',
    body: 'Hi',
    metadata: {},
    reply_to: null,
    is_pinned: false,
    is_deleted: false,
    created_at: '2025-01-01T12:01:00Z',
    updated_at: '2025-01-01T12:01:00Z',
    sender: { id: 'user-1', full_name: 'Me', email: 'me@example.com', avatar_url: null },
    delivery_status: 'delivered',
    read_by: [],
  },
]

// ============================================================================
// TESTS
// ============================================================================

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default RPC success for fetchMessages
    mockRpc.mockResolvedValue({ data: mockMessagesData, error: null })
    // Channel mock
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })
  })

  // ─── Initial state ────────────────────────────────────────────────

  it('returns empty state when conversationId is null', async () => {
    const { result } = renderHook(() => useMessages(null, 'user-1'))

    expect(result.current.messages).toHaveLength(0)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns empty state when userId is undefined', async () => {
    const { result } = renderHook(() => useMessages('conv-1', undefined))

    expect(result.current.messages).toHaveLength(0)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  // ─── fetchMessages ────────────────────────────────────────────────

  it('fetches messages on mount', async () => {
    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockRpc).toHaveBeenCalledWith('get_messages_paginated', {
      p_conversation_id: 'conv-1',
      p_before_id: null,
      p_after_id: null,
      p_limit: 50,
    })
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0].id).toBe('msg-1')
  })

  it('filters out deleted messages by default', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        ...mockMessagesData,
        { ...mockMessagesData[0], id: 'msg-3', is_deleted: true },
      ],
      error: null,
    })

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.messages).toHaveLength(2)
  })

  it('handles fetchMessages RPC error', async () => {
    const { toast } = await import('sonner')
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } })

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('RPC failed')
    expect(toast.error).toHaveBeenCalledWith('Error al cargar mensajes')
  })

  it('sets hasMore to true when full page returned', async () => {
    const fiftyMsgs = Array.from({ length: 50 }, (_, i) => ({
      ...mockMessagesData[0],
      id: `msg-${i}`,
      is_deleted: false,
    }))
    mockRpc.mockResolvedValueOnce({ data: fiftyMsgs, error: null })

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasMore).toBe(true)
  })

  it('sets hasMore to false when partial page returned', async () => {
    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasMore).toBe(false)
  })

  // ─── sendMessage ──────────────────────────────────────────────────

  it('sends message via Edge Function with optimistic update', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, message_id: 'msg-new' },
      error: null,
    })

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.sendMessage({ body: 'New message', type: 'text' })
    })

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('send-message', {
      body: {
        conversation_id: 'conv-1',
        body: 'New message',
        type: 'text',
      },
    })
    expect(result.current.sending).toBe(false)
  })

  it('marks message as failed on send error', async () => {
    const { toast } = await import('sonner')
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    })

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.sendMessage({ body: 'Failing message', type: 'text' })
    })

    expect(toast.error).toHaveBeenCalled()
    // Temp message should be marked as failed
    const failedMsg = result.current.messages.find(m => m.id.startsWith('temp-'))
    expect(failedMsg?.delivery_status).toBe('failed')
  })

  it('sendMessage shows toast when not authenticated', async () => {
    const { toast } = await import('sonner')

    const { result } = renderHook(() => useMessages('conv-1', undefined))

    await act(async () => {
      await result.current.sendMessage({ body: 'Test', type: 'text' })
    })

    expect(toast.error).toHaveBeenCalledWith('Usuario no autenticado')
    expect(mockFunctionsInvoke).not.toHaveBeenCalled()
  })

  // ─── editMessage ──────────────────────────────────────────────────

  it('edits a message', async () => {
    const { toast } = await import('sonner')
    const editChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(editChain)

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.editMessage('msg-2', 'Updated body')
    })

    expect(mockFrom).toHaveBeenCalledWith('messages')
    expect(toast.success).toHaveBeenCalledWith('Mensaje editado')
    // Local state updated
    const edited = result.current.messages.find(m => m.id === 'msg-2')
    expect(edited?.body).toBe('Updated body')
  })

  it('editMessage handles error', async () => {
    const { toast } = await import('sonner')
    const editChain = buildChain({ data: null, error: { message: 'Permission denied' } })
    mockFrom.mockReturnValue(editChain)

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.editMessage('msg-2', 'Will fail')
    })

    expect(toast.error).toHaveBeenCalledWith('Error al editar mensaje')
  })

  // ─── deleteMessage ────────────────────────────────────────────────

  it('soft deletes a message', async () => {
    const { toast } = await import('sonner')
    const deleteChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(deleteChain)

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteMessage('msg-2')
    })

    expect(mockFrom).toHaveBeenCalledWith('messages')
    expect(toast.success).toHaveBeenCalledWith('Mensaje eliminado')
    const deleted = result.current.messages.find(m => m.id === 'msg-2')
    expect(deleted?.is_deleted).toBe(true)
  })

  it('deleteMessage handles error', async () => {
    const { toast } = await import('sonner')
    const deleteChain = buildChain({ data: null, error: { message: 'Delete failed' } })
    mockFrom.mockReturnValue(deleteChain)

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteMessage('msg-2')
    })

    expect(toast.error).toHaveBeenCalledWith('Error al eliminar mensaje')
  })

  // ─── pinMessage ───────────────────────────────────────────────────

  it('pins a message', async () => {
    const { toast } = await import('sonner')
    const pinChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(pinChain)

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.pinMessage('msg-1', true)
    })

    expect(mockFrom).toHaveBeenCalledWith('messages')
    expect(toast.success).toHaveBeenCalledWith('Mensaje fijado')
    const pinned = result.current.messages.find(m => m.id === 'msg-1')
    expect(pinned?.is_pinned).toBe(true)
  })

  it('unpins a message', async () => {
    const { toast } = await import('sonner')
    const unpinChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(unpinChain)

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.pinMessage('msg-1', false)
    })

    expect(toast.success).toHaveBeenCalledWith('Mensaje desfijado')
  })

  // ─── searchMessages ───────────────────────────────────────────────

  it('searches messages via RPC', async () => {
    const searchResults = [mockMessagesData[0]]
    // First call: fetchMessages on mount; second call: searchMessages
    mockRpc
      .mockResolvedValueOnce({ data: mockMessagesData, error: null })
      .mockResolvedValueOnce({ data: searchResults, error: null })

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let results: unknown[]
    await act(async () => {
      results = await result.current.searchMessages('Hello')
    })

    expect(mockRpc).toHaveBeenCalledWith('search_messages', {
      p_conversation_id: 'conv-1',
      p_query: 'Hello',
      p_limit: 20,
    })
    expect(results!).toHaveLength(1)
  })

  it('searchMessages returns empty for blank query', async () => {
    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let results: unknown[]
    await act(async () => {
      results = await result.current.searchMessages('   ')
    })

    expect(results!).toHaveLength(0)
  })

  it('searchMessages handles error', async () => {
    const { toast } = await import('sonner')
    mockRpc
      .mockResolvedValueOnce({ data: mockMessagesData, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Search failed' } })

    const { result } = renderHook(() => useMessages('conv-1', 'user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.searchMessages('Query')
    })

    expect(toast.error).toHaveBeenCalledWith('Error al buscar mensajes')
  })
})
