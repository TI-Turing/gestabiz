import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import { toast } from 'sonner'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useBusinessClosedDays } from '../useBusinessClosedDays'

const closedDayBiz = {
  id: 'd1',
  business_id: 'biz-1',
  location_id: null,
  closed_date: '2026-05-10',
  reason: 'Festivo nacional',
  created_by: null,
  created_at: '2026-04-01T10:00:00Z',
}

const closedDayLoc = {
  id: 'd2',
  business_id: 'biz-1',
  location_id: 'loc-1',
  closed_date: '2026-05-15',
  reason: 'Mantenimiento sede',
  created_by: 'admin-1',
  created_at: '2026-04-01T10:00:00Z',
}

describe('useBusinessClosedDays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not query when businessId is missing', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useBusinessClosedDays(null), { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 30))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns empty array when no closed days exist', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1'),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.closedDays).toEqual([])
  })

  it('queries business_closed_days filtered by business_id within month range', async () => {
    const chain = mockSupabaseChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', null, new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFrom).toHaveBeenCalledWith('business_closed_days')
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1')
    expect(chain.gte).toHaveBeenCalledWith('closed_date', '2026-04-01')
    expect(chain.lte).toHaveBeenCalledWith('closed_date', '2026-06-30')
  })

  it('isClosedDay returns true for business-wide closure (location_id=null)', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [closedDayBiz], error: null }))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', 'loc-1', new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isClosedDay('2026-05-10')).toBe(true)
    expect(result.current.isClosedDay('2026-05-11')).toBe(false)
  })

  it('isClosedDay returns true only for the matching location', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [closedDayLoc], error: null }))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', 'loc-1', new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isClosedDay('2026-05-15', 'loc-1')).toBe(true)
    expect(result.current.isClosedDay('2026-05-15', 'loc-other')).toBe(false)
  })

  it('getClosedDayReason returns the reason text', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [closedDayBiz], error: null }))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', null, new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.getClosedDayReason('2026-05-10')).toBe('Festivo nacional')
    expect(result.current.getClosedDayReason('2026-05-11')).toBeNull()
  })

  it('addClosedDay inserts payload and shows success toast', async () => {
    let insertedPayload: Record<string, unknown> | null = null
    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({ data: null, error: null })
      const realInsert = chain.insert
      chain.insert = vi.fn((payload: Record<string, unknown>) => {
        insertedPayload = payload
        return realInsert(payload)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', null, new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addClosedDay({
        closedDate: '2026-05-20',
        locationId: 'loc-1',
        reason: 'Pintura',
        createdBy: 'admin-1',
      })
    })

    expect(insertedPayload).toMatchObject({
      business_id: 'biz-1',
      location_id: 'loc-1',
      closed_date: '2026-05-20',
      reason: 'Pintura',
      created_by: 'admin-1',
    })
    expect(toast.success).toHaveBeenCalledWith('Día cerrado agregado')
  })

  it('addClosedDay shows duplicate-friendly toast on uq_business_closed_day error', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({
        data: null,
        error: { message: 'duplicate key value violates uq_business_closed_day' },
      }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', null, new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(
        result.current.addClosedDay({ closedDate: '2026-05-10' }),
      ).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalledWith(
      'Ese día ya está marcado como cerrado para esta sede',
    )
  })

  it('removeClosedDay deletes by id and shows success toast', async () => {
    const chain = mockSupabaseChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', null, new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeClosedDay('d1')
    })

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'd1')
    expect(toast.success).toHaveBeenCalledWith('Día cerrado eliminado')
  })

  it('removeClosedDay shows generic error toast on failure', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'foreign-key' } }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessClosedDays('biz-1', null, new Date('2026-05-15')),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.removeClosedDay('d1')).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el día cerrado')
  })
})
