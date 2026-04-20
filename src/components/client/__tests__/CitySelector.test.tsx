import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CitySelector } from '../CitySelector'
import { renderWithProviders } from '@/test-utils/render-with-providers'

/* ── mocks ──────────────────────────────────────────── */

const mockRegions = [
  { id: 'reg-bog', name: 'Bogotá D.C.' },
  { id: 'reg-ant', name: 'Antioquia' },
]
const mockCities = [
  { id: 'city-med', name: 'Medellín', region_id: 'reg-ant' },
  { id: 'city-env', name: 'Envigado', region_id: 'reg-ant' },
]

vi.mock('@/hooks/useCatalogs', () => ({
  useRegions: () => ({ regions: mockRegions, loading: false }),
  useCities: () => ({ cities: mockCities, loading: false }),
}))

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string) => k,
    language: 'es',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock supabase for the fallback fetch
vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) }) },
}))

// Constants
vi.mock('@/constants', () => ({
  BOGOTA_REGION_ID: 'reg-bog',
  BOGOTA_CITY_ID: 'city-bog',
  BOGOTA_CITY_NAME: 'Bogotá',
}))

/* ── tests ────────────────────────────────────────────── */

describe('CitySelector', () => {
  const defaultProps = {
    preferredRegionId: null,
    preferredRegionName: null,
    preferredCityId: null,
    preferredCityName: null,
    onCitySelect: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('renders region selector with placeholder', () => {
    renderWithProviders(<CitySelector {...defaultProps} />)
    expect(screen.getByText('citySelector.selectRegion')).toBeInTheDocument()
  })

  it('renders region name when preferredRegionName is set', () => {
    renderWithProviders(
      <CitySelector {...defaultProps} preferredRegionName="Antioquia" />,
    )
    expect(screen.getByText('Antioquia')).toBeInTheDocument()
  })

  it('opens region dropdown on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CitySelector {...defaultProps} />)
    await user.click(screen.getByText('citySelector.selectRegion'))
    expect(screen.getByText('Bogotá D.C.')).toBeInTheDocument()
    expect(screen.getByText('Antioquia')).toBeInTheDocument()
  })

  it('calls onCitySelect with Bogotá auto-city when Bogotá region selected', async () => {
    const user = userEvent.setup()
    const onCitySelect = vi.fn()
    renderWithProviders(
      <CitySelector {...defaultProps} onCitySelect={onCitySelect} />,
    )
    await user.click(screen.getByText('citySelector.selectRegion'))
    await user.click(screen.getByText('Bogotá D.C.'))
    expect(onCitySelect).toHaveBeenCalledWith('reg-bog', 'Bogotá D.C.', 'city-bog', 'Bogotá')
  })

  it('calls onCitySelect with null city when non-Bogotá region selected', async () => {
    const user = userEvent.setup()
    const onCitySelect = vi.fn()
    renderWithProviders(
      <CitySelector {...defaultProps} onCitySelect={onCitySelect} />,
    )
    await user.click(screen.getByText('citySelector.selectRegion'))
    await user.click(screen.getByText('Antioquia'))
    expect(onCitySelect).toHaveBeenCalledWith('reg-ant', 'Antioquia', null, null)
  })

  it('does not show city selector when Bogotá is selected (special case)', () => {
    renderWithProviders(
      <CitySelector
        {...defaultProps}
        preferredRegionId="reg-bog"
        preferredRegionName="Bogotá D.C."
      />,
    )
    // City dropdown should NOT appear for Bogotá
    expect(screen.queryByText('citySelector.allCities')).not.toBeInTheDocument()
  })

  it('shows city selector when non-Bogotá region with cities selected', () => {
    renderWithProviders(
      <CitySelector
        {...defaultProps}
        preferredRegionId="reg-ant"
        preferredRegionName="Antioquia"
      />,
    )
    expect(screen.getByText('citySelector.allCities')).toBeInTheDocument()
  })

  it('shows city names when city dropdown opened', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CitySelector
        {...defaultProps}
        preferredRegionId="reg-ant"
        preferredRegionName="Antioquia"
      />,
    )
    await user.click(screen.getByText('citySelector.allCities'))
    expect(screen.getByText('Medellín')).toBeInTheDocument()
    expect(screen.getByText('Envigado')).toBeInTheDocument()
  })

  it('calls onCitySelect when a city is clicked', async () => {
    const user = userEvent.setup()
    const onCitySelect = vi.fn()
    renderWithProviders(
      <CitySelector
        {...defaultProps}
        preferredRegionId="reg-ant"
        preferredRegionName="Antioquia"
        onCitySelect={onCitySelect}
      />,
    )
    await user.click(screen.getByText('citySelector.allCities'))
    await user.click(screen.getByText('Medellín'))
    expect(onCitySelect).toHaveBeenCalledWith('reg-ant', 'Antioquia', 'city-med', 'Medellín')
  })

  it('renders MapPin icon', () => {
    const { container } = renderWithProviders(<CitySelector {...defaultProps} />)
    // MapPin is rendered as an svg with lucide classes
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
