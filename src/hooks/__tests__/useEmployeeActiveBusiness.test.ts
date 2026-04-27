import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = { from: mockFrom }
  return { supabase: __sb, default: __sb }
})

import { useEmployeeActiveBusiness } from '../useEmployeeActiveBusiness'

const EMP_ID = 'emp-42'

const businessEmployeeRow = {
  id: 'be-1',
  employee_id: EMP_ID,
  status: 'approved',
  businesses: {
    id: 'biz-1',
    name: 'Salón La Luna',
    logo_url: 'https://logo.png',
  },
}

function buildMock(
  data: object[] | null = [businessEmployeeRow],
  error: object | null = null,
) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        eq: () => Promise.resolve({ data, error }),
      }),
    }),
  })
}

describe('useEmployeeActiveBusiness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns status=not-employee when employeeId is null', async () => {
    const { result } = renderHook(() => useEmployeeActiveBusiness(null))
    await new Promise((r) => setTimeout(r, 10))
    expect(result.current.status).toBe('not-employee')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns status=not-employee when employeeId is undefined', async () => {
    const { result } = renderHook(() => useEmployeeActiveBusiness(undefined))
    await new Promise((r) => setTimeout(r, 10))
    expect(result.current.status).toBe('not-employee')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns status=not-employee when query returns empty array', async () => {
    buildMock([])
    const { result } = renderHook(() => useEmployeeActiveBusiness(EMP_ID))

    await waitFor(() => expect(result.current.status).toBe('not-employee'))
    expect(result.current.business_id).toBeNull()
  })

  it('returns first active business when query succeeds', async () => {
    buildMock([businessEmployeeRow])
    const { result } = renderHook(() => useEmployeeActiveBusiness(EMP_ID))

    await waitFor(() => expect(result.current.status).toBe('active'))

    expect(result.current.business_id).toBe('biz-1')
    expect(result.current.business_name).toBe('Salón La Luna')
    expect(result.current.business_logo_url).toBe('https://logo.png')
    expect(result.current.is_within_schedule).toBe(true)
  })

  it('queries business_employees table for the correct employee', async () => {
    buildMock([businessEmployeeRow])
    renderHook(() => useEmployeeActiveBusiness(EMP_ID))

    await waitFor(() => expect(mockFrom).toHaveBeenCalled())
    expect(mockFrom).toHaveBeenCalledWith('business_employees')
  })

  it('returns status=not-employee on fetch error', async () => {
    buildMock(null, { message: 'connection refused' })
    const { result } = renderHook(() => useEmployeeActiveBusiness(EMP_ID))

    await waitFor(() => expect(result.current.status).toBe('not-employee'))
  })

  it('returns status=not-employee when data is null', async () => {
    buildMock(null, null)
    const { result } = renderHook(() => useEmployeeActiveBusiness(EMP_ID))

    await waitFor(() => expect(result.current.status).toBe('not-employee'))
  })
})
