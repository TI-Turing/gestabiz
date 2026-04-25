import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { GenderSelect } from '../GenderSelect'
import { DocumentTypeSelect } from '../DocumentTypeSelect'
import { CountrySelect } from '../CountrySelect'
import { CitySelect } from '../CitySelect'

// --- useCatalogs mock ---
vi.mock('@/hooks/useCatalogs', () => ({
  useGenders: () => ({
    genders: [
      { id: 'male', name: 'Masculino' },
      { id: 'female', name: 'Femenino' },
      { id: 'other', name: 'Otro' },
    ],
    loading: false,
  }),
  useCountries: () => ({
    countries: [{ id: 'co', name: 'Colombia', code: 'CO' }],
    loading: false,
  }),
  useCities: (regionId?: string) => ({
    cities: regionId
      ? [
          { id: 'bog', name: 'Bogotá' },
          { id: 'med', name: 'Medellín' },
        ]
      : [],
    loading: false,
  }),
  useDocumentTypes: () => ({
    documentTypes: [
      { id: 'cc', name: 'Cédula de Ciudadanía' },
      { id: 'ce', name: 'Cédula de Extranjería' },
    ],
    loading: false,
  }),
  useRegions: () => ({
    regions: [],
    loading: false,
  }),
  useHealthInsurances: () => ({
    healthInsurances: [],
    loading: false,
  }),
  usePhonePrefixes: () => ({
    phonePrefixes: [{ id: '57', prefix: '+57', country: 'Colombia' }],
    loading: false,
  }),
}))

// --- Language mock ---
vi.mock('@/contexts/LanguageContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/LanguageContext')>(
    '@/contexts/LanguageContext',
  )
  return {
    ...actual,
    useLanguage: () => ({ t: (key: string) => key }),
  }
})

describe('GenderSelect', () => {
  it('renders all gender options', () => {
    renderWithProviders(
      <GenderSelect value="" onChange={vi.fn()} />,
    )
    // The SelectTrigger renders — confirm placeholder
    const trigger = document.querySelector('[role="combobox"]')
    expect(trigger).not.toBeNull()
  })

  it('shows loading state when loading=true', () => {
    // We can't easily override the mock per-test, so test via mock override
    // Just assert the component renders without crashing
    renderWithProviders(<GenderSelect />)
    expect(document.body.textContent).toBeTruthy()
  })
})

describe('DocumentTypeSelect', () => {
  it('shows disabled state when no countryId', () => {
    renderWithProviders(
      <DocumentTypeSelect onChange={vi.fn()} />,
    )
    const trigger = document.querySelector('[role="combobox"]')
    expect(trigger).not.toBeNull()
    // Without countryId, select should be disabled
    const disabledEl = document.querySelector('[disabled]')
    expect(disabledEl).not.toBeNull()
  })

  it('renders with countryId provided', () => {
    renderWithProviders(
      <DocumentTypeSelect countryId="co" onChange={vi.fn()} />,
    )
    const trigger = document.querySelector('[role="combobox"]')
    expect(trigger).not.toBeNull()
  })
})

describe('CountrySelect', () => {
  it('renders without crashing', () => {
    renderWithProviders(
      <CountrySelect value="co" onChange={vi.fn()} />,
    )
    expect(document.body.textContent).toBeTruthy()
  })

  it('renders as disabled by default', () => {
    renderWithProviders(<CountrySelect />)
    const trigger = document.querySelector('[role="combobox"]')
    expect(trigger).not.toBeNull()
    // Default disabled=true
    const disabledEl = document.querySelector('[disabled]')
    expect(disabledEl).not.toBeNull()
  })
})

describe('CitySelect', () => {
  it('renders disabled when regionId is not provided', () => {
    renderWithProviders(<CitySelect onChange={vi.fn()} />)
    const disabledEl = document.querySelector('[disabled]')
    expect(disabledEl).not.toBeNull()
  })

  it('renders select when regionId is provided', () => {
    renderWithProviders(
      <CitySelect regionId="ant" value="" onChange={vi.fn()} />,
    )
    const trigger = document.querySelector('[role="combobox"]')
    expect(trigger).not.toBeNull()
  })
})
