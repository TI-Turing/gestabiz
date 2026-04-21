import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { useMandatoryReviews } from '../useMandatoryReviews'

describe('useMandatoryReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('returns zeroed state when userId is undefined', () => {
    const { result } = renderHook(() =>
      useMandatoryReviews(undefined, [], []),
    )

    expect(result.current.pendingReviewsCount).toBe(0)
    expect(result.current.shouldShowModal).toBe(false)
  })

  it('returns zeroed state when completedAppointments is empty', () => {
    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', [], []),
    )

    expect(result.current.pendingReviewsCount).toBe(0)
    expect(result.current.shouldShowModal).toBe(false)
  })

  it('calculates pending reviews correctly', () => {
    const completed = [
      { id: 'apt-1' },
      { id: 'apt-2' },
      { id: 'apt-3' },
    ]
    const reviewed = ['apt-1']

    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', completed, reviewed),
    )

    expect(result.current.pendingReviewsCount).toBe(2)
    expect(result.current.shouldShowModal).toBe(true)
  })

  it('shows no pending when all appointments are reviewed', () => {
    const completed = [{ id: 'apt-1' }, { id: 'apt-2' }]
    const reviewed = ['apt-1', 'apt-2']

    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', completed, reviewed),
    )

    expect(result.current.pendingReviewsCount).toBe(0)
    expect(result.current.shouldShowModal).toBe(false)
  })

  it.skip('dismissModal hides the modal', async () => {
    const completed = [{ id: 'apt-1' }]

    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', completed, []),
    )

    await waitFor(() => {
      expect(result.current.shouldShowModal).toBe(true)
    })

    act(() => {
      result.current.dismissModal()
    })

    expect(result.current.shouldShowModal).toBe(false)
  })

  it('remindLater saves timestamp and hides modal', () => {
    const completed = [{ id: 'apt-1' }]

    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', completed, []),
    )

    act(() => {
      result.current.remindLater()
    })

    expect(result.current.shouldShowModal).toBe(false)

    const stored = JSON.parse(
      localStorage.getItem('gestabiz_remind_later_reviews') || '[]',
    )
    expect(stored).toHaveLength(1)
    expect(stored[0].userId).toBe('user-1')
  })

  it('clearRemindLater removes the entry', () => {
    localStorage.setItem(
      'gestabiz_remind_later_reviews',
      JSON.stringify([{ userId: 'user-1', timestamp: Date.now() }]),
    )

    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', [], []),
    )

    act(() => {
      result.current.clearRemindLater()
    })

    expect(localStorage.getItem('gestabiz_remind_later_reviews')).toBeNull()
  })

  it('does not show modal if within throttle duration', () => {
    // Set last check time to 5 minutes ago (within 1-hour throttle)
    const now = Date.now()
    localStorage.setItem(
      'gestabiz_last_review_check',
      JSON.stringify([{ userId: 'user-1', timestamp: now - 5 * 60 * 1000 }]),
    )

    const completed = [{ id: 'apt-1' }]

    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', completed, []),
    )

    expect(result.current.shouldShowModal).toBe(false)
  })

  it('exposes checkPendingReviews as a callable function', () => {
    const { result } = renderHook(() =>
      useMandatoryReviews('user-1', [], []),
    )

    expect(typeof result.current.checkPendingReviews).toBe('function')
  })
})
