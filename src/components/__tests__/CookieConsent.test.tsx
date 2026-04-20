import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { CookieConsent } from '../CookieConsent'

// ---------- mocks ----------

const mockGrantConsent = vi.fn()
const mockRevokeConsent = vi.fn()
const mockInitGA4 = vi.fn()
const mockUpdateConsent = vi.fn()

vi.mock('@/hooks/useAnalytics', () => ({
  grantAnalyticsConsent: (...args: unknown[]) => mockGrantConsent(...args),
  revokeAnalyticsConsent: (...args: unknown[]) => mockRevokeConsent(...args),
}))

vi.mock('@/lib/ga4', () => ({
  initializeGA4: (...args: unknown[]) => mockInitGA4(...args),
  updateGA4Consent: (...args: unknown[]) => mockUpdateConsent(...args),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'cookieConsent.title': 'Cookies y Privacidad',
        'cookieConsent.description': 'Usamos cookies analíticas para mejorar tu experiencia.',
        'cookieConsent.accept': 'Aceptar',
        'cookieConsent.reject': 'Rechazar',
        'cookieConsent.close': 'Cerrar',
      }
      return map[k] ?? k
    },
    language: 'es',
  })),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// ---------- helpers ----------

beforeEach(() => {
  localStorage.clear()
})

// ---------- tests ----------

describe('CookieConsent', () => {
  it('shows banner when no consent decision exists', () => {
    renderWithProviders(<CookieConsent />)
    expect(screen.getByText('Cookies y Privacidad')).toBeInTheDocument()
    expect(screen.getByText(/Usamos cookies analíticas/)).toBeInTheDocument()
  })

  it('hides banner when consent already decided', () => {
    localStorage.setItem('ga_consent', 'granted')
    renderWithProviders(<CookieConsent />)
    expect(screen.queryByText('Cookies y Privacidad')).not.toBeInTheDocument()
  })

  it('has accept, reject and close buttons', () => {
    renderWithProviders(<CookieConsent />)
    expect(screen.getByText('Aceptar')).toBeInTheDocument()
    expect(screen.getByText('Rechazar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('grants consent and initializes GA4 on accept', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CookieConsent />)
    await user.click(screen.getByText('Aceptar'))

    expect(mockGrantConsent).toHaveBeenCalled()
    expect(mockInitGA4).toHaveBeenCalled()
    expect(mockUpdateConsent).toHaveBeenCalledWith(true)
    // Banner hides
    expect(screen.queryByText('Cookies y Privacidad')).not.toBeInTheDocument()
  })

  it('revokes consent on reject', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CookieConsent />)
    await user.click(screen.getByText('Rechazar'))

    expect(mockRevokeConsent).toHaveBeenCalled()
    expect(mockUpdateConsent).toHaveBeenCalledWith(false)
    expect(screen.queryByText('Cookies y Privacidad')).not.toBeInTheDocument()
  })

  it('closes banner without decision on X click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CookieConsent />)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(mockGrantConsent).not.toHaveBeenCalled()
    expect(mockRevokeConsent).not.toHaveBeenCalled()
    expect(screen.queryByText('Cookies y Privacidad')).not.toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    renderWithProviders(<CookieConsent />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'cookie-consent-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'cookie-consent-description')
  })
})
