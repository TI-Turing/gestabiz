import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { LandingPage } from '../LandingPage'

// ---------- mocks ----------

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

let mockUser: null | { id: string } = null
let mockLoading = false
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: mockLoading,
    session: null,
    signOut: vi.fn(),
  })),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'landing.hero.badge': 'Prueba gratis',
        'landing.hero.title': 'Gestiona tu negocio',
        'landing.hero.titleHighlight': 'sin complicaciones',
        'landing.hero.subtitle': 'La plataforma todo-en-uno',
        'landing.hero.cta.trial': 'Empieza gratis',
        'landing.hero.cta.pricing': 'Ver planes',
        'landing.hero.cta.noCreditCard': 'Sin tarjeta',
        'landing.hero.cta.cancelAnytime': 'Cancela cuando quieras',
        'landing.hero.stats.businesses': 'Negocios',
        'landing.hero.stats.appointments': 'Citas',
        'landing.hero.stats.satisfaction': 'Satisfacción',
      }
      return map[k] ?? k
    },
    language: 'es',
  })),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: vi.fn(() => ({ trackPageView: vi.fn(), trackLogin: vi.fn(), trackSignup: vi.fn() })),
}))

vi.mock('@/hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}))

// Stub child components to simplify rendering
vi.mock('../PricingPlans', () => ({
  PricingPlans: () => <div data-testid="pricing-plans">PricingPlans</div>,
}))

vi.mock('../LandingFooter', () => ({
  LandingFooter: () => <footer data-testid="landing-footer">Footer</footer>,
}))

vi.mock('../PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="public-layout">{children}</div>,
}))

// ---------- tests ----------

const defaultProps = {
  onNavigateToAuth: vi.fn(),
  onNavigateToRegister: vi.fn(),
}

describe('LandingPage', () => {
  beforeEach(() => {
    mockUser = null
    mockLoading = false
  })

  it('renders hero section with title', () => {
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(screen.getByText('Gestiona tu negocio')).toBeInTheDocument()
    expect(screen.getByText('sin complicaciones')).toBeInTheDocument()
  })

  it('renders subtitle and badge', () => {
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(screen.getByText('Prueba gratis')).toBeInTheDocument()
    expect(screen.getByText('La plataforma todo-en-uno')).toBeInTheDocument()
  })

  it('renders stats section', () => {
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(screen.getByText('800+')).toBeInTheDocument()
    expect(screen.getByText('50K+')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
  })

  it('calls onNavigateToRegister on CTA click', () => {
    renderWithProviders(<LandingPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Empieza gratis'))
    expect(defaultProps.onNavigateToRegister).toHaveBeenCalled()
  })

  it('falls back to onNavigateToAuth when onNavigateToRegister is not provided', () => {
    const props = { onNavigateToAuth: vi.fn() }
    renderWithProviders(<LandingPage {...props} />)
    fireEvent.click(screen.getByText('Empieza gratis'))
    expect(props.onNavigateToAuth).toHaveBeenCalled()
  })

  it('renders PricingPlans and Footer', () => {
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(screen.getByTestId('pricing-plans')).toBeInTheDocument()
    expect(screen.getByTestId('landing-footer')).toBeInTheDocument()
  })

  it('wraps content in PublicLayout', () => {
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(screen.getByTestId('public-layout')).toBeInTheDocument()
  })

  it('redirects authenticated user to /app', () => {
    mockUser = { id: 'u-1' }
    mockLoading = false
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true })
  })

  it('does not redirect while loading', () => {
    mockUser = null
    mockLoading = true
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders no-credit-card and cancel-anytime labels', () => {
    renderWithProviders(<LandingPage {...defaultProps} />)
    expect(screen.getByText('Sin tarjeta')).toBeInTheDocument()
    expect(screen.getByText('Cancela cuando quieras')).toBeInTheDocument()
  })
})
