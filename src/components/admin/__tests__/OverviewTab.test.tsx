import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import type { Business } from '@/types/types'

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

vi.mock('@/hooks/usePreferredLocation', () => ({
  usePreferredLocation: () => ({ preferredLocationId: null }),
}))

vi.mock('@/pages/PublicBusinessProfile', () => ({
  default: () => <div data-testid="public-profile" />,
}))

vi.mock('../BusinessQRModal', () => ({
  BusinessQRModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="qr-modal" /> : null,
}))

vi.mock('../AssignmentHealthPanel', () => ({
  AssignmentHealthPanel: ({
    servicesWithoutEmployees,
  }: {
    servicesWithoutEmployees: number
  }) => (
    <div data-testid="health-panel">
      health: {servicesWithoutEmployees}
    </div>
  ),
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { OverviewTab } from '../OverviewTab'

function createMockBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: 'biz-1',
    name: 'Negocio Demo',
    owner_id: 'owner-1',
    is_configured: true,
    slug: 'negocio-demo',
    description: 'Descripción del negocio',
    email: 'demo@biz.com',
    phone: '3001234567',
    logo_url: 'https://logo.test/logo.png',
    category: 'Salud',
    ...overrides,
  } as Business
}

interface BuildOptions {
  appointments?: Array<Record<string, unknown>>
  locations?: Array<{ id: string }>
  services?: Array<{ id: string }>
  employees?: Array<{ employee_id: string }>
  locationServices?: Array<{ location_id: string; service_id?: string }>
  businessServices?: Array<{ id: string }>
  allBusinessEmployees?: Array<{ employee_id: string; role: string | null }>
  employeeServices?: Array<{ employee_id: string; service_id: string }>
  workSchedules?: Array<{ employee_id: string }>
  hierarchy?: Array<{ user_id: string; reports_to: string | null }>
  apptError?: { message: string } | null
}

function setupTables(opts: BuildOptions = {}) {
  const {
    appointments = [],
    locations = [],
    services = [],
    employees = [],
    locationServices = [],
    businessServices = [],
    allBusinessEmployees = [],
    employeeServices = [],
    workSchedules = [],
    hierarchy = [],
    apptError = null,
  } = opts

  // counters track how many times a table has been queried (for tables read twice)
  const counters: Record<string, number> = {}

  mockFrom.mockImplementation((table: string) => {
    counters[table] = (counters[table] || 0) + 1
    switch (table) {
      case 'appointments':
        return mockSupabaseChain(
          apptError
            ? { data: null, error: apptError }
            : { data: appointments, error: null },
        )
      case 'locations':
        return mockSupabaseChain({ data: locations, error: null })
      case 'services': {
        // First call: filtered by location; second call: businessServices for checklist
        const isSecond = counters.services >= 2
        return mockSupabaseChain({
          data: isSecond ? businessServices : services,
          error: null,
        })
      }
      case 'business_employees':
        // First call: per-location employees; subsequent: allBusinessEmployees
        return counters.business_employees === 1
          ? mockSupabaseChain({ data: employees, error: null })
          : mockSupabaseChain({
              data: allBusinessEmployees,
              error: null,
            })
      case 'location_services':
        return mockSupabaseChain({ data: locationServices, error: null })
      case 'employee_services':
        return mockSupabaseChain({ data: employeeServices, error: null })
      case 'work_schedules':
        return mockSupabaseChain({ data: workSchedules, error: null })
      case 'business_roles':
        return mockSupabaseChain({ data: hierarchy, error: null })
      default:
        return mockSupabaseChain({ data: [], error: null })
    }
  })
}

describe('OverviewTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton while stats are being fetched', () => {
    setupTables()
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    // Skeleton card always renders the title "Resumen"
    expect(screen.getByText('Resumen')).toBeInTheDocument()
  })

  it('renders all main stat cards with zero values when no data', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByText('Citas Hoy')).toBeInTheDocument()
    })
    expect(screen.getByText('Próximas Citas')).toBeInTheDocument()
    expect(screen.getByText('Citas Completadas')).toBeInTheDocument()
    expect(screen.getByText('Citas Canceladas')).toBeInTheDocument()
    expect(screen.getByText('Empleados')).toBeInTheDocument()
    expect(screen.getByText('Sedes')).toBeInTheDocument()
    expect(screen.getByText('Servicios')).toBeInTheDocument()
    expect(screen.getByText('Ingresos del Mes')).toBeInTheDocument()
    expect(screen.getByText('Valor Promedio por Cita')).toBeInTheDocument()
  })

  it('counts completed appointments and computes monthly revenue', async () => {
    const now = new Date()
    const isoToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 2,
    ).toISOString()
    setupTables({
      appointments: [
        { start_time: isoToday, status: 'completed', price: 50_000 },
        { start_time: isoToday, status: 'completed', price: 30_000 },
        { start_time: isoToday, status: 'cancelled', price: 0 },
      ],
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      // 2 completed
      expect(screen.getByText('Citas Completadas')).toBeInTheDocument()
    })
    // Revenue $80,000 (es-CO uses "."): 80.000
    expect(screen.getByText(/\$80\.000/)).toBeInTheDocument()
  })

  it('renders setup checklist when business is not configured', async () => {
    setupTables()
    renderWithProviders(
      <OverviewTab business={createMockBusiness({ is_configured: false })} />,
    )
    await waitFor(() => {
      expect(
        screen.getByText('Completa la configuración de tu negocio'),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Al menos una sede')).toBeInTheDocument()
    expect(screen.getByText('Servicios configurados')).toBeInTheDocument()
    expect(screen.getByText('No público')).toBeInTheDocument()
  })

  it('hides checklist when business is fully configured', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByText('Sedes')).toBeInTheDocument()
    })
    expect(
      screen.queryByText('Completa la configuración de tu negocio'),
    ).not.toBeInTheDocument()
  })

  it('shows AssignmentHealthPanel when there are operational issues', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }, { id: 'svc-2' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      // svc-2 not assigned to any employee → servicesWithoutEmployees = 1
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByTestId('health-panel')).toBeInTheDocument()
    })
    expect(screen.getByText(/health: 1/)).toBeInTheDocument()
  })

  it('navigates to appointments page when "Citas Hoy" card clicked', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByText('Citas Hoy')).toBeInTheDocument()
    })
    const card = screen.getByText('Citas Hoy').closest('div[class*="cursor-pointer"]')
    expect(card).toBeTruthy()
    await userEvent.click(card!)
    expect(mockNavigate).toHaveBeenCalledWith('/app/admin/appointments')
  })

  it('renders business info card with name, category and description', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByText('Negocio Demo')).toBeInTheDocument()
    })
    expect(screen.getByText('Salud')).toBeInTheDocument()
    expect(screen.getByText('Descripción del negocio')).toBeInTheDocument()
    expect(screen.getByText('demo@biz.com')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
  })

  it('shows "Negocio disponible al público" badge when fully configured', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(
        screen.getByText('Negocio disponible al público'),
      ).toBeInTheDocument()
    })
  })

  it('toggles public profile when "Ver perfil" / "Ocultar perfil" clicked', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByText('Ver perfil')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Ver perfil'))
    expect(screen.getByTestId('public-profile')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Ocultar perfil'))
    expect(screen.queryByTestId('public-profile')).not.toBeInTheDocument()
  })

  it('opens QR modal when "Generar QR" clicked', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByText('Generar QR')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Generar QR'))
    expect(screen.getByTestId('qr-modal')).toBeInTheDocument()
  })

  it('renders setup checklist progress when partially complete', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
    })
    renderWithProviders(
      <OverviewTab business={createMockBusiness({ is_configured: false })} />,
    )
    await waitFor(() => {
      expect(
        screen.getByText('Completa la configuración de tu negocio'),
      ).toBeInTheDocument()
    })
    // Logo, description, phone are filled in default mock → "1 sede" + 3 = 4 done out of 6
    expect(screen.getByText(/4 de 6 pasos completados/i)).toBeInTheDocument()
  })

  it('does not render checklist when business is configured even with zero stats', async () => {
    setupTables({
      locations: [{ id: 'loc-1' }],
      businessServices: [{ id: 'svc-1' }],
      services: [{ id: 'svc-1' }],
      locationServices: [{ location_id: 'loc-1' }],
      allBusinessEmployees: [
        { employee_id: 'emp-1', role: 'professional' },
      ],
      employeeServices: [{ employee_id: 'emp-1', service_id: 'svc-1' }],
      workSchedules: [{ employee_id: 'emp-1' }],
      hierarchy: [{ user_id: 'emp-1', reports_to: 'mgr-1' }],
    })
    renderWithProviders(<OverviewTab business={createMockBusiness()} />)
    await waitFor(() => {
      expect(screen.getByText('Citas Hoy')).toBeInTheDocument()
    })
    expect(
      screen.queryByText(/Completa la configuración/),
    ).not.toBeInTheDocument()
  })
})
