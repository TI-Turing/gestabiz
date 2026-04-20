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

import { ClientProfileModal } from '../ClientProfileModal'

interface SetupOptions {
  profile?: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
    created_at: string
  } | null
  profileError?: { message: string } | null
  appointments?: Array<{
    id: string
    start_time: string
    status: string
    service_id: string | null
    price: number | null
  }>
  services?: Array<{ id: string; name: string }>
}

function setupTables(opts: SetupOptions = {}) {
  const { profile = null, profileError = null, appointments = [], services = [] } = opts
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return mockSupabaseChain(
        profileError
          ? { data: null, error: profileError }
          : { data: profile, error: null },
      )
    }
    if (table === 'appointments') {
      return mockSupabaseChain({ data: appointments, error: null })
    }
    if (table === 'services') {
      return mockSupabaseChain({ data: services, error: null })
    }
    return mockSupabaseChain({ data: [], error: null })
  })
}

const baseProfile = {
  id: 'c-1',
  full_name: 'Juan Perez',
  email: 'juan@x.com',
  phone: '+57 300 111 2233',
  avatar_url: null,
  created_at: '2024-01-15T10:00:00Z',
}

describe('ClientProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render content when isOpen is false', () => {
    setupTables({ profile: baseProfile })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={false}
        onClose={() => {}}
      />,
    )
    expect(screen.queryByText('Perfil del Cliente')).not.toBeInTheDocument()
  })

  it('renders dialog title when isOpen', async () => {
    setupTables({ profile: baseProfile })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Perfil del Cliente')).toBeInTheDocument()
    })
  })

  it('renders profile name and contact info', async () => {
    setupTables({ profile: baseProfile })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    })
    expect(screen.getByText('juan@x.com')).toBeInTheDocument()
    expect(screen.getByText('+57 300 111 2233')).toBeInTheDocument()
  })

  it('shows "Sin información de contacto" when profile lacks email and phone', async () => {
    setupTables({
      profile: { ...baseProfile, email: null, phone: null },
    })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Sin información de contacto')).toBeInTheDocument()
    })
  })

  it('renders stats cards (Visitas, Total citas, Ingresos)', async () => {
    setupTables({
      profile: baseProfile,
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          status: 'completed',
          service_id: 's-1',
          price: 50_000,
        },
        {
          id: 'a-2',
          start_time: '2025-10-10T10:00:00Z',
          status: 'cancelled',
          service_id: 's-1',
          price: 50_000,
        },
      ],
      services: [{ id: 's-1', name: 'Corte' }],
    })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Visitas')).toBeInTheDocument()
    })
    expect(screen.getByText('Total citas')).toBeInTheDocument()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    // Completed = 1, total = 2
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    // Revenue from completed only = $50.000
    expect(screen.getByText(/50\.000/)).toBeInTheDocument()
  })

  it('shows em dash for revenue when no completed appointments', async () => {
    setupTables({
      profile: baseProfile,
      appointments: [],
    })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Visitas')).toBeInTheDocument()
    })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders both tabs (Información, Historial)', async () => {
    setupTables({ profile: baseProfile })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Información')).toBeInTheDocument()
    })
    expect(screen.getByText(/Historial \(/)).toBeInTheDocument()
  })

  it('shows "Sin visitas registradas" in info tab when no appointments', async () => {
    setupTables({ profile: baseProfile, appointments: [] })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Sin visitas registradas')).toBeInTheDocument()
    })
  })

  it('switches to history tab when clicked', async () => {
    setupTables({
      profile: baseProfile,
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          status: 'completed',
          service_id: 's-1',
          price: 50_000,
        },
      ],
      services: [{ id: 's-1', name: 'Corte de cabello' }],
    })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText(/Historial \(1\)/)).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText(/Historial \(1\)/))
    await waitFor(() => {
      expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
    })
  })

  it('shows "Sin historial de citas" in history tab when no appointments', async () => {
    setupTables({ profile: baseProfile, appointments: [] })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText(/Historial \(0\)/)).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText(/Historial \(0\)/))
    expect(screen.getByText('Sin historial de citas')).toBeInTheDocument()
  })

  it('uses fallback name when full_name is null', async () => {
    setupTables({
      profile: { ...baseProfile, full_name: null },
    })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  it('renders appointment with price in history', async () => {
    setupTables({
      profile: baseProfile,
      appointments: [
        {
          id: 'a-1',
          start_time: '2025-10-15T10:00:00Z',
          status: 'completed',
          service_id: 's-1',
          price: 75_000,
        },
      ],
      services: [{ id: 's-1', name: 'Manicure' }],
    })
    renderWithProviders(
      <ClientProfileModal
        clientId="c-1"
        businessId="biz-1"
        isOpen={true}
        onClose={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText(/Historial \(1\)/)).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText(/Historial \(1\)/))
    await waitFor(() => {
      expect(screen.getByText('Manicure')).toBeInTheDocument()
    })
    expect(screen.getAllByText(/75\.000/).length).toBeGreaterThan(0)
  })
})
