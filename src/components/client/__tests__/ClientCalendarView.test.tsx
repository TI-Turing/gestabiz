import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { ClientCalendarView } from '../ClientCalendarView'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const { isMobileState } = vi.hoisted(() => ({
  isMobileState: { value: false },
}))

vi.mock('@/hooks', () => ({
  useIsMobile: () => isMobileState.value,
}))

vi.mock('@/components/cards/AppointmentCard', () => ({
  AppointmentCard: ({ appointmentId, onClick, initialData }: { appointmentId: string; onClick?: () => void; initialData?: { service?: { name?: string | null } | null } }) => (
    <button type="button" data-testid="appointment-card" onClick={onClick}>
      {appointmentId}:{initialData?.service?.name || 'sin-servicio'}
    </button>
  ),
}))

type AppointmentFixture = Parameters<typeof ClientCalendarView>[0]['appointments'][number]

const appointments: AppointmentFixture[] = [
  {
    id: 'apt-apr-15',
    business_id: 'biz-1',
    client_id: 'client-1',
    start_time: '2026-04-15T10:00:00',
    end_time: '2026-04-15T11:00:00',
    status: 'confirmed',
    business: { id: 'biz-1', name: 'Salon Norte' },
    service: { id: 'srv-1', name: 'Corte Clasico', duration: 60 },
  },
  {
    id: 'apt-apr-21',
    business_id: 'biz-1',
    client_id: 'client-1',
    start_time: '2026-04-21T12:00:00',
    end_time: '2026-04-21T13:00:00',
    status: 'completed',
    business: { id: 'biz-1', name: 'Salon Norte' },
    service: { id: 'srv-2', name: 'Masaje Express', duration: 60 },
  },
]

describe('ClientCalendarView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T08:00:00.000Z'))
    isMobileState.value = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the month view by default with current month title and appointment previews', () => {
    renderWithProviders(
      <ClientCalendarView appointments={appointments} />,
    )

    expect(screen.getByText(/abril/i)).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Dom')).toBeInTheDocument()
    expect(screen.getByText('Corte Clasico')).toBeInTheDocument()
    expect(screen.getByText('Masaje Express')).toBeInTheDocument()
  })

  it('calls onAppointmentClick when clicking a month appointment preview', () => {
    const onAppointmentClick = vi.fn()

    renderWithProviders(
      <ClientCalendarView appointments={appointments} onAppointmentClick={onAppointmentClick} />,
    )

    fireEvent.click(screen.getByText('Corte Clasico'))
    expect(onAppointmentClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'apt-apr-15' }))
  })

  it('navigates between months and returns to today', () => {
    renderWithProviders(
      <ClientCalendarView appointments={appointments} />,
    )

    fireEvent.click(screen.getAllByRole('button')[2])
    expect(screen.getByText(/mayo/i)).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button')[0])
    expect(screen.getByText(/abril/i)).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button')[2])
    expect(screen.getByText(/mayo/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(screen.getByText(/abril/i)).toBeInTheDocument()
  })

  it('switches from month view to day view when clicking a month appointment preview', () => {
    renderWithProviders(
      <ClientCalendarView appointments={appointments} />,
    )

    fireEvent.click(screen.getByText('Masaje Express'))

    expect(screen.getByTestId('appointment-card')).toBeInTheDocument()
    expect(screen.getByText('apt-apr-21:Masaje Express')).toBeInTheDocument()
  })

  it('creates a new appointment from week view using the add button', () => {
    const onCreateAppointment = vi.fn()

    renderWithProviders(
      <ClientCalendarView appointments={appointments} onCreateAppointment={onCreateAppointment} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Semana' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Agregar/i })[0])

    expect(onCreateAppointment).toHaveBeenCalledTimes(1)
    const [selectedDate] = onCreateAppointment.mock.calls[0]
    expect(selectedDate).toBeInstanceOf(Date)
    expect(selectedDate.getDate()).toBe(20)
  })

  it('creates a new appointment from an empty future day in mobile month view', () => {
    isMobileState.value = true
    const onCreateAppointment = vi.fn()

    renderWithProviders(
      <ClientCalendarView appointments={appointments} onCreateAppointment={onCreateAppointment} />,
    )

    fireEvent.click(screen.getByText('22'))

    expect(onCreateAppointment).toHaveBeenCalledTimes(1)
    const [selectedDate] = onCreateAppointment.mock.calls[0]
    expect(selectedDate).toBeInstanceOf(Date)
    expect(selectedDate.getDate()).toBe(22)
  })
})