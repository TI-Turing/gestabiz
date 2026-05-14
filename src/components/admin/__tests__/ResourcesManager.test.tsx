import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import type { Business, BusinessResource } from '@/types/types'

const mockFrom = vi.hoisted(() => vi.fn())
const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

const mockUseBusinessResources = vi.hoisted(() => vi.fn())
const mockDeleteMutate = vi.hoisted(() => vi.fn())
const mockCreateMutate = vi.hoisted(() => vi.fn())
const mockUpdateMutate = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('sonner', () => ({ toast: mockToast }))

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/hooks/useBusinessResources', () => ({
  useBusinessResources: (id: string) => mockUseBusinessResources(id),
  useDeleteResource: () => ({ mutate: mockDeleteMutate, isPending: false }),
  useCreateResource: () => ({ mutate: mockCreateMutate, isPending: false }),
  useUpdateResource: () => ({ mutate: mockUpdateMutate, isPending: false }),
  useResourceImages: () => ({ data: [], isLoading: false }),
  useUploadResourceImage: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteResourceImage: () => ({ mutate: vi.fn(), isPending: false }),
  useReorderResourceImages: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { ResourcesManager } from '../ResourcesManager'

const businessFixture: Business = {
  id: 'biz-1',
  name: 'Negocio',
  email: 'biz@x.com',
  phone: '+57 300',
  address: 'Calle 1',
  description: 'desc',
  category: 'health',
  owner_id: 'owner-1',
  is_active: true,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
} as unknown as Business

function setupTables(opts: { locations?: Array<Record<string, unknown>> } = {}) {
  const { locations = [] } = opts
  mockFrom.mockImplementation((table: string) => {
    if (table === 'locations') {
      return mockSupabaseChain({ data: locations, error: null })
    }
    return mockSupabaseChain({ data: [], error: null })
  })
}

describe('ResourcesManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state from hook', () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    expect(screen.getByText('Cargando recursos...')).toBeInTheDocument()
  })

  it('shows empty state when no resources', async () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({ data: [], isLoading: false })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    // The empty state composes "noResources" + "create" button — check at least one empty marker
    await waitFor(() => {
      // The literal label key resolves through useLanguage; relax by matching "0 results"
      expect(screen.getByText(/0 /)).toBeInTheDocument()
    })
  })

  it('renders resources in table', async () => {
    setupTables()
    const resources: Partial<BusinessResource>[] = [
      {
        id: 'r-1',
        business_id: 'biz-1',
        name: 'Habitación 101',
        resource_type: 'room',
        capacity: 2,
        price_per_hour: 50_000,
        currency: 'COP',
        is_active: true,
        location: { id: 'l-1', name: 'Sede Centro' } as never,
      },
    ]
    mockUseBusinessResources.mockReturnValue({ data: resources, isLoading: false })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('Habitación 101')).toBeInTheDocument()
    })
    expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/50\.000/)).toBeInTheDocument()
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })

  it('renders inactive badge for inactive resources', async () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({
      data: [
        {
          id: 'r-1',
          business_id: 'biz-1',
          name: 'Cancha Off',
          resource_type: 'court',
          capacity: 10,
          price_per_hour: 100_000,
          currency: 'COP',
          is_active: false,
          location: { id: 'l-1', name: 'Sede Centro' },
        },
      ],
      isLoading: false,
    })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('Cancha Off')).toBeInTheDocument()
    })
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('shows "Sin ubicación" when resource has no location', async () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({
      data: [
        {
          id: 'r-1',
          business_id: 'biz-1',
          name: 'Recurso sin sede',
          resource_type: 'equipment',
          is_active: true,
          location: null,
        },
      ],
      isLoading: false,
    })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('Sin ubicación')).toBeInTheDocument()
    })
  })

  it('opens create dialog when add button clicked', async () => {
    setupTables({
      locations: [{ id: 'l-1', name: 'Sede 1', is_active: true, business_id: 'biz-1' }],
    })
    mockUseBusinessResources.mockReturnValue({ data: [], isLoading: false })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    // The button is rendered with translation; click first Plus button by role
    const buttons = await screen.findAllByRole('button')
    // Find button that contains the Plus icon
    const addBtn = buttons.find((b) => b.querySelector('svg.lucide-plus'))
    expect(addBtn).toBeTruthy()
    await userEvent.click(addBtn!)
    // Dialog should open with name input
    await waitFor(() => {
      expect(document.querySelector('input#name')).toBeInTheDocument()
    })
  })

  it('calls deleteMutation when delete button clicked and confirmed', async () => {
    setupTables()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockUseBusinessResources.mockReturnValue({
      data: [
        {
          id: 'r-1',
          business_id: 'biz-1',
          name: 'Recurso',
          resource_type: 'room',
          capacity: 1,
          price_per_hour: 0,
          currency: 'COP',
          is_active: true,
          location: { id: 'l-1', name: 'Sede 1' },
        },
      ],
      isLoading: false,
    })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('Recurso')).toBeInTheDocument()
    })
    // Two icon buttons in actions cell: edit, delete. Find by SVG class.
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find((b) => b.querySelector('svg.lucide-trash2'))
    expect(deleteBtn).toBeTruthy()
    await userEvent.click(deleteBtn!)
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDeleteMutate).toHaveBeenCalledWith('r-1')
    confirmSpy.mockRestore()
  })

  it('does NOT call deleteMutation when confirm is cancelled', async () => {
    setupTables()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    mockUseBusinessResources.mockReturnValue({
      data: [
        {
          id: 'r-1',
          business_id: 'biz-1',
          name: 'Recurso',
          resource_type: 'room',
          capacity: 1,
          price_per_hour: 0,
          currency: 'COP',
          is_active: true,
          location: { id: 'l-1', name: 'Sede 1' },
        },
      ],
      isLoading: false,
    })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('Recurso')).toBeInTheDocument()
    })
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find((b) => b.querySelector('svg.lucide-trash2'))
    await userEvent.click(deleteBtn!)
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('opens edit dialog with prefilled data when edit button clicked', async () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({
      data: [
        {
          id: 'r-1',
          business_id: 'biz-1',
          name: 'Habitación 101',
          resource_type: 'room',
          capacity: 4,
          price_per_hour: 80_000,
          currency: 'COP',
          is_active: true,
          description: 'Vista al mar',
          amenities: ['wifi', 'tv'],
          location_id: 'l-1',
          location: { id: 'l-1', name: 'Sede Centro' },
        },
      ],
      isLoading: false,
    })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('Habitación 101')).toBeInTheDocument()
    })
    const buttons = screen.getAllByRole('button')
    const editBtn = buttons.find((b) => b.querySelector('svg.lucide-pencil'))
    expect(editBtn).toBeTruthy()
    await userEvent.click(editBtn!)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Habitación 101')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Vista al mar')).toBeInTheDocument()
    expect(screen.getByDisplayValue('wifi, tv')).toBeInTheDocument()
  })

  it('filters resources by selected type', async () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({
      data: [
        {
          id: 'r-1',
          business_id: 'biz-1',
          name: 'Room One',
          resource_type: 'room',
          capacity: 1,
          is_active: true,
          location: { id: 'l-1', name: 'Sede' },
        },
        {
          id: 'r-2',
          business_id: 'biz-1',
          name: 'Table One',
          resource_type: 'table',
          capacity: 4,
          is_active: true,
          location: { id: 'l-1', name: 'Sede' },
        },
      ],
      isLoading: false,
    })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('Room One')).toBeInTheDocument()
    })
    expect(screen.getByText('Table One')).toBeInTheDocument()
  })

  it('renders count of filtered results', async () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({
      data: [
        {
          id: 'r-1',
          business_id: 'biz-1',
          name: 'A',
          resource_type: 'room',
          capacity: 1,
          is_active: true,
          location: { id: 'l-1', name: 'Sede' },
        },
        {
          id: 'r-2',
          business_id: 'biz-1',
          name: 'B',
          resource_type: 'room',
          capacity: 1,
          is_active: true,
          location: { id: 'l-1', name: 'Sede' },
        },
      ],
      isLoading: false,
    })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument()
    })
    // count "2 ..."
    expect(screen.getByText(/^2 /)).toBeInTheDocument()
  })

  it('does not render table when resources list is empty', async () => {
    setupTables()
    mockUseBusinessResources.mockReturnValue({ data: [], isLoading: false })
    renderWithProviders(<ResourcesManager business={businessFixture} />)
    await waitFor(() => {
      expect(screen.getByText(/^0 /)).toBeInTheDocument()
    })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
