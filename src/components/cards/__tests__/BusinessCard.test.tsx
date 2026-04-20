import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { BusinessCard, type BusinessCardData } from '../BusinessCard'

/* ── Supabase mock ── */
function buildChain(resolved: { data: unknown; error: unknown }) {
  const self: Record<string, any> = {}
  const methods = ['select', 'eq', 'neq', 'in', 'order', 'limit', 'single', 'maybeSingle', 'is', 'gt', 'gte', 'lte', 'contains', 'update', 'delete', 'insert']
  for (const m of methods) self[m] = vi.fn().mockReturnValue(self)
  self.then = (resolve: (v: unknown) => void) => resolve(resolved)
  return self
}

let chainData: { data: unknown; error: unknown } = { data: null, error: null }
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => buildChain(chainData)),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
  },
}))

/* ── Fixture ── */
const mockBusiness: BusinessCardData = {
  id: 'biz-1',
  name: 'Salón Elegante',
  description: 'El mejor salón de belleza de Bogotá',
  logo_url: 'https://example.com/logo.png',
  banner_url: 'https://example.com/banner.png',
  category: 'Belleza',
  city: 'Bogotá',
  address: 'Calle 100 #15-20',
  average_rating: 4.5,
  total_reviews: 120,
  locations_count: 3,
}

describe('BusinessCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainData = { data: null, error: null }
  })

  // ── Loading state ──
  it('renders skeleton when no data available', () => {
    const { container } = renderWithProviders(
      <BusinessCard businessId="biz-1" />
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  // ── Default variant ──
  it('renders business name and category from initialData', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} readOnly />
    )
    expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    expect(screen.getByText('Belleza')).toBeInTheDocument()
  })

  it('renders rating stars and review count', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} readOnly />
    )
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText(/120/)).toBeInTheDocument()
  })

  it('renders city with MapPin', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} readOnly />
    )
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  it('renders description', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} readOnly />
    )
    expect(screen.getByText('El mejor salón de belleza de Bogotá')).toBeInTheDocument()
  })

  // ── Selection ──
  it('calls onSelect when clicked in non-readOnly mode', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} onSelect={handleSelect} />
    )
    await user.click(screen.getByText('Salón Elegante'))
    expect(handleSelect).toHaveBeenCalledWith(mockBusiness)
  })

  it('does NOT call onSelect in readOnly mode', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} onSelect={handleSelect} readOnly />
    )
    await user.click(screen.getByText('Salón Elegante'))
    expect(handleSelect).not.toHaveBeenCalled()
  })

  // ── isSelected ──
  it('shows check mark when isSelected', () => {
    const { container } = renderWithProviders(
      <BusinessCard initialData={mockBusiness} isSelected readOnly />
    )
    // isSelected adds primary border
    const card = container.firstElementChild as HTMLElement
    expect(card?.className).toContain('border-primary')
  })

  // ── isPreselected ──
  it('shows "Preseleccionado" badge when isPreselected', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} isPreselected readOnly />
    )
    expect(screen.getByText('Preseleccionado')).toBeInTheDocument()
  })

  // ── Compact variant ──
  it('renders compact variant with name and city', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} compact readOnly />
    )
    expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  // ── Panoramic variant ──
  it('renders panoramic variant with overlaid info', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} panoramic readOnly />
    )
    expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  // ── renderActions slot ──
  it('renders custom actions via renderActions', () => {
    renderWithProviders(
      <BusinessCard
        initialData={mockBusiness}
        readOnly
        renderActions={(id) => <button data-testid="custom-action">{id}</button>}
      />
    )
    expect(screen.getByTestId('custom-action')).toHaveTextContent('biz-1')
  })

  // ── Children slot ──
  it('renders children content in compact mode', () => {
    renderWithProviders(
      <BusinessCard initialData={mockBusiness} compact readOnly>
        <span data-testid="child">Extra</span>
      </BusinessCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  // ── No rating ──
  it('does not render rating section when average_rating is 0', () => {
    renderWithProviders(
      <BusinessCard initialData={{ ...mockBusiness, average_rating: 0, total_reviews: 0 }} readOnly />
    )
    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
  })

  // ── onViewProfile ──
  it('renders "Perfil del negocio" button when onViewProfile provided with services', () => {
    renderWithProviders(
      <BusinessCard
        initialData={mockBusiness}
        onViewProfile={vi.fn()}
        services={['Corte', 'Tinte']}
      />
    )
    expect(screen.getByText('Perfil del negocio')).toBeInTheDocument()
  })
})
