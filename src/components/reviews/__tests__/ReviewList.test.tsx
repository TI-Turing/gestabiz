import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { ReviewList } from '../ReviewList'
import type { Review } from '@/types/types'

/* ── Mocks ── */
const mockReviews: Review[] = [
  {
    id: 'rev-1',
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-03-15T10:00:00Z',
    business_id: 'biz-1',
    appointment_id: 'apt-1',
    client_id: 'client-1',
    rating: 5 as const,
    comment: 'Servicio excepcional',
    is_visible: true,
    is_verified: true,
    helpful_count: 10,
    client_name: 'Ana López',
  },
  {
    id: 'rev-2',
    created_at: '2025-03-14T10:00:00Z',
    updated_at: '2025-03-14T10:00:00Z',
    business_id: 'biz-1',
    appointment_id: 'apt-2',
    client_id: 'client-2',
    rating: 3 as const,
    comment: 'Puede mejorar',
    is_visible: true,
    is_verified: false,
    helpful_count: 2,
    client_name: 'Pedro Ruiz',
  },
]

const mockStats = {
  average_rating: 4.0,
  total: 2,
  rating_distribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 },
}

const mockUseReviews = {
  reviews: mockReviews,
  stats: mockStats,
  loading: false,
  respondToReview: vi.fn(),
  toggleReviewVisibility: vi.fn(),
  deleteReview: vi.fn(),
}

vi.mock('@/hooks/useReviews', () => ({
  useReviews: vi.fn(() => mockUseReviews),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLanguage: () => ({
    t: (k: string, params?: Record<string, string>) => {
      const map: Record<string, string> = {
        'reviews.overallRating': 'Calificación general',
        'reviews.ratingDistribution': 'Distribución',
        'reviews.searchReviews': 'Buscar reseñas',
        'reviews.filterByRating': 'Filtrar por calificación',
        'reviews.allRatings': 'Todas',
        'reviews.stars': 'estrellas',
        'reviews.star': 'estrella',
        'reviews.noReviews': 'Sin reseñas',
        'reviews.noResultsFound': 'Sin resultados',
        'common.loading': 'Cargando',
        'common.loadMore': 'Cargar más',
        'reviews.anonymous': 'Anónimo',
        'reviews.verified': 'Verificado',
        'reviews.helpful': 'Útil',
        'reviews.hidden': 'Oculto',
        'reviews.businessResponse': 'Respuesta del negocio',
        'reviews.respond': 'Responder',
        'reviews.employeeLabel': 'Profesional',
        'reviews.hide': 'Ocultar',
        'reviews.show': 'Mostrar',
        'reviews.delete': 'Eliminar',
        'reviews.responsePlaceholder': 'Escribe tu respuesta...',
        'reviews.submitResponse': 'Enviar respuesta',
        'reviews.confirmDelete': '¿Eliminar?',
        'common.saving': 'Guardando...',
        'common.cancel': 'Cancelar',
      }
      let result = map[k] ?? k
      if (params) {
        for (const [pk, pv] of Object.entries(params)) {
          result = result.replace(`{${pk}}`, pv)
        }
      }
      return result
    },
    language: 'es',
  }),
}))

vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/supabase', () => ({
  default: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }) },
    from: vi.fn(),
  },
}))

describe('ReviewList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReviews.reviews = mockReviews
    mockUseReviews.stats = mockStats
    mockUseReviews.loading = false
  })

  it('renders overall average rating', () => {
    renderWithProviders(<ReviewList businessId="biz-1" />)
    expect(screen.getByText('4.0')).toBeInTheDocument()
    expect(screen.getByText('Calificación general')).toBeInTheDocument()
  })

  it('renders review cards', () => {
    renderWithProviders(<ReviewList businessId="biz-1" />)
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('Pedro Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Servicio excepcional')).toBeInTheDocument()
    expect(screen.getByText('Puede mejorar')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseReviews.loading = true
    mockUseReviews.reviews = []
    renderWithProviders(<ReviewList businessId="biz-1" />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows "no reviews" when empty and no filters', () => {
    mockUseReviews.reviews = []
    mockUseReviews.stats = { average_rating: 0, total: 0, rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    renderWithProviders(<ReviewList businessId="biz-1" />)
    expect(screen.getByText('Sin reseñas')).toBeInTheDocument()
  })

  it('filters reviews by search term', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReviewList businessId="biz-1" />)
    const searchInput = screen.getByPlaceholderText('Buscar reseñas')
    await user.type(searchInput, 'excepcional')
    expect(screen.getByText('Servicio excepcional')).toBeInTheDocument()
    expect(screen.queryByText('Puede mejorar')).not.toBeInTheDocument()
  })

  it('renders rating distribution bars', () => {
    renderWithProviders(<ReviewList businessId="biz-1" />)
    expect(screen.getByText('Distribución')).toBeInTheDocument()
    // Both 5-star and 3-star show "1 (50%)"
    const counts = screen.getAllByText('1 (50%)')
    expect(counts).toHaveLength(2)
  })
})
