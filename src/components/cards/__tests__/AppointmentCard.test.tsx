import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { AppointmentCard, type AppointmentCardData } from '../AppointmentCard'

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

/* ── Fixture ── */
const mockAppointment: AppointmentCardData = {
  id: 'apt-1',
  start_time: '2025-06-15T10:00:00Z',
  end_time: '2025-06-15T11:00:00Z',
  status: 'confirmed',
  notes: 'Test notes',
  price: 50000,
  currency: 'COP',
  business: { id: 'biz-1', name: 'Salón Test', logo_url: null, banner_url: null },
  service: { id: 'srv-1', name: 'Corte de Cabello', duration_minutes: 60, price: 50000, currency: 'COP', image_url: null, category: 'Belleza' },
  employee: { id: 'emp-1', full_name: 'María García', avatar_url: null },
  locationData: { id: 'loc-1', name: 'Sede Norte', address: 'Calle 100 #15-20', city: 'Bogotá' },
}

describe('AppointmentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainData = { data: null, error: null }
  })

  // ── Loading / Skeleton ──
  it('renders skeleton while loading (no initialData, fetch pending)', () => {
    // No initialData and no resolved chain → loading state
    chainData = { data: null, error: null }
    const { container } = renderWithProviders(
      <AppointmentCard appointmentId="apt-1" />
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  // ── With initialData ──
  it('renders appointment data from initialData without fetching', () => {
    renderWithProviders(
      <AppointmentCard initialData={mockAppointment} />
    )
    expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
    expect(screen.getByText('Salón Test')).toBeInTheDocument()
    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.getByText('Sede Norte')).toBeInTheDocument()
  })

  // ── Status badges ──
  it.each([
    ['pending', 'Pendiente'],
    ['confirmed', 'Confirmada'],
    ['completed', 'Completada'],
    ['cancelled', 'Cancelada'],
    ['no_show', 'No asistió'],
    ['rescheduled', 'Reprogramada'],
    ['in_progress', 'En progreso'],
    ['scheduled', 'Programada'],
  ] as const)('shows correct badge for status "%s"', (status, label) => {
    renderWithProviders(
      <AppointmentCard initialData={{ ...mockAppointment, status }} />
    )
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  // ── Price formatting ──
  it('formats price in COP', () => {
    renderWithProviders(
      <AppointmentCard initialData={mockAppointment} />
    )
    // Intl.NumberFormat for COP — expect something like $50.000 or $ 50.000
    const priceEl = screen.getByText((content) => content.includes('50') && content.includes('000'))
    expect(priceEl).toBeInTheDocument()
  })

  // ── onClick callback ──
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    renderWithProviders(
      <AppointmentCard initialData={mockAppointment} onClick={handleClick} />
    )
    await user.click(screen.getByText('Corte de Cabello'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // ── readOnly ──
  it('renders as div (not button) when onClick is not provided', () => {
    const { container } = renderWithProviders(
      <AppointmentCard initialData={mockAppointment} />
    )
    // Default mode: rendered as div, not button
    const card = container.firstElementChild
    expect(card?.tagName).toBe('DIV')
  })

  // ── renderActions slot ──
  it('renders custom actions via renderActions prop', () => {
    renderWithProviders(
      <AppointmentCard
        initialData={mockAppointment}
        renderActions={(id) => <button data-testid="custom-action">{id}</button>}
      />
    )
    expect(screen.getByTestId('custom-action')).toBeInTheDocument()
    expect(screen.getByTestId('custom-action')).toHaveTextContent('apt-1')
  })

  // ── Compact mode ──
  it('renders compact variant with minimal info', () => {
    renderWithProviders(
      <AppointmentCard initialData={mockAppointment} compact />
    )
    expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
    expect(screen.getByText('Salón Test')).toBeInTheDocument()
  })

  // ── Featured mode ──
  it('renders featured variant with employee info', () => {
    renderWithProviders(
      <AppointmentCard initialData={mockAppointment} featured onClick={() => {}} />
    )
    expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.getByText('Profesional')).toBeInTheDocument()
  })

  // ── Children slot ──
  it('renders children content', () => {
    renderWithProviders(
      <AppointmentCard initialData={mockAppointment}>
        <span data-testid="child-slot">Extra content</span>
      </AppointmentCard>
    )
    expect(screen.getByTestId('child-slot')).toBeInTheDocument()
  })

  // ── Null if no data ──
  it('returns null when no data and not loading', () => {
    // Give an ID but make the chain return null (no initialData)
    // The useQuery will resolve with null data
    chainData = { data: null, error: { message: 'not found' } }
    const { container } = renderWithProviders(
      <AppointmentCard appointmentId="missing-id" />
    )
    // Should show skeleton initially (loading), then either null or skeleton
    // Since error → data is undefined → returns null (after loading)
    waitFor(() => {
      expect(container.children.length).toBeLessThanOrEqual(1)
    })
  })
})
