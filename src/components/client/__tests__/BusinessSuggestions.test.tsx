import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BusinessSuggestions } from '../BusinessSuggestions'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import type { BusinessSuggestion } from '@/hooks/useClientDashboard'

/* ── mocks ──────────────────────────────────────────── */

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string, p?: Record<string, unknown>) => (p ? `${k}::${JSON.stringify(p)}` : k),
    language: 'es',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/components/cards/BusinessCard', () => ({
  BusinessCard: ({ businessId, onSelect, renderActions, children, className }: any) => (
    <div data-testid={`bcard-${businessId}`} className={className}>
      <button data-testid={`sel-${businessId}`} onClick={() => onSelect?.()}>sel</button>
      {renderActions && <div data-testid={`act-${businessId}`}>{renderActions(businessId)}</div>}
      {children}
    </div>
  ),
}))

/* ── fixtures ────────────────────────────────────────── */

const makeSuggestion = (overrides: Partial<BusinessSuggestion> = {}): BusinessSuggestion => ({
  id: 'biz-1',
  name: 'Salon A',
  description: 'Desc',
  logo_url: null,
  city: 'Bogotá',
  average_rating: 4.0,
  total_reviews: 5,
  isFrequent: false,
  visitsCount: 0,
  lastAppointmentDate: null,
  ...overrides,
} as BusinessSuggestion)

/* ── tests ────────────────────────────────────────────── */

describe('BusinessSuggestions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders loading skeleton when isLoading=true', () => {
    const { container } = renderWithProviders(
      <BusinessSuggestions
        suggestions={[]}
        isLoading={true}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(1)
  })

  it('renders empty state when no suggestions', () => {
    renderWithProviders(
      <BusinessSuggestions
        suggestions={[]}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    expect(screen.getByText(/No hay negocios recomendados/)).toBeInTheDocument()
  })

  it('renders title with city when preferredCityName provided', () => {
    renderWithProviders(
      <BusinessSuggestions
        suggestions={[makeSuggestion()]}
        isLoading={false}
        preferredCityName="Medellín"
        preferredRegionName={null}
      />,
    )
    expect(screen.getByText(/businessSuggestions\.titleWithCity.*Medellín/)).toBeInTheDocument()
  })

  it('renders frequent businesses section when present', () => {
    const suggestions = [
      makeSuggestion({ id: 'f1', isFrequent: true, visitsCount: 3 }),
    ]
    renderWithProviders(
      <BusinessSuggestions
        suggestions={suggestions}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    expect(screen.getByText('businessSuggestions.frequentTitle')).toBeInTheDocument()
    expect(screen.getByTestId('bcard-f1')).toBeInTheDocument()
  })

  it('renders visits badge for frequent businesses', () => {
    const suggestions = [
      makeSuggestion({ id: 'f1', isFrequent: true, visitsCount: 5 }),
    ]
    renderWithProviders(
      <BusinessSuggestions
        suggestions={suggestions}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    expect(screen.getByText(/businessSuggestions\.multiVisit/)).toBeInTheDocument()
  })

  it('renders recommended section collapsed by default', () => {
    const suggestions = [makeSuggestion({ id: 'r1', isFrequent: false })]
    renderWithProviders(
      <BusinessSuggestions
        suggestions={suggestions}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    expect(screen.getByText('businessSuggestions.recommendedTitle')).toBeInTheDocument()
    // Card should NOT be visible because recommended is collapsed by default
    expect(screen.queryByTestId('bcard-r1')).not.toBeInTheDocument()
  })

  it('expands recommended section on click', async () => {
    const user = userEvent.setup()
    const suggestions = [makeSuggestion({ id: 'r1', isFrequent: false })]
    renderWithProviders(
      <BusinessSuggestions
        suggestions={suggestions}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    // Click on recommended header to expand
    await user.click(screen.getByText('businessSuggestions.recommendedTitle'))
    expect(screen.getByTestId('bcard-r1')).toBeInTheDocument()
  })

  it('calls onBusinessSelect when card selected', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const suggestions = [makeSuggestion({ id: 'f1', isFrequent: true })]
    renderWithProviders(
      <BusinessSuggestions
        suggestions={suggestions}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
        onBusinessSelect={onSelect}
      />,
    )
    await user.click(screen.getByTestId('sel-f1'))
    expect(onSelect).toHaveBeenCalledWith('f1')
  })

  it('renders bookAgain button for frequent businesses', () => {
    const suggestions = [makeSuggestion({ id: 'f1', isFrequent: true })]
    renderWithProviders(
      <BusinessSuggestions
        suggestions={suggestions}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    expect(screen.getByText('businessSuggestions.bookAgain')).toBeInTheDocument()
  })

  it('collapses entire card when header clicked', async () => {
    const user = userEvent.setup()
    const suggestions = [makeSuggestion({ id: 'f1', isFrequent: true })]
    renderWithProviders(
      <BusinessSuggestions
        suggestions={suggestions}
        isLoading={false}
        preferredCityName={null}
        preferredRegionName={null}
      />,
    )
    expect(screen.getByTestId('bcard-f1')).toBeInTheDocument()
    // Click the card header to collapse
    await user.click(screen.getByText('businessSuggestions.title'))
    expect(screen.queryByTestId('bcard-f1')).not.toBeInTheDocument()
  })
})
