import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('@/components/cards/ServiceCard', () => ({
  ServiceCard: ({ service, isSelected, onSelect }: any) => (
    <button data-testid={`svc-card-${service.id}`} aria-pressed={isSelected} onClick={() => onSelect(service)}>
      {service.name}
    </button>
  ),
}))

vi.mock('@/components/admin/ServiceProfileModal', () => ({
  ServiceProfileModal: () => null,
}))

import { ServiceSelection } from '../wizard-steps/ServiceSelection'

const svcA = {
  id: 'svc-1',
  business_id: 'biz-1',
  name: 'Corte',
  description: '',
  duration_minutes: 30,
  price: 50000,
  currency: 'COP',
  category: 'a',
  is_active: true,
  created_at: '',
  updated_at: '',
  image_url: null,
}
const svcB = { ...svcA, id: 'svc-2', name: 'Tinte' }

describe('ServiceSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReset()
  })

  it('uses preloaded services without querying when provided', async () => {
    renderWithProviders(
      <ServiceSelection
        businessId="biz-1"
        selectedServiceId={null}
        onSelectService={vi.fn()}
        preloadedServices={[svcA, svcB] as any}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('svc-card-svc-1')).toBeInTheDocument()
    })
    expect(screen.getByTestId('svc-card-svc-2')).toBeInTheDocument()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches services from supabase when no preloaded list', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [svcA], error: null }))
    renderWithProviders(
      <ServiceSelection businessId="biz-1" selectedServiceId={null} onSelectService={vi.fn()} />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('svc-card-svc-1')).toBeInTheDocument()
    })
    expect(mockFrom).toHaveBeenCalledWith('services')
  })

  it('renders empty grid when supabase returns empty array', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))
    renderWithProviders(
      <ServiceSelection businessId="biz-1" selectedServiceId={null} onSelectService={vi.fn()} />,
    )
    await waitFor(() => {
      expect(screen.getByText('appointments.wizard.selectAService')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('svc-card-svc-1')).not.toBeInTheDocument()
  })

  it('renders empty grid when supabase returns error', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: { message: 'boom' } }))
    renderWithProviders(
      <ServiceSelection businessId="biz-1" selectedServiceId={null} onSelectService={vi.fn()} />,
    )
    await waitFor(() => {
      expect(screen.getByText('appointments.wizard.selectAService')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('svc-card-svc-1')).not.toBeInTheDocument()
  })

  it('calls onSelectService when a service card is clicked', async () => {
    const onSelectService = vi.fn()
    renderWithProviders(
      <ServiceSelection
        businessId="biz-1"
        selectedServiceId={null}
        onSelectService={onSelectService}
        preloadedServices={[svcA] as any}
      />,
    )
    await waitFor(() => screen.getByTestId('svc-card-svc-1'))
    await userEvent.click(screen.getByTestId('svc-card-svc-1'))
    expect(onSelectService).toHaveBeenCalled()
    expect(onSelectService.mock.calls[0][0].id).toBe('svc-1')
  })

  it('filters services by location-active employees when locationId is set', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'business_employees') {
        return mockSupabaseChain({ data: [{ employee_id: 'e1' }], error: null })
      }
      if (table === 'employee_services') {
        return mockSupabaseChain({
          data: [
            { employee_id: 'e1', service_id: 'svc-1' },
            { employee_id: 'eX', service_id: 'svc-2' },
          ],
          error: null,
        })
      }
      return mockSupabaseChain({ data: [], error: null })
    })
    renderWithProviders(
      <ServiceSelection
        businessId="biz-1"
        locationId="loc-1"
        selectedServiceId={null}
        onSelectService={vi.fn()}
        preloadedServices={[svcA, svcB] as any}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('svc-card-svc-1')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('svc-card-svc-2')).not.toBeInTheDocument()
  })
})
