import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
const getWrapper = () => createWrapper().Wrapper

// ============================================================================
// MOCKS
// ============================================================================

const mockRpc = vi.fn()

vi.mock('@/lib/supabase', () => { const __sb = {
    rpc: (...args: unknown[]) => mockRpc(...args),
  }; return { supabase: __sb, default: __sb } })

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import {
  useClientDashboard,
  useCompletedAppointmentsFromDashboard,
  useUpcomingAppointmentsFromDashboard,
  usePendingReviewsInfo,
} from '../useClientDashboard'

// ============================================================================
// HELPERS
// ============================================================================

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: `apt-${Math.random().toString(36).slice(2, 8)}`,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    business_id: 'biz-1',
    location_id: 'loc-1',
    service_id: 'srv-1',
    client_id: 'client-1',
    employee_id: 'emp-1',
    start_time: '2025-06-01T10:00:00Z',
    end_time: '2025-06-01T11:00:00Z',
    status: 'confirmed',
    notes: null,
    price: 50000,
    currency: 'COP',
    business: {
      id: 'biz-1',
      name: 'Salón A',
      description: null,
      logo_url: null,
      banner_url: null,
      average_rating: 4.5,
      total_reviews: 10,
      city: 'Bogotá',
      state: 'Cundinamarca',
    },
    location: { id: 'loc-1', name: 'Sede Norte', address: 'Calle 100', city: 'Bogotá', state: null, postal_code: null, country: 'CO', latitude: null, longitude: null, google_maps_url: null },
    employee: { id: 'emp-1', full_name: 'Ana', email: null, phone: null, avatar_url: null },
    client: { id: 'client-1', full_name: 'Carlos', email: null, phone: null, avatar_url: null },
    service: { id: 'srv-1', name: 'Corte', description: null, duration_minutes: 30, price: 50000, currency: 'COP', image_url: null, category: 'hair' },
    review_id: null,
    has_review: false,
    ...overrides,
  }
}

const baseDashboardData = {
  appointments: [
    makeAppointment({ id: 'apt-1', status: 'completed', start_time: '2025-03-01T10:00:00Z' }),
    makeAppointment({ id: 'apt-2', status: 'confirmed', start_time: '2099-06-01T10:00:00Z' }),
    makeAppointment({ id: 'apt-3', status: 'cancelled', start_time: '2025-02-01T10:00:00Z' }),
  ],
  reviewedAppointmentIds: ['apt-1'],
  pendingReviewsCount: 0,
  favorites: [],
  suggestions: [
    { id: 'biz-2', name: 'Clínica B', description: null, logo_url: null, banner_url: null, average_rating: 4.0, total_reviews: 5, relevance_score: 2 },
  ],
  stats: { totalAppointments: 3, completedAppointments: 1, upcomingAppointments: 1, cancelledAppointments: 1 },
}

// ============================================================================
// TESTS
// ============================================================================

describe('useClientDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('returns null when clientId is null', async () => {
    const { result } = renderHook(() => useClientDashboard(null), {
      wrapper: getWrapper(),
    })

    // Query should be disabled — loading should eventually settle
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeUndefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls RPC with clientId and no city preference', async () => {
    mockRpc.mockResolvedValue({ data: baseDashboardData, error: null })

    const { result } = renderHook(() => useClientDashboard('client-1'), {
      wrapper: getWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockRpc).toHaveBeenCalledWith('get_client_dashboard_data', {
      p_client_id: 'client-1',
      p_preferred_city_name: null,
      p_preferred_region_name: null,
    })
  })

  it('reads preferred city from localStorage', async () => {
    localStorage.setItem('preferred-city', JSON.stringify({ cityName: 'Medellín', regionName: 'Antioquia' }))
    mockRpc.mockResolvedValue({ data: baseDashboardData, error: null })

    renderHook(() => useClientDashboard('client-1'), { wrapper: getWrapper() })

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled()
    })

    expect(mockRpc).toHaveBeenCalledWith('get_client_dashboard_data', {
      p_client_id: 'client-1',
      p_preferred_city_name: 'Medellín',
      p_preferred_region_name: 'Antioquia',
    })
  })

  it('normalizes business aliases (businesses → business)', async () => {
    const rawData = {
      ...baseDashboardData,
      appointments: [
        makeAppointment({
          id: 'apt-alias',
          business: undefined,
          businesses: { id: 'biz-alias', name: 'Alias Biz', description: null, logo_url: null, banner_url: null, average_rating: null, total_reviews: 0, city: null, state: null },
        }),
      ],
    }
    mockRpc.mockResolvedValue({ data: rawData, error: null })

    const { result } = renderHook(() => useClientDashboard('client-1'), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.data).toBeTruthy())

    const apt = result.current.data!.appointments[0]
    expect(apt.business?.id).toBe('biz-alias')
    expect(apt.business?.name).toBe('Alias Biz')
  })

  it('builds frequent businesses from completed appointments', async () => {
    const appts = [
      makeAppointment({ id: 'a1', status: 'completed', business: { id: 'biz-1', name: 'Salon A', description: null, logo_url: null, banner_url: null, average_rating: 4.5, total_reviews: 10, city: 'Bogotá', state: null }, start_time: '2025-01-10T10:00:00Z' }),
      makeAppointment({ id: 'a2', status: 'completed', business: { id: 'biz-1', name: 'Salon A', description: null, logo_url: null, banner_url: null, average_rating: 4.5, total_reviews: 10, city: 'Bogotá', state: null }, start_time: '2025-02-10T10:00:00Z' }),
      makeAppointment({ id: 'a3', status: 'completed', business: { id: 'biz-2', name: 'Clinic B', description: null, logo_url: null, banner_url: null, average_rating: 4.0, total_reviews: 5, city: 'Medellín', state: null }, start_time: '2025-03-10T10:00:00Z' }),
      makeAppointment({ id: 'a4', status: 'pending', business: { id: 'biz-1', name: 'Salon A', description: null, logo_url: null, banner_url: null, average_rating: 4.5, total_reviews: 10, city: 'Bogotá', state: null }, start_time: '2025-04-10T10:00:00Z' }),
    ]
    const data = { ...baseDashboardData, appointments: appts, suggestions: [] }
    mockRpc.mockResolvedValue({ data, error: null })

    const { result } = renderHook(() => useClientDashboard('client-1'), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.data).toBeTruthy())

    const suggestions = result.current.data!.suggestions
    // biz-1 has 2 completed, biz-2 has 1 completed → biz-1 first
    expect(suggestions[0].id).toBe('biz-1')
    expect(suggestions[0].isFrequent).toBe(true)
    expect(suggestions[0].visitsCount).toBe(2)
    expect(suggestions[1].id).toBe('biz-2')
  })

  it('merges frequent businesses with base suggestions', async () => {
    const appts = [
      makeAppointment({ id: 'a1', status: 'completed', business: { id: 'biz-2', name: 'Clínica B', description: null, logo_url: null, banner_url: null, average_rating: 4.0, total_reviews: 5, city: null, state: null }, start_time: '2025-03-10T10:00:00Z' }),
    ]
    const data = {
      ...baseDashboardData,
      appointments: appts,
      suggestions: [
        { id: 'biz-2', name: 'Clínica B', description: 'Best clinic', logo_url: null, banner_url: null, average_rating: 4.0, total_reviews: 5, relevance_score: 2 },
        { id: 'biz-3', name: 'Gym C', description: null, logo_url: null, banner_url: null, average_rating: 3.8, total_reviews: 3, relevance_score: 1 },
      ],
    }
    mockRpc.mockResolvedValue({ data, error: null })

    const { result } = renderHook(() => useClientDashboard('client-1'), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.data).toBeTruthy())

    const suggestions = result.current.data!.suggestions
    // biz-2 should be first (frequent), inheriting base description
    expect(suggestions[0].id).toBe('biz-2')
    expect(suggestions[0].isFrequent).toBe(true)
    expect(suggestions[0].description).toBe('Best clinic')
    // biz-3 should be second (not frequent)
    expect(suggestions[1].id).toBe('biz-3')
  })

  it('handles RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    const { result } = renderHook(() => useClientDashboard('client-1'), { wrapper: getWrapper() })

    // Hook has retry: 2, so wait longer for all retries to exhaust
    await waitFor(() => expect(result.current.error).toBeTruthy(), { timeout: 5000 })

    expect(result.current.error?.message).toContain('RPC failed')
  })

  it('handles null RPC data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useClientDashboard('client-1'), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
  })
})

// ============================================================================
// DERIVED HOOKS
// ============================================================================

describe('useCompletedAppointmentsFromDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('filters only completed appointments', async () => {
    mockRpc.mockResolvedValue({ data: baseDashboardData, error: null })

    const { result } = renderHook(() => useCompletedAppointmentsFromDashboard('client-1'), {
      wrapper: getWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.appointments).toHaveLength(1)
    expect(result.current.appointments[0].status).toBe('completed')
  })
})

describe('useUpcomingAppointmentsFromDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('filters only future non-cancelled appointments', async () => {
    mockRpc.mockResolvedValue({ data: baseDashboardData, error: null })

    const { result } = renderHook(() => useUpcomingAppointmentsFromDashboard('client-1'), {
      wrapper: getWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Only apt-2 (confirmed, start_time 2099) should be upcoming
    expect(result.current.appointments).toHaveLength(1)
    expect(result.current.appointments[0].id).toBe('apt-2')
  })
})

describe('usePendingReviewsInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('returns pending reviews info', async () => {
    mockRpc.mockResolvedValue({ data: baseDashboardData, error: null })

    const { result } = renderHook(() => usePendingReviewsInfo('client-1'), {
      wrapper: getWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.pendingReviewsCount).toBe(0)
    expect(result.current.reviewedAppointmentIds).toEqual(['apt-1'])
    expect(result.current.completedAppointments).toHaveLength(1)
  })
})
