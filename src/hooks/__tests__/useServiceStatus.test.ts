import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

const mockGetSession = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockListBuckets = vi.hoisted(() => vi.fn())
const mockFatal = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    storage: { listBuckets: mockListBuckets },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), fatal: mockFatal, info: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useServiceStatus } from '../useServiceStatus'

function setupSuccessfulMocks() {
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  mockListBuckets.mockResolvedValue({ data: [], error: null })
  mockSelect.mockResolvedValue({ data: [{ count: 1 }], error: null })
  mockFrom.mockReturnValue({ select: mockSelect })
}

describe('useServiceStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSuccessfulMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('starts with checking status for all services', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    expect(result.current.supabase).toBe('checking')
    expect(result.current.auth).toBe('checking')
    expect(result.current.database).toBe('checking')
    expect(result.current.storage).toBe('checking')
    expect(result.current.lastChecked).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('returns operational status when all checks pass', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.supabase).toBe('operational')
    })

    expect(result.current.auth).toBe('operational')
    expect(result.current.database).toBe('operational')
    expect(result.current.storage).toBe('operational')
    expect(result.current.lastChecked).toBeInstanceOf(Date)
    expect(result.current.error).toBeNull()
  })

  it('sets auth and supabase to degraded when getSession rejects', async () => {
    mockGetSession.mockRejectedValue(new Error('Auth service error'))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.auth).toBe('down')
    })

    // supabase is 'down' because auth 'down' triggers the else-if branch
    expect(result.current.supabase).toBe('down')
    expect(result.current.lastChecked).toBeInstanceOf(Date)
  })

  it('sets database to down when db query returns null (timeout)', async () => {
    // Simulate db check returning null (e.g., timeout caught)
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.database).toBe('down')
    })

    expect(result.current.supabase).toBe('down')
  })

  it('calls logger.fatal when an unexpected error propagates', async () => {
    // Make getSession throw synchronously (not reject), bypassing inner .catch
    mockGetSession.mockImplementation(() => {
      throw new Error('Unexpected crash')
    })

    const { Wrapper } = createWrapper()
    renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(mockFatal).toHaveBeenCalled()
    })
  })

  it('exposes refresh callback', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    expect(typeof result.current.refresh).toBe('function')
  })

  it('refresh can be called manually to re-check', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.supabase).toBe('operational')
    })

    const callsBefore = mockGetSession.mock.calls.length

    await result.current.refresh()

    await waitFor(() => {
      expect(mockGetSession.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  it('storage is operational when listBuckets returns any response', async () => {
    // Even an auth error from storage = storage is reachable
    mockListBuckets.mockResolvedValue({ data: null, error: new Error('Storage auth error') })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useServiceStatus(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.storage).toBe('operational')
    })
  })
})
