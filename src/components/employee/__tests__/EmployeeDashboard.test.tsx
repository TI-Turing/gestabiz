import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { EmployeeDashboard } from '../EmployeeDashboard'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  navigateMock,
  locationState,
  fromMock,
  employeeBusinessesState,
  absenceState,
  joinRequestsState,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  locationState: { pathname: '/app/employee/employments' },
  fromMock: vi.fn(),
  employeeBusinessesState: {
    businesses: [] as Array<Record<string, unknown>>,
    loading: false,
  },
  absenceState: {
    vacationBalance: null,
    refresh: vi.fn(),
  },
  joinRequestsState: {
    data: [] as Array<Record<string, unknown>>,
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationState,
  }
})

vi.mock('@/components/layouts/UnifiedLayout', () => ({
  UnifiedLayout: ({ children, activePage, business }: { children: React.ReactNode; activePage: string; business?: { id?: string } }) => (
    <div data-testid="employee-layout">
      <div>active-page:{activePage}</div>
      <div>layout-business:{business?.id ?? 'none'}</div>
      {children}
    </div>
  ),
}))

vi.mock('@/components/settings/CompleteUnifiedSettings', () => ({
  default: ({ businessId }: { businessId?: string }) => <div>settings:{businessId}</div>,
}))

vi.mock('@/components/profile/MyProfilePage', () => ({
  MyProfilePage: ({ user }: { user: { id: string } }) => <div>profile:{user.id}</div>,
}))

vi.mock('@/components/employee/WorkScheduleEditor', () => ({
  WorkScheduleEditor: ({ businessId, employeeId }: { businessId: string; employeeId: string }) => (
    <div>schedule:{businessId}:{employeeId}</div>
  ),
}))

vi.mock('@/components/employee/MyEmploymentsEnhanced', () => ({
  MyEmployments: ({ employeeId }: { employeeId: string }) => <div>employments:{employeeId}</div>,
}))

vi.mock('@/components/employee/EmployeeOnboarding', () => ({
  EmployeeOnboarding: () => <div>employee-onboarding</div>,
}))

vi.mock('@/components/employee/EmployeeAbsencesTab', () => ({
  EmployeeAbsencesTab: ({ businessId }: { businessId: string }) => <div>absences:{businessId}</div>,
}))

vi.mock('@/components/employee/EmployeeAppointmentsPage', () => ({
  EmployeeAppointmentsPage: ({ employeeId, businessId }: { employeeId: string; businessId: string }) => (
    <div>appointments:{businessId}:{employeeId}</div>
  ),
}))

vi.mock('@/components/employee/EmployeeClientsPage', () => ({
  EmployeeClientsPage: ({ employeeId, businessId }: { employeeId: string; businessId: string }) => (
    <div>clients:{businessId}:{employeeId}</div>
  ),
}))

vi.mock('@/components/employee/PhoneRequiredModal', () => ({
  PhoneRequiredModal: ({ userId }: { userId: string }) => <div>phone-required:{userId}</div>,
}))

vi.mock('@/hooks/usePendingNavigation', () => ({
  usePendingNavigation: vi.fn(),
}))

vi.mock('@/hooks/useEmployeeAbsences', () => ({
  useEmployeeAbsences: () => absenceState,
}))

vi.mock('@/hooks/useEmployeeBusinesses', () => ({
  useEmployeeBusinesses: () => employeeBusinessesState,
}))

vi.mock('@/hooks/useEmployeeJoinRequests', () => ({
  useMyJoinRequests: () => joinRequestsState,
}))

vi.mock('@/contexts/LanguageContext', () => ({
  
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLanguage: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'employeeDashboard.sidebar.myEmployments': 'Mis Empleos',
        'employeeDashboard.sidebar.searchVacancies': 'Buscar Vacantes',
        'employeeDashboard.sidebar.myAbsences': 'Mis Ausencias',
        'employeeDashboard.sidebar.myAppointments': 'Mis Citas',
        'employeeDashboard.sidebar.schedule': 'Horario',
        'landing.footer.developedBy': 'Desarrollado por',
      }

      return labels[key] ?? key
    },
  }),
}))

vi.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: () => <div>loading-spinner</div>,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

function createProfilesQuery(phone: string | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { phone },
          error: null,
        }),
      }),
    }),
  }
}

const businesses = [
  {
    id: 'biz-1',
    name: 'Salon Centro',
    description: 'A',
    logo_url: null,
    phone: '123',
    email: 'salon@demo.com',
    address: 'Cra 1',
    city: 'Medellin',
    state: 'Antioquia',
  },
  {
    id: 'biz-2',
    name: 'Spa Norte',
    description: 'B',
    logo_url: null,
    phone: '456',
    email: 'spa@demo.com',
    address: 'Cra 2',
    city: 'Medellin',
    state: 'Antioquia',
  },
]

const baseUser = {
  id: 'emp-1',
  name: 'Empleado Demo',
  email: 'empleado@demo.com',
  phone: '3001234567',
  avatar_url: null,
}

function renderDashboard(userOverrides: Partial<typeof baseUser> = {}) {
  return renderWithProviders(
    <EmployeeDashboard
      currentRole="employee"
      availableRoles={['employee', 'client']}
      onRoleChange={vi.fn()}
      onLogout={vi.fn()}
      user={{ ...baseUser, ...userOverrides }}
    />,
  )
}

describe('EmployeeDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    locationState.pathname = '/app/employee/employments'
    employeeBusinessesState.businesses = businesses
    employeeBusinessesState.loading = false
    joinRequestsState.data = []
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return createProfilesQuery('3001234567')
      }

      throw new Error(`Unexpected table: ${table}`)
    })
    localStorage.removeItem('gestabiz-employee-business-emp-1')
  })

  it('renders the employments page by default once the employee has a phone', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('employments:emp-1')).toBeInTheDocument()
    })

    expect(screen.getByTestId('employee-layout')).toHaveTextContent('active-page:employments')
    expect(screen.getByTestId('employee-layout')).toHaveTextContent('layout-business:biz-1')
  })

  it('uses the persisted employee business when rendering schedule subpages', async () => {
    locationState.pathname = '/app/employee/schedule'
    localStorage.setItem('gestabiz-employee-business-emp-1', 'biz-2')

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('schedule:biz-2:emp-1')).toBeInTheDocument()
    })

    expect(screen.getByTestId('employee-layout')).toHaveTextContent('active-page:schedule')
    expect(screen.getByTestId('employee-layout')).toHaveTextContent('layout-business:biz-2')
  })

  it('renders the employee appointments subpage with the resolved business context', async () => {
    locationState.pathname = '/app/employee/appointments'

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('appointments:biz-1:emp-1')).toBeInTheDocument()
    })
  })
})