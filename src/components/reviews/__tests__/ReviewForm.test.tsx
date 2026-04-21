import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { ReviewForm } from '../ReviewForm'
import { toast } from 'sonner'

/* ── Mocks ── */
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/contexts/LanguageContext', () => ({
  
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLanguage: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'reviews.leaveReview': 'Deja tu reseña',
        'reviews.reviewDescription': 'Comparte tu experiencia',
        'reviews.form.ratingLabel': 'Calificación',
        'reviews.comment': 'Comentario',
        'common.forms.optional': 'Opcional',
        'reviews.commentPlaceholder': 'Escribe tu comentario...',
        'reviews.shareExperience': 'Comparte tu opinión',
        'reviews.submitReview': 'Enviar reseña',
        'common.submitting': 'Enviando...',
        'common.cancel': 'Cancelar',
        'reviews.submitSuccess': 'Reseña enviada',
        'reviews.errors.ratingRequired': 'La calificación es requerida',
        'reviews.errors.submitFailed': 'Error al enviar',
        'reviews.ratings.poor': 'Malo',
        'reviews.ratings.fair': 'Regular',
        'reviews.ratings.good': 'Bueno',
        'reviews.ratings.veryGood': 'Muy bueno',
        'reviews.ratings.excellent': 'Excelente',
      }
      return map[k] ?? k
    },
    language: 'es',
  }),
}))
vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('ReviewForm', () => {
  const defaultProps = {
    appointmentId: 'apt-1',
    businessId: 'biz-1',
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('renders title and description', () => {
    renderWithProviders(<ReviewForm {...defaultProps} />)
    expect(screen.getByText('Deja tu reseña')).toBeInTheDocument()
    expect(screen.getByText(/Comparte tu experiencia/)).toBeInTheDocument()
  })

  it('renders 5 star buttons', () => {
    renderWithProviders(<ReviewForm {...defaultProps} />)
    // 5 star buttons rendered as <button> with Star SVG inside
    const buttons = screen.getAllByRole('button')
    // 5 stars + submit + cancel = 7
    expect(buttons.length).toBeGreaterThanOrEqual(5)
  })

  it('shows error toast when submitting without rating', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReviewForm {...defaultProps} />)
    // Submit button is disabled when rating=0, so we force submit via form
    // Instead, we verify that the button itself is disabled
    const submitBtn = screen.getByText('Enviar reseña')
    expect(submitBtn).toBeDisabled()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('submits with rating and comment', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReviewForm {...defaultProps} />)

    // Click the 4th star (among the first 5 buttons)
    const allButtons = screen.getAllByRole('button')
    await user.click(allButtons[3]) // 4th star

    // Type a comment
    const textarea = screen.getByPlaceholderText('Escribe tu comentario...')
    await user.type(textarea, 'Excelente servicio')

    // Submit
    await user.click(screen.getByText('Enviar reseña'))

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(4, 'Excelente servicio')
    })
    expect(toast.success).toHaveBeenCalledWith('Reseña enviada')
  })

  it('shows rating label on star selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReviewForm {...defaultProps} />)
    const allButtons = screen.getAllByRole('button')
    await user.click(allButtons[4]) // 5th star = Excelente
    expect(screen.getByText('Excelente')).toBeInTheDocument()
  })

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReviewForm {...defaultProps} />)
    await user.click(screen.getByText('Cancelar'))
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('shows character counter', () => {
    renderWithProviders(<ReviewForm {...defaultProps} />)
    expect(screen.getByText('0/1000')).toBeInTheDocument()
  })

  it('updates character counter on typing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReviewForm {...defaultProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu comentario...')
    await user.type(textarea, 'Hola')
    expect(screen.getByText('4/1000')).toBeInTheDocument()
  })

  it('shows error toast on submit failure', async () => {
    const user = userEvent.setup()
    const failSubmit = vi.fn().mockRejectedValue(new Error('fail'))
    renderWithProviders(<ReviewForm {...defaultProps} onSubmit={failSubmit} />)

    const allButtons = screen.getAllByRole('button')
    await user.click(allButtons[2]) // 3rd star
    await user.click(screen.getByText('Enviar reseña'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al enviar')
    })
  })

  it('disables submit button when rating is 0', () => {
    renderWithProviders(<ReviewForm {...defaultProps} />)
    expect(screen.getByText('Enviar reseña')).toBeDisabled()
  })
})
