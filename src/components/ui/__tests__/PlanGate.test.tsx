import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { PlanGate } from '../PlanGate'

const mockHasModule = vi.hoisted(() => vi.fn())
const mockIsLoading = vi.hoisted(() => ({ value: false }))

vi.mock('@/hooks/usePlanFeatures', () => ({
  usePlanFeatures: () => ({
    planId: 'free',
    hasModule: mockHasModule,
    upgradePlan: { id: 'basico', name: 'Básico' },
    isLoading: mockIsLoading.value,
    error: null,
  }),
}))

vi.mock('@/lib/pricingPlans', async () => {
  const actual = await vi.importActual<typeof import('@/lib/pricingPlans')>(
    '@/lib/pricingPlans',
  )
  return { ...actual, getPlanName: (id: string) => id }
})

const CHILD_CONTENT = 'Contenido del módulo'

describe('PlanGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading.value = false
    mockHasModule.mockReturnValue(true)
  })

  it('renders children when module is accessible', () => {
    renderWithProviders(
      <PlanGate feature="recruitment" businessId="biz-1">
        <div>{CHILD_CONTENT}</div>
      </PlanGate>,
    )
    expect(screen.getByText(CHILD_CONTENT)).toBeDefined()
  })

  describe('mode: upgrade (default)', () => {
    it('renders UpgradeScreen when module not in plan', () => {
      mockHasModule.mockReturnValue(false)

      renderWithProviders(
        <PlanGate feature="recruitment" businessId="biz-1">
          <div>{CHILD_CONTENT}</div>
        </PlanGate>,
      )
      expect(screen.queryByText(CHILD_CONTENT)).toBeNull()
      expect(screen.getByText(/Ver planes y precios/i)).toBeDefined()
    })

    it('renders custom fallback when provided', () => {
      mockHasModule.mockReturnValue(false)

      renderWithProviders(
        <PlanGate
          feature="expenses"
          businessId="biz-1"
          fallback={<span>Upgrade necesario</span>}
        >
          <div>{CHILD_CONTENT}</div>
        </PlanGate>,
      )
      expect(screen.getByText('Upgrade necesario')).toBeDefined()
      expect(screen.queryByText(CHILD_CONTENT)).toBeNull()
    })
  })

  describe('mode: hide', () => {
    it('renders nothing when module not in plan', () => {
      mockHasModule.mockReturnValue(false)

      const { container } = renderWithProviders(
        <PlanGate feature="expenses" businessId="biz-1" mode="hide">
          <div>{CHILD_CONTENT}</div>
        </PlanGate>,
      )
      expect(screen.queryByText(CHILD_CONTENT)).toBeNull()
      expect(container.firstChild).toBeNull()
    })

    it('renders children when module is accessible', () => {
      renderWithProviders(
        <PlanGate feature="expenses" businessId="biz-1" mode="hide">
          <div>{CHILD_CONTENT}</div>
        </PlanGate>,
      )
      expect(screen.getByText(CHILD_CONTENT)).toBeDefined()
    })
  })

  describe('mode: disable', () => {
    it('renders children with disabled overlay when module not in plan', () => {
      mockHasModule.mockReturnValue(false)

      renderWithProviders(
        <PlanGate feature="expenses" businessId="biz-1" mode="disable">
          <button>{CHILD_CONTENT}</button>
        </PlanGate>,
      )
      // Children still rendered, but wrapped in a pointer-events-none container
      expect(screen.getByText(CHILD_CONTENT)).toBeDefined()
    })

    it('renders children normally when module is accessible', () => {
      renderWithProviders(
        <PlanGate feature="expenses" businessId="biz-1" mode="disable">
          <button>{CHILD_CONTENT}</button>
        </PlanGate>,
      )
      expect(screen.getByText(CHILD_CONTENT)).toBeDefined()
    })
  })

  describe('loading state', () => {
    it('returns null when loading in default mode', () => {
      mockIsLoading.value = true

      const { container } = renderWithProviders(
        <PlanGate feature="expenses" businessId="biz-1">
          <div>{CHILD_CONTENT}</div>
        </PlanGate>,
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders children disabled when loading in disable mode', () => {
      mockIsLoading.value = true

      renderWithProviders(
        <PlanGate feature="expenses" businessId="biz-1" mode="disable">
          <button>{CHILD_CONTENT}</button>
        </PlanGate>,
      )
      expect(screen.getByText(CHILD_CONTENT)).toBeDefined()
    })
  })
})
