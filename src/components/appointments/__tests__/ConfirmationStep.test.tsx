import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { ConfirmationStep } from '../wizard-steps/ConfirmationStep'

const baseData = {
  serviceId: 'svc-1',
  service: { name: 'Corte de Cabello', duration: 30, price: 50000 },
  date: new Date('2026-05-10T15:00:00'),
  startTime: '15:00',
  endTime: '15:30',
  notes: '',
  locationId: 'loc-1',
  location: { name: 'Sede Centro', address: 'Calle 10' },
  employeeId: 'emp-1',
  employee: { full_name: 'Pedro Pro', email: 'pedro@test.com' },
}

describe('ConfirmationStep', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders newAppointment header by default', () => {
    renderWithProviders(
      <ConfirmationStep wizardData={baseData} onUpdateNotes={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByText('appointments.wizard.newAppointment')).toBeInTheDocument()
    expect(screen.getByText('appointments.wizard.confirmDetails')).toBeInTheDocument()
  })

  it('renders editAppointment header when isEditing', () => {
    renderWithProviders(
      <ConfirmationStep
        wizardData={baseData}
        onUpdateNotes={vi.fn()}
        onSubmit={vi.fn()}
        isEditing
      />,
    )
    expect(screen.getByText('appointments.wizard.editAppointment')).toBeInTheDocument()
    expect(screen.getByText('appointments.wizard.confirmDetailsEdit')).toBeInTheDocument()
  })

  it('shows service details', () => {
    renderWithProviders(
      <ConfirmationStep wizardData={baseData} onUpdateNotes={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByText('Corte de Cabello')).toBeInTheDocument()
    expect(screen.getByText('30 appointments.wizard.minutes')).toBeInTheDocument()
  })

  it('renders date and time range', () => {
    renderWithProviders(
      <ConfirmationStep wizardData={baseData} onUpdateNotes={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByText('15:00 - 15:30')).toBeInTheDocument()
  })

  it('renders location name and employee', () => {
    renderWithProviders(
      <ConfirmationStep wizardData={baseData} onUpdateNotes={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByText('Sede Centro')).toBeInTheDocument()
    expect(screen.getByText('Pedro Pro')).toBeInTheDocument()
  })

  it('falls back to email when employee.full_name is null', () => {
    renderWithProviders(
      <ConfirmationStep
        wizardData={{ ...baseData, employee: { full_name: null, email: 'fallback@test.com' } }}
        onUpdateNotes={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByText('fallback@test.com')).toBeInTheDocument()
  })

  it('renders formatted price total', () => {
    renderWithProviders(
      <ConfirmationStep wizardData={baseData} onUpdateNotes={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByText('$50.000')).toBeInTheDocument()
  })

  it('renders client info section in admin booking mode', () => {
    renderWithProviders(
      <ConfirmationStep
        wizardData={{
          ...baseData,
          clientName: 'Cliente Test',
          clientPhone: '3001234567',
          clientPhonePrefix: '+57',
          clientEmail: 'client@test.com',
          clientProfileId: 'cli-1',
        }}
        onUpdateNotes={vi.fn()}
        onSubmit={vi.fn()}
        isAdminBooking
      />,
    )
    expect(screen.getByText('Cliente Test')).toBeInTheDocument()
    expect(screen.getByText('+57 3001234567')).toBeInTheDocument()
    expect(screen.getByText('client@test.com')).toBeInTheDocument()
    expect(screen.getByText('appointments.clientData.registered')).toBeInTheDocument()
  })

  it('calls onUpdateNotes when textarea is typed in', async () => {
    const onUpdateNotes = vi.fn()
    renderWithProviders(
      <ConfirmationStep wizardData={baseData} onUpdateNotes={onUpdateNotes} onSubmit={vi.fn()} />,
    )
    const textarea = screen.getByLabelText('appointments.wizard.optionalNotes')
    await userEvent.type(textarea, 'A')
    expect(onUpdateNotes).toHaveBeenCalledWith('A')
  })

  it('shows "notSelected" when service is null', () => {
    renderWithProviders(
      <ConfirmationStep
        wizardData={{ ...baseData, service: null, location: null, employee: null }}
        onUpdateNotes={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    const placeholders = screen.getAllByText('appointments.wizard.notSelected')
    expect(placeholders.length).toBeGreaterThan(0)
  })
})
