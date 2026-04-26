import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ── hoisted mocks ──────────────────────────────────────────────
const mockAppointmentsList = vi.hoisted(() => vi.fn())
const mockServicesList = vi.hoisted(() => vi.fn())
const mockLocationsList = vi.hoisted(() => vi.fn())
const mockBusinessesList = vi.hoisted(() => vi.fn())
const mockStatsGet = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())
const mockLoggerError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {},
}))

vi.mock('@/lib/services', () => ({
  appointmentsService: { list: mockAppointmentsList },
  servicesService: { list: mockServicesList },
  locationsService: { list: mockLocationsList },
  businessesService: { list: mockBusinessesList },
  statsService: { get: mockStatsGet },
}))

vi.mock('@/lib/hierarchyService', () => ({
  hierarchyService: {
    updateHierarchy: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/normalizers', () => ({
  normalizeAppointmentStatus: (s: string) => s,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
    warn: vi.fn(),
    fatal: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { error: mockToastError, success: vi.fn() },
}))

import { useSupabaseData } from '../useSupabaseData'

const BASE_USER = {
  id: 'user1',
  email: 'user@test.com',
  role: 'admin',
  activeRole: 'admin',
}

describe('useSupabaseData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAppointmentsList.mockResolvedValue([])
    mockServicesList.mockResolvedValue([])
    mockLocationsList.mockResolvedValue([])
    mockBusinessesList.mockResolvedValue([])
    mockStatsGet.mockResolvedValue(null)
  })

  it('returns empty arrays and null stats as initial state', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useSupabaseData({ user: null, autoFetch: false }),
      { wrapper: Wrapper }
    )

    expect(result.current.appointments).toEqual([])
    expect(result.current.services).toEqual([])
    expect(result.current.locations).toEqual([])
    expect(result.current.businesses).toEqual([])
    expect(result.current.clients).toEqual([])
    expect(result.current.stats).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch automatically when autoFetch is false', async () => {
    const { Wrapper } = createWrapper()
    renderHook(
      () => useSupabaseData({ user: BASE_USER as never, autoFetch: false }),
      { wrapper: Wrapper }
    )

    // Wait a tick to ensure no async fetches were started
    await new Promise((r) => setTimeout(r, 10))

    expect(mockAppointmentsList).not.toHaveBeenCalled()
  })

  it('fetchAppointments calls appointmentsService.list with correct params', async () => {
    mockAppointmentsList.mockResolvedValue([
      { id: 'apt1', status: 'pending', start_time: '2025-06-15T10:00:00Z' },
    ])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useSupabaseData({ user: BASE_USER as never, autoFetch: false }),
      { wrapper: Wrapper }
    )

    await act(async () => {
      await result.current.fetchAppointments('biz1')
    })

    expect(mockAppointmentsList).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz1' })
    )
  })

  it('returns early from fetchAppointments when user is null', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useSupabaseData({ user: null, autoFetch: false }),
      { wrapper: Wrapper }
    )

    const returned = await result.current.fetchAppointments('biz1')

    expect(mockAppointmentsList).not.toHaveBeenCalled()
    expect(returned).toEqual([])
  })

  it('handles service error by setting error state and showing toast', async () => {
    mockAppointmentsList.mockRejectedValue(new Error('Network error'))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useSupabaseData({ user: BASE_USER as never, autoFetch: false }),
      { wrapper: Wrapper }
    )

    await act(async () => {
      await result.current.fetchAppointments('biz1')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })

    expect(mockToastError).toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('populates appointments array after successful fetch', async () => {
    const mockApts = [
      { id: 'apt1', status: 'pending', start_time: '2025-06-15T10:00:00Z', end_time: '2025-06-15T11:00:00Z' },
    ]
    mockAppointmentsList.mockResolvedValue(mockApts)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useSupabaseData({ user: BASE_USER as never, autoFetch: false }),
      { wrapper: Wrapper }
    )

    await act(async () => {
      await result.current.fetchAppointments('biz1')
    })

    await waitFor(() => {
      expect(result.current.appointments).toHaveLength(1)
      expect(result.current.appointments[0].id).toBe('apt1')
    })
  })
})
