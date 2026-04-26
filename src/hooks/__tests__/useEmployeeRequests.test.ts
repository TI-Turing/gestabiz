import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
// NOTE: vitest.config has restoreMocks:true — vi.fn().mockReturnValue() is cleared after each test.
//       Use vi.fn(factory) pattern so restoreMocks restores to the factory, not to undefined.
const { mockQueryFn, mockFrom, mockChannel, mockRemoveChannel, mockChannelObj } = vi.hoisted(() => {
  const mockQueryFn = vi.fn()

  function buildChain(termFn: () => Promise<unknown>) {
    const c: Record<string, unknown> = {}
    ;[
      'select', 'eq', 'neq', 'lte', 'gte', 'order', 'limit',
      'insert', 'update', 'delete', 'or', 'filter', 'not', 'is',
      'ilike', 'like', 'match', 'contains',
    ].forEach(m => {
      c[m] = () => c
    })
    c['single'] = termFn
    c['maybeSingle'] = termFn
    c['then'] = (
      resolve: (v: unknown) => void,
      reject: (e: unknown) => void,
    ) => Promise.resolve(termFn()).then(resolve, reject)
    return c
  }

  // Realtime channel mock — use vi.fn(factory) so restoreMocks preserves the impl
  // eslint-disable-next-line prefer-const
  let mockChannelObj: { on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> }
  mockChannelObj = {
    on: vi.fn(() => mockChannelObj),       // factory → preserved by restoreMocks
    subscribe: vi.fn(() => mockChannelObj), // factory → preserved by restoreMocks
  }
  const mockChannel = vi.fn(() => mockChannelObj)
  const mockRemoveChannel = vi.fn()

  return {
    mockQueryFn,
    mockFrom: vi.fn(() => buildChain(mockQueryFn)),
    mockChannel,
    mockRemoveChannel,
    mockChannelObj,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    channel: (name: string) => mockChannel(name),
    removeChannel: (ch: unknown) => mockRemoveChannel(ch),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

import { useEmployeeRequests } from '../useEmployeeRequests'

// ─── Test data ────────────────────────────────────────────────────────────────
const MOCK_REQUEST = {
  id: 'req-1',
  user_id: 'user-1',
  business_id: 'biz-1',
  status: 'pending',
  invitation_code: 'CODE123',
  message: 'Quiero trabajar aquí',
  created_at: '2025-01-01T00:00:00Z',
  business: { name: 'Salón Belleza', id: 'biz-1' },
  user: { full_name: 'Juan García', email: 'juan@example.com', avatar_url: null },
  responder: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useEmployeeRequests', () => {
  beforeEach(() => {
    // restoreMocks:true auto-restores after each test; factory-based mocks survive.
    // mockQueryFn and mockRemoveChannel need explicit re-setup (plain vi.fn()).
    mockQueryFn.mockReset()
    mockQueryFn.mockResolvedValue({ data: [], error: null })
    mockRemoveChannel.mockResolvedValue(undefined)
  })

  it('returns empty requests array and isLoading=false initially (no ids)', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeRequests({ autoFetch: false }),
      { wrapper: Wrapper },
    )

    expect(result.current.requests).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch when neither businessId nor userId is provided', async () => {
    const { Wrapper } = createWrapper()
    renderHook(
      () => useEmployeeRequests({ autoFetch: true }),
      { wrapper: Wrapper },
    )

    // No ids → early return without calling supabase
    await new Promise(r => setTimeout(r, 50))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches requests when businessId is provided', async () => {
    mockQueryFn.mockResolvedValue({ data: [MOCK_REQUEST], error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeRequests({ businessId: 'biz-1', autoFetch: true }),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFrom).toHaveBeenCalledWith('employee_requests')
    expect(result.current.requests).toHaveLength(1)
    expect(result.current.requests[0].id).toBe('req-1')
  })

  it('fetches requests when userId is provided', async () => {
    mockQueryFn.mockResolvedValue({ data: [MOCK_REQUEST], error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeRequests({ userId: 'user-1', autoFetch: true }),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFrom).toHaveBeenCalledWith('employee_requests')
    expect(result.current.requests).toHaveLength(1)
  })

  it('sets error when query fails', async () => {
    mockQueryFn.mockResolvedValue({ data: null, error: { message: 'DB connection error' } })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeRequests({ businessId: 'biz-1', autoFetch: true }),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.requests).toEqual([])
  })
})
