import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockRpc = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockIsAvailable = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
  default: { from: mockFrom, rpc: mockRpc },
}))

vi.mock('@/lib/services/resources', () => ({
  resourcesService: { isAvailable: mockIsAvailable },
}))

import { useAssigneeAvailability } from '../useAssigneeAvailability'

const startTime = new Date('2026-06-01T10:00:00Z')
const endTime = new Date('2026-06-01T11:00:00Z')

describe('useAssigneeAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))
  })

  it('does not fetch when neither employeeId nor resourceId is provided', () => {
    // Hook disables itself via enabled:false when no ID — query never runs
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useAssigneeAvailability({ startTime, endTime }),
      { wrapper: Wrapper },
    )
    expect(result.current.isFetching).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns error when both employeeId and resourceId are provided', async () => {
    // Hook has retry:1 which overrides the test client default,
    // so we need a longer timeout to account for the retry delay
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useAssigneeAvailability({
          employeeId: 'emp-1',
          resourceId: 'res-1',
          startTime,
          endTime,
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toContain('simultáneamente')
  })

  it('returns isAvailable=true when employee RPC confirms availability', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => useAssigneeAvailability({ employeeId: 'emp-1', startTime, endTime }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.isAvailable).toBe(true)
    expect(result.current.data?.conflictingAppointments).toEqual([])
  })

  it('falls back to manual overlap query when employee RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } })
    // Manual fallback returns empty conflicts → available
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useAssigneeAvailability({ employeeId: 'emp-1', startTime, endTime }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // No conflicts found → available
    expect(result.current.data?.isAvailable).toBe(true)
  })

  it('returns isAvailable=false when manual query finds conflicting appointments', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } })
    const conflictingApt = {
      id: 'apt-1',
      start_time: '2026-06-01T10:00:00Z',
      end_time: '2026-06-01T11:00:00Z',
      status: 'confirmed',
    }
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [conflictingApt], error: null }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useAssigneeAvailability({ employeeId: 'emp-1', startTime, endTime }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.isAvailable).toBe(false)
    expect(result.current.data?.conflictingAppointments).toHaveLength(1)
  })

  it('uses resourcesService.isAvailable for resource path', async () => {
    mockIsAvailable.mockResolvedValue(true)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useAssigneeAvailability({ resourceId: 'res-1', startTime, endTime }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.isAvailable).toBe(true)
    expect(mockIsAvailable).toHaveBeenCalledWith('res-1', startTime, endTime, undefined)
  })

  it('passes excludeAppointmentId to resourcesService', async () => {
    mockIsAvailable.mockResolvedValue(true)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useAssigneeAvailability({
          resourceId: 'res-1',
          startTime,
          endTime,
          excludeAppointmentId: 'apt-123',
        }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockIsAvailable).toHaveBeenCalledWith('res-1', startTime, endTime, 'apt-123')
  })

  it('does not fetch when enabled=false', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useAssigneeAvailability({
          employeeId: 'emp-1',
          startTime,
          endTime,
          enabled: false,
        }),
      { wrapper: Wrapper },
    )

    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()
  })
})
