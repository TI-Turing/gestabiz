import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import {
  LoadingSpinner,
  SuspenseFallback,
  ButtonSpinner,
  FormSkeleton,
} from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('renders the spinner icon', () => {
    const { container } = renderWithProviders(<LoadingSpinner />)
    // Loader2 icon rendered via Lucide React
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders with text when text prop is provided', () => {
    renderWithProviders(<LoadingSpinner text="Cargando datos..." />)
    expect(screen.getByText('Cargando datos...')).toBeDefined()
  })

  it('does not render text when text prop is omitted', () => {
    const { container } = renderWithProviders(<LoadingSpinner />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('renders in fullScreen mode with fixed overlay', () => {
    const { container } = renderWithProviders(<LoadingSpinner fullScreen />)
    const overlay = container.firstChild as HTMLElement
    expect(overlay?.className).toContain('fixed')
  })

  it('applies size classes correctly for sm', () => {
    const { container } = renderWithProviders(<LoadingSpinner size="sm" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('h-4')
  })

  it('applies size classes correctly for xl', () => {
    const { container } = renderWithProviders(<LoadingSpinner size="xl" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('h-12')
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <LoadingSpinner className="custom-class" />,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.className).toContain('custom-class')
  })
})

describe('SuspenseFallback', () => {
  it('renders with default text', () => {
    renderWithProviders(<SuspenseFallback />)
    expect(screen.getByText('Cargando componente...')).toBeDefined()
  })

  it('renders with custom text', () => {
    renderWithProviders(<SuspenseFallback text="Por favor espera..." />)
    expect(screen.getByText('Por favor espera...')).toBeDefined()
  })
})

describe('ButtonSpinner', () => {
  it('renders a spinner svg', () => {
    const { container } = renderWithProviders(<ButtonSpinner />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('applies custom className to the svg', () => {
    const { container } = renderWithProviders(
      <ButtonSpinner className="extra-class" />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('extra-class')
  })
})

describe('FormSkeleton', () => {
  it('renders skeleton divs for form fields', () => {
    const { container } = renderWithProviders(<FormSkeleton />)
    // There should be multiple skeleton elements
    const skeletons = container.querySelectorAll('.bg-muted')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
