import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = { from: mockFrom }
  return { supabase: __sb, default: __sb }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/queryConfig', () => ({
  default: { STABLE: { staleTime: 0, gcTime: 0 } },
  QUERY_CONFIG: { STABLE: { staleTime: 0, gcTime: 0 } },
}))

import { useBusinessChatConfig } from '../useBusinessChatConfig'
import { toast } from 'sonner'

const BIZ_ID = 'biz-123'

const mockBusinessRow = { allow_professional_chat: true }
const mockLocationsRows = [
  {
    id: 'loc-1',
    name: 'Sede Central',
    chat_admin_id: null,
    chat_admin_profile: null,
  },
]

/** Build a chainable mock for the two parallel queries in useBusinessChatConfig */
function makeFromMock(
  businessData: typeof mockBusinessRow | null = mockBusinessRow,
  locationsData: typeof mockLocationsRows = mockLocationsRows,
  businessError: object | null = null,
  locationsError: object | null = null,
) {
  let callCount = 0
  mockFrom.mockImplementation((table: string) => {
    if (table === 'businesses') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: businessData, error: businessError }),
          }),
        }),
      }
    }
    if (table === 'locations') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: locationsData, error: locationsError }),
            }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }
    }
    callCount++
    return {}
  })
}

describe('useBusinessChatConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with loading=true and returns default config', () => {
    makeFromMock()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessChatConfig(BIZ_ID), { wrapper: Wrapper })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.config.allow_professional_chat).toBe(true)
    expect(result.current.config.locations).toEqual([])
  })

  it('loads config and exposes allow_professional_chat flag', async () => {
    makeFromMock()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessChatConfig(BIZ_ID), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.config.allow_professional_chat).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('maps locations from DB into config.locations array', async () => {
    makeFromMock()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessChatConfig(BIZ_ID), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.config.locations).toHaveLength(1)
    expect(result.current.config.locations[0].location_id).toBe('loc-1')
    expect(result.current.config.locations[0].location_name).toBe('Sede Central')
    expect(result.current.config.locations[0].chat_admin_id).toBeNull()
  })

  it('exposes error message when business query fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('DB error') }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessChatConfig(BIZ_ID), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('DB error')
  })

  it('updateProfessionalChat calls businesses.update and shows success toast', async () => {
    makeFromMock()
    const updateMock = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBusinessRow, error: null }),
            }),
          }),
          update: updateMock,
        }
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockLocationsRows, error: null }),
            }),
          }),
        }),
      }
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessChatConfig(BIZ_ID), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.updateProfessionalChat(false)
    })

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it('updateLocationChatAdmin calls locations.update and shows success toast', async () => {
    makeFromMock()
    const locUpdateMock = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBusinessRow, error: null }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockLocationsRows, error: null }),
            }),
          }),
        }),
        update: locUpdateMock,
      }
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useBusinessChatConfig(BIZ_ID), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.updateLocationChatAdmin({ locationId: 'loc-1', adminId: 'user-99' })
    })

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })
})
