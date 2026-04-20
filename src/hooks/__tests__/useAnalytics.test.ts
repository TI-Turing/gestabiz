import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockReactGA = vi.hoisted(() => ({
  send: vi.fn(),
  event: vi.fn(),
}))

vi.mock('react-ga4', () => ({ default: mockReactGA }))

import { useAnalytics } from '../useAnalytics'

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('returns all tracking methods', () => {
    const { result } = renderHook(() => useAnalytics())

    expect(typeof result.current.trackPageView).toBe('function')
    expect(typeof result.current.trackBookingStarted).toBe('function')
    expect(typeof result.current.trackBookingStepCompleted).toBe('function')
    expect(typeof result.current.trackBookingCompleted).toBe('function')
    expect(typeof result.current.trackBookingAbandoned).toBe('function')
    expect(typeof result.current.trackProfileView).toBe('function')
    expect(typeof result.current.trackReserveButtonClick).toBe('function')
  })

  it('does not fire events when GA is disabled (dev mode)', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackPageView('/test')

    // In test env, GA is disabled (DEV=true, no consent)
    expect(mockReactGA.send).not.toHaveBeenCalled()
  })

  it('does not fire events without user consent', () => {
    // No consent set in localStorage
    const { result } = renderHook(() => useAnalytics())

    result.current.trackBookingStarted({ businessId: 'b-1' })

    expect(mockReactGA.event).not.toHaveBeenCalled()
  })

  it('all tracking methods are stable references across renders', () => {
    const { result, rerender } = renderHook(() => useAnalytics())

    const firstTrackPageView = result.current.trackPageView
    const firstTrackBookingStarted = result.current.trackBookingStarted

    rerender()

    expect(result.current.trackPageView).toBe(firstTrackPageView)
    expect(result.current.trackBookingStarted).toBe(firstTrackBookingStarted)
  })
})
