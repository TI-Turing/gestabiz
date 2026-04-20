import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const mockInfo = vi.hoisted(() => vi.fn())
const mockWarning = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({ info: mockInfo, warning: mockWarning, error: vi.fn(), success: vi.fn() }),
}))

import { SuccessStep } from '../wizard-steps/SuccessStep'

const baseData = {
  service: { name: 'Corte' },
  date: new Date('2026-05-10T15:00:00'),
  startTime: '15:00',
  location: { name: 'Sede Centro' },
}

describe('SuccessStep', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders processing state initially', () => {
    renderWithProviders(<SuccessStep appointmentData={baseData} onClose={vi.fn()} />)
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('shows confirmed state after timeout with appointment details', async () => {
    renderWithProviders(<SuccessStep appointmentData={baseData} onClose={vi.fn()} />)
    await waitFor(
      () => {
        expect(screen.getByText('Appointment Confirmed!')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    expect(screen.getByText('Corte')).toBeInTheDocument()
    expect(screen.getByText('Sede Centro')).toBeInTheDocument()
  })

  it('disables close button while loading and enables after success', async () => {
    const onClose = vi.fn()
    renderWithProviders(<SuccessStep appointmentData={baseData} onClose={onClose} />)
    const closeBtn = screen.getAllByRole('button')[0]
    expect(closeBtn).toBeDisabled()
    await waitFor(() => expect(closeBtn).not.toBeDisabled(), { timeout: 3000 })
    await userEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders Add to Calendar and Share buttons after success', async () => {
    renderWithProviders(<SuccessStep appointmentData={baseData} onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Add to Google Calendar')).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText('Share Appointment')).toBeInTheDocument()
  })

  it('calls info alert when Add to Google Calendar clicked', async () => {
    renderWithProviders(<SuccessStep appointmentData={baseData} onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Add to Google Calendar')).toBeInTheDocument(), { timeout: 3000 })
    await userEvent.click(screen.getByText('Add to Google Calendar'))
    expect(mockInfo).toHaveBeenCalled()
  })
})
