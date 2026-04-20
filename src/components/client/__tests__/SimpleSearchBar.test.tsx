import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SimpleSearchBar } from '../SimpleSearchBar'
import { renderWithProviders } from '@/test-utils/render-with-providers'

/* ── mocks ──────────────────────────────────────────── */

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string) => k,
    language: 'es',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

/* ── tests ────────────────────────────────────────────── */

describe('SimpleSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders search input with default placeholder', () => {
    renderWithProviders(<SimpleSearchBar onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText('search.placeholders.businesses')).toBeInTheDocument()
  })

  it('renders custom placeholder when provided', () => {
    renderWithProviders(<SimpleSearchBar onSearch={vi.fn()} placeholder="Buscar aquí..." />)
    expect(screen.getByPlaceholderText('Buscar aquí...')).toBeInTheDocument()
  })

  it('renders search type dropdown trigger', () => {
    renderWithProviders(<SimpleSearchBar onSearch={vi.fn()} />)
    // Default type label is businesses
    expect(screen.getByText('search.types.businesses')).toBeInTheDocument()
  })

  it('calls onSearch with debounce after typing', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProviders(<SimpleSearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText('search.placeholders.businesses')
    await user.type(input, 'salon')

    // Advance timers past the 300ms debounce
    vi.advanceTimersByTime(350)

    expect(onSearch).toHaveBeenCalledWith('salon', 'businesses')
  })

  it('debounces multiple keystrokes', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProviders(<SimpleSearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText('search.placeholders.businesses')
    await user.type(input, 'sal')

    // Clear previous calls from partial typing
    onSearch.mockClear()

    // Advance past debounce
    vi.advanceTimersByTime(350)

    // Should only have the final debounced call
    const lastCall = onSearch.mock.calls[onSearch.mock.calls.length - 1]
    expect(lastCall).toEqual(['sal', 'businesses'])
  })

  it('fires onSearch immediately on search type change', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProviders(<SimpleSearchBar onSearch={onSearch} />)

    // Open dropdown and select services
    const trigger = screen.getByText('search.types.businesses')
    await user.click(trigger)
    await user.click(screen.getByText('search.types.services'))

    // Should have been called with the new type
    expect(onSearch).toHaveBeenCalledWith('', 'services')
  })

  it('defaults to businesses search type', () => {
    renderWithProviders(<SimpleSearchBar onSearch={vi.fn()} />)
    expect(screen.getByText('search.types.businesses')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <SimpleSearchBar onSearch={vi.fn()} className="my-custom" />,
    )
    expect(container.firstChild).toHaveClass('my-custom')
  })

  it('shows all 3 search type options in dropdown', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProviders(<SimpleSearchBar onSearch={vi.fn()} />)

    await user.click(screen.getByText('search.types.businesses'))
    expect(screen.getByText('search.types.services')).toBeInTheDocument()
    expect(screen.getByText('search.types.users')).toBeInTheDocument()
  })

  it('updates input value as user types', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProviders(<SimpleSearchBar onSearch={vi.fn()} />)

    const input = screen.getByPlaceholderText('search.placeholders.businesses')
    await user.type(input, 'corte')
    expect(input).toHaveValue('corte')
  })
})
