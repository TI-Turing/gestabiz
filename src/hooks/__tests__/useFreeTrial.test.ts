import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ── hoisted mocks ──────────────────────────────────────────────
const mockFunctionsInvoke = vi.hoisted(() => vi.fn())
const mockInvalidateQueries = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: mockFunctionsInvoke },
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0 },
    FREQUENT: { staleTime: 0, gcTime: 0 },
    KEYS: {
      PLAN_FEATURES: (id: string) => ['plan-features', id],
    },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
    FREQUENT: { staleTime: 0, gcTime: 0 },
    KEYS: {
      PLAN_FEATURES: (id: string) => ['plan-features', id],
    },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useFreeTrial } from '../useFreeTrial'
import { useAuth } from '@/contexts/AuthContext'

const mockUseAuth = vi.mocked(useAuth)

const BASE_USER = {
  id: 'owner1',
  has_used_free_trial: false,
  email: 'owner@test.com',
  activeRole: 'admin',
  role: 'admin',
}

function renderFreeTrial(
  params: {
    businessId?: string | null
    businessOwnerId?: string | null
    currentPlan?: { status: string; end_date?: string } | null
  } = {}
) {
  const {
    businessId = 'biz1',
    businessOwnerId = 'owner1',
    currentPlan = null,
  } = params

  const refetchPlan = vi.fn()
  const { Wrapper } = createWrapper()

  return {
    ...renderHook(
      () =>
        useFreeTrial(
          businessId,
          businessOwnerId,
          refetchPlan,
          currentPlan as never,
        ),
      { wrapper: Wrapper }
    ),
    refetchPlan,
  }
}

describe('useFreeTrial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: BASE_USER,
      currentBusinessId: 'biz1',
      businessOwnerId: 'owner1',
      loading: false,
    } as never)
  })

  describe('isEligible', () => {
    it('is true when user is owner, has not used trial, and has no active plan', () => {
      const { result } = renderFreeTrial()

      expect(result.current.isEligible).toBe(true)
    })

    it('is false when user is NOT the owner', () => {
      mockUseAuth.mockReturnValue({
        user: { ...BASE_USER, id: 'other-user' },
        currentBusinessId: 'biz1',
        businessOwnerId: 'owner1',
      } as never)

      const { result } = renderFreeTrial({ businessOwnerId: 'owner1' })

      expect(result.current.isEligible).toBe(false)
    })

    it('is false when user has already used the trial', () => {
      mockUseAuth.mockReturnValue({
        user: { ...BASE_USER, has_used_free_trial: true },
        currentBusinessId: 'biz1',
        businessOwnerId: 'owner1',
      } as never)

      const { result } = renderFreeTrial()

      expect(result.current.isEligible).toBe(false)
      expect(result.current.hasUsedTrial).toBe(true)
    })

    it('is false when there is an active plan', () => {
      const { result } = renderFreeTrial({
        currentPlan: { status: 'active' },
      })

      expect(result.current.isEligible).toBe(false)
    })
  })

  describe('isTrialing + daysRemaining', () => {
    it('is trialing when plan status is trialing', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()

      const { result } = renderFreeTrial({
        currentPlan: { status: 'trialing', end_date: futureDate },
      })

      expect(result.current.isTrialing).toBe(true)
      expect(result.current.trialEndsAt).toBe(futureDate)
      expect(result.current.daysRemaining).toBeGreaterThan(0)
    })

    it('clamps daysRemaining to 0 if trial is already expired', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

      const { result } = renderFreeTrial({
        currentPlan: { status: 'trialing', end_date: pastDate },
      })

      expect(result.current.daysRemaining).toBe(0)
    })

    it('is not trialing when plan status is active', () => {
      const { result } = renderFreeTrial({
        currentPlan: { status: 'active' },
      })

      expect(result.current.isTrialing).toBe(false)
      expect(result.current.trialEndsAt).toBeNull()
    })
  })

  describe('activateFreeTrial', () => {
    it('calls functions.invoke with correct payload on success', async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null })

      const { result, refetchPlan } = renderFreeTrial()

      await act(async () => {
        await result.current.activateFreeTrial()
      })

      expect(mockFunctionsInvoke).toHaveBeenCalledWith('activate-free-trial', {
        body: { businessId: 'biz1' },
      })
      expect(refetchPlan).toHaveBeenCalled()
    })

    it('sets error message on trial_already_used error code', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { code: 'trial_already_used', message: 'Already used' },
      })

      const { result } = renderFreeTrial()

      await act(async () => {
        await result.current.activateFreeTrial()
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })

    it('does not call refetchPlan when activation fails with error code', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { error: 'business_already_has_plan' },
        error: null,
      })

      const { result, refetchPlan } = renderFreeTrial()

      await act(async () => {
        await result.current.activateFreeTrial()
      })

      expect(refetchPlan).not.toHaveBeenCalled()
      expect(result.current.error).toBeTruthy()
    })
  })
})
