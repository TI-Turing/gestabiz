import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockFrom = vi.hoisted(() => vi.fn())
const mockGetRegionName = vi.hoisted(() => vi.fn())
const mockGetCityName = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('../useCatalogs', () => ({
  getRegionName: mockGetRegionName,
  getCityName: mockGetCityName,
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { useLocationNames } from '../useLocationNames'

// Use unique UUIDs per test to avoid in-memory cache interference between tests
let idSuffix = 0
function freshUUID(): string {
  idSuffix++
  return `a1b2c3d4-e5f6-${String(idSuffix).padStart(4, '0')}-a1b2-c3d4e5f6a1b2`
}

function makeSingleChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'match', 'limit']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain['single'] = vi.fn().mockResolvedValue(resolved)
  return chain
}

describe('useLocationNames', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRegionName.mockResolvedValue(null)
    mockGetCityName.mockResolvedValue(null)
  })

  it('returns all nulls when no ids are provided', async () => {
    const { result } = renderHook(() => useLocationNames())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.regionName).toBeNull()
    expect(result.current.cityName).toBeNull()
    expect(result.current.countryName).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('uses non-UUID regionId as name directly without DB call', async () => {
    const { result } = renderHook(() => useLocationNames('Antioquia'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.regionName).toBe('Antioquia')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('queries DB when regionId is a valid UUID and returns name', async () => {
    const regionId = freshUUID()
    const countryId = freshUUID()

    let fromCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      fromCallCount++
      if (table === 'regions') {
        return makeSingleChain({
          data: { name: 'Valle del Cauca', country_id: countryId },
          error: null,
        })
      }
      if (table === 'countries') {
        return makeSingleChain({ data: { name: 'Colombia' }, error: null })
      }
      return makeSingleChain({ data: null, error: null })
    })

    const { result } = renderHook(() => useLocationNames(regionId))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.regionName).toBe('Valle del Cauca')
    expect(result.current.countryName).toBe('Colombia')
    expect(fromCallCount).toBeGreaterThanOrEqual(2) // regions + countries
  })

  it('falls back to getRegionName helper when region DB query returns no name', async () => {
    const regionId = freshUUID()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'regions') {
        return makeSingleChain({ data: { name: null, country_id: null }, error: null })
      }
      return makeSingleChain({ data: null, error: null })
    })
    mockGetRegionName.mockResolvedValue('Bolívar')

    const { result } = renderHook(() => useLocationNames(regionId))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.regionName).toBe('Bolívar')
    expect(mockGetRegionName).toHaveBeenCalledWith(regionId)
  })

  it('sets cityName from getCityName helper when cityId provided', async () => {
    const cityId = freshUUID()
    mockGetCityName.mockResolvedValue('Medellín')

    const { result } = renderHook(() => useLocationNames(undefined, cityId))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cityName).toBe('Medellín')
    expect(mockGetCityName).toHaveBeenCalledWith(cityId)
  })

  it('sets cityName to null when cityId is not provided', async () => {
    const regionId = freshUUID()
    mockFrom.mockReturnValue(
      makeSingleChain({ data: { name: 'Cundinamarca', country_id: null }, error: null }),
    )

    const { result } = renderHook(() => useLocationNames(regionId, undefined))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cityName).toBeNull()
    expect(mockGetCityName).not.toHaveBeenCalled()
  })

  it('handles both regionId and cityId simultaneously', async () => {
    const regionId = freshUUID()
    const countryId = freshUUID()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'regions') {
        return makeSingleChain({
          data: { name: 'Atlántico', country_id: countryId },
          error: null,
        })
      }
      if (table === 'countries') {
        return makeSingleChain({ data: { name: 'Colombia' }, error: null })
      }
      return makeSingleChain({ data: null, error: null })
    })
    mockGetCityName.mockResolvedValue('Barranquilla')

    const { result } = renderHook(() => useLocationNames(regionId, 'city-abc'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.regionName).toBe('Atlántico')
    expect(result.current.cityName).toBe('Barranquilla')
  })

  it('does not throw when region DB query fails', async () => {
    const regionId = freshUUID()
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => {
        throw new Error('Network error')
      }),
    }))

    const { result } = renderHook(() => useLocationNames(regionId))

    await waitFor(() => expect(result.current.loading).toBe(false))
    // Should not crash; names may be null
    expect(result.current.regionName).toBeNull()
  })
})
