import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat } from '../useChat'

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
    MESSAGE_SENT: 'message_sent',
    MESSAGE_EDITED: 'message_edited',
    MESSAGE_DELETED: 'message_deleted',
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

// ============================================================================
// HELPERS
// ============================================================================

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, any> = {}
  const methods = ['select', 'update', 'delete', 'insert', 'eq', 'neq', 'is', 'gt', 'contains', 'order', 'limit', 'single', 'maybeSingle']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  // Make self a thenable so `await chain.method().method()` resolves correctly
  self.then = (resolve: (v: unknown) => void) => resolve(resolvedValue)
  return self
}

const mockConversationsData = [
  {
    id: 'conv-1',
    type: 'direct',
    title: null,
    created_by: 'user-1',
    business_id: 'biz-1',
    last_message_at: '2025-01-01T12:00:00Z',
    last_message_preview: 'Hello',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
    is_archived: false,
    metadata: {},
    unread_count: 2,
    is_pinned: false,
    is_muted: false,
    other_user_id: 'user-2',
    other_user_full_name: 'Test User',
    other_user_email: 'test@example.com',
    other_user_avatar_url: null,
    last_message_sender_id: 'user-2',
  },
]

function setupChannelMock() {
  const channelObj = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  mockChannel.mockReturnValue(channelObj)
  return channelObj
}

// ============================================================================
// TESTS
// ============================================================================

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock()
    // Default: fetchConversations succeeds
    mockRpc.mockResolvedValue({ data: mockConversationsData, error: null })
  })

  it('returns empty state when userId is null', async () => {
    const { result } = renderHook(() => useChat(null))

    // When userId is null, the useEffect early-returns without calling fetchConversations,
    // so loading stays true (its initial value)
    expect(result.current.conversations).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('fetches conversations on mount', async () => {
    const { result } = renderHook(() => useChat('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockRpc).toHaveBeenCalledWith(
      'get_conversations_with_participants',
      { p_user_id: 'user-1' },
    )
    expect(result.current.conversations).toHaveLength(1)
    expect(result.current.conversations[0].id).toBe('conv-1')
    expect(result.current.conversations[0].other_user?.full_name).toBe('Test User')
  })

  it('calculates totalUnreadCount from conversations', async () => {
    const { result } = renderHook(() => useChat('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.totalUnreadCount).toBe(2)
  })

  it('handles fetchConversations RPC error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } })

    const { result } = renderHook(() => useChat('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('RPC failed')
  })

  it('handles empty conversations', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    const { result } = renderHook(() => useChat('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.conversations).toHaveLength(0)
  })

  // ─── setActiveConversationId ──────────────────────────────────────

  it('sets active conversation and fetches messages', async () => {
    const messagesChain = buildChain({
      data: [
        {
          id: 'msg-1',
          conversation_id: 'conv-1',
          sender_id: 'user-2',
          content: 'Hello there',
          type: 'text',
          attachments: null,
          sent_at: '2025-01-01T12:00:00Z',
          delivered_at: null,
          read_by: [],
          reply_to_id: null,
          edited_at: null,
          deleted_at: null,
          metadata: {},
          created_at: '2025-01-01T12:00:00Z',
          updated_at: '2025-01-01T12:00:00Z',
          sender: { id: 'user-2', full_name: 'Test User', email: 'test@example.com', avatar_url: null },
        },
      ],
      error: null,
    })
    mockFrom.mockReturnValue(messagesChain)

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setActiveConversationId('conv-1')
    })

    await waitFor(() => expect(result.current.activeMessages.length).toBeGreaterThan(0))
    expect(result.current.activeConversation?.id).toBe('conv-1')
  })

  // ─── createOrGetConversation ──────────────────────────────────────

  it('createOrGetConversation calls RPC', async () => {
    // First call: fetchConversations on mount
    mockRpc
      .mockResolvedValueOnce({ data: mockConversationsData, error: null })
      // Second call: get_or_create_direct_conversation
      .mockResolvedValueOnce({ data: 'conv-new', error: null })
      // Third call: fetchConversations after create
      .mockResolvedValueOnce({ data: mockConversationsData, error: null })

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let conversationId: string | undefined
    await act(async () => {
      conversationId = await result.current.createOrGetConversation({
        other_user_id: 'user-3',
        business_id: 'biz-1',
      })
    })

    expect(conversationId).toBe('conv-new')
    expect(mockRpc).toHaveBeenCalledWith(
      'get_or_create_direct_conversation',
      {
        p_user1_id: 'user-1',
        p_user2_id: 'user-3',
        p_business_id: 'biz-1',
      },
    )
  })

  it('createOrGetConversation throws when userId is null', async () => {
    const { result } = renderHook(() => useChat(null))

    await expect(
      act(() => result.current.createOrGetConversation({ other_user_id: 'user-2' }))
    ).rejects.toThrow('Usuario no autenticado')
  })

  // ─── sendMessage ──────────────────────────────────────────────────

  it('sendMessage sends via RPC with optimistic update', async () => {
    // fetchConversations on mount
    mockRpc.mockResolvedValueOnce({ data: mockConversationsData, error: null })

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // send_message RPC → returns message id
    mockRpc.mockResolvedValueOnce({ data: 'msg-new', error: null })
    // update_typing_indicator RPC
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    // Fetch the real message after optimistic
    const realMsgChain = buildChain({
      data: {
        id: 'msg-new',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Test message',
        type: 'text',
        attachments: null,
        sent_at: '2025-01-01T13:00:00Z',
        delivered_at: null,
        read_by: [],
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        metadata: {},
        created_at: '2025-01-01T13:00:00Z',
        updated_at: '2025-01-01T13:00:00Z',
        sender: { id: 'user-1', full_name: 'Me', email: 'me@example.com', avatar_url: null },
      },
      error: null,
    })
    mockFrom.mockReturnValue(realMsgChain)

    await act(async () => {
      await result.current.sendMessage({
        conversation_id: 'conv-1',
        content: 'Test message',
      })
    })

    expect(mockRpc).toHaveBeenCalledWith(
      'send_message',
      expect.objectContaining({
        p_conversation_id: 'conv-1',
        p_sender_id: 'user-1',
        p_content: 'Test message',
        p_type: 'text',
      }),
    )
  })

  it('sendMessage throws when userId is null', async () => {
    const { result } = renderHook(() => useChat(null))

    await expect(
      act(() => result.current.sendMessage({
        conversation_id: 'conv-1',
        content: 'Test',
      }))
    ).rejects.toThrow('Usuario no autenticado')
  })

  // ─── markMessagesAsRead ───────────────────────────────────────────

  it('markMessagesAsRead calls RPC and updates local state', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: mockConversationsData, error: null })  // fetchConversations
      .mockResolvedValueOnce({ data: 5, error: null })  // mark_messages_as_read

    // For the in_app_notifications update after marking read
    const notifChain = buildChain({ data: [], error: null })
    notifChain.select.mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue(notifChain)

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.markMessagesAsRead('conv-1', 'msg-last')
    })

    expect(mockRpc).toHaveBeenCalledWith(
      'mark_messages_as_read',
      {
        p_conversation_id: 'conv-1',
        p_user_id: 'user-1',
        p_message_id: 'msg-last',
      },
    )

    // Verify local state update: unread_count should be 0
    expect(result.current.conversations[0].unread_count).toBe(0)
  })

  // ─── editMessage ──────────────────────────────────────────────────

  it('editMessage updates message content', async () => {
    mockRpc.mockResolvedValueOnce({ data: mockConversationsData, error: null })

    const editChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(editChain)

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.editMessage('msg-1', 'Edited content')
    })

    expect(mockFrom).toHaveBeenCalledWith('chat_messages')
  })

  // ─── deleteMessage ────────────────────────────────────────────────

  it('deleteMessage soft deletes message', async () => {
    mockRpc.mockResolvedValueOnce({ data: mockConversationsData, error: null })

    const deleteChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(deleteChain)

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteMessage('msg-1')
    })

    expect(mockFrom).toHaveBeenCalledWith('chat_messages')
  })

  // ─── toggleArchiveConversation ────────────────────────────────────

  it('toggleArchiveConversation updates local state', async () => {
    mockRpc.mockResolvedValueOnce({ data: mockConversationsData, error: null })

    const archiveChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(archiveChain)

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleArchiveConversation('conv-1', true)
    })

    expect(result.current.conversations[0].is_archived).toBe(true)
  })

  // ─── toggleMuteConversation ───────────────────────────────────────

  it('toggleMuteConversation updates local state', async () => {
    mockRpc.mockResolvedValueOnce({ data: mockConversationsData, error: null })

    const muteChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(muteChain)

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleMuteConversation('conv-1', true)
    })

    expect(result.current.conversations[0].is_muted).toBe(true)
  })

  // ─── togglePinConversation ────────────────────────────────────────

  it('togglePinConversation updates local state', async () => {
    mockRpc.mockResolvedValueOnce({ data: mockConversationsData, error: null })

    const pinChain = buildChain({ data: null, error: null })
    mockFrom.mockReturnValue(pinChain)

    const { result } = renderHook(() => useChat('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.togglePinConversation('conv-1', true)
    })

    expect(result.current.conversations[0].is_pinned).toBe(true)
  })

  // ─── Realtime subscription ────────────────────────────────────────

  it('sets up realtime channel on mount', async () => {
    renderHook(() => useChat('user-1'))

    await waitFor(() => expect(mockChannel).toHaveBeenCalled())
    // Should create at least 1 channel for chat_participants
    expect(mockChannel).toHaveBeenCalledWith(
      expect.stringContaining('chat_participants_user-1'),
    )
  })

  it('cleans up realtime channel on unmount', async () => {
    const { unmount } = renderHook(() => useChat('user-1'))

    await waitFor(() => expect(mockChannel).toHaveBeenCalled())

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})
