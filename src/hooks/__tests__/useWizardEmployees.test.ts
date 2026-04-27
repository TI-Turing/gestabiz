import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockRpc = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
  default: { from: mockFrom, rpc: mockRpc },
}))

import { useWizardEmployees } from '../useWizardEmployees'

const mockRpcEmployees = [
  {
    employee_id: 'emp-1',
    full_name: 'Ana García',
    avatar_url: null,
    email: 'ana@test.com',
    role: 'professional',
    expertise_level: '3',
    setup_completed: true,
    supervisor_name: null,
    avg_rating: '4.5',
    review_count: '10',
  },
  {
    employee_id: 'emp-2',
    full_name: 'Luis Martínez',
    avatar_url: null,
    email: 'luis@test.com',
    role: 'professional',
    expertise_level: null,
    setup_completed: true,
    supervisor_name: null,
    avg_rating: null,
    review_count: null,
  },
]

const mockSchedules = [
  { employee_id: 'emp-1' },
  // emp-2 has no schedule → should be filtered out
]

describe('useWizardEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when businessId is null', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees(null, 'svc-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.employees).toEqual([])
  })

  it('returns empty array when serviceId is null', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees('biz-1', null),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.employees).toEqual([])
  })

  it('returns employees that have at least one active work schedule', async () => {
    mockRpc.mockResolvedValue({ data: mockRpcEmployees, error: null })
    mockFrom.mockReturnValue(mockSupabaseChain({ data: mockSchedules, error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees('biz-1', 'svc-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Only emp-1 has a schedule
    expect(result.current.employees).toHaveLength(1)
    expect(result.current.employees[0]?.id).toBe('emp-1')
    expect(result.current.employees[0]?.full_name).toBe('Ana García')
    expect(result.current.error).toBeNull()
  })

  it('returns no employees when none have active work schedules', async () => {
    mockRpc.mockResolvedValue({ data: mockRpcEmployees, error: null })
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null })) // no schedules

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees('biz-1', 'svc-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.employees).toEqual([])
  })

  it('returns empty array when RPC returns empty data', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees('biz-1', 'svc-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.employees).toEqual([])
  })

  it('sets error when RPC fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees('biz-1', 'svc-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toContain('RPC error')
  })

  it('sets error when work_schedules query fails', async () => {
    mockRpc.mockResolvedValue({ data: mockRpcEmployees, error: null })
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'schedules query failed' } }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees('biz-1', 'svc-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })

  it('maps avg_rating and total_reviews to numbers with fallback to 0', async () => {
    mockRpc.mockResolvedValue({ data: [mockRpcEmployees[1]], error: null }) // emp-2 has null ratings
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: [{ employee_id: 'emp-2' }], error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardEmployees('biz-1', 'svc-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.employees[0]?.avg_rating).toBe(0)
    expect(result.current.employees[0]?.total_reviews).toBe(0)
  })
})
