import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())
const mockNavigate = vi.hoisted(() => vi.fn())
const mockUseParams = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
  default: { from: mockFrom, rpc: mockRpc },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  }
})

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

import AppointmentConfirmation from '../../pages/AppointmentConfirmation'

const futureDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString()

function setupAppointment(data: unknown, error: { code?: string; message: string } | null = null) {
  mockFrom.mockImplementation(() =>
    mockSupabaseChain(
      error
        ? { data: null, error: error as { message: string } }
        : { data: data as never, error: null },
    ),
  )
}

const baseAppointmentData = {
  id: 'apt-1',
  appointment_date: '2026-05-10',
  appointment_time: '15:00:00',
  status: 'pending',
  confirmed: false,
  confirmation_deadline: futureDeadline,
  clients: { name: 'Ana Gomez', email: 'ana@example.com' },
  services: { name: 'Corte de Cabello' },
  businesses: { name: 'Negocio Demo' },
  locations: { address: 'Calle 10' },
}

describe('AppointmentConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ token: 'tok-1' })
    mockRpc.mockResolvedValue({ data: { ok: true }, error: null })
  })

  it('shows error when token missing', async () => {
    mockUseParams.mockReturnValue({ token: undefined })
    setupAppointment(null)
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(screen.getByText('Token de confirmación no válido')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    setupAppointment(null)
    renderWithProviders(<AppointmentConfirmation />)
    expect(screen.getByText('Cargando detalles de la cita...')).toBeInTheDocument()
  })

  it('shows specific error on PGRST116', async () => {
    setupAppointment(null, { code: 'PGRST116', message: 'no rows' })
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(
        screen.getByText('Esta cita ya ha sido confirmada o el token ha expirado'),
      ).toBeInTheDocument()
    })
  })

  it('shows error if confirmation_deadline already passed', async () => {
    setupAppointment({
      ...baseAppointmentData,
      confirmation_deadline: new Date(Date.now() - 3600 * 1000).toISOString(),
    })
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(
        screen.getByText('El tiempo para confirmar esta cita ha expirado'),
      ).toBeInTheDocument()
    })
  })

  it('renders appointment details', async () => {
    setupAppointment(baseAppointmentData)
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(screen.getByText('Ana Gomez')).toBeInTheDocument()
    })
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
    expect(screen.getByText('Negocio Demo')).toBeInTheDocument()
    expect(screen.getByText('Calle 10')).toBeInTheDocument()
    expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
  })

  it('calls RPC and shows success state on confirm click', async () => {
    setupAppointment(baseAppointmentData)
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(screen.getByText('Ana Gomez')).toBeInTheDocument()
    })
    const confirmBtn = screen.getAllByRole('button').find((b) => /confirmar/i.test(b.textContent ?? '') && !/cancelar/i.test(b.textContent ?? ''))
    await userEvent.click(confirmBtn!)
    await waitFor(() => {
      expect(screen.getByText('¡Cita Confirmada!')).toBeInTheDocument()
    })
    expect(mockRpc).toHaveBeenCalledWith('confirm_appointment_by_token', { p_token: 'tok-1' })
  })

  it('shows error message when RPC returns error', async () => {
    setupAppointment(baseAppointmentData)
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(screen.getByText('Ana Gomez')).toBeInTheDocument()
    })
    const confirmBtn = screen.getAllByRole('button').find((b) => /confirmar/i.test(b.textContent ?? '') && !/cancelar/i.test(b.textContent ?? ''))
    await userEvent.click(confirmBtn!)
    await waitFor(() => {
      expect(
        screen.getByText('Error al confirmar la cita. Por favor, inténtalo de nuevo.'),
      ).toBeInTheDocument()
    })
  })

  it('navigates home from success state', async () => {
    setupAppointment(baseAppointmentData)
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(screen.getByText('Ana Gomez')).toBeInTheDocument()
    })
    const confirmBtn = screen.getAllByRole('button').find((b) => /confirmar/i.test(b.textContent ?? '') && !/cancelar/i.test(b.textContent ?? ''))
    await userEvent.click(confirmBtn!)
    await waitFor(() => {
      expect(screen.getByText('¡Cita Confirmada!')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Ir al inicio'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('handles array-shaped joined responses', async () => {
    setupAppointment({
      ...baseAppointmentData,
      clients: [{ name: 'Pedro', email: 'p@e.com' }],
      services: [{ name: 'Servicio Array' }],
      businesses: [{ name: 'Biz Array' }],
      locations: [{ address: 'Dir Array' }],
    })
    renderWithProviders(<AppointmentConfirmation />)
    await waitFor(() => {
      expect(screen.getByText('Pedro')).toBeInTheDocument()
    })
    expect(screen.getByText('Servicio Array')).toBeInTheDocument()
    expect(screen.getByText('Biz Array')).toBeInTheDocument()
  })
})
