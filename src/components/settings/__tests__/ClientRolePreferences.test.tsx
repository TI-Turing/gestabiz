import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { ClientRolePreferences } from '../ClientRolePreferences'
import { renderWithProviders } from '@/test-utils/render-with-providers'

/* ── mocks ───────────────────────────────────────────── */

// Supabase mock
const mockFrom = vi.fn()
vi.mock('@/lib/supabase', () => { const __sb = { from: (...a: unknown[]) => mockFrom(...a) }; return { supabase: __sb, default: __sb } })

// i18n — return key as text
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string, params?: Record<string, string>) => {
      if (params) return `${k}::${JSON.stringify(params)}`
      return k
    },
    language: 'es',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

/* ── helpers ─────────────────────────────────────────── */

function buildChain(resolvedValue: { data: unknown; error: unknown; count?: number | null }) {
  const self: Record<string, any> = {}
  const methods = ['select', 'update', 'delete', 'insert', 'eq', 'neq', 'is', 'gt', 'in', 'gte', 'lte', 'contains', 'order', 'limit', 'single', 'maybeSingle']
  for (const m of methods) self[m] = vi.fn().mockReturnValue(self)
  self.then = (resolve: (v: unknown) => void) => resolve(resolvedValue)
  return self
}

/* ── tests ────────────────────────────────────────────── */

describe('ClientRolePreferences', () => {
  const userId = 'user-abc-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue(buildChain({ data: null, error: null, count: 5 }))
  })

  it('renders the booking preferences card title', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    expect(screen.getByText('settings.clientPrefs.bookingPrefs.title')).toBeInTheDocument()
  })

  it('renders 4 preference toggles', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(4)
  })

  it('has reminders and email confirmation toggles checked by default', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    const switches = screen.getAllByRole('switch')
    // reminders = index 0, emailConfirmation = index 1 (defaultChecked: true)
    expect(switches[0]).toBeChecked()
    expect(switches[1]).toBeChecked()
    // promotions = index 2, savePayment = index 3 (defaultChecked: false)
    expect(switches[2]).not.toBeChecked()
    expect(switches[3]).not.toBeChecked()
  })

  it('renders advance time selector', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    expect(screen.getByText('settings.clientPrefs.advanceTime.title')).toBeInTheDocument()
  })

  it('renders payment method selector', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    expect(screen.getByText('settings.clientPrefs.paymentMethods.title')).toBeInTheDocument()
  })

  it('renders service history section with completed count', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null, count: 12 }))
    renderWithProviders(<ClientRolePreferences userId={userId} />)

    const historyLabel = await screen.findByText(/settings\.clientPrefs\.serviceHistory\.completedServices/)
    expect(historyLabel).toBeInTheDocument()
    expect(historyLabel.textContent).toContain('"count":"12"')
  })

  it('fetches completed appointments count from supabase', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    expect(mockFrom).toHaveBeenCalledWith('appointments')
  })

  it('renders view history button', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    expect(screen.getByText('settings.clientPrefs.serviceHistory.viewHistory')).toBeInTheDocument()
  })

  it('renders save preferences button', () => {
    renderWithProviders(<ClientRolePreferences userId={userId} />)
    expect(screen.getByText('settings.clientPrefs.savePreferences')).toBeInTheDocument()
  })

  it('does not fetch when userId is empty', () => {
    renderWithProviders(<ClientRolePreferences userId="" />)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
