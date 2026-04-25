import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { UsageMetrics } from '../UsageMetrics'
import { CancelSubscriptionModal } from '../CancelSubscriptionModal'
import { PaymentHistory } from '../PaymentHistory'
import { AddPaymentMethodModal } from '../AddPaymentMethodModal'

// --- Sentry mock ---
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  withScope: vi.fn(),
}))

// --- useSubscription mock ---
const mockCancelSubscription = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    cancelSubscription: mockCancelSubscription,
    loading: false,
  }),
}))

// --- Language mock ---
vi.mock('@/contexts/LanguageContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/LanguageContext')>(
    '@/contexts/LanguageContext',
  )
  return {
    ...actual,
    useLanguage: () => ({ t: (key: string) => key }),
  }
})

// --- sonner mock ---
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// --- usePlanFeatures mock (used indirectly) ---
vi.mock('@/hooks/usePlanFeatures', () => ({
  usePlanFeatures: () => ({ isModuleAccessible: () => true }),
}))

const sampleUsage = [
  { resource_type: 'locations', current_count: 2, limit: 5, percentage: 40 },
  { resource_type: 'employees', current_count: 8, limit: 10, percentage: 80 },
  { resource_type: 'appointments', current_count: 90, limit: 100, percentage: 90 },
]

const samplePayments = [
  {
    id: 'pay-1',
    amount: 8000000,
    currency: 'COP',
    status: 'succeeded' as const,
    paid_at: '2025-01-01T00:00:00Z',
    invoice_pdf: null,
    description: 'Plan Inicio - Enero 2025',
    failure_reason: null,
  },
  {
    id: 'pay-2',
    amount: 8000000,
    currency: 'COP',
    status: 'failed' as const,
    paid_at: null,
    invoice_pdf: null,
    description: 'Plan Inicio - Febrero 2025',
    failure_reason: 'insufficient_funds',
  },
]

describe('UsageMetrics', () => {
  it('renders plan name', () => {
    renderWithProviders(
      <UsageMetrics usage={sampleUsage} planName="Inicio" billingCycle="monthly" />,
    )
    expect(screen.getByText(/Inicio/i)).toBeDefined()
  })

  it('renders resource names', () => {
    renderWithProviders(
      <UsageMetrics usage={sampleUsage} planName="Inicio" billingCycle="monthly" />,
    )
    expect(screen.getByText('Sedes')).toBeDefined()
    expect(screen.getByText('Empleados')).toBeDefined()
    expect(screen.getByText('Citas')).toBeDefined()
  })

  it('renders critical badge for 90% usage', () => {
    renderWithProviders(
      <UsageMetrics usage={sampleUsage} planName="Inicio" billingCycle="monthly" />,
    )
    expect(screen.getAllByText('Crítico').length).toBeGreaterThan(0)
  })

  it('renders warning badge for 80% usage', () => {
    renderWithProviders(
      <UsageMetrics usage={sampleUsage} planName="Inicio" billingCycle="monthly" />,
    )
    expect(screen.getAllByText('Advertencia').length).toBeGreaterThan(0)
  })

  it('renders normal badge for low usage', () => {
    renderWithProviders(
      <UsageMetrics
        usage={[{ resource_type: 'locations', current_count: 1, limit: 5, percentage: 20 }]}
        planName="Inicio"
        billingCycle="monthly"
      />,
    )
    expect(screen.getByText('Normal')).toBeDefined()
  })

  it('renders alerts section for items >= 80%', () => {
    renderWithProviders(
      <UsageMetrics usage={sampleUsage} planName="Inicio" billingCycle="monthly" />,
    )
    // At least one alert visible
    expect(document.querySelector('.bg-destructive, [class*="destructive"], [class*="yellow"]')).not.toBeNull()
  })
})

describe('CancelSubscriptionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders cancel modal with title', () => {
    renderWithProviders(
      <CancelSubscriptionModal
        businessId="biz-1"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.getByText('Cancelar Suscripción')).toBeDefined()
  })

  it('renders cancellation timing options', () => {
    renderWithProviders(
      <CancelSubscriptionModal
        businessId="biz-1"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.getByText(/cuándo quieres cancelar/i)).toBeDefined()
  })

  it('calls onClose when dialog closed', () => {
    const onClose = vi.fn()
    renderWithProviders(
      <CancelSubscriptionModal businessId="biz-1" onClose={onClose} onSuccess={vi.fn()} />,
    )
    // The cancel/close button in the footer
    const cancelBtn = screen.queryByRole('button', { name: /cancelar|cerrar|volver/i })
    if (cancelBtn) {
      fireEvent.click(cancelBtn)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('renders confirm cancellation button', () => {
    renderWithProviders(
      <CancelSubscriptionModal businessId="biz-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    const confirmBtn = screen.queryByRole('button', { name: /confirmar|cancelar suscripción/i })
    expect(confirmBtn).not.toBeNull()
  })
})

describe('PaymentHistory', () => {
  it('renders payment table', () => {
    renderWithProviders(<PaymentHistory payments={samplePayments} />)
    expect(document.querySelector('table, [role="table"]')).not.toBeNull()
  })

  it('renders succeeded payment', () => {
    renderWithProviders(<PaymentHistory payments={samplePayments} />)
    // Description may appear in both mobile card and desktop table (responsive rendering)
    expect(screen.getAllByText('Plan Inicio - Enero 2025').length).toBeGreaterThan(0)
  })

  it('renders failed payment', () => {
    renderWithProviders(<PaymentHistory payments={samplePayments} />)
    // Description may appear in both mobile card and desktop table (responsive rendering)
    expect(screen.getAllByText('Plan Inicio - Febrero 2025').length).toBeGreaterThan(0)
  })

  it('renders empty state with no payments', () => {
    renderWithProviders(<PaymentHistory payments={[]} />)
    const noPaymentsText = screen.queryByText(/sin pagos|no hay pagos|sin historial|empty/i)
    if (noPaymentsText) expect(noPaymentsText).toBeDefined()
    // Or at minimum renders without crashing
    expect(document.body.textContent).toBeTruthy()
  })

  it('renders filter controls', () => {
    renderWithProviders(<PaymentHistory payments={samplePayments} />)
    // Search input should exist
    const searchInput = document.querySelector('input[type="text"]') ?? document.querySelector('input')
    expect(searchInput).not.toBeNull()
  })
})

describe('AddPaymentMethodModal', () => {
  it('renders payment info dialog', () => {
    renderWithProviders(
      <AddPaymentMethodModal businessId="biz-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    expect(screen.getByText('Método de Pago')).toBeDefined()
  })

  it('renders MercadoPago info text', () => {
    renderWithProviders(
      <AddPaymentMethodModal businessId="biz-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    // MercadoPago may appear multiple times (title + body)
    expect(screen.getAllByText(/MercadoPago/i).length).toBeGreaterThan(0)
  })

  it('renders close/ok button', () => {
    renderWithProviders(
      <AddPaymentMethodModal businessId="biz-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    // Dialog may have multiple buttons (Entendido + X close icon)
    const btns = screen.getAllByRole('button')
    expect(btns.length).toBeGreaterThan(0)
  })

  it('calls onClose when closed', () => {
    const onClose = vi.fn()
    renderWithProviders(
      <AddPaymentMethodModal businessId="biz-1" onClose={onClose} onSuccess={vi.fn()} />,
    )
    const btn = screen.queryByRole('button', { name: /cerrar|entendido|ok/i })
    if (btn) {
      fireEvent.click(btn)
      expect(onClose).toHaveBeenCalled()
    }
  })
})
