import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FavoritesList from '../FavoritesList'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import type { FavoriteBusiness } from '@/hooks/useFavorites'

/* ── mocks ──────────────────────────────────────────── */

const mockToggleFavorite = vi.fn().mockResolvedValue(false)

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({ toggleFavorite: mockToggleFavorite }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, loading: false }),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string) => k,
    language: 'es',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Stub BusinessCard to render something inspectable
vi.mock('@/components/cards/BusinessCard', () => ({
  BusinessCard: ({ businessId, onSelect, renderActions, children }: any) => (
    <div data-testid={`business-card-${businessId}`}>
      <button data-testid={`select-${businessId}`} onClick={() => onSelect?.()}>select</button>
      {renderActions && <div data-testid={`actions-${businessId}`}>{renderActions(businessId)}</div>}
      {children}
    </div>
  ),
}))

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

/* ── fixtures ────────────────────────────────────────── */

const makeFav = (overrides: Partial<FavoriteBusiness> = {}): FavoriteBusiness => ({
  id: 'biz-1',
  name: 'Salon A',
  description: 'Desc A',
  logo_url: null,
  banner_url: null,
  city: 'Bogotá',
  average_rating: 4.5,
  review_count: 10,
  ...overrides,
})

/* ── tests ────────────────────────────────────────────── */

describe('FavoritesList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders loading state with spinner text', () => {
    renderWithProviders(<FavoritesList favorites={[]} loading={true} />)
    expect(screen.getByText('favoritesList.loading')).toBeInTheDocument()
  })

  it('renders empty state when no favorites', () => {
    renderWithProviders(<FavoritesList favorites={[]} loading={false} />)
    expect(screen.getByText('favoritesList.emptyTitle')).toBeInTheDocument()
    expect(screen.getByText('favoritesList.emptyDescription')).toBeInTheDocument()
  })

  it('renders favorites grid with business cards', () => {
    const favs = [makeFav({ id: 'b1' }), makeFav({ id: 'b2', name: 'Salon B' })]
    renderWithProviders(<FavoritesList favorites={favs} loading={false} />)
    expect(screen.getByTestId('business-card-b1')).toBeInTheDocument()
    expect(screen.getByTestId('business-card-b2')).toBeInTheDocument()
  })

  it('shows favorites count in header', () => {
    const favs = [makeFav({ id: 'b1' }), makeFav({ id: 'b2' })]
    renderWithProviders(<FavoritesList favorites={favs} loading={false} />)
    expect(screen.getByText('favoritesList.myFavorites')).toBeInTheDocument()
    // "2 favoritesList.businessesMarked" since length !== 1
    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it('calls onViewProfile when card is selected', async () => {
    const user = userEvent.setup()
    const onViewProfile = vi.fn()
    renderWithProviders(
      <FavoritesList favorites={[makeFav({ id: 'b1' })]} loading={false} onViewProfile={onViewProfile} />,
    )
    await user.click(screen.getByTestId('select-b1'))
    expect(onViewProfile).toHaveBeenCalledWith('b1')
  })

  it('calls toggleFavorite when remove heart button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <FavoritesList favorites={[makeFav({ id: 'b1' })]} loading={false} />,
    )
    // The heart button is rendered inside renderActions
    const actionsContainer = screen.getByTestId('actions-b1')
    const heartBtn = actionsContainer.querySelector('button')!
    await user.click(heartBtn)
    expect(mockToggleFavorite).toHaveBeenCalledWith('b1')
  })

  it('renders book button inside each card', () => {
    renderWithProviders(
      <FavoritesList favorites={[makeFav({ id: 'b1' })]} loading={false} />,
    )
    expect(screen.getByText('favoritesList.bookButton')).toBeInTheDocument()
  })

  it('renders tip text in description', () => {
    renderWithProviders(
      <FavoritesList favorites={[makeFav({ id: 'b1' })]} loading={false} />,
    )
    // tipDescription appears in both the count paragraph and the tip section
    expect(screen.getAllByText(/favoritesList\.tipDescription/).length).toBeGreaterThanOrEqual(2)
  })

  it('shows singular label for 1 favorite', () => {
    renderWithProviders(
      <FavoritesList favorites={[makeFav({ id: 'b1' })]} loading={false} />,
    )
    // The count text is inside a single <p>: "1 favoritesList.businessMarked favoritesList.tipDescription"
    expect(screen.getByText(/favoritesList\.businessMarked/)).toBeInTheDocument()
    expect(screen.queryByText(/favoritesList\.businessesMarked/)).not.toBeInTheDocument()
  })

  it('renders removeFavorite title attribute on heart button', () => {
    renderWithProviders(
      <FavoritesList favorites={[makeFav({ id: 'b1' })]} loading={false} />,
    )
    const actionsContainer = screen.getByTestId('actions-b1')
    const heartBtn = actionsContainer.querySelector('button')!
    expect(heartBtn).toHaveAttribute('title', 'favoritesList.removeFavorite')
  })
})
