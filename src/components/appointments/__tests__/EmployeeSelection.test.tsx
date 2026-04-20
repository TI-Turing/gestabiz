import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const mockUseAuth = vi.hoisted(() => vi.fn())
const mockUseWizardEmployees = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/hooks/useWizardEmployees', () => ({
  useWizardEmployees: (...args: unknown[]) => mockUseWizardEmployees(...args),
}))

vi.mock('sonner', () => ({
  toast: { error: mockToastError, success: vi.fn(), info: vi.fn() },
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/components/cards/EmployeeCard', () => ({
  EmployeeCard: ({ employeeId, initialData, onSelect, isSelf }: any) => (
    <button
      data-testid={`emp-card-${employeeId}`}
      data-self={isSelf ? 'true' : 'false'}
      onClick={() => onSelect(initialData)}
    >
      {initialData.full_name || initialData.email}
    </button>
  ),
}))

vi.mock('@/components/user/UserProfile', () => ({
  default: () => null,
}))

import { EmployeeSelection } from '../wizard-steps/EmployeeSelection'

const baseProps = {
  businessId: 'biz-1',
  locationId: 'loc-1',
  serviceId: 'svc-1',
  selectedEmployeeId: null,
  onSelectEmployee: vi.fn(),
}

const empReady = {
  id: 'emp-1',
  email: 'pedro@test.com',
  full_name: 'Pedro Pro',
  role: 'professional',
  avatar_url: null,
  expertise_level: 3,
  setup_completed: true,
  supervisor_name: 'Boss',
  avg_rating: 4.5,
  total_reviews: 10,
}
const empNotReady = { ...empReady, id: 'emp-2', email: 'x@x.com', full_name: 'Sin Setup', setup_completed: false, supervisor_name: 'No asignado', role: 'professional' }
const managerWithoutSetup = { ...empReady, id: 'emp-3', email: 'm@m.com', full_name: 'Mgr Sin Setup', setup_completed: false, supervisor_name: 'Boss', role: 'manager' }

describe('EmployeeSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { id: 'current-user' } })
  })

  it('renders loading state', () => {
    mockUseWizardEmployees.mockReturnValue({ employees: null, isLoading: true, error: null })
    renderWithProviders(<EmployeeSelection {...baseProps} />)
    expect(screen.getByText('Cargando profesionales...')).toBeInTheDocument()
  })

  it('renders empty state when filter excludes all', () => {
    mockUseWizardEmployees.mockReturnValue({ employees: [empNotReady], isLoading: false, error: null })
    renderWithProviders(<EmployeeSelection {...baseProps} />)
    expect(screen.getByText(/No hay profesionales disponibles/)).toBeInTheDocument()
  })

  it('shows toast.error when hook returns error', () => {
    mockUseWizardEmployees.mockReturnValue({ employees: [], isLoading: false, error: 'fallo rpc' })
    renderWithProviders(<EmployeeSelection {...baseProps} />)
    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('fallo rpc'))
  })

  it('renders bookable employees (setup_completed=true) and lets parent select them', async () => {
    const onSelectEmployee = vi.fn()
    mockUseWizardEmployees.mockReturnValue({ employees: [empReady], isLoading: false, error: null })
    renderWithProviders(<EmployeeSelection {...baseProps} onSelectEmployee={onSelectEmployee} />)
    await waitFor(() => expect(screen.getByTestId('emp-card-emp-1')).toBeInTheDocument())
    await userEvent.click(screen.getByTestId('emp-card-emp-1'))
    expect(onSelectEmployee).toHaveBeenCalled()
  })

  it('blocks self-selection with toast.error', async () => {
    const onSelectEmployee = vi.fn()
    mockUseAuth.mockReturnValue({ user: { id: 'emp-1' } })
    mockUseWizardEmployees.mockReturnValue({ employees: [empReady], isLoading: false, error: null })
    renderWithProviders(<EmployeeSelection {...baseProps} onSelectEmployee={onSelectEmployee} />)
    await waitFor(() => expect(screen.getByTestId('emp-card-emp-1')).toBeInTheDocument())
    expect(screen.getByTestId('emp-card-emp-1').getAttribute('data-self')).toBe('true')
    await userEvent.click(screen.getByTestId('emp-card-emp-1'))
    expect(onSelectEmployee).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('No puedes agendarte una cita a ti mismo')
  })

  it('grandfathers managers without setup_completed but with supervisor', () => {
    mockUseWizardEmployees.mockReturnValue({ employees: [managerWithoutSetup], isLoading: false, error: null })
    renderWithProviders(<EmployeeSelection {...baseProps} />)
    expect(screen.getByTestId('emp-card-emp-3')).toBeInTheDocument()
  })
})
