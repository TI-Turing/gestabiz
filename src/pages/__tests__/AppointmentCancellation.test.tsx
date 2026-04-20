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

import AppointmentCancellation from '../../pages/AppointmentCancellation'

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
  status: 'confirmed',
  confirmed: true,
  confirmation_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  clients: { name: 'Maria Lopez', email: 'maria@example.com' },
  services: { name: 'Manicure' },
  businesses: { name: 'Spa Demo' },
  locations: { address: 'Avenida 5' },
}

describe('AppointmentCancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ token: 'tok-c' })
    mockRpc.mockResolvedValue({ data: { ok: true }, error: null })
  })

  it('shows error when token missing', async () => {
    mockUseParams.mockReturnValue({ token: undefined })
    setupAppointment(null)
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Token de cancelación no válido')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    setupAppointment(null)
    renderWithProviders(<AppointmentCancellation />)
    expect(screen.getByText('Cargando detalles de la cita...')).toBeInTheDocument()
  })

  it('shows specific error on PGRST116', async () => {
    setupAppointment(null, { code: 'PGRST116', message: 'no rows' })
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Esta cita no existe o ya ha sido cancelada')).toBeInTheDocument()
    })
  })

  it('renders appointment details and current status', async () => {
    setupAppointment(baseAppointmentData)
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    })
    expect(screen.getByText('maria@example.com')).toBeInTheDocument()
    expect(screen.getByText('Spa Demo')).toBeInTheDocument()
    expect(screen.getByText('Avenida 5')).toBeInTheDocument()
    expect(screen.getByText('Manicure')).toBeInTheDocument()
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
    expect(screen.getByText(/Confirmación del cliente: Sí/)).toBeInTheDocument()
  })

  it('shows "Pendiente" status when not confirmed', async () => {
    setupAppointment({ ...baseAppointmentData, status: 'pending', confirmed: false })
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    })
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText(/Confirmación del cliente: No/)).toBeInTheDocument()
  })

  it('cancels appointment with default reason when no reason provided', async () => {
    setupAppointment(baseAppointmentData)
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    })
    const cancelBtn = screen.getAllByRole('button').find((b) => /^cancelar/i.test((b.textContent ?? '').trim()))
    await userEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(screen.getByText('Cita Cancelada')).toBeInTheDocument()
    })
    expect(mockRpc).toHaveBeenCalledWith('cancel_appointment_by_token', {
      p_token: 'tok-c',
      p_reason: 'Cancelado por el cliente',
    })
  })

  it('passes user-provided reason to RPC', async () => {
    setupAppointment(baseAppointmentData)
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    })
    const reasonInput = screen.getByLabelText(/razón de cancelación/i)
    await userEvent.type(reasonInput, 'Conflicto de agenda')
    const cancelBtn = screen.getAllByRole('button').find((b) => /^cancelar/i.test((b.textContent ?? '').trim()))
    await userEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('cancel_appointment_by_token', {
        p_token: 'tok-c',
        p_reason: 'Conflicto de agenda',
      })
    })
  })

  it('shows error when RPC fails', async () => {
    setupAppointment(baseAppointmentData)
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    })
    const cancelBtn = screen.getAllByRole('button').find((b) => /^cancelar/i.test((b.textContent ?? '').trim()))
    await userEvent.click(cancelBtn!)
    await waitFor(() => {
      expect(
        screen.getByText('Error al cancelar la cita. Por favor, inténtalo de nuevo.'),
      ).toBeInTheDocument()
    })
  })

  it('redirects to confirmation page when "Confirmar en su lugar" clicked', async () => {
    setupAppointment(baseAppointmentData)
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Confirmar en su lugar'))
    expect(mockNavigate).toHaveBeenCalledWith('/confirmar-cita/tok-c')
  })

  it('handles array-shaped joined responses', async () => {
    setupAppointment({
      ...baseAppointmentData,
      clients: [{ name: 'Carlos Ruiz', email: 'c@e.com' }],
      services: [{ name: 'Pedicure' }],
      businesses: [{ name: 'Beauty Place' }],
      locations: [{ address: 'Calle 50' }],
    })
    renderWithProviders(<AppointmentCancellation />)
    await waitFor(() => {
      expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument()
    })
    expect(screen.getByText('Beauty Place')).toBeInTheDocument()
  })
})
