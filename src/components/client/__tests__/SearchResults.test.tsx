import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { SearchResults } from '../SearchResults'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  invokeMock,
  fromMock,
  requestLocationMock,
  geoState,
  authState,
  preferredCityState,
} = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  fromMock: vi.fn(),
  requestLocationMock: vi.fn(),
  geoState: {
    hasLocation: false,
    latitude: null as number | null,
    longitude: null as number | null,
  },
  authState: {
    user: { id: 'client-1' },
  },
  preferredCityState: {
    preferredRegionId: 'region-1',
    preferredRegionName: 'Antioquia',
    preferredCityId: 'city-1',
    preferredCityName: 'Medellin',
  },
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'es',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/hooks/usePreferredCity', () => ({
  usePreferredCity: () => preferredCityState,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    hasLocation: geoState.hasLocation,
    latitude: geoState.latitude,
    longitude: geoState.longitude,
    requestLocation: requestLocationMock,
  }),
}))

vi.mock('@/components/cards/SearchResultCard', () => ({
  SearchResultCard: ({ result, onClick }: { result: { name: string }; onClick?: () => void }) => (
    <button type="button" data-testid="result-card" onClick={onClick}>
      {result.name}
    </button>
  ),
}))

vi.mock('@/components/ui/select', () => {
  const React = require('react') as typeof import('react')
  const SelectContext = React.createContext<{ onValueChange?: (value: string) => void }>({})

  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
      <SelectContext.Provider value={{ onValueChange }}>{children}</SelectContext.Provider>
    ),
    SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <button type="button" className={className}>{children}</button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div role="listbox">{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      const context = React.useContext(SelectContext)
      return (
        <button type="button" role="option" onClick={() => context.onValueChange?.(value)}>
          {children}
        </button>
      )
    },
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: vi.fn(),
    functions: {
      invoke: invokeMock,
    },
  },
}))

type QueryResult<T> = {
  data: T
  error: unknown
}

function createQueryBuilder<T>(result: QueryResult<T>) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (onFulfilled: (value: QueryResult<T>) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  }
}

const businessesResponse = [
  {
    id: 'biz-a',
    name: 'Alpha Studio',
    description: 'Alpha desc',
    logo_url: null,
    average_rating: 5,
    review_count: 12,
    category_id: 'cat-1',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'biz-b',
    name: 'Beta Spa',
    description: 'Beta desc',
    logo_url: null,
    average_rating: 4,
    review_count: 8,
    category_id: 'cat-2',
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'biz-c',
    name: 'Gamma Nails',
    description: 'Gamma desc',
    logo_url: null,
    average_rating: 3,
    review_count: 2,
    category_id: 'cat-3',
    created_at: '2025-03-01T10:00:00Z',
  },
]

const locationsResponse = [
  { business_id: 'biz-a', address: 'A', city: 'medellin', latitude: 0.1, longitude: 0.01 },
  { business_id: 'biz-b', address: 'B', city: 'medellin', latitude: 0.01, longitude: 0.01 },
  { business_id: 'biz-c', address: 'C', city: 'medellin', latitude: 0.2, longitude: 0.01 },
]

const categoriesResponse = [
  { id: 'cat-1', name: 'Cabello' },
  { id: 'cat-2', name: 'Spa' },
  { id: 'cat-3', name: 'Unas' },
]

function setupBusinessSearchMocks() {
  invokeMock.mockResolvedValue({
    data: { businesses: businessesResponse },
    error: null,
  })

  fromMock.mockImplementation((table: string) => {
    if (table === 'locations') {
      return createQueryBuilder({ data: locationsResponse, error: null })
    }

    if (table === 'business_categories') {
      return createQueryBuilder({ data: categoriesResponse, error: null })
    }

    return createQueryBuilder({ data: [], error: null })
  })
}

function getRenderedOrder() {
  return screen.getAllByTestId('result-card').map((node) => node.textContent)
}

describe('SearchResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    geoState.hasLocation = false
    geoState.latitude = null
    geoState.longitude = null
    authState.user = { id: 'client-1' }
    preferredCityState.preferredRegionId = 'region-1'
    preferredCityState.preferredRegionName = 'Antioquia'
    preferredCityState.preferredCityId = 'city-1'
    preferredCityState.preferredCityName = 'Medellin'
    setupBusinessSearchMocks()
  })

  it('renders fetched businesses using balanced sorting by default', async () => {
    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        userLocation={{ latitude: 0, longitude: 0 }}
        onResultClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card')).toHaveLength(3)
    })

    expect(invokeMock).toHaveBeenCalledWith('search_businesses', {
      body: expect.objectContaining({
        type: 'businesses',
        term: 'spa',
        preferredRegionId: 'region-1',
        preferredCityId: 'city-1',
        clientId: 'client-1',
      }),
    })

    expect(getRenderedOrder()).toEqual(['Beta Spa', 'Alpha Studio', 'Gamma Nails'])
  })

  it('calls onResultClick with the selected result', async () => {
    const onResultClick = vi.fn()

    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        userLocation={{ latitude: 0, longitude: 0 }}
        onResultClick={onResultClick}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card')).toHaveLength(3)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Beta Spa' }))

    expect(onResultClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'biz-b',
        name: 'Beta Spa',
        type: 'businesses',
        category: 'Spa',
      }),
    )
  })

  it('calls onClose from the modal header button', async () => {
    const onClose = vi.fn()

    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        userLocation={{ latitude: 0, longitude: 0 }}
        onResultClick={vi.fn()}
        onClose={onClose}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card')).toHaveLength(3)
    })

    const closeButton = screen.getAllByRole('button').find((button) => button.textContent === '')
    expect(closeButton).toBeDefined()
    fireEvent.click(closeButton!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when the search returns no results', async () => {
    invokeMock.mockResolvedValue({ data: { businesses: [] }, error: null })
    fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }))

    renderWithProviders(
      <SearchResults
        searchTerm="zzz"
        searchType="businesses"
        onResultClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('search.resultsPage.noResultsTitle')).toBeInTheDocument()
    })
  })

  it('sorts by relevance preserving backend order', async () => {
    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        userLocation={{ latitude: 0, longitude: 0 }}
        onResultClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card')).toHaveLength(3)
    })

    fireEvent.click(screen.getByRole('option', { name: 'search.sorting.relevance' }))
    expect(getRenderedOrder()).toEqual(['Alpha Studio', 'Beta Spa', 'Gamma Nails'])
  })

  it('sorts by rating descending', async () => {
    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        userLocation={{ latitude: 0, longitude: 0 }}
        onResultClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card')).toHaveLength(3)
    })

    fireEvent.click(screen.getByRole('option', { name: 'search.sorting.rating' }))
    expect(getRenderedOrder()).toEqual(['Alpha Studio', 'Beta Spa', 'Gamma Nails'])
  })

  it('sorts by newest and oldest using createdAt', async () => {
    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        userLocation={{ latitude: 0, longitude: 0 }}
        onResultClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card')).toHaveLength(3)
    })

    fireEvent.click(screen.getByRole('option', { name: 'search.sorting.newest' }))
    expect(getRenderedOrder()).toEqual(['Gamma Nails', 'Beta Spa', 'Alpha Studio'])

    fireEvent.click(screen.getByRole('option', { name: 'search.sorting.oldest' }))
    expect(getRenderedOrder()).toEqual(['Alpha Studio', 'Beta Spa', 'Gamma Nails'])
  })

  it('sorts by distance and requests geolocation when missing', async () => {
    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        onResultClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card')).toHaveLength(3)
    })

    fireEvent.click(screen.getByRole('option', { name: 'search.sorting.distance' }))
    expect(requestLocationMock).toHaveBeenCalledTimes(1)

    geoState.hasLocation = true
    geoState.latitude = 0
    geoState.longitude = 0

    renderWithProviders(
      <SearchResults
        searchTerm="spa"
        searchType="businesses"
        onResultClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('result-card').length).toBeGreaterThanOrEqual(3)
    })

    fireEvent.click(screen.getAllByRole('option', { name: 'search.sorting.distance' }).at(-1)!)
    const order = screen.getAllByTestId('result-card').slice(-3).map((node) => node.textContent)
    expect(order).toEqual(['Beta Spa', 'Alpha Studio', 'Gamma Nails'])
  })
})