import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import PublicBusinessProfile from '../PublicBusinessProfile'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  navigateMock,
  routeState,
  authState,
  businessDataState,
  preselectionState,
  trackReserveClickMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  routeState: {
    slug: 'salon-demo',
    search: '',
  },
  authState: {
    user: null as null | { id: string },
  },
  businessDataState: {
    business: null as null | Record<string, unknown>,
    isLoading: false,
    error: null as string | null,
  },
  preselectionState: {
    data: {} as Record<string, unknown>,
  },
  trackReserveClickMock: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ slug: routeState.slug }),
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(routeState.search), vi.fn()],
  }
})

vi.mock('@/hooks/useBusinessProfileData', () => ({
  useBusinessProfileData: () => businessDataState,
}))

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    latitude: null,
    longitude: null,
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('@/hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}))

vi.mock('@/hooks/useBookingPreselection', () => ({
  useBookingPreselection: () => ({
    patch: (updates: Record<string, unknown>) => {
      preselectionState.data = { ...preselectionState.data, ...updates }
    },
    get: () => preselectionState.data,
    clear: () => {
      preselectionState.data = {}
    },
  }),
}))

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackReserveButtonClick: trackReserveClickMock,
    trackProfileView: vi.fn(),
    trackContactClick: vi.fn(),
  }),
}))

vi.mock('@/components/landing/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="public-layout">{children}</div>,
}))

vi.mock('@/components/cards/ServiceCard', () => ({
  ServiceCard: () => <div>service-card</div>,
}))

vi.mock('@/components/cards/LocationCard', () => ({
  LocationCard: () => <div>location-card</div>,
}))

vi.mock('@/components/cards/EmployeeCard', () => ({
  EmployeeCard: () => <div>employee-card</div>,
}))

vi.mock('@/components/reviews/ReviewList', () => ({
  ReviewList: () => <div>review-list</div>,
}))

vi.mock('@/components/business/ChatWithAdminModal', () => ({
  default: () => <div>chat-modal</div>,
}))

vi.mock('@/components/admin/ServiceProfileModal', () => ({
  ServiceProfileModal: () => null,
}))

vi.mock('@/components/admin/LocationProfileModal', () => ({
  LocationProfileModal: () => null,
}))

vi.mock('@/components/user/UserProfile', () => ({
  default: () => null,
}))

vi.mock('@/components/appointments/AppointmentWizard', () => ({
  AppointmentWizard: ({ open, businessId, userId }: { open: boolean; businessId: string; userId?: string }) => (
    open ? <div>wizard-open:{businessId}:{userId ?? 'anon'}</div> : null
  ),
}))

const businessFixture = {
  id: 'biz-1',
  slug: 'salon-demo',
  name: 'Salon Demo',
  description: 'Perfil público de prueba',
  logo_url: null,
  banner_url: null,
  phone: '3000000000',
  email: 'salon@demo.com',
  website: null,
  rating: 4.5,
  reviewCount: 2,
  category: { name: 'Belleza', icon: 'Sparkles' },
  subcategories: [],
  services: [],
  locations: [],
  employees: [],
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  og_image_url: null,
}

describe('PublicBusinessProfile (page)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.slug = 'salon-demo'
    routeState.search = ''
    authState.user = null
    businessDataState.business = businessFixture
    businessDataState.isLoading = false
    businessDataState.error = null
    preselectionState.data = {}
  })

  it('renders loading state while page data is resolving', () => {
    businessDataState.isLoading = true

    renderWithProviders(<PublicBusinessProfile />)

    expect(screen.getByText('Cargando información del negocio...')).toBeInTheDocument()
  })

  it('renders error state and navigates home from fallback action', () => {
    businessDataState.business = null
    businessDataState.error = 'No existe'

    renderWithProviders(<PublicBusinessProfile />)

    expect(screen.getByText('Negocio no encontrado')).toBeInTheDocument()
    expect(screen.getByText('No existe')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('redirects unauthenticated users to login when booking from public CTA', async () => {
    renderWithProviders(<PublicBusinessProfile />)

    fireEvent.click(screen.getByRole('button', { name: 'Reservar Ahora' }))

    await waitFor(() => {
      expect(trackReserveClickMock).toHaveBeenCalledWith({
        businessId: 'biz-1',
        serviceId: undefined,
        source: 'profile',
      })
    })

    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining('/login?'),
    )
    expect(String(navigateMock.mock.calls[0][0])).toContain('redirect=%2Fnegocio%2Fsalon-demo')
    expect(String(navigateMock.mock.calls[0][0])).toContain('businessId=biz-1')
  })

  it('opens the appointment wizard for authenticated client users', async () => {
    authState.user = { id: 'client-1' }

    renderWithProviders(<PublicBusinessProfile />)

    fireEvent.click(screen.getByRole('button', { name: 'Reservar Ahora' }))

    await waitFor(() => {
      expect(screen.getByText('wizard-open:biz-1:client-1')).toBeInTheDocument()
    })
  })
})