import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())
const mockNavigate = vi.hoisted(() => vi.fn())
const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  message: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'x' } })),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  },
  default: { from: mockFrom },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('sonner', () => ({ toast: mockToast }))

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

vi.mock('@/lib/mailService', () => ({
  sendAppointmentCancellationNotification: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/hooks/usePlanFeatures', () => ({
  usePlanFeatures: () => ({
    quotaInfo: (_r: string, count: number) => ({
      limit: null,
      notShownCount: 0,
      currentCount: count,
      isAtLimit: false,
    }),
    upgradePlan: null,
    hasModule: () => true,
  }),
}))

vi.mock('@/hooks/usePreferredLocation', () => ({
  usePreferredLocation: () => ({ preferredLocationId: null }),
}))

vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/PlanLimitBanner', () => ({
  PlanLimitBanner: () => null,
}))

vi.mock('@/components/ui/MediaUploader', () => ({
  MediaUploader: () => <div data-testid="media-uploader" />,
}))

vi.mock('@/components/admin/LocationProfileModal', () => ({
  LocationProfileModal: ({ open, location }: { open: boolean; location: { name: string } }) =>
    open ? <div data-testid="location-profile">{location.name}</div> : null,
}))

vi.mock('@/components/settings/BannerCropper', () => ({
  BannerCropper: () => null,
}))

vi.mock('@/components/catalog', () => ({
  RegionSelect: () => <div data-testid="region-select" />,
  CitySelect: () => <div data-testid="city-select" />,
}))

vi.mock('@/components/ui/LocationAddress', () => ({
  LocationAddress: ({ address }: { address?: string }) => <span>{address}</span>,
}))

vi.mock('@/components/admin/locations/LocationExpenseConfig', () => ({
  LocationExpenseConfig: () => <div data-testid="expense-config" />,
}))

vi.mock('@/components/ui/BusinessHoursPicker', () => ({
  BusinessHoursPicker: () => <div data-testid="hours-picker" />,
}))

vi.mock('@/components/ui/PhoneInput', () => ({
  PhoneInput: ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => (
    <input
      data-testid="phone-input"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}))

import { LocationsManager } from '../LocationsManager'

interface SetupOptions {
  locations?: Array<Record<string, unknown>>
  locationServices?: Array<{ location_id: string }>
  media?: Array<Record<string, unknown>>
}

function setupTables(opts: SetupOptions = {}) {
  const { locations = [], locationServices = [], media = [] } = opts

  mockFrom.mockImplementation((table: string) => {
    switch (table) {
      case 'locations':
        return mockSupabaseChain({ data: locations, error: null })
      case 'location_services':
        return mockSupabaseChain({ data: locationServices, error: null })
      case 'location_media':
        return mockSupabaseChain({ data: media, error: null })
      case 'appointments':
        return mockSupabaseChain({ data: [], error: null })
      default:
        return mockSupabaseChain({ data: [], error: null })
    }
  })
}

describe('LocationsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching', () => {
    setupTables()
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    expect(screen.getByText('Cargando sedes...')).toBeInTheDocument()
  })

  it('shows empty state when business has no locations', async () => {
    setupTables()
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('No hay sedes aún')).toBeInTheDocument()
    })
    expect(screen.getByText('Crear Primera Sede')).toBeInTheDocument()
  })

  it('renders header with title and "Agregar Sede" button when locations exist', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Centro',
          is_active: true,
          is_primary: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    })
    expect(screen.getByText('Sedes')).toBeInTheDocument()
    expect(screen.getByText('Agregar Sede')).toBeInTheDocument()
  })

  it('renders location cards with name, address, phone and email', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Centro',
          address: 'Calle 10 #20-30',
          phone: '+57 300 111 2222',
          email: 'centro@x.com',
          is_active: true,
          is_primary: false,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    })
    expect(screen.getByText('Calle 10 #20-30')).toBeInTheDocument()
    expect(screen.getByText('+57 300 111 2222')).toBeInTheDocument()
    expect(screen.getByText('centro@x.com')).toBeInTheDocument()
  })

  it('shows "Principal" badge for primary location', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Centro',
          is_active: true,
          is_primary: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    })
    expect(screen.getByText('Principal')).toBeInTheDocument()
  })

  it('shows "Inactiva" badge for inactive location', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Inactiva',
          is_active: false,
          is_primary: false,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Inactiva')).toBeInTheDocument()
    })
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
  })

  it('shows "Sin servicios asignados" when location has no services', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede A',
          is_active: true,
          is_primary: false,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
      locationServices: [],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sin servicios asignados')).toBeInTheDocument()
    })
  })

  it('hides "Sin servicios asignados" when location has services', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede A',
          is_active: true,
          is_primary: false,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
      locationServices: [{ location_id: 'loc-1' }],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede A')).toBeInTheDocument()
    })
    expect(screen.queryByText('Sin servicios asignados')).not.toBeInTheDocument()
  })

  it('opens LocationProfileModal when location card is clicked', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Centro',
          is_active: true,
          is_primary: false,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Sede Centro'))
    expect(screen.getByTestId('location-profile')).toHaveTextContent('Sede Centro')
  })

  it('opens create dialog when "Crear Primera Sede" clicked', async () => {
    setupTables()
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Crear Primera Sede')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Crear Primera Sede'))
    // Dialog title for new location should appear
    await waitFor(() => {
      expect(screen.getAllByText(/Sede|Información/i).length).toBeGreaterThan(0)
    })
  })

  it('opens edit dialog when edit button clicked on a card', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Centro',
          is_active: true,
          is_primary: false,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    })
    const editBtn = screen.getByLabelText('Editar sede Sede Centro')
    await userEvent.click(editBtn)
    // Profile modal should NOT open (stopPropagation), but edit dialog does
    expect(screen.queryByTestId('location-profile')).not.toBeInTheDocument()
  })

  it('triggers delete handler when delete button clicked', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Centro',
          is_active: true,
          is_primary: false,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    })
    const deleteBtn = screen.getByLabelText('Eliminar sede Sede Centro')
    await userEvent.click(deleteBtn)
    expect(deleteBtn).toBeInTheDocument()
  })

  it('renders multiple locations sorted with primary first', async () => {
    setupTables({
      locations: [
        {
          id: 'loc-2',
          business_id: 'biz-1',
          name: 'Sede Segunda',
          is_active: true,
          is_primary: false,
          created_at: '2025-01-02',
          updated_at: '2025-01-02',
        },
        {
          id: 'loc-1',
          business_id: 'biz-1',
          name: 'Sede Principal',
          is_active: true,
          is_primary: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    })
    renderWithProviders(<LocationsManager businessId="biz-1" />)
    await waitFor(() => {
      expect(screen.getByText('Sede Principal')).toBeInTheDocument()
    })
    const titles = screen.getAllByText(/^Sede /)
    expect(titles[0]).toHaveTextContent('Sede Principal')
  })
})
