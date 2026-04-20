import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import BusinessProfile from '../BusinessProfile'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  authState,
  useQueryMock,
  toggleFavoriteMock,
  isFavoriteMock,
  toastInfoMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  authState: { user: null as null | { id: string }, loading: false },
  useQueryMock: vi.fn(),
  toggleFavoriteMock: vi.fn(),
  isFavoriteMock: vi.fn(() => false),
  toastInfoMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  }
})

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('@/hooks/useReviews', () => ({
  useReviews: () => ({
    createReview: vi.fn(),
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: isFavoriteMock,
    toggleFavorite: toggleFavoriteMock,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    info: toastInfoMock,
    error: toastErrorMock,
  },
}))

vi.mock('../ChatWithAdminModal', () => ({
  default: ({ businessName, onChatStarted }: { businessName: string; onChatStarted?: (conversationId: string) => void }) => (
    <div data-testid="chat-modal">
      <div>chat:{businessName}</div>
      <button type="button" onClick={() => onChatStarted?.('conv-123')}>emit-chat</button>
    </div>
  ),
}))

vi.mock('@/components/reviews/ReviewForm', () => ({
  ReviewForm: () => <div>review-form</div>,
}))

vi.mock('@/components/reviews/ReviewList', () => ({
  ReviewList: ({ businessId }: { businessId: string }) => <div>reviews:{businessId}</div>,
}))

vi.mock('@/components/admin/LocationProfileModal', () => ({
  LocationProfileModal: ({ location }: { location?: { name?: string } | null }) => location ? <div>location-modal:{location.name}</div> : null,
}))

vi.mock('@/components/admin/ServiceProfileModal', () => ({
  ServiceProfileModal: ({ serviceId }: { serviceId?: string | null }) => serviceId ? <div>service-modal:{serviceId}</div> : null,
}))

vi.mock('@/components/user/UserProfile', () => ({
  default: ({ userId }: { userId: string }) => <div>user-profile:{userId}</div>,
}))

vi.mock('@/components/ui/ImageLightbox', () => ({
  ImageLightbox: () => <div>lightbox</div>,
}))

vi.mock('@/components/ui/LocationAddress', () => ({
  LocationAddress: ({ address }: { address?: string }) => <span>{address}</span>,
}))

vi.mock('@/components/cards/ServiceCard', () => ({
  ServiceCard: ({ service, onViewProfile }: { service: { id: string; name: string }; onViewProfile?: () => void }) => (
    <button type="button" data-testid="service-card" onClick={onViewProfile}>
      {service.name}
    </button>
  ),
}))

vi.mock('@/components/cards/LocationCard', () => ({
  LocationCard: ({ location, onViewProfile }: { location: { name: string }; onViewProfile?: () => void }) => (
    <button type="button" data-testid="location-card" onClick={onViewProfile}>
      {location.name}
    </button>
  ),
}))

vi.mock('@/components/cards/EmployeeCard', () => ({
  EmployeeCard: ({ employee, onViewProfile }: { employee: { id: string; full_name: string | null }; onViewProfile?: () => void }) => (
    <button type="button" data-testid="employee-card" onClick={onViewProfile}>
      {employee.full_name}
    </button>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/tabs', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react')
  const TabsContext = ReactModule.createContext<{ value: string; setValue: (value: string) => void } | null>(null)

  const Tabs = ({ value, onValueChange, children }: { value: string; onValueChange?: (value: string) => void; children: React.ReactNode }) => (
    <TabsContext.Provider value={{ value, setValue: onValueChange ?? (() => {}) }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )

  const TabsList = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

  const TabsTrigger = ({ value, children }: { value: string; children: React.ReactNode }) => {
    const context = ReactModule.useContext(TabsContext)
    return (
      <button type="button" onClick={() => context?.setValue(value)}>
        {children}
      </button>
    )
  }

  const TabsContent = ({ value, children }: { value: string; children: React.ReactNode }) => {
    const context = ReactModule.useContext(TabsContext)
    if (context?.value !== value) return null
    return <div>{children}</div>
  }

  return { Tabs, TabsList, TabsTrigger, TabsContent }
})

type QueryRow = Record<string, unknown>

const businessRow = {
  id: 'biz-1',
  name: 'Negocio Demo',
  description: 'Descripcion demo',
  phone: '3001234567',
  email: 'demo@negocio.com',
  website: 'https://negocio.demo',
  logo_url: 'https://cdn/logo.png',
  banner_url: 'https://cdn/banner.png',
  category_id: 'cat-1',
}

const locationsRows = [
  {
    id: 'loc-1',
    business_id: 'biz-1',
    name: 'Sede Centro',
    city: 'Medellin',
    state: 'Antioquia',
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

const servicesRows = [
  {
    id: 'srv-1',
    name: 'Corte Ejecutivo',
    description: 'Servicio principal',
    duration_minutes: 60,
    price: 45000,
    category: 'Cabello',
    image_url: 'https://cdn/service.png',
  },
]

const reviewsRows = [
  { id: 'rev-1', rating: 4, comment: 'Muy bien', created_at: '2026-02-01' },
  { id: 'rev-2', rating: 5, comment: 'Excelente', created_at: '2026-02-02' },
]

function createQueryBuilder(table: string) {
  const filters = new Map<string, unknown>()
  let selected = ''

  const resolveData = (): { data: QueryRow | QueryRow[] | null; error: null } => {
    if (table === 'businesses') return { data: businessRow, error: null }
    if (table === 'locations') return { data: locationsRows, error: null }
    if (table === 'services') return { data: servicesRows, error: null }
    if (table === 'reviews') return { data: reviewsRows, error: null }
    if (table === 'business_subcategories') return { data: [{ subcategory_id: 'sub-1' }], error: null }
    if (table === 'business_categories') {
      if (selected.includes('icon_name')) return { data: { name: 'Belleza', icon_name: 'sparkles' }, error: null }
      return { data: [{ name: 'Barberia' }], error: null }
    }
    if (table === 'location_media') {
      return { data: [{ location_id: 'loc-1', url: 'https://cdn/location-banner.png', is_banner: true, type: 'image', description: '', created_at: '2026-01-02' }], error: null }
    }
    if (table === 'appointments') {
      return { data: [], error: null }
    }
    return { data: [], error: null }
  }

  const builder = {
    select(query: string) {
      selected = query
      return builder
    },
    eq(column: string, value: unknown) {
      filters.set(column, value)
      return builder
    },
    in(column: string, value: unknown) {
      filters.set(column, value)
      return builder
    },
    order() {
      return builder
    },
    limit() {
      return builder
    },
    single() {
      return Promise.resolve(resolveData())
    },
    then(onFulfilled?: (value: { data: QueryRow | QueryRow[] | null; error: null }) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(resolveData()).then(onFulfilled, onRejected)
    },
  }

  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => createQueryBuilder(table),
  },
}))

describe('BusinessProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = null
    authState.loading = false
    useQueryMock.mockReturnValue({
      data: [{ id: 'emp-1', full_name: 'Ana Ruiz', avatar_url: null }],
    })
  })

  it('renders fetched business data and triggers booking from the footer CTA', async () => {
    const onBookAppointment = vi.fn()

    renderWithProviders(
      <BusinessProfile businessId="biz-1" onClose={vi.fn()} onBookAppointment={onBookAppointment} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Negocio Demo' })).toBeInTheDocument()
    })

    expect(screen.getByText('Corte Ejecutivo')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Agendar Cita/i }))
    expect(onBookAppointment).toHaveBeenCalledWith('biz-1')
  })

  it('shows an info toast when an unauthenticated user clicks favorite', async () => {
    renderWithProviders(
      <BusinessProfile businessId="biz-1" onClose={vi.fn()} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Negocio Demo' })).toBeInTheDocument()
    })

    const iconButtons = screen.getAllByRole('button').filter((button) => button.textContent === '' && !button.getAttribute('aria-label'))
    fireEvent.click(iconButtons[0])

    expect(toastInfoMock).toHaveBeenCalledWith('Inicia sesión para guardar favoritos')
    expect(toggleFavoriteMock).not.toHaveBeenCalled()
  })

  it('toggles favorite using the effective user id when the user is available', async () => {
    renderWithProviders(
      <BusinessProfile businessId="biz-1" onClose={vi.fn()} userId="user-123" />,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Negocio Demo' })).toBeInTheDocument()
    })

    const iconButtons = screen.getAllByRole('button').filter((button) => button.textContent === '' && !button.getAttribute('aria-label'))
    fireEvent.click(iconButtons[0])

    expect(toggleFavoriteMock).toHaveBeenCalledWith('biz-1', 'Negocio Demo')
  })

  it('switches tabs and renders locations, professionals, reviews and about data', async () => {
    renderWithProviders(
      <BusinessProfile businessId="biz-1" onClose={vi.fn()} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Negocio Demo' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Ubic/i }))
    expect(screen.getByTestId('location-card')).toHaveTextContent('Sede Centro')

    fireEvent.click(screen.getByRole('button', { name: /Profes/i }))
    expect(screen.getByTestId('employee-card')).toHaveTextContent('Ana Ruiz')

    fireEvent.click(screen.getByRole('button', { name: /Reviews|Reseñas/i }))
    expect(screen.getByText('reviews:biz-1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Info|Acerca de/i }))
    expect(screen.getByText('Descripcion demo')).toBeInTheDocument()
    expect(screen.getByText('Categoría').parentElement).toHaveTextContent('Belleza')
  })

  it('opens the chat modal and forwards the started conversation id', async () => {
    const onChatStarted = vi.fn()

    renderWithProviders(
      <BusinessProfile businessId="biz-1" onClose={vi.fn()} onChatStarted={onChatStarted} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Negocio Demo' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Chat/i }))
    expect(screen.getByTestId('chat-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'emit-chat' }))
    expect(onChatStarted).toHaveBeenCalledWith('conv-123')
  })
})