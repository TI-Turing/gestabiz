import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import { toast } from 'sonner'

const mockFrom = vi.hoisted(() => vi.fn())
const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, functions: { invoke: mockInvoke } },
  default: { from: mockFrom, functions: { invoke: mockInvoke } },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@test.com' },
    session: { access_token: 'tok' },
    loading: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { useAbsenceApprovals } from '../useAbsenceApprovals'

/** Sets up `from()` to return different chains per table call */
function setupFromRouter(opts: {
  absences?: unknown[]
  appointments?: unknown[]
  absencesError?: unknown
  appointmentsError?: unknown
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'employee_absences') {
      return mockSupabaseChain({
        data: opts.absences ?? [],
        error: opts.absencesError ?? null,
      })
    }
    if (table === 'appointments') {
      return mockSupabaseChain({
        data: opts.appointments ?? [],
        error: opts.appointmentsError ?? null,
      })
    }
    return mockSupabaseChain({ data: [], error: null })
  })
}

const baseAbsence = {
  id: 'abs-1',
  employee_id: 'emp-1',
  business_id: 'biz-1',
  absence_type: 'vacation',
  start_date: '2026-05-01',
  end_date: '2026-05-05',
  reason: 'Vacaciones',
  employee_notes: null,
  status: 'pending',
  created_at: '2026-04-15T10:00:00Z',
  employee: { full_name: 'Ana Pérez', email: 'ana@test.com' },
}

describe('useAbsenceApprovals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when businessId is empty', async () => {
    setupFromRouter({})
    const { Wrapper } = createWrapper()
    renderHook(() => useAbsenceApprovals(''), { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 30))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns empty arrays + zeroed stats when there are no absences', async () => {
    setupFromRouter({ absences: [] })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.absences).toEqual([])
    expect(result.current.pendingAbsences).toEqual([])
    expect(result.current.stats).toEqual({
      totalAbsences: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      vacationDaysUsed: 0,
      emergencyAbsences: 0,
    })
  })

  it('maps raw rows into AbsenceApproval and computes daysRequested correctly', async () => {
    setupFromRouter({ absences: [baseAbsence] })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.absences).toHaveLength(1)
    const a = result.current.absences[0]
    expect(a.id).toBe('abs-1')
    expect(a.employeeName).toBe('Ana Pérez')
    expect(a.employeeEmail).toBe('ana@test.com')
    // 1..5 inclusive = 5 days
    expect(a.daysRequested).toBe(5)
  })

  it('classifies absences into pending/approved/rejected buckets', async () => {
    setupFromRouter({
      absences: [
        { ...baseAbsence, id: 'a1', status: 'pending' },
        { ...baseAbsence, id: 'a2', status: 'approved' },
        { ...baseAbsence, id: 'a3', status: 'approved' },
        { ...baseAbsence, id: 'a4', status: 'rejected' },
      ],
    })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.pendingAbsences).toHaveLength(1)
    expect(result.current.approvedAbsences).toHaveLength(2)
    expect(result.current.rejectedAbsences).toHaveLength(1)
    expect(result.current.stats?.totalAbsences).toBe(4)
    expect(result.current.stats?.pendingCount).toBe(1)
  })

  it('counts affected appointments only for pending absences', async () => {
    setupFromRouter({
      absences: [
        { ...baseAbsence, id: 'a1', status: 'pending' },
        { ...baseAbsence, id: 'a2', status: 'approved' },
      ],
      appointments: [
        { employee_id: 'emp-1', start_time: '2026-05-02T10:00:00' },
        { employee_id: 'emp-1', start_time: '2026-05-03T10:00:00' },
        // Outside range → not counted
        { employee_id: 'emp-1', start_time: '2026-06-10T10:00:00' },
      ],
    })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    const pending = result.current.absences.find((a) => a.id === 'a1')!
    const approved = result.current.absences.find((a) => a.id === 'a2')!
    expect(pending.affectedAppointmentsCount).toBe(2)
    expect(approved.affectedAppointmentsCount).toBe(0)
  })

  it('aggregates vacation days only for approved vacation absences', async () => {
    setupFromRouter({
      absences: [
        {
          ...baseAbsence,
          id: 'v1',
          absence_type: 'vacation',
          status: 'approved',
          start_date: '2026-05-01',
          end_date: '2026-05-03',
        },
        {
          ...baseAbsence,
          id: 'v2',
          absence_type: 'vacation',
          status: 'pending',
          start_date: '2026-06-01',
          end_date: '2026-06-10',
        },
        {
          ...baseAbsence,
          id: 'e1',
          absence_type: 'emergency',
          status: 'approved',
        },
      ],
    })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats?.vacationDaysUsed).toBe(3)
    expect(result.current.stats?.emergencyAbsences).toBe(1)
  })

  // ── approveAbsence ──────────────────────────────────────────────────────────

  it('approveAbsence invokes the edge function with action=approve', async () => {
    setupFromRouter({ absences: [] })
    mockInvoke.mockResolvedValue({
      data: { success: true, message: '3 citas canceladas' },
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.approveAbsence('abs-1', 'OK')
    })

    expect(mockInvoke).toHaveBeenCalledWith('approve-reject-absence', {
      body: { absenceId: 'abs-1', action: 'approve', adminNotes: 'OK' },
    })
    expect(toast.success).toHaveBeenCalledWith('3 citas canceladas')
  })

  it('approveAbsence throws and toasts when edge function returns error', async () => {
    setupFromRouter({ absences: [] })
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'edge-failed' },
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.approveAbsence('abs-1')).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalled()
  })

  it('approveAbsence throws when payload.success is false', async () => {
    setupFromRouter({ absences: [] })
    mockInvoke.mockResolvedValue({
      data: { success: false, error: 'no-balance' },
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.approveAbsence('abs-1')).rejects.toThrow(
        'no-balance',
      )
    })
  })

  // ── rejectAbsence ───────────────────────────────────────────────────────────

  it('rejectAbsence invokes the edge function with action=reject', async () => {
    setupFromRouter({ absences: [] })
    mockInvoke.mockResolvedValue({
      data: { success: true, message: 'Rechazada' },
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.rejectAbsence('abs-1', 'No procede')
    })

    expect(mockInvoke).toHaveBeenCalledWith('approve-reject-absence', {
      body: { absenceId: 'abs-1', action: 'reject', adminNotes: 'No procede' },
    })
    expect(toast.success).toHaveBeenCalledWith('Rechazada')
  })

  // ── getAffectedAppointments ─────────────────────────────────────────────────

  it('getAffectedAppointments returns [] when absence not found', async () => {
    setupFromRouter({ absences: [] })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: unknown[] = ['placeholder']
    await act(async () => {
      res = await result.current.getAffectedAppointments('does-not-exist')
    })
    expect(res).toEqual([])
  })

  it('getAffectedAppointments queries appointments scoped to the absence', async () => {
    setupFromRouter({
      absences: [baseAbsence],
      appointments: [
        { id: 'apt-1', start_time: '2026-05-02T10:00:00', end_time: '2026-05-02T11:00:00' },
      ],
    })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: unknown[] = []
    await act(async () => {
      res = await result.current.getAffectedAppointments('abs-1')
    })
    expect(res.length).toBeGreaterThanOrEqual(1)
  })

  // ── refresh ─────────────────────────────────────────────────────────────────

  it('refresh invalidates the query cache (re-fetches)', async () => {
    setupFromRouter({ absences: [] })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAbsenceApprovals('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    const callsBefore = mockFrom.mock.calls.length
    await act(async () => {
      await result.current.refresh()
    })
    await waitFor(() => {
      expect(mockFrom.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })
})
