import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { EmployeeCard, type EmployeeCardData } from '../EmployeeCard'

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

/* ── Mock ProfileAvatar ── */
vi.mock('@/components/ui/ProfileAvatar', () => ({
  ProfileAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar" aria-label={alt} />,
}))

/* ── Fixture ── */
const mockEmployee: EmployeeCardData = {
  id: 'emp-1',
  full_name: 'María García',
  email: 'maria@salon.com',
  role: 'professional',
  avatar_url: 'https://example.com/avatar.jpg',
  average_rating: 4.8,
  total_reviews: 25,
  job_title: 'Estilista Senior',
  offers_services: true,
  services: [
    { service_id: 'svc-1', service_name: 'Corte', expertise_level: 5 },
    { service_id: 'svc-2', service_name: 'Tinte', expertise_level: 4 },
  ],
}

describe('EmployeeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainData = { data: null, error: null }
  })

  // ── Loading ──
  it('renders skeleton when no data available', () => {
    const { container } = renderWithProviders(
      <EmployeeCard employeeId="emp-1" />
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  // ── Default rendering ──
  it('renders employee name from initialData', () => {
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} readOnly />
    )
    expect(screen.getByText('María García')).toBeInTheDocument()
  })

  it('renders job title', () => {
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} readOnly />
    )
    expect(screen.getByText('Estilista Senior')).toBeInTheDocument()
  })

  it('renders "Ofrece servicios" badge', () => {
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} readOnly />
    )
    expect(screen.getByText('Ofrece servicios')).toBeInTheDocument()
  })

  it('renders services list with expertise level', () => {
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} readOnly />
    )
    expect(screen.getByText('Corte')).toBeInTheDocument()
    expect(screen.getByText('Tinte')).toBeInTheDocument()
  })

  it('renders rating', () => {
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} readOnly />
    )
    expect(screen.getByText('(4.8)')).toBeInTheDocument()
  })

  // ── Selection ──
  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} onSelect={handleSelect} />
    )
    await user.click(screen.getByText('María García'))
    expect(handleSelect).toHaveBeenCalledWith(mockEmployee)
  })

  it('does NOT call onSelect in readOnly mode', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} onSelect={handleSelect} readOnly />
    )
    await user.click(screen.getByText('María García'))
    expect(handleSelect).not.toHaveBeenCalled()
  })

  // ── isSelected ──
  it('applies selected styling when isSelected', () => {
    const { container } = renderWithProviders(
      <EmployeeCard employee={mockEmployee} isSelected readOnly />
    )
    const card = container.firstElementChild as HTMLElement
    expect(card?.className).toContain('border-primary')
  })

  // ── isPreselected ──
  it('shows "Preseleccionado" badge when isPreselected', () => {
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} isPreselected readOnly />
    )
    expect(screen.getByText('Preseleccionado')).toBeInTheDocument()
  })

  // ── isSelf ──
  it('shows "No puedes agendarte a ti mismo" overlay when isSelf', () => {
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} isSelf readOnly />
    )
    expect(screen.getByText('No puedes agendarte a ti mismo')).toBeInTheDocument()
  })

  it('does NOT call onSelect when isSelf', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} onSelect={handleSelect} isSelf />
    )
    await user.click(screen.getByText('María García'))
    expect(handleSelect).not.toHaveBeenCalled()
  })

  // ── Administrador badge ──
  it('shows "Administrador" badge for managers', () => {
    renderWithProviders(
      <EmployeeCard employee={{ ...mockEmployee, role: 'manager' }} readOnly />
    )
    expect(screen.getByText('Administrador')).toBeInTheDocument()
  })

  // ── renderActions ──
  it('renders custom actions via renderActions', () => {
    renderWithProviders(
      <EmployeeCard
        employee={mockEmployee}
        readOnly
        renderActions={(id) => <button data-testid="action">{id}</button>}
      />
    )
    expect(screen.getByTestId('action')).toHaveTextContent('emp-1')
  })

  // ── onViewProfile ──
  it('renders "Ver perfil" button when onViewProfile provided', async () => {
    const user = userEvent.setup()
    const handleViewProfile = vi.fn()
    renderWithProviders(
      <EmployeeCard employee={mockEmployee} onViewProfile={handleViewProfile} readOnly />
    )
    const btn = screen.getByText('Ver perfil')
    expect(btn).toBeInTheDocument()
    await user.click(btn)
    expect(handleViewProfile).toHaveBeenCalledWith('emp-1')
  })
})
