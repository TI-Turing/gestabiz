import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockUsePreferredCity = vi.hoisted(() => vi.fn())
const mockUseAuth = vi.hoisted(() => vi.fn())
const mockUseKV = vi.hoisted(() => vi.fn())
const mockInvoke = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/hooks/usePreferredCity', () => ({
  usePreferredCity: () => mockUsePreferredCity(),
}))

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (fn: any) => fn,
}))

vi.mock('@/lib/useKV', () => ({
  useKV: (...args: any[]) => mockUseKV(...args),
}))

vi.mock('@/lib/cache', () => ({
  withCache: (_key: string, fn: any) => fn(),
}))

vi.mock('@/lib/supabase', () => {
  const client = {
    from: mockFrom,
    functions: { invoke: mockInvoke },
  }
  return { supabase: client, default: client }
})

vi.mock('@/components/business/BusinessProfile', () => ({
  default: () => null,
}))

import { BusinessSelection } from '../wizard-steps/BusinessSelection'

const sampleBusinesses = [
  { id: 'biz-1', name: 'Salon A', description: 'Best salon', logo_url: null, banner_url: null, address: 'Cl 1', city: 'city-1', phone: null, category_id: null },
  { id: 'biz-2', name: 'Spa B', description: null, logo_url: null, banner_url: null, address: 'Cl 2', city: 'city-1', phone: null, category_id: null },
]

const buildEdgeResponse = (overrides: Partial<any> = {}) => ({
  data: {
    businesses: sampleBusinesses,
    locationsCountMap: { 'biz-1': 1, 'biz-2': 2 },
    cityBusinessIds: ['biz-1', 'biz-2'],
    cityLocationIds: [],
    cityNameMap: { 'city-1': 'Bogotá' },
    ratingStatsByBusinessId: {},
    matchSourcesByBusinessId: {},
    total: 2,
    ...overrides,
  },
  error: null,
})

describe('BusinessSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } })
    mockUseKV.mockReturnValue([null, vi.fn()])
    mockUsePreferredCity.mockReturnValue({
      preferredRegionId: 'region-1',
      preferredCityId: 'city-1',
      preferredRegionName: 'Cundinamarca',
      preferredCityName: 'Bogotá',
    })
    mockInvoke.mockResolvedValue(buildEdgeResponse())
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))
  })

  it('does not auto-load when autoLoad is false', () => {
    renderWithProviders(
      <BusinessSelection
        selectedBusinessId={null}
        onSelectBusiness={vi.fn()}
        autoLoad={false}
      />
    )
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('auto-loads businesses via edge function and renders them', async () => {
    renderWithProviders(
      <BusinessSelection selectedBusinessId={null} onSelectBusiness={vi.fn()} />
    )
    await waitFor(() => {
      expect(screen.getByText('Salon A')).toBeInTheDocument()
    })
    expect(screen.getByText('Spa B')).toBeInTheDocument()
    expect(mockInvoke).toHaveBeenCalledWith('search_businesses', expect.any(Object))
  })

  it('does not load until preferredRegionId is available', () => {
    mockUsePreferredCity.mockReturnValue({
      preferredRegionId: null,
      preferredCityId: null,
      preferredRegionName: null,
      preferredCityName: null,
    })
    renderWithProviders(
      <BusinessSelection selectedBusinessId={null} onSelectBusiness={vi.fn()} />
    )
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('calls onSelectBusiness when a card is clicked', async () => {
    const onSelect = vi.fn()
    renderWithProviders(
      <BusinessSelection selectedBusinessId={null} onSelectBusiness={onSelect} />
    )
    await waitFor(() => screen.getByText('Salon A'))
    await userEvent.click(screen.getByText('Salon A'))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'biz-1', name: 'Salon A' }))
  })

  it('searches businesses when input is typed (>=2 chars)', async () => {
    renderWithProviders(
      <BusinessSelection selectedBusinessId={null} onSelectBusiness={vi.fn()} />
    )
    await waitFor(() => screen.getByText('Salon A'))
    mockInvoke.mockClear()
    const input = screen.getByPlaceholderText(/Buscar negocios/i)
    await userEvent.type(input, 'sal')
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
    const lastCall = mockInvoke.mock.calls[mockInvoke.mock.calls.length - 1]
    expect(lastCall[1].body.term).toBe('sal')
  })

  it('toggles 4.5 rating filter button', async () => {
    renderWithProviders(
      <BusinessSelection selectedBusinessId={null} onSelectBusiness={vi.fn()} />
    )
    await waitFor(() => screen.getByText('Salon A'))
    const filterBtn = screen.getByRole('button', { name: /4\.5/i })
    await userEvent.click(filterBtn)
    await waitFor(() => {
      const calls = mockInvoke.mock.calls
      const last = calls[calls.length - 1]
      expect(last[1].body.minRating).toBe(4.5)
    })
  })
})
