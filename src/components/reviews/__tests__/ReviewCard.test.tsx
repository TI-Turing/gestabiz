import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { ReviewCard } from '../ReviewCard'
import type { Review } from '@/types/types'

/* ── Mocks ── */
vi.mock('@/contexts/LanguageContext', () => ({
  
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLanguage: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'reviews.anonymous': 'Anónimo',
        'reviews.verified': 'Verificado',
        'reviews.hidden': 'Oculto',
        'reviews.businessResponse': 'Respuesta del negocio',
        'reviews.helpful': 'Útil',
        'reviews.respond': 'Responder',
        'reviews.hide': 'Ocultar',
        'reviews.show': 'Mostrar',
        'reviews.delete': 'Eliminar',
        'reviews.responsePlaceholder': 'Escribe tu respuesta...',
        'reviews.submitResponse': 'Enviar respuesta',
        'reviews.confirmDelete': '¿Eliminar reseña?',
        'common.saving': 'Guardando...',
        'common.cancel': 'Cancelar',
        'reviews.employeeLabel': 'Profesional',
      }
      return map[k] ?? k
    },
    language: 'es',
  }),
}))
vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

/* ── Fixture ── */
const mockReview: Review = {
  id: 'rev-1',
  created_at: '2025-03-15T10:00:00Z',
  updated_at: '2025-03-15T10:00:00Z',
  business_id: 'biz-1',
  appointment_id: 'apt-1',
  client_id: 'client-1',
  rating: 4 as const,
  comment: 'Muy buen servicio, recomendado.',
  is_visible: true,
  is_verified: true,
  helpful_count: 5,
  client_name: 'Carlos Pérez',
  employee_name: 'Laura Gómez',
}

describe('ReviewCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders client name', () => {
    renderWithProviders(<ReviewCard review={mockReview} />)
    expect(screen.getByText('Carlos Pérez')).toBeInTheDocument()
  })

  it('renders comment text', () => {
    renderWithProviders(<ReviewCard review={mockReview} />)
    expect(screen.getByText('Muy buen servicio, recomendado.')).toBeInTheDocument()
  })

  it('renders "Verificado" badge when is_verified', () => {
    renderWithProviders(<ReviewCard review={mockReview} />)
    expect(screen.getByText('Verificado')).toBeInTheDocument()
  })

  it('renders employee name with label', () => {
    renderWithProviders(<ReviewCard review={mockReview} />)
    expect(screen.getByText('Profesional:')).toBeInTheDocument()
    expect(screen.getByText('Laura Gómez')).toBeInTheDocument()
  })

  it('renders helpful count', () => {
    renderWithProviders(
      <ReviewCard review={mockReview} onHelpful={vi.fn()} />
    )
    expect(screen.getByText('Útil (5)')).toBeInTheDocument()
  })

  it('renders "Anónimo" when no client_name', () => {
    const anonReview = { ...mockReview, client_name: undefined }
    renderWithProviders(<ReviewCard review={anonReview} />)
    expect(screen.getByText('Anónimo')).toBeInTheDocument()
  })

  it('renders "Oculto" badge when not visible', () => {
    const hidden = { ...mockReview, is_visible: false }
    renderWithProviders(<ReviewCard review={hidden} />)
    expect(screen.getByText('Oculto')).toBeInTheDocument()
  })

  it('renders business response when available', () => {
    const withResponse: Review = {
      ...mockReview,
      response: 'Gracias por tu comentario',
      response_at: '2025-03-16T10:00:00Z',
    }
    renderWithProviders(<ReviewCard review={withResponse} />)
    expect(screen.getByText('Respuesta del negocio')).toBeInTheDocument()
    expect(screen.getByText('Gracias por tu comentario')).toBeInTheDocument()
  })

  it('calls onHelpful when helpful button is clicked', async () => {
    const user = userEvent.setup()
    const handleHelpful = vi.fn()
    renderWithProviders(
      <ReviewCard review={mockReview} onHelpful={handleHelpful} />
    )
    await user.click(screen.getByText('Útil (5)'))
    expect(handleHelpful).toHaveBeenCalledWith('rev-1')
  })

  it('shows respond button when canRespond and no response', () => {
    renderWithProviders(
      <ReviewCard review={mockReview} canRespond businessId="biz-1" />
    )
    expect(screen.getByText('Responder')).toBeInTheDocument()
  })

  it('hides respond button when review already has response', () => {
    const withResponse = { ...mockReview, response: 'Gracias' }
    renderWithProviders(
      <ReviewCard review={withResponse} canRespond businessId="biz-1" />
    )
    expect(screen.queryByText('Responder')).not.toBeInTheDocument()
  })
})
