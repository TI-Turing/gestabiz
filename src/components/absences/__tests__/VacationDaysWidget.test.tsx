import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { VacationDaysWidget } from '../VacationDaysWidget'
import type { VacationBalance } from '@/hooks/useEmployeeAbsences'

vi.mock('@/contexts/LanguageContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/LanguageContext')>(
    '@/contexts/LanguageContext',
  )
  return {
    ...actual,
    useLanguage: () => ({
      t: (key: string, params?: Record<string, string>) => {
        if (key === 'absences.vacationWidget.title') return 'Días de Vacaciones'
        if (key === 'absences.vacationWidget.titleWithYear') return `Vacaciones ${params?.year ?? ''}`
        if (key === 'absences.vacationWidget.noInfo') return 'No hay información de balance'
        if (key === 'absences.vacationWidget.daysAvailable') return 'Días disponibles'
        if (key === 'absences.vacationWidget.daysUsed') return 'Días utilizados'
        if (key === 'absences.vacationWidget.totalDays') return 'días totales'
        return key
      },
    }),
  }
})

const mockBalance: VacationBalance = {
  id: 'bal-1',
  employee_id: 'emp-1',
  business_id: 'biz-1',
  year: 2025,
  totalDaysAvailable: 15,
  daysUsed: 5,
  daysRemaining: 10,
  daysPending: 0,
}

describe('VacationDaysWidget', () => {
  it('renders loading skeleton when loading=true', () => {
    const { container } = renderWithProviders(
      <VacationDaysWidget balance={null} loading />,
    )
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
    // Should NOT render balance data
    expect(screen.queryByText('10')).toBeNull()
  })

  it('renders "no info" message when balance is null', () => {
    renderWithProviders(<VacationDaysWidget balance={null} />)
    expect(screen.getByText('No hay información de balance')).toBeDefined()
  })

  it('renders balance data when balance is provided', () => {
    renderWithProviders(<VacationDaysWidget balance={mockBalance} />)
    // Days remaining is displayed prominently (may appear multiple times in different elements)
    const remainingElements = screen.getAllByText('10')
    expect(remainingElements.length).toBeGreaterThan(0)
    // Days used
    expect(screen.getByText('5')).toBeDefined()
    // Total days available (appears as part of badge text or standalone)
    expect(screen.getByText(/15/)).toBeDefined()
  })

  it('renders year in title when balance is provided', () => {
    renderWithProviders(<VacationDaysWidget balance={mockBalance} />)
    expect(screen.getByText(/2025/)).toBeDefined()
  })

  it('shows daysRemaining as 0 when negative (clamps to 0)', () => {
    const negativeBalance: VacationBalance = {
      ...mockBalance,
      daysRemaining: -3,
    }
    renderWithProviders(<VacationDaysWidget balance={negativeBalance} />)
    // Math.max(0, -3) = 0
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
  })

  it('renders title card text without loading state', () => {
    renderWithProviders(<VacationDaysWidget balance={mockBalance} />)
    expect(screen.getByText(/Vacaciones/)).toBeDefined()
  })
})
