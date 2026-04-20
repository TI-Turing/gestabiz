import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { EmployeeClientsPage } from '../EmployeeClientsPage'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (options: unknown) => useQueryMock(options),
  }
})

vi.mock('@/components/admin/ClientProfileModal', () => ({
  ClientProfileModal: ({ clientId, isOpen }: { clientId: string | null; isOpen: boolean }) => (
    isOpen ? <div data-testid="client-profile-modal">Modal {clientId}</div> : null
  ),
}))

vi.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: () => <div>Cargando spinner</div>,
}))

const clients = [
  {
    id: 'client-1',
    name: 'Ana Lopez',
    email: 'ana@correo.com',
    total: 4,
    completed: 3,
    lastVisit: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'client-2',
    name: 'Bruno Diaz',
    email: 'bruno@correo.com',
    total: 2,
    completed: 1,
    lastVisit: '2026-04-08T09:00:00.000Z',
  },
]

describe('EmployeeClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQueryMock.mockReturnValue({
      data: clients,
      isLoading: false,
    })
  })

  it('renders the loading state while the employee client query is pending', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: true,
    })

    renderWithProviders(
      <EmployeeClientsPage employeeId="emp-1" businessId="biz-1" />,
    )

    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(screen.getByText('Cargando spinner')).toBeInTheDocument()
  })

  it('renders the employee client cards and filters them by search term', () => {
    renderWithProviders(
      <EmployeeClientsPage employeeId="emp-1" businessId="biz-1" />,
    )

    expect(screen.getByText('Mis Clientes')).toBeInTheDocument()
    expect(screen.getByText('2 clientes atendidos')).toBeInTheDocument()
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('Bruno Diaz')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o correo...'), {
      target: { value: 'bruno' },
    })

    expect(screen.queryByText('Ana Lopez')).not.toBeInTheDocument()
    expect(screen.getByText('Bruno Diaz')).toBeInTheDocument()
  })

  it('shows the proper empty states for no clients and for empty search results', () => {
    const { rerender } = renderWithProviders(
      <EmployeeClientsPage employeeId="emp-1" businessId="biz-1" />,
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o correo...'), {
      target: { value: 'zzz' },
    })

    expect(screen.getByText('No se encontraron clientes')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o correo...'), {
      target: { value: '' },
    })

    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    })

    rerender(<EmployeeClientsPage employeeId="emp-1" businessId="biz-1" />)

    expect(screen.getByText('Aún no tienes clientes atendidos')).toBeInTheDocument()
  })

  it('opens the shared client profile modal when a client card is clicked', () => {
    renderWithProviders(
      <EmployeeClientsPage employeeId="emp-1" businessId="biz-1" />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Ana Lopez/i }))

    expect(screen.getByTestId('client-profile-modal')).toHaveTextContent('Modal client-1')
  })
})