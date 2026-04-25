import { renderHook, waitFor, act } from '@testing-library/react'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { useEmployeeServices } from '../useEmployeeServices'
import { toast } from 'sonner'

const mockService = {
  id: 'es-1',
  employee_id: 'emp-1',
  service_id: 'svc-1',
  business_id: 'biz-1',
  location_id: 'loc-1',
  expertise_level: 3,
  is_active: true,
  commission_percentage: null,
  created_at: '2024-01-01T00:00:00Z',
  employee: { id: 'emp-1', full_name: 'Ana García' },
  service: { id: 'svc-1', name: 'Corte de Cabello', price: 50000, duration: 60 },
  location: { id: 'loc-1', name: 'Sede Principal' },
}

describe('useEmployeeServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches services on mount', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [mockService], error: null }))

    const { result } = renderHook(() => useEmployeeServices())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFrom).toHaveBeenCalledWith('employee_services')
    expect(result.current.services).toHaveLength(1)
    expect(result.current.services[0].id).toBe('es-1')
    expect(result.current.error).toBeNull()
  })

  it('applies employee_id filter when provided', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [mockService], error: null }))

    const { result } = renderHook(() => useEmployeeServices({ employee_id: 'emp-1' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.services).toHaveLength(1)
  })

  it('applies business_id filter when provided', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [mockService], error: null }))

    const { result } = renderHook(() => useEmployeeServices({ business_id: 'biz-1' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.services).toHaveLength(1)
  })

  it('sets error and shows toast when fetch fails', async () => {
    const fetchError = new Error('DB connection failed')
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: fetchError }))

    const { result } = renderHook(() => useEmployeeServices())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('DB connection failed')
    expect(toast.error).toHaveBeenCalled()
  })

  it('returns empty services array when no data', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => useEmployeeServices())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.services).toEqual([])
    expect(result.current.error).toBeNull()
  })

  describe('removeServiceFromEmployee', () => {
    it('calls delete, shows success toast and refetches', async () => {
      // Call 1: initial fetch, Call 2: delete, Call 3: refetch
      mockFrom
        .mockReturnValueOnce(mockSupabaseChain({ data: [mockService], error: null }))
        .mockReturnValueOnce(mockSupabaseChain({ data: null, error: null }))
        .mockReturnValueOnce(mockSupabaseChain({ data: [], error: null }))

      const { result } = renderHook(() => useEmployeeServices())
      await waitFor(() => expect(result.current.services).toHaveLength(1))

      await act(async () => {
        await result.current.removeServiceFromEmployee('es-1')
      })

      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('removido'))
    })

    it('throws and shows error toast when delete fails', async () => {
      const deleteError = new Error('Delete error')
      mockFrom
        .mockReturnValueOnce(mockSupabaseChain({ data: [mockService], error: null }))
        .mockReturnValueOnce(mockSupabaseChain({ data: null, error: deleteError }))

      const { result } = renderHook(() => useEmployeeServices())
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await expect(result.current.removeServiceFromEmployee('es-1')).rejects.toThrow('Delete error')
      })

      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('updateEmployeeService', () => {
    it('calls update and shows success toast', async () => {
      // Call 1: initial fetch, Call 2: update, Call 3: refetch
      mockFrom
        .mockReturnValueOnce(mockSupabaseChain({ data: [mockService], error: null }))
        .mockReturnValueOnce(mockSupabaseChain({ data: null, error: null }))
        .mockReturnValueOnce(mockSupabaseChain({ data: [mockService], error: null }))

      const { result } = renderHook(() => useEmployeeServices())
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.updateEmployeeService('es-1', { expertise_level: 5 })
      })

      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('actualizado'))
    })

    it('throws and shows error toast when update fails', async () => {
      const updateError = new Error('Update error')
      mockFrom
        .mockReturnValueOnce(mockSupabaseChain({ data: [mockService], error: null }))
        .mockReturnValueOnce(mockSupabaseChain({ data: null, error: updateError }))

      const { result } = renderHook(() => useEmployeeServices())
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await expect(result.current.updateEmployeeService('es-1', { is_active: false })).rejects.toThrow('Update error')
      })

      expect(toast.error).toHaveBeenCalled()
    })
  })
})
