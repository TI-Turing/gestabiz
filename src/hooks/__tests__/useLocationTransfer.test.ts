import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import { toast } from 'sonner'

const mockFrom = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())
const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    functions: { invoke: mockInvoke },
  },
  default: {
    from: mockFrom,
    rpc: mockRpc,
    functions: { invoke: mockInvoke },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { useLocationTransfer } from '../useLocationTransfer'

describe('useLocationTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTransferImpact', () => {
    it('returns mapped impact when RPC succeeds', async () => {
      mockRpc.mockResolvedValue({
        data: {
          appointments_to_keep: 5,
          appointments_to_cancel: 3,
          effective_date: '2026-05-01',
        },
        error: null,
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })

      let impact: unknown
      await act(async () => {
        impact = await result.current.getTransferImpact(
          'be-1',
          new Date('2026-05-01'),
        )
      })

      expect(impact).toEqual({
        appointmentsToKeep: 5,
        appointmentsToCancel: 3,
        effectiveDate: '2026-05-01',
      })
      expect(mockRpc).toHaveBeenCalledWith(
        'get_transfer_impact',
        expect.objectContaining({ p_business_employee_id: 'be-1' }),
      )
    })

    it('returns null when RPC errors', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'oops' } })
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })
      let impact: unknown
      await act(async () => {
        impact = await result.current.getTransferImpact(
          'be-1',
          new Date('2026-05-01'),
        )
      })
      expect(impact).toBeNull()
    })
  })

  describe('scheduleTransfer', () => {
    it('rejects when employee not found', async () => {
      mockFrom.mockReturnValue(
        mockSupabaseChain({ data: null, error: { message: 'not found' } }),
      )
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })

      let res: { success: boolean } = { success: true }
      await act(async () => {
        res = await result.current.scheduleTransfer(
          'biz-1',
          'emp-1',
          'loc-2',
          new Date('2026-05-01'),
          15,
        )
      })
      expect(res.success).toBe(false)
      expect(toast.error).toHaveBeenCalledWith('No se pudo encontrar el empleado')
    })

    it('rejects when employee already has pending transfer', async () => {
      mockFrom.mockReturnValue(
        mockSupabaseChain({
          data: {
            id: 'be-1',
            location_id: 'loc-1',
            transfer_status: 'pending',
          },
          error: null,
        }),
      )
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })

      let res: { success: boolean } = { success: true }
      await act(async () => {
        res = await result.current.scheduleTransfer(
          'biz-1',
          'emp-1',
          'loc-2',
          new Date('2026-05-01'),
          15,
        )
      })
      expect(res.success).toBe(false)
      expect(toast.error).toHaveBeenCalledWith(
        'Ya tienes un traslado programado. Cancélalo primero.',
      )
    })

    it('rejects when destination location equals current', async () => {
      mockFrom.mockReturnValue(
        mockSupabaseChain({
          data: {
            id: 'be-1',
            location_id: 'loc-1',
            transfer_status: null,
          },
          error: null,
        }),
      )
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })

      let res: { success: boolean } = { success: true }
      await act(async () => {
        res = await result.current.scheduleTransfer(
          'biz-1',
          'emp-1',
          'loc-1',
          new Date('2026-05-01'),
          15,
        )
      })
      expect(res.success).toBe(false)
      expect(toast.error).toHaveBeenCalledWith(
        'La sede de destino es la misma que la actual',
      )
    })

    it('successfully schedules transfer, updates record and invokes edge function', async () => {
      let updatedPayload: Record<string, unknown> | null = null
      mockFrom.mockImplementation(() => {
        const chain = mockSupabaseChain({
          data: {
            id: 'be-1',
            location_id: 'loc-1',
            transfer_status: null,
          },
          error: null,
        })
        const realUpdate = chain.update
        chain.update = vi.fn((p: Record<string, unknown>) => {
          updatedPayload = p
          return realUpdate(p)
        }) as never
        return chain
      })
      mockRpc.mockResolvedValue({
        data: {
          appointments_to_keep: 4,
          appointments_to_cancel: 2,
          effective_date: '2026-05-01',
        },
        error: null,
      })
      mockInvoke.mockResolvedValue({ data: { ok: true }, error: null })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })

      let res: { success: boolean; impact?: unknown } = { success: false }
      await act(async () => {
        res = await result.current.scheduleTransfer(
          'biz-1',
          'emp-1',
          'loc-2',
          new Date('2026-05-01'),
          15,
        )
      })

      expect(res.success).toBe(true)
      expect(res.impact).toEqual({
        appointmentsToKeep: 4,
        appointmentsToCancel: 2,
        effectiveDate: '2026-05-01',
      })
      expect(updatedPayload).toMatchObject({
        transfer_from_location_id: 'loc-1',
        transfer_to_location_id: 'loc-2',
        transfer_notice_period_days: 15,
        transfer_status: 'pending',
      })
      expect(mockInvoke).toHaveBeenCalledWith(
        'cancel-future-appointments-on-transfer',
        expect.objectContaining({
          body: expect.objectContaining({ businessEmployeeId: 'be-1' }),
        }),
      )
      expect(toast.success).toHaveBeenCalled()
    })
  })

  describe('cancelTransfer', () => {
    it('rejects when no pending transfer exists', async () => {
      mockFrom.mockReturnValue(
        mockSupabaseChain({
          data: { id: 'be-1', transfer_status: 'completed' },
          error: null,
        }),
      )
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })
      let res = true
      await act(async () => {
        res = await result.current.cancelTransfer('biz-1', 'emp-1')
      })
      expect(res).toBe(false)
      expect(toast.error).toHaveBeenCalledWith(
        'No tienes un traslado programado para cancelar',
      )
    })

    it('clears transfer fields and toasts success when pending', async () => {
      let updatedPayload: Record<string, unknown> | null = null
      mockFrom.mockImplementation(() => {
        const chain = mockSupabaseChain({
          data: { id: 'be-1', transfer_status: 'pending' },
          error: null,
        })
        const realUpdate = chain.update
        chain.update = vi.fn((p: Record<string, unknown>) => {
          updatedPayload = p
          return realUpdate(p)
        }) as never
        return chain
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })

      let res = false
      await act(async () => {
        res = await result.current.cancelTransfer('biz-1', 'emp-1')
      })
      expect(res).toBe(true)
      expect(updatedPayload).toMatchObject({
        transfer_from_location_id: null,
        transfer_to_location_id: null,
        transfer_status: 'cancelled',
      })
      expect(toast.success).toHaveBeenCalledWith(
        'Traslado cancelado exitosamente',
      )
    })
  })

  describe('getTransferStatus', () => {
    it('returns mapped status when found', async () => {
      mockFrom.mockReturnValue(
        mockSupabaseChain({
          data: {
            transfer_status: 'pending',
            transfer_from_location_id: 'loc-1',
            transfer_to_location_id: 'loc-2',
            transfer_effective_date: '2026-05-01',
            transfer_notice_period_days: 15,
            transfer_scheduled_at: '2026-04-01T10:00:00Z',
          },
          error: null,
        }),
      )
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })

      let status: unknown
      await act(async () => {
        status = await result.current.getTransferStatus('biz-1', 'emp-1')
      })
      expect(status).toEqual({
        status: 'pending',
        fromLocationId: 'loc-1',
        toLocationId: 'loc-2',
        effectiveDate: '2026-05-01',
        noticePeriodDays: 15,
        scheduledAt: '2026-04-01T10:00:00Z',
      })
    })

    it('returns null on error', async () => {
      mockFrom.mockReturnValue(
        mockSupabaseChain({ data: null, error: { message: 'oops' } }),
      )
      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useLocationTransfer(), {
        wrapper: Wrapper,
      })
      let status: unknown = 'unset'
      await act(async () => {
        status = await result.current.getTransferStatus('biz-1', 'emp-1')
      })
      expect(status).toBeNull()
    })
  })
})
