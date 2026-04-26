import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSession, mockSignOut, mockQueryFn, mockFrom } = vi.hoisted(() => {
  const mockQueryFn = vi.fn()

  function buildChain(termFn: () => Promise<unknown>) {
    const c: Record<string, unknown> = {}
    ;[
      'select', 'eq', 'neq', 'lte', 'gte', 'order', 'limit',
      'insert', 'update', 'delete', 'or', 'filter', 'not', 'is',
      'ilike', 'like', 'match', 'contains', 'throwOnError', 'range',
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

  const mockFrom = vi.fn(() => buildChain(mockQueryFn))

  return {
    mockGetSession: vi.fn(),
    mockSignOut: vi.fn(),
    mockQueryFn,
    mockFrom,
  }
})

// Auth listener capture
let authListenerCallback: ((event: string, session: unknown) => void) | null = null

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authListenerCallback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signOut: () => mockSignOut(),
    },
    from: (table: string) => mockFrom(table),
  },
}))

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}))

vi.mock('@/lib/queryClient', () => ({
  resetQueryClient: vi.fn(),
}))

import { useAuthSimple } from '../useAuthSimple'

// ─── Test data ────────────────────────────────────────────────────────────────
const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'alice@example.com',
    user_metadata: { full_name: 'Alice Test' },
  },
  access_token: 'access-token',
  refresh_token: 'refresh-token',
}

const MOCK_PROFILE = {
  id: 'user-1',
  full_name: 'Alice Test',
  email: 'alice@example.com',
  phone: '555-1234',
  avatar_url: null,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useAuthSimple', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    authListenerCallback = null
    localStorage.clear()
    // Default: no session, all queries return null
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockQueryFn.mockResolvedValue({ data: null, error: null })
  })

  it('starts with loading: true', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAuthSimple(), { wrapper: Wrapper })

    expect(result.current.loading).toBe(true)
  })

  it('resolves to loading=false and user=null when no session exists', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAuthSimple(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets user and session after successful profile hydration', async () => {
    mockGetSession.mockResolvedValue({ data: { session: MOCK_SESSION }, error: null })
    // First call: profiles query for hydrateUserProfile
    mockQueryFn.mockResolvedValueOnce({ data: MOCK_PROFILE, error: null })
    // Subsequent calls: business context queries → no businesses
    mockQueryFn.mockResolvedValue({ data: null, error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAuthSimple(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.email).toBe('alice@example.com')
    expect(result.current.session).toEqual(MOCK_SESSION)
  })

  it('handles getSession error gracefully — loading false, user null', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Auth service unavailable' },
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAuthSimple(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })

  it('handles profile hydration failure — loading still resolves to false', async () => {
    mockGetSession.mockResolvedValue({ data: { session: MOCK_SESSION }, error: null })
    // Profile query fails
    mockQueryFn.mockResolvedValue({ data: null, error: { message: 'Profile fetch failed' } })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAuthSimple(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
