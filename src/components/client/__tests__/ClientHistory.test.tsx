import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import * as Sentry from '@sentry/react'
import { ClientHistory } from '../ClientHistory'
import { renderWithProviders } from '@/test-utils/render-with-providers'

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange }: { id?: string; checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}))

vi.mock('@/components/cards/AppointmentCard', () => ({
  AppointmentCard: ({ appointmentId, initialData, renderActions }: { appointmentId: string; initialData?: { title?: string; business?: { name?: string } | null }; renderActions?: () => React.ReactNode }) => (
    <div data-testid="appointment-card">
      <div>{appointmentId}</div>
      <div>{initialData?.title}</div>
      <div>{initialData?.business?.name}</div>
      {renderActions?.()}
    </div>
  ),
}))

type Appointment = React.ComponentProps<typeof ClientHistory>['appointments'][number]

const appointments: Appointment[] = [
  {
    id: 'apt-1',
    business_id: 'biz-a',
    location_id: 'loc-a',
    service_id: 'srv-a',
    user_id: 'user-1',
    client_id: 'client-1',
    title: 'Corte Basico',
    client_name: 'Cliente Uno',
    start_time: '2026-04-01T10:00:00',
    end_time: '2026-04-01T11:00:00',
    status: 'completed',
    price: 30000,
    currency: 'COP',
    created_at: '2026-03-20T10:00:00',
    updated_at: '2026-03-20T10:00:00',
    business: { id: 'biz-a', name: 'Salon Centro' },
    location: { id: 'loc-a', name: 'Sede Principal', address: 'Cra 1' },
    service: { id: 'srv-a', name: 'Corte Basico', price: 30000, currency: 'COP', category: 'Cabello' },
    employee: { id: 'emp-a', full_name: 'Ana Ruiz' },
  },
  {
    id: 'apt-2',
    business_id: 'biz-a',
    location_id: 'loc-b',
    service_id: 'srv-b',
    user_id: 'user-1',
    client_id: 'client-1',
    title: 'Masaje Relax',
    client_name: 'Cliente Uno',
    start_time: '2026-04-02T12:00:00',
    end_time: '2026-04-02T13:00:00',
    status: 'cancelled',
    price: 50000,
    currency: 'COP',
    created_at: '2026-03-21T10:00:00',
    updated_at: '2026-03-21T10:00:00',
    business: { id: 'biz-a', name: 'Salon Centro' },
    location: { id: 'loc-b', name: 'Sede Norte', address: 'Cra 2' },
    service: { id: 'srv-b', name: 'Masaje Relax', price: 50000, currency: 'COP', category: 'Spa' },
    employee: { id: 'emp-b', full_name: 'Bea Torres' },
  },
  {
    id: 'apt-3',
    business_id: 'biz-b',
    location_id: 'loc-c',
    service_id: 'srv-c',
    user_id: 'user-1',
    client_id: 'client-1',
    title: 'Diseno de Unas',
    client_name: 'Cliente Uno',
    start_time: '2026-04-03T09:00:00',
    end_time: '2026-04-03T10:00:00',
    status: 'no_show',
    price: 25000,
    currency: 'COP',
    created_at: '2026-03-22T10:00:00',
    updated_at: '2026-03-22T10:00:00',
    business: { id: 'biz-b', name: 'Spa del Sur' },
    location: { id: 'loc-c', name: 'Sede Sur', address: 'Cra 3' },
    service: { id: 'srv-c', name: 'Diseno de Unas', price: 25000, currency: 'COP', category: 'Unas' },
    employee: { id: 'emp-c', full_name: 'Carla Mesa' },
  },
  {
    id: 'apt-4',
    business_id: 'biz-b',
    location_id: 'loc-c',
    service_id: 'srv-d',
    user_id: 'user-1',
    client_id: 'client-1',
    title: 'Facial Premium',
    client_name: 'Cliente Uno',
    start_time: '2026-04-04T15:00:00',
    end_time: '2026-04-04T16:00:00',
    status: 'confirmed',
    price: 70000,
    currency: 'COP',
    created_at: '2026-03-23T10:00:00',
    updated_at: '2026-03-23T10:00:00',
    business: { id: 'biz-b', name: 'Spa del Sur' },
    location: { id: 'loc-c', name: 'Sede Sur', address: 'Cra 3' },
    service: { id: 'srv-d', name: 'Facial Premium', price: 70000, currency: 'COP', category: 'Spa' },
    employee: { id: 'emp-d', full_name: 'Diego Gil' },
  },
  {
    id: 'apt-5',
    business_id: 'biz-a',
    location_id: 'loc-a',
    service_id: 'srv-e',
    user_id: 'user-1',
    client_id: 'client-1',
    title: 'Corte Premium',
    client_name: 'Cliente Uno',
    start_time: '2026-04-05T11:00:00',
    end_time: '2026-04-05T12:00:00',
    status: 'completed',
    price: 75000,
    currency: 'COP',
    created_at: '2026-03-24T10:00:00',
    updated_at: '2026-03-24T10:00:00',
    business: { id: 'biz-a', name: 'Salon Centro' },
    location: { id: 'loc-a', name: 'Sede Principal', address: 'Cra 1' },
    service: { id: 'srv-e', name: 'Corte Premium', price: 75000, currency: 'COP', category: 'Cabello' },
    employee: { id: 'emp-a', full_name: 'Ana Ruiz' },
  },
  {
    id: 'apt-6',
    business_id: 'biz-b',
    location_id: 'loc-c',
    service_id: 'srv-f',
    user_id: 'user-1',
    client_id: 'client-1',
    title: 'Circuito Spa',
    client_name: 'Cliente Uno',
    start_time: '2026-04-06T14:00:00',
    end_time: '2026-04-06T15:00:00',
    status: 'scheduled',
    price: 90000,
    currency: 'COP',
    created_at: '2026-03-25T10:00:00',
    updated_at: '2026-03-25T10:00:00',
    business: { id: 'biz-b', name: 'Spa del Sur' },
    location: { id: 'loc-c', name: 'Sede Sur', address: 'Cra 3' },
    service: { id: 'srv-f', name: 'Circuito Spa', price: 90000, currency: 'COP', category: 'Spa' },
    employee: { id: 'emp-d', full_name: 'Diego Gil' },
  },
]

describe('ClientHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a loading spinner while loading data', () => {
    const { container } = renderWithProviders(
      <ClientHistory userId="user-1" appointments={[]} loading />,
    )

    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('renders stats and the first paginated appointment page', () => {
    const { container } = renderWithProviders(
      <ClientHistory userId="user-1" appointments={appointments} loading={false} />,
    )

    const statCards = Array.from(container.querySelectorAll('[data-slot="card"]')).slice(0, 5)

    expect(statCards[0]).toHaveTextContent('Total')
    expect(statCards[0]).toHaveTextContent('6')
    expect(statCards[1]).toHaveTextContent('Asistidas')
    expect(statCards[1]).toHaveTextContent('2')
    expect(statCards[2]).toHaveTextContent('Canceladas')
    expect(statCards[2]).toHaveTextContent('1')
    expect(statCards[3]).toHaveTextContent('Perdidas')
    expect(statCards[3]).toHaveTextContent('1')
    expect(statCards[4]).toHaveTextContent('Total Pagado')
    expect(statCards[4]).toHaveTextContent('105.000')
    expect(screen.getAllByTestId('appointment-card')).toHaveLength(5)
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('filters appointments by search term across business, service, employee or location', () => {
    renderWithProviders(
      <ClientHistory userId="user-1" appointments={appointments} loading={false} />,
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar por negocio, servicio, empleado o sede...'), {
      target: { value: 'Diego' },
    })

    expect(screen.getAllByTestId('appointment-card')).toHaveLength(2)
    expect(screen.getByText('apt-4')).toBeInTheDocument()
    expect(screen.getByText('apt-6')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 2 de 2 citas (6 total)')).toBeInTheDocument()
  })

  it('filters by business and location and allows clearing all filters', () => {
    renderWithProviders(
      <ClientHistory userId="user-1" appointments={appointments} loading={false} />,
    )

    expect(screen.queryByRole('button', { name: 'Sede' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Salon Centro'))

    expect(screen.getByRole('button', { name: 'Sede' })).toBeInTheDocument()
    expect(screen.getAllByTestId('appointment-card')).toHaveLength(3)

    fireEvent.click(screen.getByLabelText('Sede Norte'))
    expect(screen.getAllByTestId('appointment-card')).toHaveLength(1)
    expect(screen.getByText('apt-2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/i }))

    expect(screen.queryByRole('button', { name: 'Sede' })).not.toBeInTheDocument()
    expect(screen.getAllByTestId('appointment-card')).toHaveLength(5)
  })

  it('navigates between paginated result pages', () => {
    renderWithProviders(
      <ClientHistory userId="user-1" appointments={appointments} loading={false} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(screen.getAllByTestId('appointment-card')).toHaveLength(1)
    expect(screen.getByText('apt-6')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('shows the empty state when filters remove all appointments', () => {
    renderWithProviders(
      <ClientHistory userId="user-1" appointments={appointments} loading={false} />,
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar por negocio, servicio, empleado o sede...'), {
      target: { value: 'sin coincidencias' },
    })

    expect(screen.getByText('No se encontraron citas')).toBeInTheDocument()
    expect(screen.getByText('Intenta ajustar los filtros para ver más resultados')).toBeInTheDocument()
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })
})