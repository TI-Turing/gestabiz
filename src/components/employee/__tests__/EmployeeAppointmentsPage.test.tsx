import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { EmployeeAppointmentsPage } from '../EmployeeAppointmentsPage'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  fromMock,
  refetchMock,
  appointmentsState,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  refetchMock: vi.fn(),
  appointmentsState: {
    appointments: [] as Array<Record<string, unknown>>,
    loading: false,
    error: null as Error | null,
  },
}))

vi.mock('@/hooks/useEmployeeAppointments', () => ({
  useEmployeeAppointments: () => ({
    appointments: appointmentsState.appointments,
    loading: appointmentsState.loading,
    error: appointmentsState.error,
    refetch: refetchMock,
  }),
}))

vi.mock('@/components/employee/EmployeeAppointmentsList', () => ({
  EmployeeAppointmentsList: ({ appointments }: { appointments: Array<{ id: string }> }) => (
    <div data-testid="appointments-list">{appointments.map((appointment) => appointment.id).join(',')}</div>
  ),
}))

vi.mock('@/components/admin/AppointmentsCalendar', () => ({
  AppointmentsCalendar: ({ businessId, employeeId }: { businessId: string; employeeId: string }) => (
    <div data-testid="appointments-calendar">Calendario {businessId} {employeeId}</div>
  ),
}))

vi.mock('@/components/ui/select', () => {
  const React = require('react') as typeof import('react')
  const SelectContext = React.createContext<{ onValueChange?: (value: string) => void }>({})

  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => {
      const value = React.useMemo(() => ({ onValueChange }), [onValueChange])
      return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>
    },
    SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <button type="button" className={className}>{children}</button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      const context = React.useContext(SelectContext)
      return (
        <button type="button" onClick={() => context.onValueChange?.(value)}>
          {children}
        </button>
      )
    },
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

function createThenableQuery<T>(result: { data: T; error: unknown }) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  }

  return query
}

function createPendingQuery() {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnValue(new Promise(() => {})),
  }

  return query
}

const servicesResponse = [
  { id: 'srv-1', name: 'Corte' },
  { id: 'srv-2', name: 'Facial' },
  { id: 'srv-3', name: 'Masaje' },
]

function createAppointmentIso(offsetDays: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  date.setUTCHours(15, 0, 0, 0)
  return date.toISOString()
}

function buildAppointments() {
  return [
    {
      id: 'apt-1',
      business_id: 'biz-1',
      service_id: 'srv-1',
      client_id: 'client-1',
      employee_id: 'emp-1',
      start_time: createAppointmentIso(0),
      end_time: createAppointmentIso(0),
      status: 'scheduled',
      client_name: 'Ana Lopez',
    },
    {
      id: 'apt-2',
      business_id: 'biz-1',
      service_id: 'srv-1',
      client_id: 'client-2',
      employee_id: 'emp-1',
      start_time: createAppointmentIso(-1),
      end_time: createAppointmentIso(-1),
      status: 'rescheduled',
      client_name: 'Bea Ramirez',
    },
    {
      id: 'apt-3',
      business_id: 'biz-1',
      service_id: 'srv-2',
      client_id: 'client-3',
      employee_id: 'emp-1',
      start_time: createAppointmentIso(-2),
      end_time: createAppointmentIso(-2),
      status: 'confirmed',
      client_name: 'Carlos Diaz',
    },
    {
      id: 'apt-4',
      business_id: 'biz-1',
      service_id: 'srv-2',
      client_id: 'client-4',
      employee_id: 'emp-1',
      start_time: createAppointmentIso(-3),
      end_time: createAppointmentIso(-3),
      status: 'in_progress',
      client_name: 'Diana Gomez',
    },
    {
      id: 'apt-5',
      business_id: 'biz-1',
      service_id: 'srv-3',
      client_id: 'client-5',
      employee_id: 'emp-1',
      start_time: createAppointmentIso(-4),
      end_time: createAppointmentIso(-4),
      status: 'completed',
      client_name: 'Elena Ruiz',
    },
    {
      id: 'apt-6',
      business_id: 'biz-1',
      service_id: 'srv-3',
      client_id: 'client-6',
      employee_id: 'emp-1',
      start_time: createAppointmentIso(-5),
      end_time: createAppointmentIso(-5),
      status: 'cancelled',
      client_name: 'Fabian Melo',
    },
  ]
}

describe('EmployeeAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appointmentsState.appointments = buildAppointments()
    appointmentsState.loading = false
    appointmentsState.error = null
    fromMock.mockImplementation((table: string) => {
      if (table === 'services') {
        return createThenableQuery({ data: servicesResponse, error: null })
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('renders the loading state while appointments are being fetched', () => {
    appointmentsState.loading = true
    fromMock.mockImplementation(() => createPendingQuery())

    const { container } = renderWithProviders(
      <EmployeeAppointmentsPage employeeId="emp-1" businessId="biz-1" />,
    )

    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('renders the error state and retries the query', () => {
    appointmentsState.error = new Error('fallo de red')
    fromMock.mockImplementation(() => createPendingQuery())

    renderWithProviders(
      <EmployeeAppointmentsPage employeeId="emp-1" businessId="biz-1" />,
    )

    expect(screen.getByText('Error al cargar las citas: fallo de red')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  it('renders the employee appointment stats and the default list view', async () => {
    const { container } = renderWithProviders(
      <EmployeeAppointmentsPage employeeId="emp-1" businessId="biz-1" />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('appointments-list')).toHaveTextContent('apt-1,apt-2,apt-3,apt-4,apt-5,apt-6')
    })

    const statCards = Array.from(container.querySelectorAll('[data-slot="card"]')).slice(0, 5)

    expect(screen.getByText('Mis Citas')).toBeInTheDocument()
    expect(statCards[0]).toHaveTextContent('1')
    expect(statCards[0]).toHaveTextContent('Citas Hoy')
    expect(statCards[1]).toHaveTextContent('2')
    expect(statCards[1]).toHaveTextContent('Programadas')
    expect(statCards[2]).toHaveTextContent('2')
    expect(statCards[2]).toHaveTextContent('Confirmadas')
    expect(statCards[3]).toHaveTextContent('1')
    expect(statCards[3]).toHaveTextContent('Completadas')
    expect(screen.getByText('6 citas encontradas')).toBeInTheDocument()
  })

  it('filters appointments by status, service and client search term, then clears the filters', async () => {
    renderWithProviders(
      <EmployeeAppointmentsPage employeeId="emp-1" businessId="biz-1" />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Programadas' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Corte' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Programadas' }))
    expect(screen.getByTestId('appointments-list')).toHaveTextContent('apt-1,apt-2')
    expect(screen.getByText('2 citas encontradas')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Corte' }))
    expect(screen.getByTestId('appointments-list')).toHaveTextContent('apt-1,apt-2')

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre de cliente...'), {
      target: { value: 'Bea' },
    })
    expect(screen.getByTestId('appointments-list')).toHaveTextContent('apt-2')
    expect(screen.getByText('1 cita encontrada')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))

    expect(screen.getByTestId('appointments-list')).toHaveTextContent('apt-1,apt-2,apt-3,apt-4,apt-5,apt-6')
    expect(screen.getByText('6 citas encontradas')).toBeInTheDocument()
  })

  it('switches to calendar mode and hides the list specific UI', async () => {
    renderWithProviders(
      <EmployeeAppointmentsPage employeeId="emp-1" businessId="biz-1" />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('appointments-list')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Calendario' }))

    expect(screen.getByTestId('appointments-calendar')).toHaveTextContent('Calendario biz-1 emp-1')
    expect(screen.queryByTestId('appointments-list')).not.toBeInTheDocument()
    expect(screen.queryByText('6 citas encontradas')).not.toBeInTheDocument()
  })
})