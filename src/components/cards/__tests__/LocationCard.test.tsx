import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { LocationCard } from '../LocationCard'
import type { Location } from '@/types/types'

/* ── Supabase mock ── */
function buildChain(resolved: { data: unknown; error: unknown }) {
  const self: Record<string, any> = {}
  const methods = ['select', 'eq', 'neq', 'in', 'order', 'limit', 'single', 'maybeSingle', 'is', 'gt', 'gte', 'lte', 'contains', 'update', 'delete', 'insert']
  for (const m of methods) self[m] = vi.fn().mockReturnValue(self)
  self.then = (resolve: (v: unknown) => void) => resolve(resolved)
  return self
}

let chainData: { data: unknown; error: unknown } = { data: null, error: null }
vi.mock('@/lib/supabase', () => { const __sb = {
    from: vi.fn(() => buildChain(chainData)),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
  }; return { supabase: __sb, default: __sb } })

/* ── Mock LocationAddress to avoid complex rendering ── */
vi.mock('@/components/ui/LocationAddress', () => ({
  LocationAddress: ({ address }: { address: string }) => <span data-testid="location-address">{address}</span>,
}))

/* ── Fixture ── */
const mockLocation: Location = {
  id: 'loc-1',
  business_id: 'biz-1',
  name: 'Sede Principal',
  address: 'Calle 100 #15-20',
  city: 'bogota',
  state: 'cundinamarca',
  country: 'CO',
  postal_code: '110111',
  phone: '+57 300 1234567',
  email: 'sede@salon.com',
  is_primary: true,
  is_active: true,
  opens_at: '08:00',
  closes_at: '20:00',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
} as Location

describe('LocationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainData = { data: null, error: null }
  })

  // ── Loading ──
  it('renders skeleton when no data available', () => {
    const { container } = renderWithProviders(
      <LocationCard locationId="loc-1" />
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  // ── Default variant ──
  it('renders location name from initialData', () => {
    renderWithProviders(
      <LocationCard initialData={mockLocation} readOnly />
    )
    expect(screen.getByText('Sede Principal')).toBeInTheDocument()
  })

  it('renders address', () => {
    renderWithProviders(
      <LocationCard initialData={mockLocation} readOnly />
    )
    expect(screen.getByTestId('location-address')).toHaveTextContent('Calle 100 #15-20')
  })

  it('renders phone number', () => {
    renderWithProviders(
      <LocationCard initialData={mockLocation} readOnly />
    )
    expect(screen.getByText('+57 300 1234567')).toBeInTheDocument()
  })

  // ── Selection ──
  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <LocationCard initialData={mockLocation} onSelect={handleSelect} />
    )
    await user.click(screen.getByText('Sede Principal'))
    expect(handleSelect).toHaveBeenCalledWith(mockLocation)
  })

  it('does NOT call onSelect in readOnly mode', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <LocationCard initialData={mockLocation} onSelect={handleSelect} readOnly />
    )
    await user.click(screen.getByText('Sede Principal'))
    expect(handleSelect).not.toHaveBeenCalled()
  })

  // ── isSelected ──
  it('applies selected styling when isSelected', () => {
    const { container } = renderWithProviders(
      <LocationCard initialData={mockLocation} isSelected readOnly />
    )
    const card = container.firstElementChild as HTMLElement
    expect(card?.className).toContain('border-primary')
  })

  // ── isPreselected ──
  it('shows "Preseleccionado" badge when isPreselected', () => {
    renderWithProviders(
      <LocationCard initialData={mockLocation} isPreselected readOnly />
    )
    expect(screen.getByText('Preseleccionado')).toBeInTheDocument()
  })

  // ── Compact variant ──
  it('renders compact variant with name and "Principal" badge', () => {
    renderWithProviders(
      <LocationCard initialData={mockLocation} compact readOnly />
    )
    expect(screen.getByText('Sede Principal')).toBeInTheDocument()
    expect(screen.getByText('Principal')).toBeInTheDocument()
  })

  it('renders phone and email in compact mode', () => {
    renderWithProviders(
      <LocationCard initialData={mockLocation} compact readOnly />
    )
    expect(screen.getByText('+57 300 1234567')).toBeInTheDocument()
    expect(screen.getByText('sede@salon.com')).toBeInTheDocument()
  })

  // ── renderActions ──
  it('renders custom actions via renderActions', () => {
    renderWithProviders(
      <LocationCard
        initialData={mockLocation}
        readOnly
        renderActions={(id) => <button data-testid="action">{id}</button>}
      />
    )
    expect(screen.getByTestId('action')).toHaveTextContent('loc-1')
  })

  // ── children in compact mode ──
  it('renders children content in compact mode', () => {
    renderWithProviders(
      <LocationCard initialData={mockLocation} compact readOnly>
        <span data-testid="child">Extra info</span>
      </LocationCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
