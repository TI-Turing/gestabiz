import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { QuickSaleForm } from '../QuickSaleForm'

// --- Supabase mock ---
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  default: {
    from: mockFrom,
  },
  supabase: {
    from: mockFrom,
  },
}))

// --- Auth mock ---
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'admin@test.com' },
    session: null,
  }),
}))

// --- Preferred location mock ---
vi.mock('@/hooks/usePreferredLocation', () => ({
  usePreferredLocation: () => ({
    preferredLocationId: 'loc-1',
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

// --- PermissionGate mock — just render children ---
vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// --- PhonePrefixSelect mock ---
vi.mock('@/components/catalog/PhonePrefixSelect', () => ({
  PhonePrefixSelect: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (v: string) => void
  }) => (
    <select
      data-testid="phone-prefix"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="+57">+57</option>
    </select>
  ),
}))

// --- sonner mock ---
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// --- Supabase chain helper ---
function makeChain(data: unknown, error: null = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
    insert: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  // services
  mockFrom.mockImplementation((table: string) => {
    if (table === 'services') {
      return makeChain([
        { id: 'svc-1', name: 'Corte de cabello', price: 50000, currency: 'COP', duration_minutes: 30 },
      ])
    }
    if (table === 'locations') {
      return makeChain([{ id: 'loc-1', name: 'Sede Principal', address: 'Calle 1' }])
    }
    if (table === 'business_employees') {
      return makeChain([])
    }
    return makeChain([])
  })
})

describe('QuickSaleForm', () => {
  it('renders client name input', async () => {
    renderWithProviders(<QuickSaleForm businessId="biz-1" />)
    await waitFor(() => {
      const nameInput = screen.queryByRole('textbox', { name: /nombre|cliente/i })
        ?? screen.queryByPlaceholderText(/nombre/i)
      expect(nameInput ?? screen.getByLabelText(/nombre/i)).toBeDefined()
    })
  })

  it('renders payment method select', async () => {
    renderWithProviders(<QuickSaleForm businessId="biz-1" />)
    await waitFor(() => {
      // Payment method section should exist — default option 'Efectivo' is visible
      const paymentSection = document.body.textContent
      expect(paymentSection).toContain('Efectivo')
    })
  })

  it('renders submit/register button', async () => {
    renderWithProviders(<QuickSaleForm businessId="biz-1" />)
    await waitFor(() => {
      const submitBtn = screen.queryByRole('button', { name: /registrar|guardar|venta/i })
      expect(submitBtn).not.toBeNull()
    })
  })

  it('fetches services from Supabase on mount', async () => {
    renderWithProviders(<QuickSaleForm businessId="biz-1" />)
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('services')
    })
  })

  it('fetches locations from Supabase on mount', async () => {
    renderWithProviders(<QuickSaleForm businessId="biz-1" />)
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('locations')
    })
  })
})
