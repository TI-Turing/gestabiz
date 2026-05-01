import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = { from: mockFrom }
  return { supabase: __sb, default: __sb }
})

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

import { useBusinessAdmins } from '../useBusinessAdmins'

const BIZ_ID = 'biz-abc'

const ownerProfile = {
  id: 'owner-1',
  full_name: 'Ana Admin',
  email: 'ana@biz.com',
  avatar_url: null,
}

const locationRow = {
  id: 'loc-1',
  name: 'Sede Norte',
  address: 'Calle 10 #1-01',
  city: 'Bogotá',
  state: 'Cundinamarca',
  latitude: 4.6,
  longitude: -74.08,
}

/** Returns a chainable mock that resolves sequentially for the 3 queries */
function buildMocks(
  businessData: { owner_id: string } | null = { owner_id: 'owner-1' },
  businessError: object | null = null,
  profileData: typeof ownerProfile | null = ownerProfile,
  profileError: object | null = null,
  locationsData: typeof locationRow[] = [locationRow],
  locationsError: object | null = null,
) {
  let callIndex = 0
  mockFrom.mockImplementation((table: string) => {
    callIndex++
    if (table === 'businesses') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: businessData, error: businessError }),
          }),
        }),
      }
    }
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: profileData, error: profileError }),
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
      }
    }
    return {}
  })
}

describe('useBusinessAdmins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with loading=true and empty admins', () => {
    buildMocks()
    const { result } = renderHook(() => useBusinessAdmins({ businessId: BIZ_ID }))
    expect(result.current.loading).toBe(true)
    expect(result.current.admins).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('does NOT query when businessId is empty string', async () => {
    const { result } = renderHook(() => useBusinessAdmins({ businessId: '' }))
    await new Promise((r) => setTimeout(r, 20))
    expect(mockFrom).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(true)
  })

  it('fetches owner and maps to a single admin with locations', async () => {
    buildMocks()
    const { result } = renderHook(() => useBusinessAdmins({ businessId: BIZ_ID }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.admins).toHaveLength(1)
    const admin = result.current.admins[0]
    expect(admin.user_id).toBe('owner-1')
    expect(admin.full_name).toBe('Ana Admin')
    expect(admin.email).toBe('ana@biz.com')
    expect(admin.locations).toHaveLength(1)
    expect(admin.locations[0].location_id).toBe('loc-1')
    expect(admin.locations[0].location_name).toBe('Sede Norte')
  })

  it('returns empty admins array when business has no locations', async () => {
    buildMocks({ owner_id: 'owner-1' }, null, ownerProfile, null, [])
    const { result } = renderHook(() => useBusinessAdmins({ businessId: BIZ_ID }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.admins).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('sets error when business query fails', async () => {
    buildMocks(null, new Error('network error'), null, null, [])
    const { result } = renderHook(() => useBusinessAdmins({ businessId: BIZ_ID }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeTruthy()
    expect(result.current.admins).toEqual([])
  })

  it('sets error when profile query fails', async () => {
    buildMocks({ owner_id: 'owner-1' }, null, null, new Error('profile missing'), [])
    const { result } = renderHook(() => useBusinessAdmins({ businessId: BIZ_ID }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeTruthy()
  })

  it('calculates distance_km when userLocation is provided', async () => {
    buildMocks()
    const { result } = renderHook(() =>
      useBusinessAdmins({
        businessId: BIZ_ID,
        userLocation: { latitude: 4.6, longitude: -74.08 },
      }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    const loc = result.current.admins[0]?.locations[0]
    // Same coordinates → ~0 km distance
    expect(loc?.distance_km).toBeDefined()
    expect(loc!.distance_km!).toBeCloseTo(0, 1)
  })

  it('does NOT set distance_km when userLocation is null', async () => {
    buildMocks()
    const { result } = renderHook(() =>
      useBusinessAdmins({ businessId: BIZ_ID, userLocation: null }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    const loc = result.current.admins[0]?.locations[0]
    expect(loc?.distance_km).toBeUndefined()
  })

  it('exposes refetch function that re-fetches data', async () => {
    buildMocks()
    const { result } = renderHook(() => useBusinessAdmins({ businessId: BIZ_ID }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const callsBefore = mockFrom.mock.calls.length
    await result.current.refetch()
    expect(mockFrom.mock.calls.length).toBeGreaterThan(callsBefore)
  })
})
