import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())
const mockUseKV = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/contexts', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}))

vi.mock('@/lib/supabase', () => {
  const client = { from: mockFrom }
  return { supabase: client, default: client }
})

vi.mock('@/lib/useKV', () => ({
  useKV: (...args: any[]) => mockUseKV(...args),
}))

vi.mock('sonner', () => ({
  toast: { success: toastSuccess, error: toastError, info: vi.fn() },
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/components/appointments/AppointmentWizard', () => ({
  AppointmentWizard: ({ open, onClose }: any) =>
    open ? <div data-testid="wizard-open"><button onClick={onClose}>close-wiz</button></div> : null,
}))

vi.mock('@/components/cards/AppointmentCard', () => ({
  AppointmentCard: ({ appointmentId, initialData, children, renderActions }: any) => (
    <div data-testid={`apt-${appointmentId}`}>
      <span>{initialData?.title}</span>
      {renderActions && <div data-testid={`apt-actions-${appointmentId}`}>{renderActions(appointmentId)}</div>}
      {children}
    </div>
  ),
}))

import ClientDashboard from '../ClientDashboard'

const baseUser: any = {
  id: 'user-1',
  business_id: 'biz-1',
  full_name: 'John Doe',
  email: 'john@test.com',
}

const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()

const upcomingAppt: any = {
  id: 'apt-1',
  title: 'Corte de cabello',
  start_time: futureDate,
  end_time: futureDate,
  status: 'pending',
  location: 'Sede Centro',
  employee_name: 'Maria Lopez',
  price: 50000,
}

const pastAppt: any = {
  id: 'apt-2',
  title: 'Tinte',
  start_time: pastDate,
  end_time: pastDate,
  status: 'completed',
  location: 'Sede Norte',
  employee_name: 'Ana Garcia',
  price: 80000,
}

describe('ClientDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseKV.mockReturnValue([[], vi.fn()])
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: null }))
  })

  it('renders empty upcoming state and book button', () => {
    renderWithProviders(
      <ClientDashboard user={baseUser} appointments={[]} createAppointment={vi.fn()} refetch={vi.fn()} />
    )
    expect(screen.getByText('clientDashboard.noUpcoming')).toBeInTheDocument()
    expect(screen.getByText('clientDashboard.bookAppointment')).toBeInTheDocument()
  })

  it('opens AppointmentWizard when book button is clicked', async () => {
    renderWithProviders(
      <ClientDashboard user={baseUser} appointments={[]} createAppointment={vi.fn()} refetch={vi.fn()} />
    )
    await userEvent.click(screen.getByText('clientDashboard.bookAppointment'))
    expect(screen.getByTestId('wizard-open')).toBeInTheDocument()
  })

  it('renders upcoming appointments via AppointmentCard', () => {
    renderWithProviders(
      <ClientDashboard
        user={baseUser}
        appointments={[upcomingAppt]}
        createAppointment={vi.fn()}
        refetch={vi.fn()}
      />
    )
    expect(screen.getByTestId('apt-apt-1')).toBeInTheDocument()
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
  })

  it('renders past appointments table on desktop', () => {
    renderWithProviders(
      <ClientDashboard
        user={baseUser}
        appointments={[pastAppt]}
        createAppointment={vi.fn()}
        refetch={vi.fn()}
      />
    )
    expect(screen.getByText('clientDashboard.pastTitle')).toBeInTheDocument()
    expect(screen.getAllByText('Tinte').length).toBeGreaterThan(0)
  })

  it('calls supabase update + refetch when confirm button is clicked', async () => {
    const refetch = vi.fn()
    mockFrom.mockReturnValue(mockSupabaseChain({ data: null, error: null }))
    renderWithProviders(
      <ClientDashboard
        user={baseUser}
        appointments={[upcomingAppt]}
        createAppointment={vi.fn()}
        refetch={refetch}
      />
    )
    const confirmBtn = screen.getByTitle('clientDashboard.confirmButton')
    await userEvent.click(confirmBtn)
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(toastSuccess).toHaveBeenCalled()
      expect(refetch).toHaveBeenCalled()
    })
  })

  it('shows toast error when supabase update fails', async () => {
    mockFrom.mockReturnValueOnce(mockSupabaseChain({ data: null, error: { message: 'fail-update' } }))
    renderWithProviders(
      <ClientDashboard
        user={baseUser}
        appointments={[upcomingAppt]}
        createAppointment={vi.fn()}
        refetch={vi.fn()}
      />
    )
    await userEvent.click(screen.getByTitle('clientDashboard.confirmButton'))
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled()
    })
  })

  it('combines local appointments with server appointments and dedupes', () => {
    mockUseKV.mockReturnValue([[upcomingAppt], vi.fn()])
    renderWithProviders(
      <ClientDashboard
        user={baseUser}
        appointments={[upcomingAppt]}
        createAppointment={vi.fn()}
        refetch={vi.fn()}
      />
    )
    // Despite being in both lists, only one card is rendered
    expect(screen.getAllByTestId('apt-apt-1').length).toBe(1)
  })
})
