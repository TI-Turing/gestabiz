import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (name: string, params: unknown) => mockRpc(name, params),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

import { useEmployeeBusinessDetails } from '../useEmployeeBusinessDetails'

// ─── Test data ────────────────────────────────────────────────────────────────
const MOCK_DETAILS = {
  employee_id: 'emp-1',
  business_id: 'biz-1',
  employee_role: 'professional',
  employee_status: 'approved',
  hire_date: '2025-01-01',
  salary_base: 2000000,
  full_name: 'Ana Trabajadora',
  email: 'ana@biz.com',
  business_name: 'Salón Belleza',
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useEmployeeBusinessDetails', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockRpc.mockResolvedValue({ data: [], error: null })
  })

  it('returns null details and loading=false when employeeId is not provided', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinessDetails(null as unknown as string, 'biz-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.details).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns null details and loading=false when businessId is not provided', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinessDetails('emp-1', null as unknown as string),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.details).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls RPC with correct parameters', async () => {
    mockRpc.mockResolvedValue({ data: [MOCK_DETAILS], error: null })

    const { Wrapper } = createWrapper()
    renderHook(() => useEmployeeBusinessDetails('emp-1', 'biz-1'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled()
    })

    expect(mockRpc).toHaveBeenCalledWith('get_employee_business_details', {
      p_employee_id: 'emp-1',
      p_business_id: 'biz-1',
    })
  })

  it('sets details from successful RPC response', async () => {
    mockRpc.mockResolvedValue({ data: [MOCK_DETAILS], error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinessDetails('emp-1', 'biz-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.details).not.toBeNull()
    expect(result.current.details?.full_name).toBe('Ana Trabajadora')
    expect(result.current.error).toBeNull()
  })

  it('handles RPC error gracefully — sets error and null details', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinessDetails('emp-1', 'biz-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.details).toBeNull()
    expect(result.current.error).not.toBeNull()
  })

  it('refetch function re-calls the RPC', async () => {
    mockRpc.mockResolvedValue({ data: [MOCK_DETAILS], error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useEmployeeBusinessDetails('emp-1', 'biz-1'),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const callsBefore = mockRpc.mock.calls.length

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockRpc.mock.calls.length).toBeGreaterThan(callsBefore)
  })
})
