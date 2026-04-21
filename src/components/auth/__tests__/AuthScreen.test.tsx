import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import AuthScreen from '../AuthScreen'

// ---------- mocks ----------

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockSignInWithMagicLink = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithMagicLink: mockSignInWithMagicLink,
  })),
}))

const mockNavigate = vi.fn()
const mockSearchParams = new URLSearchParams()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  }
})

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'auth.emailPlaceholder': 'Email',
        'auth.passwordPlaceholder': 'Contraseña',
        'auth.namePlaceholder': 'Nombre completo',
        'auth.signIn': 'Iniciar sesión',
        'auth.signUp': 'Registrarse',
        'auth.signingIn': 'Iniciando...',
        'auth.creatingAccount': 'Creando cuenta...',
        'auth.orContinueWith': 'O continúa con',
        'auth.forgotPassword': '¿Olvidaste tu contraseña?',
        'auth.rememberMe': 'Recuérdame',
        'auth.noAccount': '¿No tienes cuenta?',
        'auth.alreadyHaveAccount': '¿Ya tienes cuenta?',
        'auth.loginError': 'Error al iniciar sesión',
        'auth.registrationError': 'Error al registrarse',
        'auth.resetPassword': 'Restablecer contraseña',
        'auth.enterEmailFirst': 'Ingresa tu email',
        'auth.checkEmailVerification': 'Revisa tu correo para verificar tu cuenta',
        'auth.continueBooking': 'Inicia sesión para continuar tu reserva',
        'common.messages.requiredFields': 'Todos los campos son obligatorios',
        'common.actions.back': 'Volver',
        'common.actions.close': 'Cerrar',
      }
      return map[k] ?? k
    },
    language: 'es',
  })),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: vi.fn(() => ({ trackLogin: vi.fn(), trackSignup: vi.fn(), trackPageView: vi.fn() })),
}))

vi.mock('@/components/ui/ServiceStatusBadge', () => ({
  ServiceStatusBadge: () => <div data-testid="service-status-badge" />,
}))

vi.mock('../AccountInactiveModal', () => ({
  AccountInactiveModal: () => null,
}))

// Mock Sentry globally
vi.stubGlobal('Sentry', { captureException: vi.fn() })

// Mock static image imports
vi.mock('@/assets/images/gestabiz/gestabiz_logo_light.svg', () => ({ default: '/logo.svg' }))
vi.mock('@/assets/images/tt/1.png', () => ({ default: '/ti-turing.png' }))

// ---------- tests ----------

describe('AuthScreen', () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue({ success: true, user: { id: 'u-1', email: 'a@b.com' } })
    mockSignUp.mockResolvedValue({ success: true, needsEmailConfirmation: false })
  })

  it('renders email and password inputs', () => {
    renderWithProviders(<AuthScreen />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
  })

  it('renders sign-in button', () => {
    renderWithProviders(<AuthScreen />)
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    renderWithProviders(<AuthScreen />)
    expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument()
  })

  it('renders logo', () => {
    renderWithProviders(<AuthScreen />)
    expect(screen.getByAltText('Gestabiz Logo')).toBeInTheDocument()
  })

  it('email and password inputs are required', () => {
    renderWithProviders(<AuthScreen />)
    expect(screen.getByPlaceholderText('Email')).toBeRequired()
  })

  it('calls signIn with email and password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthScreen />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', password: 'password123' })
      )
    })
  })

  it('shows form error when signIn returns error', async () => {
    mockSignIn.mockResolvedValue({ success: false, error: 'Credenciales inválidas' })
    const user = userEvent.setup()
    renderWithProviders(<AuthScreen />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Contraseña'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })
  })

  it('navigates to /app on successful login by default', async () => {
    mockSignIn.mockResolvedValue({ success: true, user: { id: 'u-1', email: 'a@b.com' } })
    const user = userEvent.setup()
    renderWithProviders(<AuthScreen />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Contraseña'), 'pass')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true })
    }, { timeout: 3000 })
  })

  it('shows reset password form when forgot password is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthScreen />)

    await user.click(screen.getByText('¿Olvidaste tu contraseña?'))

    expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu email')).toBeInTheDocument()
  })

  it('calls onLoginSuccess callback when provided', async () => {
    const onLoginSuccess = vi.fn()
    mockSignIn.mockResolvedValue({ success: true, user: { id: 'u-1', email: 'a@b.com' } })
    const user = userEvent.setup()
    renderWithProviders(<AuthScreen onLoginSuccess={onLoginSuccess} />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Contraseña'), 'pass')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})
