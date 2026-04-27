import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBookingPreselection } from '../useBookingPreselection'

const KEY = 'gestabiz_booking_presel'

describe('useBookingPreselection', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns empty object when nothing is stored', () => {
    const { result } = renderHook(() => useBookingPreselection())
    expect(result.current.get()).toEqual({})
  })

  it('patch stores values in localStorage', () => {
    const { result } = renderHook(() => useBookingPreselection())
    act(() => {
      result.current.patch({ businessId: 'biz-1' })
    })
    expect(result.current.get()).toEqual({ businessId: 'biz-1' })
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ businessId: 'biz-1' }))
  })

  it('patch merges new values with existing ones', () => {
    const { result } = renderHook(() => useBookingPreselection())
    act(() => {
      result.current.patch({ businessId: 'biz-1', serviceId: 'svc-1' })
    })
    act(() => {
      result.current.patch({ employeeId: 'emp-1' })
    })
    expect(result.current.get()).toEqual({
      businessId: 'biz-1',
      serviceId: 'svc-1',
      employeeId: 'emp-1',
    })
  })

  it('patch overwrites existing keys', () => {
    const { result } = renderHook(() => useBookingPreselection())
    act(() => {
      result.current.patch({ businessId: 'biz-1' })
    })
    act(() => {
      result.current.patch({ businessId: 'biz-2' })
    })
    expect(result.current.get().businessId).toBe('biz-2')
  })

  it('can set all preselection fields in one patch', () => {
    const { result } = renderHook(() => useBookingPreselection())
    act(() => {
      result.current.patch({
        businessId: 'biz-1',
        serviceId: 'svc-1',
        employeeId: 'emp-1',
        locationId: 'loc-1',
      })
    })
    expect(result.current.get()).toEqual({
      businessId: 'biz-1',
      serviceId: 'svc-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
    })
  })

  it('clear removes the item from localStorage', () => {
    const { result } = renderHook(() => useBookingPreselection())
    act(() => {
      result.current.patch({ businessId: 'biz-1' })
    })
    act(() => {
      result.current.clear()
    })
    expect(result.current.get()).toEqual({})
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('get returns empty object when localStorage has invalid JSON', () => {
    localStorage.setItem(KEY, 'not_valid_json')
    const { result } = renderHook(() => useBookingPreselection())
    expect(result.current.get()).toEqual({})
  })

  it('get returns empty object when localStorage has null string', () => {
    // localStorage.getItem returns null when key doesn't exist → JSON.parse('{}')
    localStorage.removeItem(KEY)
    const { result } = renderHook(() => useBookingPreselection())
    expect(result.current.get()).toEqual({})
  })

  it('two independent hook instances share the same localStorage key', () => {
    const { result: hookA } = renderHook(() => useBookingPreselection())
    const { result: hookB } = renderHook(() => useBookingPreselection())
    act(() => {
      hookA.current.patch({ businessId: 'shared-biz' })
    })
    expect(hookB.current.get().businessId).toBe('shared-biz')
  })
})
