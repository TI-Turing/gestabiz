import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { ServiceCard, type ServiceCardData } from '../ServiceCard'

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
const mockService: ServiceCardData = {
  id: 'svc-1',
  name: 'Corte de Cabello',
  description: 'Corte profesional con estilista certificado',
  duration: 45,
  duration_minutes: 45,
  price: 35000,
  category: 'Cabello',
  image_url: 'https://example.com/corte.jpg',
  business_id: 'biz-1',
  business: { id: 'biz-1', name: 'Salón Elegante', logo_url: 'https://example.com/logo.png' },
}

describe('ServiceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainData = { data: null, error: null }
  })

  // ── Loading ──
  it('renders skeleton when no data available', () => {
    const { container } = renderWithProviders(
      <ServiceCard serviceId="svc-1" />
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  // ── Default variant ──
  it('renders service name from initialData', () => {
    renderWithProviders(
      <ServiceCard service={mockService} readOnly />
    )
    expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
  })

  it('renders description', () => {
    renderWithProviders(
      <ServiceCard service={mockService} readOnly />
    )
    expect(screen.getByText('Corte profesional con estilista certificado')).toBeInTheDocument()
  })

  it('renders formatted price in COP', () => {
    renderWithProviders(
      <ServiceCard service={mockService} readOnly />
    )
    expect(screen.getByText(/35/)).toBeInTheDocument()
  })

  it('renders business name', () => {
    renderWithProviders(
      <ServiceCard service={mockService} readOnly />
    )
    expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
  })

  // ── Selection ──
  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <ServiceCard service={mockService} onSelect={handleSelect} />
    )
    await user.click(screen.getByText('Corte de Cabello'))
    expect(handleSelect).toHaveBeenCalledWith(mockService)
  })

  it('does NOT call onSelect in readOnly mode', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <ServiceCard service={mockService} onSelect={handleSelect} readOnly />
    )
    await user.click(screen.getByText('Corte de Cabello'))
    expect(handleSelect).not.toHaveBeenCalled()
  })

  // ── isSelected ──
  it('adds selected styling when isSelected', () => {
    const { container } = renderWithProviders(
      <ServiceCard service={mockService} isSelected readOnly />
    )
    const card = container.firstElementChild as HTMLElement
    expect(card?.className).toContain('border-primary')
  })

  // ── isPreselected ──
  it('shows "Preseleccionado" badge when isPreselected', () => {
    renderWithProviders(
      <ServiceCard service={mockService} isPreselected readOnly />
    )
    expect(screen.getByText('Preseleccionado')).toBeInTheDocument()
  })

  // ── Compact variant ──
  it('renders compact variant with duration', () => {
    renderWithProviders(
      <ServiceCard service={mockService} compact readOnly />
    )
    expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })

  // ── renderActions ──
  it('renders custom actions via renderActions', () => {
    renderWithProviders(
      <ServiceCard
        service={mockService}
        readOnly
        renderActions={(id) => <button data-testid="action">{id}</button>}
      />
    )
    expect(screen.getByTestId('action')).toHaveTextContent('svc-1')
  })

  // ── onViewProfile ──
  it('renders "Ver perfil" button when onViewProfile provided', () => {
    renderWithProviders(
      <ServiceCard service={mockService} onViewProfile={vi.fn()} readOnly />
    )
    expect(screen.getByText('Ver perfil')).toBeInTheDocument()
  })

  // ── First letter placeholder when no image ──
  it('shows first letter of name when no image_url', () => {
    renderWithProviders(
      <ServiceCard service={{ ...mockService, image_url: undefined }} readOnly />
    )
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})
