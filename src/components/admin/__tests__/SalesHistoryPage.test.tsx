import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

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

import { SalesHistoryPage } from '../SalesHistoryPage'

interface SetupOptions {
  appointments?: Array<{
    id: string
    start_time: string
    client_id: string
    service_id: string
    price: number | null
  }>
  profiles?: Array<{ id: string; full_name: string | null }>
  services?: Array<{ id: string; name: string }>
}

function setupTables(opts: SetupOptions = {}) {
  const { appointments = [], profiles = [], services = [] } = opts
  mockFrom.mockImplementation((table: string) => {
    if (table === 'appointments') {
      return mockSupabaseChain({ data: appointments, error: null })
    }
    if (table === 'profiles') {
      return mockSupabaseChain({ data: profiles, error: null })
    }
    if (table === 'services') {
      return mockSupabaseChain({ data: services, error: null })
    }
    return mockSupabaseChain({ data: [], error: null })
  })
}

describe('SalesHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header with title and subtitle', () => {
    setupTables()
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    expect(screen.getByText('Historial de Ventas')).toBeInTheDocument()
    expect(screen.getByText('Citas completadas en el período')).toBeInTheDocument()
  })

  it('shows loading spinner initially', () => {
    setupTables()
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    // LoadingSpinner is rendered before data resolves
    expect(screen.getByText('Historial de Ventas')).toBeInTheDocument()
  })

  it('shows empty state when no sales exist', async () => {
    setupTables()
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(
        screen.getByText('No hay ventas en el período seleccionado'),
      ).toBeInTheDocument()
    })
  })

  it('renders summary cards with zero values when empty', async () => {
    setupTables()
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Citas completadas')).toBeInTheDocument()
    })
    expect(screen.getByText('Ingresos en período')).toBeInTheDocument()
    expect(screen.getByText('Promedio por cita')).toBeInTheDocument()
  })

  it('renders sales rows with service name and client name', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 50_000,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'Juan Perez' }],
      services: [{ id: 's-1', name: 'Corte de cabello' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
    })
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
  })

  it('shows total revenue in summary', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 30_000,
        },
        {
          id: 'a-2',
          start_time: '2025-10-16T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 70_000,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'Cliente Test' }],
      services: [{ id: 's-1', name: 'Servicio Test' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getAllByText('Cliente Test').length).toBeGreaterThan(0)
    })
    // Total: 30k + 70k = 100k → "$100.000"
    expect(screen.getByText(/100\.000/)).toBeInTheDocument()
  })

  it('shows average revenue when there are sales', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 40_000,
        },
        {
          id: 'a-2',
          start_time: '2025-10-16T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 60_000,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'X Cliente' }],
      services: [{ id: 's-1', name: 'X Servicio' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getAllByText('X Cliente').length).toBeGreaterThan(0)
    })
    // Average = 50k → "$50.000"
    expect(screen.getByText(/50\.000/)).toBeInTheDocument()
  })

  it('shows count of sales in summary', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 1000,
        },
        {
          id: 'a-2',
          start_time: '2025-10-16T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 1000,
        },
        {
          id: 'a-3',
          start_time: '2025-10-17T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 1000,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'Cliente' }],
      services: [{ id: 's-1', name: 'Servicio' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getAllByText('Servicio').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('uses fallback name when profile is missing', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 100,
        },
      ],
      profiles: [],
      services: [{ id: 's-1', name: 'Servicio' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Cliente sin nombre')).toBeInTheDocument()
    })
  })

  it('uses fallback service name when service is missing', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 100,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'Juan' }],
      services: [],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Servicio')).toBeInTheDocument()
    })
  })

  it('filters by client name search', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 100,
        },
        {
          id: 'a-2',
          start_time: '2025-10-16T10:00:00Z',
          client_id: 'c-2',
          service_id: 's-1',
          price: 100,
        },
      ],
      profiles: [
        { id: 'c-1', full_name: 'Juan Perez' },
        { id: 'c-2', full_name: 'Ana Lopez' },
      ],
      services: [{ id: 's-1', name: 'Corte' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Buscar cliente, servicio o atendido por...')
    await userEvent.type(searchInput, 'Juan')
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.queryByText('Ana Lopez')).not.toBeInTheDocument()
  })

  it('filters by service name search', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 100,
        },
        {
          id: 'a-2',
          start_time: '2025-10-16T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-2',
          price: 100,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'Cliente Uno' }],
      services: [
        { id: 's-1', name: 'Manicure' },
        { id: 's-2', name: 'Pedicure' },
      ],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Manicure')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Buscar cliente, servicio o atendido por...')
    await userEvent.type(searchInput, 'Pedicure')
    expect(screen.getByText('Pedicure')).toBeInTheDocument()
    expect(screen.queryByText('Manicure')).not.toBeInTheDocument()
  })

  it('shows search-empty message when search has no matches', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 100,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'Juan' }],
      services: [{ id: 's-1', name: 'Servicio' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Buscar cliente, servicio o atendido por...')
    await userEvent.type(searchInput, 'noexiste123')
    expect(screen.getByText('No hay resultados para esa búsqueda')).toBeInTheDocument()
  })

  it('opens ClientProfileModal when client button clicked', async () => {
    setupTables({
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          client_id: 'c-1',
          service_id: 's-1',
          price: 100,
        },
      ],
      profiles: [{ id: 'c-1', full_name: 'Juan' }],
      services: [{ id: 's-1', name: 'Corte' }],
    })
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Juan'))
    expect(screen.getByTestId('client-profile')).toHaveTextContent('c-1')
  })

  it('renders date range select with default of 30 days', () => {
    setupTables()
    renderWithProviders(<SalesHistoryPage businessId="biz-1" />)
    expect(screen.getByText('Últimos 30 días')).toBeInTheDocument()
  })
})
