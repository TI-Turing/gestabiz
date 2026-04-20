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

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { useLocationServices } from '../useLocationServices'

const sampleService = {
  id: 'ls-1',
  location_id: 'loc-1',
  service_id: 'svc-1',
  is_active: true,
  created_at: '2026-04-01T10:00:00Z',
  service: { id: 'svc-1', name: 'Corte' },
  location: { id: 'loc-1', name: 'Sede Centro' },
}

describe('useLocationServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when locationId is undefined', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices(undefined), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.services).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches services filtered by location_id and is_active=true', async () => {
    const chain = mockSupabaseChain({ data: [sampleService], error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFrom).toHaveBeenCalledWith('location_services')
    expect(chain.eq).toHaveBeenCalledWith('location_id', 'loc-1')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    expect(result.current.services).toEqual([sampleService])
  })

  it('exposes the error and toasts on fetch failure', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: new Error('boom') }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Error al cargar servicios'),
    )
  })

  it('addServiceToLocation inserts with correct payload and toasts success', async () => {
    let insertedPayload: Record<string, unknown> | null = null
    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({ data: sampleService, error: null })
      const realInsert = chain.insert
      chain.insert = vi.fn((p: Record<string, unknown>) => {
        insertedPayload = p
        return realInsert(p)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addServiceToLocation('svc-1', 'loc-1')
    })

    expect(insertedPayload).toEqual({
      location_id: 'loc-1',
      service_id: 'svc-1',
      is_active: true,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Servicio agregado a la sede exitosamente',
    )
  })

  it('addServiceToLocation rethrows and toasts on error', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: new Error('dup-key') }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(
        result.current.addServiceToLocation('svc-1', 'loc-1'),
      ).rejects.toThrow('dup-key')
    })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Error al agregar servicio'),
    )
  })

  it('removeServiceFromLocation deletes by id and toasts', async () => {
    const chain = mockSupabaseChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeServiceFromLocation('ls-1')
    })

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'ls-1')
    expect(toast.success).toHaveBeenCalledWith('Servicio removido de la sede')
  })

  it('toggleServiceStatus updates is_active and toasts the right label', async () => {
    let updatedPayload: Record<string, unknown> | null = null
    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({ data: null, error: null })
      const realUpdate = chain.update
      chain.update = vi.fn((p: Record<string, unknown>) => {
        updatedPayload = p
        return realUpdate(p)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleServiceStatus('ls-1', false)
    })

    expect(updatedPayload).toEqual({ is_active: false })
    expect(toast.success).toHaveBeenCalledWith('Servicio desactivado')
  })

  it('toggleServiceStatus toasts "Servicio activado" when isActive=true', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: null }))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationServices('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleServiceStatus('ls-1', true)
    })
    expect(toast.success).toHaveBeenCalledWith('Servicio activado')
  })
})
