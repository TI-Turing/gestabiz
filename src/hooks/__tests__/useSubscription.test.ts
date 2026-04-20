import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSubscription } from '../useSubscription'

// ============================================================================
// MOCKS
// ============================================================================

const mockShowToast = vi.fn()
vi.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({ showToast: mockShowToast }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const mockGateway = {
  getSubscriptionDashboard: vi.fn(),
  createCheckoutSession: vi.fn(),
  updateSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  pauseSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
  reactivateSubscription: vi.fn(),
  validatePlanLimit: vi.fn(),
  applyDiscountCode: vi.fn(),
}

vi.mock('@/lib/payments/PaymentGatewayFactory', () => ({
  getPaymentGateway: () => mockGateway,
}))

// Mock window.location
const originalLocation = window.location
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...originalLocation, href: '', origin: 'http://localhost:5173' },
  })
})

// ============================================================================
// HELPERS
// ============================================================================

const mockDashboard = {
  subscription: { id: 'sub-1', status: 'active', planType: 'inicio' },
  invoices: [],
  paymentMethods: [],
  usage: { appointments: 10, locations: 1, employees: 2 },
}

// ============================================================================
// TESTS
// ============================================================================

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGateway.getSubscriptionDashboard.mockResolvedValue(mockDashboard)
  })

  it('loads dashboard on mount when businessId is provided', async () => {
    const { result } = renderHook(() => useSubscription('biz-1'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGateway.getSubscriptionDashboard).toHaveBeenCalledWith('biz-1')
    expect(result.current.dashboard).toEqual(mockDashboard)
    expect(result.current.error).toBeNull()
  })

  it('does not load dashboard when businessId is null', async () => {
    const { result } = renderHook(() => useSubscription(null))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGateway.getSubscriptionDashboard).not.toHaveBeenCalled()
    expect(result.current.dashboard).toBeNull()
  })

  it('sets error and shows toast on loadDashboard failure', async () => {
    mockGateway.getSubscriptionDashboard.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSubscription('biz-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(mockShowToast).toHaveBeenCalledWith('Network error', 'error')
  })

  it('createCheckout redirects to session URL', async () => {
    mockGateway.createCheckoutSession.mockResolvedValue({
      sessionUrl: 'https://checkout.stripe.com/session-123',
    })

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createCheckout('inicio', 'monthly')
    })

    expect(mockGateway.createCheckoutSession).toHaveBeenCalledWith({
      businessId: 'biz-1',
      planType: 'inicio',
      billingCycle: 'monthly',
      discountCode: undefined,
      successUrl: 'http://localhost:5173/dashboard/billing?payment=success',
      cancelUrl: 'http://localhost:5173/pricing?payment=canceled',
    })
    expect(window.location.href).toBe('https://checkout.stripe.com/session-123')
  })

  it('createCheckout throws when businessId is null', async () => {
    const { result } = renderHook(() => useSubscription(null))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(
      act(() => result.current.createCheckout('inicio', 'monthly'))
    ).rejects.toThrow('Business ID is required')
  })

  it('updatePlan calls gateway and reloads dashboard', async () => {
    mockGateway.updateSubscription.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Reset after initial load
    mockGateway.getSubscriptionDashboard.mockClear()

    await act(async () => {
      await result.current.updatePlan('profesional', 'yearly')
    })

    expect(mockGateway.updateSubscription).toHaveBeenCalledWith({
      businessId: 'biz-1',
      newPlanType: 'profesional',
      newBillingCycle: 'yearly',
    })
    expect(mockShowToast).toHaveBeenCalledWith('Plan actualizado exitosamente', 'success')
    expect(mockGateway.getSubscriptionDashboard).toHaveBeenCalledWith('biz-1')
  })

  it('cancelSubscription with cancelAtPeriodEnd=true', async () => {
    mockGateway.cancelSubscription.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.cancelSubscription(true, 'Too expensive')
    })

    expect(mockGateway.cancelSubscription).toHaveBeenCalledWith({
      businessId: 'biz-1',
      cancelAtPeriodEnd: true,
      cancellationReason: 'Too expensive',
    })
    expect(mockShowToast).toHaveBeenCalledWith(
      'Suscripción cancelada al final del período',
      'success'
    )
  })

  it('cancelSubscription with immediate cancellation', async () => {
    mockGateway.cancelSubscription.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.cancelSubscription(false)
    })

    expect(mockShowToast).toHaveBeenCalledWith(
      'Suscripción cancelada inmediatamente',
      'success'
    )
  })

  it('pauseSubscription calls gateway', async () => {
    mockGateway.pauseSubscription.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.pauseSubscription()
    })

    expect(mockGateway.pauseSubscription).toHaveBeenCalledWith('biz-1')
    expect(mockShowToast).toHaveBeenCalledWith('Suscripción pausada exitosamente', 'success')
  })

  it('resumeSubscription calls gateway', async () => {
    mockGateway.resumeSubscription.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.resumeSubscription()
    })

    expect(mockGateway.resumeSubscription).toHaveBeenCalledWith('biz-1')
    expect(mockShowToast).toHaveBeenCalledWith('Suscripción reanudada exitosamente', 'success')
  })

  it('reactivateSubscription calls gateway', async () => {
    mockGateway.reactivateSubscription.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.reactivateSubscription()
    })

    expect(mockGateway.reactivateSubscription).toHaveBeenCalledWith('biz-1')
    expect(mockShowToast).toHaveBeenCalledWith('Suscripción reactivada exitosamente', 'success')
  })

  it('validateLimit returns result and shows toast when not allowed', async () => {
    mockGateway.validatePlanLimit.mockResolvedValue({
      allowed: false,
      current: 3,
      limit: 3,
      message: 'Has alcanzado el límite de citas',
    })

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let limitResult: unknown
    await act(async () => {
      limitResult = await result.current.validateLimit('appointments')
    })

    expect(mockGateway.validatePlanLimit).toHaveBeenCalledWith('biz-1', 'appointments')
    expect(limitResult).toEqual(expect.objectContaining({ allowed: false }))
    expect(mockShowToast).toHaveBeenCalledWith('Has alcanzado el límite de citas', 'info')
  })

  it('validateLimit does not show toast when allowed', async () => {
    mockGateway.validatePlanLimit.mockResolvedValue({
      allowed: true,
      current: 1,
      limit: 3,
    })

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Clear toasts from loadDashboard
    mockShowToast.mockClear()

    await act(async () => {
      await result.current.validateLimit('appointments')
    })

    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('applyDiscount shows success toast when valid', async () => {
    mockGateway.applyDiscountCode.mockResolvedValue({
      isValid: true,
      discountAmount: 16000,
    })

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.applyDiscount('PROMO20', 'inicio', 80000)
    })

    expect(mockGateway.applyDiscountCode).toHaveBeenCalledWith('biz-1', 'PROMO20', 'inicio', 80000)
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Código aplicado: PROMO20'),
      'success'
    )
  })

  it('applyDiscount shows error toast when invalid', async () => {
    mockGateway.applyDiscountCode.mockResolvedValue({
      isValid: false,
      discountAmount: 0,
      message: 'Código expirado',
    })

    const { result } = renderHook(() => useSubscription('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.applyDiscount('EXPIRED', 'inicio', 80000)
    })

    expect(mockShowToast).toHaveBeenCalledWith('Código expirado', 'error')
  })
})
