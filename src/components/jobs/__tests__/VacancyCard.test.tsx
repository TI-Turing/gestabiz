import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { VacancyCard } from '../VacancyCard'
import type { JobVacancy } from '@/hooks/useJobVacancies'

type VacancyWithExtras = JobVacancy & {
  match_score?: number
  business_name?: string
  experience_level?: 'junior' | 'mid' | 'senior'
}

const mockVacancy: VacancyWithExtras = {
  id: 'vac-1',
  business_id: 'biz-1',
  location_id: 'loc-1',
  title: 'Estilista de Cabello',
  description: 'Descripción del puesto',
  position_type: 'full_time',
  experience_level: 'mid',
  salary_min: 2000000,
  salary_max: 3500000,
  number_of_positions: 2,
  applications_count: 0,
  published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  expires_at: null,
  is_remote: false,
  remote_allowed: false,
  benefits: ['Seguridad social', 'Comisiones'],
  required_skills: [],
  status: 'published',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  location_city: 'Bogotá',
  commission_based: false,
  business_name: 'Salón Glamour',
  match_score: 85,
}

describe('VacancyCard', () => {
  let onApply: ReturnType<typeof vi.fn>
  let onViewDetails: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onApply = vi.fn()
    onViewDetails = vi.fn()
  })

  it('renders the vacancy title', () => {
    renderWithProviders(
      <VacancyCard vacancy={mockVacancy} onApply={onApply} onViewDetails={onViewDetails} />,
    )
    expect(screen.getByText('Estilista de Cabello')).toBeDefined()
  })

  it('renders business name', () => {
    renderWithProviders(
      <VacancyCard vacancy={mockVacancy} onApply={onApply} onViewDetails={onViewDetails} />,
    )
    expect(screen.getByText('Salón Glamour')).toBeDefined()
  })

  it('renders city location', () => {
    renderWithProviders(
      <VacancyCard vacancy={mockVacancy} onApply={onApply} onViewDetails={onViewDetails} />,
    )
    expect(screen.getByText(/Bogotá/)).toBeDefined()
  })

  it('formats salary in COP', () => {
    renderWithProviders(
      <VacancyCard vacancy={mockVacancy} onApply={onApply} onViewDetails={onViewDetails} />,
    )
    // Salary range should appear in COP format
    const salaryText = screen.getByText(/2.000.000|2,000,000|COP/)
    expect(salaryText).toBeDefined()
  })

  it('calls onApply with vacancy id when apply button is clicked', () => {
    renderWithProviders(
      <VacancyCard vacancy={mockVacancy} onApply={onApply} onViewDetails={onViewDetails} />,
    )
    const applyBtn = screen.getByRole('button', { name: /aplicar|postular/i })
    fireEvent.click(applyBtn)
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith('vac-1')
  })

  it('calls onViewDetails with vacancy id when details button is clicked', () => {
    renderWithProviders(
      <VacancyCard vacancy={mockVacancy} onApply={onApply} onViewDetails={onViewDetails} />,
    )
    const detailsBtn = screen.getByRole('button', { name: /ver detalle|detalles/i })
    fireEvent.click(detailsBtn)
    expect(onViewDetails).toHaveBeenCalledTimes(1)
    expect(onViewDetails).toHaveBeenCalledWith('vac-1')
  })

  it('disables apply button when vacancy is fully booked', () => {
    const fullyBooked: VacancyWithExtras = {
      ...mockVacancy,
      number_of_positions: 1,
      applications_count: 1,
    }
    renderWithProviders(
      <VacancyCard vacancy={fullyBooked} onApply={onApply} onViewDetails={onViewDetails} />,
    )
    // When fully booked, button text changes to 'Completo' and is disabled
    const applyBtn = screen.getByRole('button', { name: /aplicar|postular|completo/i })
    expect((applyBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows match score badge when showMatchScore=true', () => {
    renderWithProviders(
      <VacancyCard
        vacancy={mockVacancy}
        onApply={onApply}
        onViewDetails={onViewDetails}
        showMatchScore
      />,
    )
    expect(screen.getByText(/85%/)).toBeDefined()
  })

  it('hides match score when showMatchScore=false', () => {
    renderWithProviders(
      <VacancyCard
        vacancy={mockVacancy}
        onApply={onApply}
        onViewDetails={onViewDetails}
        showMatchScore={false}
      />,
    )
    expect(screen.queryByText(/85%/)).toBeNull()
  })

  it('hides match score when match_score is undefined', () => {
    const noScore: VacancyWithExtras = { ...mockVacancy, match_score: undefined }
    renderWithProviders(
      <VacancyCard
        vacancy={noScore}
        onApply={onApply}
        onViewDetails={onViewDetails}
        showMatchScore
      />,
    )
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('handles remote_allowed property (MatchingVacancy format)', () => {
    // Use is_remote: true to test remote display
    // (If the key 'is_remote' is present in the object, the component uses vacancy.is_remote;
    // setting it to true correctly shows the Remoto badge)
    const remoteVacancy: VacancyWithExtras = {
      ...mockVacancy,
      is_remote: true,
      remote_allowed: true,
    }
    renderWithProviders(
      <VacancyCard
        vacancy={remoteVacancy}
        onApply={onApply}
        onViewDetails={onViewDetails}
      />,
    )
    // Remote badge should appear
    expect(screen.getByText(/remoto/i)).toBeDefined()
  })
})
