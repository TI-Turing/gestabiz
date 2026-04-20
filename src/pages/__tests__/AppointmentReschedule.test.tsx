import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())
const mockNavigate = vi.hoisted(() => vi.fn())
const mockUseParams = vi.hoisted(() => vi.fn())
const mockGetSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
  default: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
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

import AppointmentReschedule, { RESCHEDULE_STORAGE_KEY } from '../../pages/AppointmentReschedule'

function setupAppointment(data: unknown, error: { code?: string; message: string } | null = null) {
  mockFrom.mockImplementation(() =>
    mockSupabaseChain(
      error
        ? { data: null, error: error as { message: string } }
        : { data: data as never, error: null },
    ),
  )
}

describe('AppointmentReschedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ token: 'tok-1' })
    mockGetSession.mockResolvedValue({ data: { session: null } })
    sessionStorage.clear()
  })

  it('shows error when token is missing', async () => {
    mockUseParams.mockReturnValue({ token: undefined })
    setupAppointment(null)
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(screen.getByText('Enlace de reprogramación no válido')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    setupAppointment(null)
    renderWithProviders(<AppointmentReschedule />)
    expect(screen.getByText('Cargando detalles de la cita...')).toBeInTheDocument()
  })

  it('shows specific error when PGRST116', async () => {
    setupAppointment(null, { code: 'PGRST116', message: 'no rows' })
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(
        screen.getByText('Esta cita no existe, ya fue cancelada o ya no puede reprogramarse'),
      ).toBeInTheDocument()
    })
  })

  it('shows generic error on other supabase errors', async () => {
    setupAppointment(null, { code: 'OTHER', message: 'oops' })
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(screen.getByText('Error al cargar los detalles de la cita')).toBeInTheDocument()
    })
  })

  it('renders appointment details when fetch succeeds', async () => {
    setupAppointment({
      id: 'apt-1',
      start_time: '2026-05-10T15:00:00Z',
      status: 'confirmed',
      services: { name: 'Corte de Cabello' },
      businesses: { name: 'Negocio Demo' },
      locations: { name: 'Sede Centro', address: 'Calle 10 #5-20' },
    })
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
    })
    expect(screen.getByText('Negocio Demo')).toBeInTheDocument()
    expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    expect(screen.getByText('Calle 10 #5-20')).toBeInTheDocument()
  })

  it('handles array-shaped joined responses', async () => {
    setupAppointment({
      id: 'apt-1',
      start_time: '2026-05-10T15:00:00Z',
      status: 'pending',
      services: [{ name: 'Manicure' }],
      businesses: [{ name: 'Spa Test' }],
      locations: [{ name: 'Sede Norte', address: 'Carrera 7' }],
    })
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(screen.getByText('Manicure')).toBeInTheDocument()
    })
    expect(screen.getByText('Spa Test')).toBeInTheDocument()
  })

  it('navigates to login when no session on reschedule click', async () => {
    setupAppointment({
      id: 'apt-1',
      start_time: '2026-05-10T15:00:00Z',
      status: 'pending',
      services: { name: 'X' },
      businesses: { name: 'Y' },
      locations: { name: 'Z', address: 'W' },
    })
    mockGetSession.mockResolvedValue({ data: { session: null } })
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(screen.getByText('X')).toBeInTheDocument()
    })
    const button = screen.getAllByRole('button').find((b) => /reprogr/i.test(b.textContent ?? '')) ||
      screen.getAllByRole('button')[0]
    await userEvent.click(button!)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
    expect(sessionStorage.getItem(RESCHEDULE_STORAGE_KEY)).toBe('apt-1')
  })

  it('navigates to /app/client when authenticated session exists', async () => {
    setupAppointment({
      id: 'apt-2',
      start_time: '2026-05-10T15:00:00Z',
      status: 'pending',
      services: { name: 'X' },
      businesses: { name: 'Y' },
      locations: { name: 'Z', address: 'W' },
    })
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(screen.getByText('X')).toBeInTheDocument()
    })
    const button = screen.getAllByRole('button').find((b) => /reprogr/i.test(b.textContent ?? '')) ||
      screen.getAllByRole('button')[0]
    await userEvent.click(button!)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/client')
    })
    expect(sessionStorage.getItem(RESCHEDULE_STORAGE_KEY)).toBe('apt-2')
  })

  it('navigates home when error "Ir al inicio" clicked', async () => {
    setupAppointment(null, { code: 'PGRST116', message: 'no rows' })
    renderWithProviders(<AppointmentReschedule />)
    await waitFor(() => {
      expect(screen.getByText('No se puede reprogramar')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Ir al inicio'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
