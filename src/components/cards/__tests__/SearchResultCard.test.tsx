import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { SearchResultCard, type SearchResultData } from '../SearchResultCard'
import { Building2 } from 'lucide-react'

/* ── Mock LocationAddress ── */
vi.mock('@/components/ui/LocationAddress', () => ({
  LocationAddress: ({ cityId }: { cityId: string }) => <span data-testid="city">{cityId}</span>,
}))

/* ── Fixture ── */
const mockResult: SearchResultData = {
  id: 'r-1',
  name: 'Salón Elegante',
  type: 'business',
  description: 'El mejor salón de belleza en Bogotá',
  rating: 4.5,
  reviewCount: 120,
  distance: 2.3,
  category: 'Belleza',
  price: 50000,
  currency: 'COP',
  business: { id: 'biz-1', name: 'Salón Corp' },
  location: { address: 'Calle 100', city: 'bogota' },
}

describe('SearchResultCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders result name', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} />
    )
    expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
  })

  it('renders description', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} />
    )
    expect(screen.getByText('El mejor salón de belleza en Bogotá')).toBeInTheDocument()
  })

  it('renders type badge', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} />
    )
    expect(screen.getByText('Negocio')).toBeInTheDocument()
  })

  it('renders rating with review count', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} reviewsLabel="reseñas" />
    )
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(120 reseñas)')).toBeInTheDocument()
  })

  it('renders distance in km', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} />
    )
    expect(screen.getByText('2.3 km')).toBeInTheDocument()
  })

  it('renders price formatted COP', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} />
    )
    expect(screen.getByText('$50.000 COP')).toBeInTheDocument()
  })

  it('renders category', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} />
    )
    expect(screen.getByText('Belleza')).toBeInTheDocument()
  })

  it('renders business name', () => {
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} />
    )
    expect(screen.getByText('Salón Corp')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    renderWithProviders(
      <SearchResultCard result={mockResult} typeLabel="Negocio" typeIcon={Building2} onClick={handleClick} />
    )
    await user.click(screen.getByText('Salón Elegante'))
    expect(handleClick).toHaveBeenCalled()
  })
})
