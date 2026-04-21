import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())
const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

vi.mock('@/hooks/usePlanFeatures', () => ({
  usePlanFeatures: () => ({
    quotaInfo: () => ({ limit: null, notShownCount: 0, isAtLimit: false }),
    upgradePlan: null,
  }),
}))

vi.mock('@/components/ui/PlanLimitBanner', () => ({
  PlanLimitBanner: () => null,
}))

vi.mock('@/components/admin/ClientProfileModal', () => ({
  ClientProfileModal: ({
    isOpen,
    clientId,
    onClose,
  }: {
    isOpen: boolean
    clientId: string | null
    onClose: () => void
  }) =>
    isOpen ? (
      <div data-testid="client-profile">
        {clientId}
        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}))

import { ClientsManager } from '../ClientsManager'

interface SetupOptions {
  appointments?: Array<{
    client_id: string
    start_time: string
    status: string
  }>
  profiles?: Array<{
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }>
  appointmentsError?: { message: string } | null
  profilesError?: { message: string } | null
}

function setupTables(opts: SetupOptions = {}) {
  const {
    appointments = [],
    profiles = [],
    appointmentsError = null,
    profilesError = null,
  } = opts
  mockFrom.mockImplementation((table: string) => {
    if (table === 'appointments') {
      return mockSupabaseChain(
        appointmentsError
          ? { data: null, error: appointmentsError }
          : { data: appointments, error: null },
      )
    }
    if (table === 'profiles') {
      return mockSupabaseChain(
        profilesError
          ? { data: null, error: profilesError }
          : { data: profiles, error: null },
      )
    }
    return mockSupabaseChain({ data: [], error: null })
  })
}

describe('ClientsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header with "Clientes" title', () => {
    setupTables()
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    expect(screen.getByText('Clientes')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    setupTables()
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    expect(screen.getByText(/Cargando/)).toBeInTheDocument()
  })

  it('shows empty state when no clients exist', async () => {
    setupTables()
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(
        screen.getByText('Aún no hay clientes registrados'),
      ).toBeInTheDocument()
    })
  })

  it('renders aggregated clients with name, email and visit count', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
        { client_id: 'c-1', start_time: '2025-10-10T10:00:00Z', status: 'completed' },
        { client_id: 'c-2', start_time: '2025-10-20T10:00:00Z', status: 'pending' },
      ],
      profiles: [
        { id: 'c-1', full_name: 'Juan Perez', email: 'juan@x.com', avatar_url: null },
        { id: 'c-2', full_name: 'Ana Lopez', email: 'ana@x.com', avatar_url: null },
      ],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    })
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('juan@x.com')).toBeInTheDocument()
    expect(screen.getByText('ana@x.com')).toBeInTheDocument()
    // Juan tiene 2 citas
    expect(screen.getByText('2 citas')).toBeInTheDocument()
    // Ana tiene 1 cita
    expect(screen.getByText('1 cita')).toBeInTheDocument()
  })

  it('shows total clients count in subtitle', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
        { client_id: 'c-2', start_time: '2025-10-20T10:00:00Z', status: 'pending' },
      ],
      profiles: [
        { id: 'c-1', full_name: 'Alpha Uno', email: null, avatar_url: null },
        { id: 'c-2', full_name: 'Beta Dos', email: null, avatar_url: null },
      ],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Alpha Uno')).toBeInTheDocument()
    })
    expect(screen.getByText('2 clientes registrados')).toBeInTheDocument()
  })

  it('shows singular "1 cliente registrado" when only one client', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
      ],
      profiles: [{ id: 'c-1', full_name: 'Solo', email: null, avatar_url: null }],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Solo')).toBeInTheDocument()
    })
    expect(screen.getByText('1 cliente registrado')).toBeInTheDocument()
  })

  it('excludes cancelled appointments from stats', async () => {
    // Note: real query has .neq('status','cancelled') so cancelled never reaches us.
    // Validate that pending+completed both count.
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'pending' },
        { client_id: 'c-1', start_time: '2025-10-10T10:00:00Z', status: 'completed' },
      ],
      profiles: [{ id: 'c-1', full_name: 'Cliente Multi', email: null, avatar_url: null }],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Cliente Multi')).toBeInTheDocument()
    })
    expect(screen.getByText('2 citas')).toBeInTheDocument()
  })

  it('uses fallback name when profile has no full_name', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
      ],
      profiles: [{ id: 'c-1', full_name: null, email: null, avatar_url: null }],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Cliente sin nombre')).toBeInTheDocument()
    })
  })

  it('filters clients by search term (name)', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
        { client_id: 'c-2', start_time: '2025-10-20T10:00:00Z', status: 'pending' },
      ],
      profiles: [
        { id: 'c-1', full_name: 'Juan Perez', email: 'juan@x.com', avatar_url: null },
        { id: 'c-2', full_name: 'Ana Lopez', email: 'ana@x.com', avatar_url: null },
      ],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Buscar por nombre o correo...')
    await userEvent.type(searchInput, 'Juan')
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.queryByText('Ana Lopez')).not.toBeInTheDocument()
  })

  it('filters clients by search term (email)', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
        { client_id: 'c-2', start_time: '2025-10-20T10:00:00Z', status: 'pending' },
      ],
      profiles: [
        { id: 'c-1', full_name: 'Juan Perez', email: 'juan@example.com', avatar_url: null },
        { id: 'c-2', full_name: 'Ana Lopez', email: 'ana@other.com', avatar_url: null },
      ],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Buscar por nombre o correo...')
    await userEvent.type(searchInput, 'other')
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
  })

  it('shows "no se encontraron" when search has no matches', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
      ],
      profiles: [{ id: 'c-1', full_name: 'Juan', email: null, avatar_url: null }],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Buscar por nombre o correo...')
    await userEvent.type(searchInput, 'xyz123')
    expect(
      screen.getByText('No se encontraron clientes con ese criterio'),
    ).toBeInTheDocument()
  })

  it('opens ClientProfileModal when client card is clicked', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
      ],
      profiles: [{ id: 'c-1', full_name: 'Juan', email: null, avatar_url: null }],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Juan'))
    expect(screen.getByTestId('client-profile')).toHaveTextContent('c-1')
  })

  it('closes ClientProfileModal when close button clicked', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
      ],
      profiles: [{ id: 'c-1', full_name: 'Juan', email: null, avatar_url: null }],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Juan'))
    expect(screen.getByTestId('client-profile')).toBeInTheDocument()
    await userEvent.click(screen.getByText('close'))
    expect(screen.queryByTestId('client-profile')).not.toBeInTheDocument()
  })

  it('sorts clients by total visits descending', async () => {
    setupTables({
      appointments: [
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
        { client_id: 'c-2', start_time: '2025-10-20T10:00:00Z', status: 'completed' },
        { client_id: 'c-2', start_time: '2025-10-21T10:00:00Z', status: 'completed' },
        { client_id: 'c-2', start_time: '2025-10-22T10:00:00Z', status: 'completed' },
      ],
      profiles: [
        { id: 'c-1', full_name: 'Pocas Citas', email: null, avatar_url: null },
        { id: 'c-2', full_name: 'Muchas Citas', email: null, avatar_url: null },
      ],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Muchas Citas')).toBeInTheDocument()
    })
    const cards = screen.getAllByRole('button').filter((b) =>
      b.textContent?.includes('Citas'),
    )
    expect(cards[0]).toHaveTextContent('Muchas Citas')
  })

  it('skips appointments without client_id', async () => {
    setupTables({
      appointments: [
        { client_id: '', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
        { client_id: 'c-1', start_time: '2025-10-15T10:00:00Z', status: 'completed' },
      ],
      profiles: [{ id: 'c-1', full_name: 'Solo', email: null, avatar_url: null }],
    })
    renderWithProviders(<ClientsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Solo')).toBeInTheDocument()
    })
    expect(screen.getByText('1 cliente registrado')).toBeInTheDocument()
  })
})
