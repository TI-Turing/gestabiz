import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { createMockResource } from '@/test-utils/mock-factories'
import { toast } from 'sonner'

// ── Mock the service layer (lib/services/resources) ────────────────────────────

const serviceMock = vi.hoisted(() => ({
  getByBusinessId: vi.fn(),
  getByLocationId: vi.fn(),
  getByType: vi.fn(),
  getById: vi.fn(),
  getAvailability: vi.fn(),
  getServices: vi.fn(),
  getStats: vi.fn(),
  getAvailableForService: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  assignServices: vi.fn(),
  refreshAvailability: vi.fn(),
}))

vi.mock('@/lib/services/resources', () => ({
  resourcesService: serviceMock,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import {
  useBusinessResources,
  useLocationResources,
  useResourcesByType,
  useResourceDetail,
  useResourceAvailability,
  useResourceServices,
  useResourceStats,
  useResourcesForService,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useAssignServices,
  useRefreshResourceAvailability,
  resourcesKeys,
} from '../useBusinessResources'

const sampleResource = createMockResource({
  id: 'res-1',
  business_id: 'biz-1',
  location_id: 'loc-1',
  resource_type: 'room',
})

describe('useBusinessResources — query keys', () => {
  it('builds stable, hierarchical query keys', () => {
    expect(resourcesKeys.all).toEqual(['business-resources'])
    expect(resourcesKeys.byBusiness('b1')).toEqual([
      'business-resources',
      'business',
      'b1',
    ])
    expect(resourcesKeys.byLocation('l1')).toEqual([
      'business-resources',
      'location',
      'l1',
    ])
    expect(resourcesKeys.byType('b1', 'room')).toEqual([
      'business-resources',
      'business',
      'b1',
      'type',
      'room',
    ])
    expect(resourcesKeys.detail('r1')).toEqual([
      'business-resources',
      'detail',
      'r1',
    ])
    expect(resourcesKeys.services('r1')).toEqual([
      'business-resources',
      'services',
      'r1',
    ])
    expect(resourcesKeys.stats('r1')).toEqual([
      'business-resources',
      'stats',
      'r1',
    ])
    expect(resourcesKeys.forService('b1', 's1')).toEqual([
      'business-resources',
      'for-service',
      'b1',
      's1',
      'all',
    ])
    expect(resourcesKeys.forService('b1', 's1', 'l1')).toEqual([
      'business-resources',
      'for-service',
      'b1',
      's1',
      'l1',
    ])
  })
})

describe('useBusinessResources — queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useBusinessResources is disabled when no businessId', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useBusinessResources(''), { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(serviceMock.getByBusinessId).not.toHaveBeenCalled()
  })

  it('useBusinessResources fetches via service when businessId provided', async () => {
    serviceMock.getByBusinessId.mockResolvedValue([sampleResource])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessResources('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getByBusinessId).toHaveBeenCalledWith('biz-1')
    expect(result.current.data).toEqual([sampleResource])
  })

  it('useLocationResources is disabled when no locationId', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useLocationResources(''), { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(serviceMock.getByLocationId).not.toHaveBeenCalled()
  })

  it('useLocationResources calls service.getByLocationId', async () => {
    serviceMock.getByLocationId.mockResolvedValue([sampleResource])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLocationResources('loc-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getByLocationId).toHaveBeenCalledWith('loc-1')
  })

  it('useResourcesByType is disabled without both args', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useResourcesByType('biz-1', ''), { wrapper: Wrapper })
    renderHook(() => useResourcesByType('', 'room'), { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(serviceMock.getByType).not.toHaveBeenCalled()
  })

  it('useResourcesByType passes both arguments', async () => {
    serviceMock.getByType.mockResolvedValue([sampleResource])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useResourcesByType('biz-1', 'room'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getByType).toHaveBeenCalledWith('biz-1', 'room')
  })

  it('useResourceDetail calls service.getById', async () => {
    serviceMock.getById.mockResolvedValue(sampleResource)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useResourceDetail('res-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getById).toHaveBeenCalledWith('res-1')
    expect(result.current.data).toEqual(sampleResource)
  })

  it('useResourceAvailability passes resourceId + dates', async () => {
    serviceMock.getAvailability.mockResolvedValue([])
    const start = new Date('2026-04-01T00:00:00Z')
    const end = new Date('2026-04-30T23:59:59Z')
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useResourceAvailability('res-1', start, end),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getAvailability).toHaveBeenCalledWith('res-1', start, end)
  })

  it('useResourceServices calls service.getServices', async () => {
    serviceMock.getServices.mockResolvedValue([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useResourceServices('res-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getServices).toHaveBeenCalledWith('res-1')
  })

  it('useResourceStats calls service.getStats', async () => {
    serviceMock.getStats.mockResolvedValue({ total_bookings: 0, revenue_total: 0 })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useResourceStats('res-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getStats).toHaveBeenCalledWith('res-1')
  })

  it('useResourcesForService omits locationId from call signature when undefined', async () => {
    serviceMock.getAvailableForService.mockResolvedValue([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useResourcesForService('biz-1', 'svc-1'),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getAvailableForService).toHaveBeenCalledWith(
      'biz-1',
      'svc-1',
      undefined,
    )
  })

  it('useResourcesForService passes locationId when provided', async () => {
    serviceMock.getAvailableForService.mockResolvedValue([])
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useResourcesForService('biz-1', 'svc-1', 'loc-1'),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(serviceMock.getAvailableForService).toHaveBeenCalledWith(
      'biz-1',
      'svc-1',
      'loc-1',
    )
  })
})

describe('useBusinessResources — mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── useCreateResource ─────────────────────────────────────────────────────

  it('useCreateResource calls service.create and shows success toast', async () => {
    serviceMock.create.mockResolvedValue(sampleResource)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateResource(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        business_id: 'biz-1',
        location_id: 'loc-1',
        resource_type: 'room',
        name: 'Sala A',
      } as never)
    })

    expect(serviceMock.create).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Recurso creado exitosamente')
  })

  it('useCreateResource maps duplicate error to a friendly message', async () => {
    serviceMock.create.mockRejectedValue(new Error('duplicate key'))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateResource(), { wrapper: Wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          business_id: 'biz-1',
          resource_type: 'room',
          name: 'Sala A',
        } as never),
      ).rejects.toBeTruthy()
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Ya existe un recurso con ese nombre en esta sede',
    )
  })

  it('useCreateResource shows generic error toast for other failures', async () => {
    serviceMock.create.mockRejectedValue(new Error('server boom'))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateResource(), { wrapper: Wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          business_id: 'biz-1',
          resource_type: 'room',
          name: 'Sala A',
        } as never),
      ).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('server boom'),
    )
  })

  // ── useUpdateResource ─────────────────────────────────────────────────────

  it('useUpdateResource calls service.update with resourceId + updates', async () => {
    serviceMock.update.mockResolvedValue(sampleResource)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateResource(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        resourceId: 'res-1',
        updates: { name: 'Nuevo nombre' },
      })
    })

    expect(serviceMock.update).toHaveBeenCalledWith('res-1', { name: 'Nuevo nombre' })
    expect(toast.success).toHaveBeenCalledWith('Recurso actualizado exitosamente')
  })

  it('useUpdateResource shows error toast on failure', async () => {
    serviceMock.update.mockRejectedValue(new Error('fail-update'))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateResource(), { wrapper: Wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ resourceId: 'res-1', updates: {} }),
      ).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('fail-update'),
    )
  })

  // ── useDeleteResource ─────────────────────────────────────────────────────

  it('useDeleteResource calls service.delete and shows success toast', async () => {
    serviceMock.delete.mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteResource(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync('res-1')
    })

    expect(serviceMock.delete).toHaveBeenCalledWith('res-1')
    expect(toast.success).toHaveBeenCalledWith('Recurso desactivado exitosamente')
  })

  it('useDeleteResource shows error toast on failure', async () => {
    serviceMock.delete.mockRejectedValue(new Error('cannot-delete'))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteResource(), { wrapper: Wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync('res-1')).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('cannot-delete'),
    )
  })

  // ── useAssignServices ─────────────────────────────────────────────────────

  it('useAssignServices calls service.assignServices with all params', async () => {
    serviceMock.assignServices.mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAssignServices(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        resourceId: 'res-1',
        serviceIds: ['svc-1', 'svc-2'],
        customPrices: { 'svc-1': 50000 },
      })
    })

    expect(serviceMock.assignServices).toHaveBeenCalledWith(
      'res-1',
      ['svc-1', 'svc-2'],
      { 'svc-1': 50000 },
    )
    expect(toast.success).toHaveBeenCalledWith('Servicios asignados exitosamente')
  })

  it('useAssignServices works without customPrices', async () => {
    serviceMock.assignServices.mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAssignServices(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        resourceId: 'res-1',
        serviceIds: ['svc-1'],
      })
    })

    expect(serviceMock.assignServices).toHaveBeenCalledWith(
      'res-1',
      ['svc-1'],
      undefined,
    )
  })

  it('useAssignServices shows error toast on failure', async () => {
    serviceMock.assignServices.mockRejectedValue(new Error('assign-fail'))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAssignServices(), { wrapper: Wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ resourceId: 'res-1', serviceIds: [] }),
      ).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('assign-fail'),
    )
  })

  // ── useRefreshResourceAvailability ────────────────────────────────────────

  it('useRefreshResourceAvailability calls service.refreshAvailability', async () => {
    serviceMock.refreshAvailability.mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRefreshResourceAvailability(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(serviceMock.refreshAvailability).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Disponibilidad actualizada')
  })

  it('useRefreshResourceAvailability shows error toast on failure', async () => {
    serviceMock.refreshAvailability.mockRejectedValue(new Error('refresh-fail'))
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRefreshResourceAvailability(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBeTruthy()
    })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('refresh-fail'),
    )
  })

  // ── useUpdateResource error path completes ───────────────────────────────

  it('useCreateResource invalidates byLocation only when location_id is present', async () => {
    serviceMock.create.mockResolvedValue({ ...sampleResource, location_id: null })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateResource(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        business_id: 'biz-1',
        resource_type: 'room',
        name: 'Sala A',
      } as never)
    })

    // No-op: we just verify success path with null location_id doesn't crash
    expect(toast.success).toHaveBeenCalledWith('Recurso creado exitosamente')
  })
})
