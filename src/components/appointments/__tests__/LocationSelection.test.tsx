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
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/components/cards/LocationCard', () => ({
  LocationCard: ({ location, isSelected, onSelect, className }: any) => (
    <button
      data-testid={`loc-card-${location.id}`}
      data-disabled={!onSelect ? 'true' : 'false'}
      className={className}
      aria-pressed={isSelected}
      onClick={() => onSelect && onSelect(location)}
    >
      {location.name}
    </button>
  ),
}))

vi.mock('@/components/admin/LocationProfileModal', () => ({
  LocationProfileModal: () => null,
}))

import { LocationSelection } from '../wizard-steps/LocationSelection'

const locA: any = { id: 'loc-1', business_id: 'biz-1', name: 'Sede Centro', is_active: true }
const locB: any = { id: 'loc-2', business_id: 'biz-1', name: 'Sede Norte', is_active: true }

const buildSupabaseFlow = (opts: {
  employeeIds?: string[]
  empServices?: { service_id: string; location_id: string | null; employee_id: string; is_active: boolean }[]
  serviceIds?: string[]
  locationMedia?: any[]
}) => {
  const { employeeIds = ['e1'], empServices = [], serviceIds = [], locationMedia = [] } = opts
  return (table: string) => {
    if (table === 'business_employees') {
      return mockSupabaseChain({ data: employeeIds.map((id) => ({ employee_id: id })), error: null })
    }
    if (table === 'employee_services') {
      return mockSupabaseChain({ data: empServices, error: null })
    }
    if (table === 'services') {
      return mockSupabaseChain({ data: serviceIds.map((id) => ({ id })), error: null })
    }
    if (table === 'location_media') {
      return mockSupabaseChain({ data: locationMedia, error: null })
    }
    return mockSupabaseChain({ data: [], error: null })
  }
}

describe('LocationSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReset()
  })

  it('renders loading then preloaded locations filtered by active employee+service', async () => {
    mockFrom.mockImplementation(
      buildSupabaseFlow({
        employeeIds: ['e1'],
        empServices: [{ service_id: 'svc-1', location_id: 'loc-1', employee_id: 'e1', is_active: true }],
        serviceIds: ['svc-1'],
      }),
    )
    renderWithProviders(
      <LocationSelection
        businessId="biz-1"
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        preloadedLocations={[locA, locB]}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('loc-card-loc-1')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('loc-card-loc-2')).not.toBeInTheDocument()
  })

  it('renders empty state when no locations after filtering', async () => {
    mockFrom.mockImplementation(buildSupabaseFlow({ employeeIds: ['e1'], empServices: [], serviceIds: [] }))
    renderWithProviders(
      <LocationSelection
        businessId="biz-1"
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        preloadedLocations={[locA, locB]}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText(/No hay sedes disponibles/)).toBeInTheDocument()
    })
  })

  it('returns early without rendering loader when businessId is empty', async () => {
    renderWithProviders(
      <LocationSelection businessId="" selectedLocationId={null} onSelectLocation={vi.fn()} preloadedLocations={[]} />,
    )
    await waitFor(() => {
      expect(screen.getByText(/No hay sedes disponibles/)).toBeInTheDocument()
    })
  })

  it('calls onSelectLocation when an available card is clicked', async () => {
    const onSelectLocation = vi.fn()
    mockFrom.mockImplementation(
      buildSupabaseFlow({
        employeeIds: ['e1'],
        empServices: [{ service_id: 'svc-1', location_id: 'loc-1', employee_id: 'e1', is_active: true }],
        serviceIds: ['svc-1'],
      }),
    )
    renderWithProviders(
      <LocationSelection
        businessId="biz-1"
        selectedLocationId={null}
        onSelectLocation={onSelectLocation}
        preloadedLocations={[locA]}
      />,
    )
    await waitFor(() => screen.getByTestId('loc-card-loc-1'))
    await userEvent.click(screen.getByTestId('loc-card-loc-1'))
    expect(onSelectLocation).toHaveBeenCalledWith(expect.objectContaining({ id: 'loc-1' }))
  })

  it('disables locations not matching filterByEmployeeId', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'business_employees') {
        // first call: list approved employees (no filter); second call: maybeSingle for filterByEmployeeId
        return mockSupabaseChain({ data: [{ employee_id: 'e1', location_id: 'loc-1' }], error: null })
      }
      if (table === 'employee_services') {
        return mockSupabaseChain({
          data: [
            { service_id: 'svc-1', location_id: 'loc-1', employee_id: 'e1', is_active: true },
            { service_id: 'svc-1', location_id: 'loc-2', employee_id: 'e1', is_active: true },
          ],
          error: null,
        })
      }
      if (table === 'services') {
        return mockSupabaseChain({ data: [{ id: 'svc-1' }], error: null })
      }
      if (table === 'location_media') {
        return mockSupabaseChain({ data: [], error: null })
      }
      return mockSupabaseChain({ data: [], error: null })
    })
    renderWithProviders(
      <LocationSelection
        businessId="biz-1"
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        preloadedLocations={[locA, locB]}
        filterByEmployeeId="e1"
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('loc-card-loc-1')).toBeInTheDocument()
      expect(screen.getByTestId('loc-card-loc-2')).toBeInTheDocument()
    })
    // loc-2 should be marked disabled (no onSelect handler passed through)
    await waitFor(() => {
      expect(screen.getByTestId('loc-card-loc-2').getAttribute('data-disabled')).toBe('true')
    })
  })
})
