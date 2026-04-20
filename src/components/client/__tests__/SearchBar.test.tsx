import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '../SearchBar'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const { tMock, setLastSearchMock, fromMock } = vi.hoisted(() => ({
  tMock: vi.fn((key: string) => key),
  setLastSearchMock: vi.fn().mockResolvedValue(undefined),
  fromMock: vi.fn(),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: tMock,
    language: 'es',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

vi.mock('@/components/ui/dropdown-menu', () => {
  const React = require('react')

  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => children,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => React.createElement('div', { role: 'menu' }, children),
    DropdownMenuItem: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) =>
      React.createElement('button', { type: 'button', role: 'menuitem', onClick, className }, children),
  }
})

vi.mock('@/lib/useKV', () => ({
  useKV: () => [{ term: '', type: 'businesses' }, setLastSearchMock],
}))

vi.mock('@phosphor-icons/react', () => ({
  MapPin: (props: Record<string, unknown>) => require('react').createElement('span', props),
}))

vi.mock('lucide-react', () => {
  const React = require('react')
  const icon = (name: string) => (props: Record<string, unknown>) =>
    React.createElement('span', { 'data-testid': name, ...props })

  return {
    Search: icon('Search'),
    Building2: icon('Building2'),
    Briefcase: icon('Briefcase'),
    User: icon('User'),
    ChevronDown: icon('ChevronDown'),
    Loader2: icon('Loader2'),
    Star: icon('Star'),
  }
})

vi.mock('@/lib/supabase', () => { const __sb = {
    from: fromMock,
    rpc: vi.fn(),
    functions: { invoke: vi.fn() },
  }; return { supabase: __sb, default: __sb } })

type QueryResult = {
  data: unknown
  error: unknown
}

function createQueryBuilder(result: QueryResult) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  }
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    fromMock.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return createQueryBuilder({
          data: [
            {
              id: 'business-1',
              name: 'Salon Central',
              logo_url: null,
              average_rating: 4.7,
              category: { name: 'Belleza' },
              locations: [{ id: 'loc-1', name: 'Principal', city: 'Medellin' }],
            },
          ],
          error: null,
        })
      }

      if (table === 'cities') {
        return createQueryBuilder({ data: [], error: null })
      }

      return createQueryBuilder({ data: [], error: null })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the search input with the default placeholder', () => {
    renderWithProviders(<SearchBar onResultSelect={vi.fn()} onViewMore={vi.fn()} />)

    expect(screen.getByPlaceholderText('search.placeholders.services')).toBeInTheDocument()
  })

  it('performs a debounced search and emits the selected result', async () => {
    const onResultSelect = vi.fn()

    renderWithProviders(<SearchBar onResultSelect={onResultSelect} onViewMore={vi.fn()} />)

    fireEvent.click(screen.getByRole('menuitem', { name: 'search.types.businesses' }))

    const input = screen.getByPlaceholderText('search.placeholders.businesses')
    act(() => {
      fireEvent.change(input, { target: { value: 'sa' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByRole('button', { name: /Salon Central/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Salon Central/i }))

    expect(onResultSelect).toHaveBeenCalledWith({
      id: 'business-1',
      name: 'Salon Central',
      type: 'businesses',
      subtitle: 'Belleza',
      location: 'Medellin',
      logo_url: null,
      rating: 4.7,
    })
  })

  it('calls onViewMore and persists the last search on enter', async () => {
    const onViewMore = vi.fn()

    renderWithProviders(<SearchBar onResultSelect={vi.fn()} onViewMore={onViewMore} />)

    const input = screen.getByPlaceholderText('search.placeholders.services')
    fireEvent.change(input, { target: { value: 'corte' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    expect(setLastSearchMock).toHaveBeenCalledWith({ term: 'corte', type: 'services' })
    expect(onViewMore).toHaveBeenCalledWith('corte', 'services')
  })
})
