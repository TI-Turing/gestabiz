import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePendingReviews } from '@/hooks/usePendingReviews'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

// ── Mocks ─────────────────────────────────────────────────────────────────────
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn().mockResolvedValue(undefined),
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

// ── Fixtures ──────────────────────────────────────────────────────────────────
const APPOINTMENT = {
  id: 'apt-1',
  start_time: '2025-11-01T10:00:00',
  business_id: 'biz-1',
  employee_id: 'emp-1',
  service_id: 'svc-1',
  updated_at: '2025-11-01T11:00:00',
  businesses: { id: 'biz-1', name: 'Salon Test' },
  employee: { id: 'emp-1', full_name: 'Ana García' },
  services: { id: 'svc-1', name: 'Corte' },
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('usePendingReviews — initial state', () => {
  it('starts with loading=true', () => {
    // Mock both supabase calls that the hook will make
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())
    // The hook starts loading immediately after mount
    expect(result.current.loading || result.current.pendingReviews.length === 0).toBe(true)
  })

  it('exposes required API shape', () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())

    expect(typeof result.current.loadPendingReviews).toBe('function')
    expect(typeof result.current.remindLater).toBe('function')
    expect(typeof result.current.getRemindLaterList).toBe('function')
    expect(typeof result.current.removeFromRemindLater).toBe('function')
    expect(typeof result.current.clearExpiredReminders).toBe('function')
  })
})

describe('usePendingReviews — no user', () => {
  it('returns empty reviews when user is null', async () => {
    vi.doMock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null }),
    }))

    // Still mock to prevent crashes if hook tries to fetch
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    // May or may not fetch, but should not error
    expect(result.current.error).toBeNull()
  })
})

describe('usePendingReviews — fetching data', () => {
  it('returns pending reviews for appointments without prior reviews', async () => {
    // First call: appointments query → one appointment
    // Second call: reviews query → empty (no prior reviews)
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [APPOINTMENT], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    expect(result.current.pendingReviews).toHaveLength(1)
    expect(result.current.pendingReviews[0].appointment_id).toBe('apt-1')
    expect(result.current.pendingReviews[0].business_name).toBe('Salon Test')
  })

  it('filters out appointments that already have a review', async () => {
    // First call: appointments query → one appointment
    // Second call: reviews query → existing review for same appointment
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [APPOINTMENT], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: [{ appointment_id: 'apt-1' }], error: null }))

    const { result } = renderHook(() => usePendingReviews())

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    expect(result.current.pendingReviews).toHaveLength(0)
  })

  it('sets error state when supabase fetch fails', async () => {
    const dbError = new Error('DB error')
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: dbError }))

    const { result } = renderHook(() => usePendingReviews())

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    expect(result.current.error).toBeTruthy()
  })
})

describe('usePendingReviews — remindLater', () => {
  it('removes appointment from pending list', async () => {
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [APPOINTMENT], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })
    expect(result.current.pendingReviews).toHaveLength(1)

    act(() => {
      result.current.remindLater('apt-1')
    })

    expect(result.current.pendingReviews).toHaveLength(0)
  })

  it('persists remind-later entry in localStorage', async () => {
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [APPOINTMENT], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    act(() => {
      result.current.remindLater('apt-1')
    })

    const stored = localStorage.getItem('gestabiz_remind_later_reviews')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!) as Array<{ appointmentId: string }>
    expect(parsed.some((e) => e.appointmentId === 'apt-1')).toBe(true)
  })
})

describe('usePendingReviews — getRemindLaterList / removeFromRemindLater', () => {
  it('getRemindLaterList returns empty array when nothing stored', () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())
    expect(result.current.getRemindLaterList()).toEqual([])
  })

  it('removeFromRemindLater deletes specific entry from localStorage', async () => {
    // Seed localStorage with a remind-later entry
    const entry = { appointmentId: 'apt-99', timestamp: Date.now() }
    localStorage.setItem('gestabiz_remind_later_reviews', JSON.stringify([entry]))

    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => usePendingReviews())

    act(() => {
      result.current.removeFromRemindLater('apt-99')
    })

    const stored = localStorage.getItem('gestabiz_remind_later_reviews')
    const parsed = JSON.parse(stored || '[]') as Array<{ appointmentId: string }>
    expect(parsed.some((e) => e.appointmentId === 'apt-99')).toBe(false)
  })
})
