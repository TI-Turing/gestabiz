import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ── hoisted mocks ──────────────────────────────────────────────
const mockRpc = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  default: { rpc: mockRpc },
  supabase: { rpc: mockRpc },
}))

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
    FREQUENT: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
    REALTIME: { staleTime: 0, gcTime: 0 },
    KEYS: {
      WIZARD_DATETIME_DAY: (id: string, type: string, date: string) =>
        ['wizard-datetime-day', id, type, date],
      WIZARD_DATETIME_MONTH: (id: string, type: string, month: string) =>
        ['wizard-datetime-month', id, type, month],
    },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
    FREQUENT: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
    REALTIME: { staleTime: 0, gcTime: 0 },
    KEYS: {
      WIZARD_DATETIME_DAY: (id: string, type: string, date: string) =>
        ['wizard-datetime-day', id, type, date],
      WIZARD_DATETIME_MONTH: (id: string, type: string, month: string) =>
        ['wizard-datetime-month', id, type, month],
    },
  },
}))

import { useWizardDateTimeData } from '../useWizardDateTimeData'

const BASE_PARAMS = {
  employeeId: 'emp1',
  resourceId: null,
  businessId: 'biz1',
  locationId: 'loc1',
  selectedDate: new Date('2025-06-15'),
  clientId: 'client1',
}

const DAY_RESPONSE = {
  location_schedule: { opens_at: '08:00', closes_at: '18:00' },
  employee_schedule: { lunch_break_start: '12:00', lunch_break_end: '13:00' },
  work_schedules: [],
  day_appointments: [],
  client_day_appointments: [],
  employee_transfer: null,
}

const MONTH_RESPONSE = {
  month_appointments: [],
  month_absences: [],
}

function renderWizardData(p = BASE_PARAMS) {
  const { Wrapper } = createWrapper()
  return renderHook(
    () => useWizardDateTimeData(p.employeeId, p.resourceId, p.businessId, p.locationId, p.selectedDate, p.clientId),
    { wrapper: Wrapper }
  )
}

describe('useWizardDateTimeData', () => {
  beforeEach(() => {
    vi.resetAllMocks()  // also clears mockResolvedValueOnce queue (clearAllMocks does not)
    // Mock two sequential RPC calls: day then month
    mockRpc
      .mockResolvedValueOnce({ data: DAY_RESPONSE, error: null })
      .mockResolvedValueOnce({ data: MONTH_RESPONSE, error: null })
  })

  it('day query is disabled when selectedDate is null — only month query runs', async () => {
    const { Wrapper } = createWrapper()
    renderHook(
      () => useWizardDateTimeData('emp1', null, BASE_PARAMS.businessId, BASE_PARAMS.locationId, null, BASE_PARAMS.clientId),
      { wrapper: Wrapper }
    )

    // Month query runs (selectedDate not required), day query does not
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1)
    })

    // Verify the single call used first-day-of-current-month, not null
    const [, params] = mockRpc.mock.calls[0]
    expect(params.p_selected_date).toBeTruthy()
  })

  it('both queries are disabled when businessId is missing', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useWizardDateTimeData(BASE_PARAMS.employeeId, null, '', BASE_PARAMS.locationId, BASE_PARAMS.selectedDate, BASE_PARAMS.clientId),
      { wrapper: Wrapper }
    )

    expect(result.current.isLoading).toBe(false)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('both queries are disabled when no assignee (no employeeId or resourceId)', () => {
    const { Wrapper } = createWrapper()
    renderHook(
      () =>
        useWizardDateTimeData(null, null, BASE_PARAMS.businessId, BASE_PARAMS.locationId, BASE_PARAMS.selectedDate, BASE_PARAMS.clientId),
      { wrapper: Wrapper }
    )

    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls rpc with correct params when all required fields are present', async () => {
    const { result } = renderWizardData()

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled()
    })

    const firstCall = mockRpc.mock.calls[0]
    expect(firstCall[0]).toBe('get_datetime_selection_data')
    expect(firstCall[1]).toMatchObject({
      p_employee_id: 'emp1',
      p_business_id: 'biz1',
      p_location_id: 'loc1',
      p_client_id: 'client1',
    })
  })

  it('exposes day data once query resolves', async () => {
    const { result } = renderWizardData()

    await waitFor(() => {
      expect(result.current.day.locationSchedule).not.toBeNull()
    })

    expect(result.current.day.locationSchedule).toEqual(DAY_RESPONSE.location_schedule)
    expect(result.current.day.employeeSchedule).toEqual(DAY_RESPONSE.employee_schedule)
  })

  it('returns loading:true while queries are in flight', () => {
    // Clear the once queue from beforeEach so only the pending default is used
    mockRpc.mockReset()
    mockRpc.mockReturnValue(new Promise(() => {}))

    const { result } = renderWizardData()

    expect(result.current.isLoading).toBe(true)
  })

  it('uses resource_id param when resourceId is provided', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: DAY_RESPONSE, error: null })
      .mockResolvedValueOnce({ data: MONTH_RESPONSE, error: null })

    const { Wrapper } = createWrapper()
    renderHook(
      () =>
        useWizardDateTimeData(null, 'res1', BASE_PARAMS.businessId, BASE_PARAMS.locationId, BASE_PARAMS.selectedDate, BASE_PARAMS.clientId),
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith(
        'get_datetime_selection_data',
        expect.objectContaining({ p_resource_id: 'res1' })
      )
    })
  })
})
