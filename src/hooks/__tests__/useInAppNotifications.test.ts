import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
const getWrapper = () => createWrapper().Wrapper
import { useInAppNotifications } from '../useInAppNotifications'
import type { InAppNotification } from '@/types/types'

// ============================================================================
// MOCKS
// ============================================================================

const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockNeq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

// Chain builder — returns itself for chaining except terminal calls
const chain = () => {
  const self: Record<string, ReturnType<typeof vi.fn>> = {
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    order: mockOrder,
    limit: mockLimit,
  }
  // Each method returns self for chaining
  for (const fn of Object.values(self)) {
    fn.mockReturnValue(self)
  }
  return self
}

let mockChain: ReturnType<typeof chain>

const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

// ============================================================================
// HELPERS
// ============================================================================

function makeNotification(overrides: Partial<InAppNotification> = {}): InAppNotification {
  return {
    id: `notif-${Math.random().toString(36).slice(2, 8)}`,
    user_id: 'user-1',
    business_id: 'biz-1',
    type: 'appointment_reminder' as InAppNotification['type'],
    title: 'Reminder',
    message: 'You have an appointment',
    status: 'unread' as InAppNotification['status'],
    data: {},
    created_at: '2025-01-01T10:00:00Z',
    read_at: null,
    ...overrides,
  } as InAppNotification
}

const notifications: InAppNotification[] = [
  makeNotification({ id: 'n1', status: 'unread' as InAppNotification['status'], type: 'appointment_reminder' as InAppNotification['type'], business_id: 'biz-1' }),
  makeNotification({ id: 'n2', status: 'read' as InAppNotification['status'], type: 'chat_message' as InAppNotification['type'], business_id: 'biz-1' }),
  makeNotification({ id: 'n3', status: 'unread' as InAppNotification['status'], type: 'appointment_cancelled' as InAppNotification['type'], business_id: 'biz-2' }),
]

// ============================================================================
// TESTS
// ============================================================================

describe('useInAppNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = chain()

    // Default: successful fetch
    mockChain.limit.mockResolvedValue({ data: notifications, error: null })

    // Channel mock: return subscribable object
    const channelObj = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }
    mockChannel.mockReturnValue(channelObj)
  })

  it('fetches notifications on mount', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.notifications).toHaveLength(3)
    expect(result.current.error).toBeNull()
  })

  it('calculates unread count from filtered results', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    // n1 and n3 are unread
    expect(result.current.unreadCount).toBe(2)
  })

  it('does not fetch when userId is empty', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: '' }),
      { wrapper: getWrapper() },
    )

    // Should not be loading since query is disabled
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notifications).toHaveLength(0)
  })

  // ─── Local Filters ────────────────────────────────────────────────

  it('filters by status', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1', status: 'read' as InAppNotification['status'] }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].id).toBe('n2')
  })

  it('filters by type', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1', type: 'appointment_cancelled' as InAppNotification['type'] }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].id).toBe('n3')
  })

  it('excludes chat messages', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1', excludeChatMessages: true }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    // n2 (chat_message) should be excluded
    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.notifications.every(n => n.type !== 'chat_message')).toBe(true)
  })

  it('filters by businessId', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1', businessId: 'biz-2' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].id).toBe('n3')
  })

  it('excludes specific types', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({
        userId: 'user-1',
        excludeTypes: ['chat_message' as InAppNotification['type'], 'appointment_cancelled' as InAppNotification['type']],
      }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Only n1 (appointment_reminder) should remain
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].id).toBe('n1')
  })

  // ─── CRUD Actions ─────────────────────────────────────────────────

  it('markAsRead updates notification', async () => {
    mockChain.eq.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Reset chain for the update call
    mockChain = chain()
    mockChain.eq.mockResolvedValue({ data: null, error: null })

    await act(async () => {
      await result.current.markAsRead('n1')
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'read' }),
    )
  })

  it('markAsRead shows toast on error', async () => {
    const { toast: toastMock } = await import('sonner')

    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Setup error for update
    mockChain = chain()
    mockChain.eq.mockResolvedValue({ data: null, error: { message: 'Update failed' } })

    await expect(
      act(() => result.current.markAsRead('n1'))
    ).rejects.toEqual({ message: 'Update failed' })

    expect(toastMock.error).toHaveBeenCalledWith('Error al marcar como leído')
  })

  it('markAllAsRead updates all unread', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockChain = chain()
    mockChain.neq.mockResolvedValue({ data: null, error: null })

    await act(async () => {
      await result.current.markAllAsRead()
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'read' }),
    )
  })

  it('archive updates notification status', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockChain = chain()
    mockChain.eq.mockResolvedValue({ data: null, error: null })

    await act(async () => {
      await result.current.archive('n1')
    })

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'archived' })
  })

  it('deleteNotification removes notification', async () => {
    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockChain = chain()
    mockChain.eq.mockResolvedValue({ data: null, error: null })

    await act(async () => {
      await result.current.deleteNotification('n1')
    })

    expect(mockDelete).toHaveBeenCalled()
  })

  it('handles fetch error', async () => {
    mockChain = chain()
    mockChain.limit.mockResolvedValue({ data: null, error: { message: 'Fetch failed' } })

    const { result } = renderHook(
      () => useInAppNotifications({ userId: 'user-1' }),
      { wrapper: getWrapper() },
    )

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
