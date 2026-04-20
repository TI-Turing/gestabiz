import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const mockUseEmployeeBusinesses = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useEmployeeBusinesses', () => ({
  useEmployeeBusinesses: (...args: unknown[]) => mockUseEmployeeBusinesses(...args),
}))

vi.mock('@/components/cards/BusinessCard', () => ({
  BusinessCard: ({ business, isSelected, onSelect }: any) => (
    <button data-testid={`biz-card-${business.id}`} aria-pressed={isSelected} onClick={() => onSelect(business)}>
      {business.name}
    </button>
  ),
}))

import { EmployeeBusinessSelection } from '../wizard-steps/EmployeeBusinessSelection'

const baseProps = {
  employeeId: 'emp-1',
  employeeName: 'Pedro Pro',
  selectedBusinessId: null,
  onSelectBusiness: vi.fn(),
}

describe('EmployeeBusinessSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseEmployeeBusinesses.mockReturnValue({ businesses: [], loading: true, error: null, isEmployeeOfAnyBusiness: false })
    renderWithProviders(<EmployeeBusinessSelection {...baseProps} />)
    expect(screen.getByText('Verificando disponibilidad...')).toBeInTheDocument()
  })

  it('renders error state when hook returns error', () => {
    mockUseEmployeeBusinesses.mockReturnValue({ businesses: [], loading: false, error: 'fallo de red', isEmployeeOfAnyBusiness: false })
    renderWithProviders(<EmployeeBusinessSelection {...baseProps} />)
    expect(screen.getByText('fallo de red')).toBeInTheDocument()
  })

  it('shows unbookable warning when employee has no business', () => {
    mockUseEmployeeBusinesses.mockReturnValue({ businesses: [], loading: false, error: null, isEmployeeOfAnyBusiness: false })
    renderWithProviders(<EmployeeBusinessSelection {...baseProps} />)
    expect(screen.getByText(/no está disponible para reservas/i)).toBeInTheDocument()
  })

  it('auto-selects single business and renders confirmation', () => {
    const onSelectBusiness = vi.fn()
    const businesses = [{ id: 'b1', name: 'Mi Negocio', city: 'Bogotá' }]
    mockUseEmployeeBusinesses.mockReturnValue({ businesses, loading: false, error: null, isEmployeeOfAnyBusiness: true })
    renderWithProviders(<EmployeeBusinessSelection {...baseProps} onSelectBusiness={onSelectBusiness} />)
    expect(onSelectBusiness).toHaveBeenCalledWith(businesses[0])
    expect(screen.getByText('Reservando con Pedro Pro')).toBeInTheDocument()
    expect(screen.getByText(/Mi Negocio/)).toBeInTheDocument()
  })

  it('does not re-call onSelectBusiness when single business already selected', () => {
    const onSelectBusiness = vi.fn()
    const businesses = [{ id: 'b1', name: 'Mi Negocio' }]
    mockUseEmployeeBusinesses.mockReturnValue({ businesses, loading: false, error: null, isEmployeeOfAnyBusiness: true })
    renderWithProviders(
      <EmployeeBusinessSelection {...baseProps} selectedBusinessId="b1" onSelectBusiness={onSelectBusiness} />,
    )
    expect(onSelectBusiness).not.toHaveBeenCalled()
  })

  it('renders multi-business selector with both cards', async () => {
    const onSelectBusiness = vi.fn()
    const businesses = [
      { id: 'b1', name: 'Negocio Uno' },
      { id: 'b2', name: 'Negocio Dos' },
    ]
    mockUseEmployeeBusinesses.mockReturnValue({ businesses, loading: false, error: null, isEmployeeOfAnyBusiness: true })
    renderWithProviders(<EmployeeBusinessSelection {...baseProps} onSelectBusiness={onSelectBusiness} />)
    expect(screen.getByTestId('biz-card-b1')).toBeInTheDocument()
    expect(screen.getByTestId('biz-card-b2')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('biz-card-b2'))
    expect(onSelectBusiness).toHaveBeenCalledWith(businesses[1])
  })
})
