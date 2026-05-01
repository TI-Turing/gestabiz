import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockQueryFn, mockFrom, mockFunctionsInvoke, mockUseAuth } = vi.hoisted(() => {
  const mockQueryFn = vi.fn()

  function buildChain(termFn: () => Promise<unknown>) {
    const c: Record<string, unknown> = {}
    ;[
      'select', 'eq', 'neq', 'lte', 'gte', 'order', 'limit',
      'insert', 'update', 'delete', 'or', 'filter', 'not', 'is',
      'ilike', 'like', 'match', 'contains', 'throwOnError',
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
    mockFunctionsInvoke: vi.fn(),
    mockUseAuth: vi.fn(),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    functions: { invoke: (name: string, opts: unknown) => mockFunctionsInvoke(name, opts) },
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'file.png' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
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

import { useBugReports } from '../useBugReports'

// ─── Test data ────────────────────────────────────────────────────────────────
const MOCK_USER = { id: 'user-1', email: 'test@example.com' }

const MOCK_BUG_REPORT = {
  id: 'report-1',
  user_id: 'user-1',
  title: 'Test Bug',
  description: 'Something is broken',
  status: 'open',
  priority: 'high',
  severity: 'high',
  category: 'ui',
  created_at: '2025-01-01T00:00:00Z',
}

const CREATE_DATA = {
  title: 'Test Bug',
  description: 'Something is broken',
  stepsToReproduce: '1. Open app\n2. Click button',
  severity: 'high' as const,
  category: 'ui' as const,
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useBugReports', () => {
  beforeEach(() => {
    // clearAllMocks preserves mockFrom/mockFunctionsInvoke implementations;
    // mockReset on specific fns clears Once queues
    vi.clearAllMocks()
    mockQueryFn.mockReset()
    mockFunctionsInvoke.mockReset()
    // Default: authenticated user
    mockUseAuth.mockReturnValue({ user: MOCK_USER })
    // Default: queries return null
    mockQueryFn.mockResolvedValue({ data: null, error: null })
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: null })
  })

  it('returns initial state: loading=false, error=null', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBugReports(), { wrapper: Wrapper })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('createBugReport returns null when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBugReports(), { wrapper: Wrapper })

    let report: unknown
    await act(async () => {
      report = await result.current.createBugReport(CREATE_DATA)
    })

    expect(report).toBeNull()
  })

  it('createBugReport calls supabase insert and returns bug report', async () => {
    // First call: bug_reports insert → success
    mockQueryFn.mockResolvedValueOnce({ data: MOCK_BUG_REPORT, error: null })
    // Second call: profiles select for email notification
    mockQueryFn.mockResolvedValueOnce({
      data: { full_name: 'Test User', email: 'test@example.com' },
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBugReports(), { wrapper: Wrapper })

    let report: unknown
    await act(async () => {
      report = await result.current.createBugReport(CREATE_DATA)
    })

    expect(mockFrom).toHaveBeenCalledWith('bug_reports')
    expect(report).toEqual(MOCK_BUG_REPORT)
  })

  it('createBugReport calls functions.invoke for email notification', async () => {
    mockQueryFn.mockResolvedValueOnce({ data: MOCK_BUG_REPORT, error: null })
    mockQueryFn.mockResolvedValueOnce({
      data: { full_name: 'Test User', email: 'test@example.com' },
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBugReports(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.createBugReport(CREATE_DATA)
    })

    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'send-bug-report-email',
      expect.objectContaining({ body: expect.objectContaining({ title: 'Test Bug' }) }),
    )
  })

  it('getBugReports calls supabase from bug_reports and returns array', async () => {
    mockQueryFn.mockResolvedValue({ data: [MOCK_BUG_REPORT], error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBugReports(), { wrapper: Wrapper })

    let reports: unknown
    await act(async () => {
      reports = await result.current.getBugReports()
    })

    expect(mockFrom).toHaveBeenCalledWith('bug_reports')
    expect(Array.isArray(reports)).toBe(true)
  })
})
