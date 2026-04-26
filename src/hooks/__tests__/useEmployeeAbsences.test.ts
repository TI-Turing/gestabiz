import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from '@/test-utils/render-with-providers'
import { useEmployeeAbsences } from '../useEmployeeAbsences'

// ---------------------------------------------------------------------------
// HOISTED MOCKS
// ---------------------------------------------------------------------------
const { mockQueryFn, mockFrom, buildChain } = vi.hoisted(() => {
  const mockQueryFn = vi.fn()

  function buildChain(termFn: () => Promise<unknown>) {
    const c: Record<string, unknown> = {}
    ;[
      'select', 'eq', 'neq', 'lte', 'gte', 'order', 'limit',
      'insert', 'update', 'delete', 'or', 'filter', 'not',
      'is', 'ilike', 'like', 'match', 'contains', 'upsert',
    ].forEach(m => { c[m] = () => c })
    c['single'] = termFn
    c['maybeSingle'] = termFn
    c['then'] = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve(termFn()).then(resolve, reject)
    return c
  }

  return {
    mockQueryFn,
    mockFrom: vi.fn(() => buildChain(mockQueryFn)),
    buildChain,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'emp@test.com' } }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------
describe('useEmployeeAbsences', () => {
  const { Wrapper } = createWrapper()

  beforeEach(() => {
    mockQueryFn.mockReset()
    mockQueryFn.mockResolvedValue({ data: [], error: null })
  })

  it('returns empty absences when businessId is empty string', async () => {
    const { result } = renderHook(() => useEmployeeAbsences(''), { wrapper: Wrapper })
    // Query is disabled when businessId is ''
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.absences).toEqual([])
  })

  it('fetches and maps absences correctly when businessId is provided', async () => {
    const rawAbsence = {
      id: 'abs-1',
      business_id: 'biz-1',
      employee_id: 'user-1',
      absence_type: 'vacation',
      start_date: '2025-06-01',
      end_date: '2025-06-05',
      reason: 'Vacaciones anuales',
      employee_notes: 'nota',
      admin_notes: null,
      status: 'pending',
      approved_by: null,
      approved_at: null,
      created_at: '2025-05-01T00:00:00Z',
    }
    // Route per table to avoid ambiguity between the two queries
    mockFrom.mockImplementation((table: string) => {
      if (table === 'employee_absences')
        return buildChain(() => Promise.resolve({ data: [rawAbsence], error: null }))
      return buildChain(() => Promise.resolve({ data: null, error: null }))
    })

    const { result } = renderHook(() => useEmployeeAbsences('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.absences).toHaveLength(1))

    const abs = result.current.absences[0]
    expect(abs.id).toBe('abs-1')
    expect(abs.absenceType).toBe('vacation')
    expect(abs.startDate).toBe('2025-06-01')
    expect(abs.status).toBe('pending')
  })

  it('fetches vacation balance from vacation_balance table', async () => {
    const rawBalance = {
      year: 2025,
      total_vacation_days: 15,
      days_used: 5,
      days_pending: 2,
      days_remaining: 8,
    }
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vacation_balance')
        return buildChain(() => Promise.resolve({ data: rawBalance, error: null }))
      return buildChain(() => Promise.resolve({ data: [], error: null }))
    })

    const { result } = renderHook(() => useEmployeeAbsences('biz-1'), { wrapper: Wrapper })
    await waitFor(() => result.current.vacationBalance !== null)

    expect(result.current.vacationBalance?.year).toBe(2025)
    expect(result.current.vacationBalance?.totalDaysAvailable).toBe(15)
    expect(result.current.vacationBalance?.daysRemaining).toBe(8)
  })

  it('sets error when absences query returns an error', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'employee_absences')
        return buildChain(() => Promise.resolve({ data: null, error: { message: 'DB error' } }))
      return buildChain(() => Promise.resolve({ data: null, error: null }))
    })

    const { result } = renderHook(() => useEmployeeAbsences('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.error).toBe('DB error')
  })

  it('validateWorkDays detects weekend days as invalid', async () => {
    mockQueryFn.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useEmployeeAbsences('biz-1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let validation!: { isValid: boolean; invalidDays: string[] }
    await act(async () => {
      // 2025-11-01 = Saturday, 2025-11-02 = Sunday
      validation = await result.current.validateWorkDays('2025-11-01', '2025-11-02')
    })

    expect(validation.isValid).toBe(false)
    expect(validation.invalidDays).toHaveLength(2)
  })
})
