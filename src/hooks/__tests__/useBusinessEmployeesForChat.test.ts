import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = { from: mockFrom }
  return { supabase: __sb, default: __sb }
})

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0 },
    KEYS: {
      BUSINESS_EMPLOYEES: (bizId: string) => ['business-employees', bizId],
    },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
    KEYS: {
      BUSINESS_EMPLOYEES: (bizId: string) => ['business-employees', bizId],
    },
  },
}))

import { useBusinessEmployeesForChat } from '../useBusinessEmployeesForChat'

const BIZ_ID = 'biz-emp-001'

const employeeRow = {
  employee_id: 'emp-1',
  role: 'employee',
  profiles: { id: 'emp-1', full_name: 'Laura Soto', email: 'laura@biz.com', avatar_url: null },
}

const managerRow = {
  employee_id: 'mgr-1',
  role: 'manager',
  profiles: { id: 'mgr-1', full_name: 'Carlos Mgr', email: 'carlos@biz.com', avatar_url: null },
}

const locationRow = { id: 'loc-1', name: 'Sede Principal' }

function buildMock(
  employeesData: object[] = [employeeRow],
  employeesError: object | null = null,
  locationData: object | null = locationRow,
  locationError: object | null = null,
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'business_employees') {
      const chain = {
        select: () => chain,
        eq: () => chain,
        then: (cb: Function) =>
          Promise.resolve({ data: employeesData, error: employeesError }).then(cb),
      }
      return chain
    }
    if (table === 'locations') {
      return {
        select: () => ({
          eq: () => ({
            limit: () => ({
              single: () => Promise.resolve({ data: locationData, error: locationError }),
            }),
          }),
        }),
      }
    }
    return {}
  })
}

describe('useBusinessEmployeesForChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array and does not query when businessId is empty', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessEmployeesForChat({ businessId: '' }), {
      wrapper: Wrapper,
    })
    await new Promise((r) => setTimeout(r, 20))
    expect(mockFrom).not.toHaveBeenCalled()
    expect(result.current.employees).toEqual([])
  })

  it('returns mapped employees after successful fetch', async () => {
    buildMock()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessEmployeesForChat({ businessId: BIZ_ID }), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.employees).toHaveLength(1)
    const emp = result.current.employees[0]
    expect(emp.employee_id).toBe('emp-1')
    expect(emp.full_name).toBe('Laura Soto')
    expect(emp.email).toBe('laura@biz.com')
    expect(emp.role).toBe('employee')
  })

  it('assigns location_id and location_name to regular employees', async () => {
    buildMock()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessEmployeesForChat({ businessId: BIZ_ID }), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const emp = result.current.employees[0]
    expect(emp.location_id).toBe('loc-1')
    expect(emp.location_name).toBe('Sede Principal')
  })

  it('assigns null location to managers/owners', async () => {
    buildMock([managerRow])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessEmployeesForChat({ businessId: BIZ_ID }), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.employees).toHaveLength(1)
    const mgr = result.current.employees[0]
    expect(mgr.location_id).toBeNull()
    expect(mgr.location_name).toBeNull()
  })

  it('returns empty array when employees query returns empty', async () => {
    buildMock([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessEmployeesForChat({ businessId: BIZ_ID }), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.employees).toEqual([])
  })

  it('does not query when enabled=false', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useBusinessEmployeesForChat({ businessId: BIZ_ID, enabled: false }), {
      wrapper: Wrapper,
    })
    await new Promise((r) => setTimeout(r, 20))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('exposes refetch function', async () => {
    buildMock()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessEmployeesForChat({ businessId: BIZ_ID }), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(typeof result.current.refetch).toBe('function')
  })
})
