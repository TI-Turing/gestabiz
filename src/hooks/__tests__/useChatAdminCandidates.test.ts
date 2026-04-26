import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockQueryFn, mockFrom } = vi.hoisted(() => {
  const mockQueryFn = vi.fn()

  function buildChain(termFn: () => Promise<unknown>) {
    const c: Record<string, unknown> = {}
    ;[
      'select', 'eq', 'neq', 'lte', 'gte', 'order', 'limit',
      'filter', 'or', 'not', 'is', 'match', 'contains',
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

  return {
    mockQueryFn,
    mockFrom: vi.fn(() => buildChain(mockQueryFn)),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}))

vi.mock('@/lib/queryConfig', () => ({
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
    FREQUENT: { staleTime: 0, gcTime: 0 },
    REALTIME: { staleTime: 0, gcTime: 0 },
    KEYS: {
      BUSINESS_EMPLOYEES: (id: string) => ['business-employees', id],
      IN_APP_NOTIFICATIONS: (id: string) => ['in-app-notifications', id],
    },
  },
}))

import { useChatAdminCandidates } from '../useChatAdminCandidates'

// ─── Test data ────────────────────────────────────────────────────────────────
const MOCK_CANDIDATES = [
  {
    user_id: 'owner-1',
    hierarchy_level: 0,
    profiles: { full_name: 'Carlos Owner', email: 'carlos@biz.com', avatar_url: null },
  },
  {
    user_id: 'admin-1',
    hierarchy_level: 1,
    profiles: { full_name: 'Maria Admin', email: 'maria@biz.com', avatar_url: '/avatar.png' },
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useChatAdminCandidates', () => {
  beforeEach(() => {
    // clearAllMocks preserves mockFrom implementation; mockReset clears Once queues
    vi.clearAllMocks()
    mockQueryFn.mockReset()
    mockQueryFn.mockResolvedValue({ data: [], error: null })
  })

  it('query is disabled when businessId is empty string', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChatAdminCandidates(''), { wrapper: Wrapper })

    // With enabled: false, data is undefined and isLoading is false
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('query is disabled when businessId is undefined', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useChatAdminCandidates(undefined as unknown as string),
      { wrapper: Wrapper },
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('fetches and returns candidates when businessId is provided', async () => {
    mockQueryFn.mockResolvedValue({ data: MOCK_CANDIDATES, error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChatAdminCandidates('biz-1'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.data).not.toBeUndefined()
    })

    expect(mockFrom).toHaveBeenCalledWith('business_roles')
    expect(result.current.data).toHaveLength(2)
  })

  it('maps hierarchy_level 0 to role_label Propietario', async () => {
    mockQueryFn.mockResolvedValue({ data: MOCK_CANDIDATES, error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChatAdminCandidates('biz-1'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.data).not.toBeUndefined()
    })

    const owner = result.current.data?.find(c => c.hierarchy_level === 0)
    expect(owner?.role_label).toBe('Propietario')
    expect(owner?.full_name).toBe('Carlos Owner')
  })

  it('maps hierarchy_level 1 to role_label Administrador', async () => {
    mockQueryFn.mockResolvedValue({ data: MOCK_CANDIDATES, error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useChatAdminCandidates('biz-1'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.data).not.toBeUndefined()
    })

    const admin = result.current.data?.find(c => c.hierarchy_level === 1)
    expect(admin?.role_label).toBe('Administrador')
  })
})
