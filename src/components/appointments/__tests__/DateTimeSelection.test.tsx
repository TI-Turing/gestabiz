import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockUseWizardDateTimeData = vi.hoisted(() => vi.fn())
const mockUseEmployeeTransferAvailability = vi.hoisted(() => vi.fn())
const mockUsePublicHolidays = vi.hoisted(() => vi.fn())
const mockUseBusinessClosedDays = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('@/hooks/useWizardDateTimeData', () => ({
  useWizardDateTimeData: (...args: unknown[]) => mockUseWizardDateTimeData(...args),
}))

vi.mock('@/hooks/useEmployeeTransferAvailability', () => ({
  useEmployeeTransferAvailability: () => mockUseEmployeeTransferAvailability(),
}))

vi.mock('@/hooks/usePublicHolidays', () => ({
  usePublicHolidays: (...args: unknown[]) => mockUsePublicHolidays(...args),
}))

vi.mock('@/hooks/useBusinessClosedDays', () => ({
  useBusinessClosedDays: (...args: unknown[]) => mockUseBusinessClosedDays(...args),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ selected, onSelect }: any) => (
    <div data-testid="mock-calendar">
      <button onClick={() => onSelect && onSelect(new Date('2099-06-15T00:00:00'))}>pick-future-date</button>
      {selected && <span data-testid="cal-selected">{new Date(selected).toISOString()}</span>}
    </div>
  ),
}))

import { DateTimeSelection } from '../wizard-steps/DateTimeSelection'

const baseService: any = {
  id: 'svc-1',
  name: 'Corte',
  duration: 30,
  duration_minutes: 30,
  price: 50000,
}

const defaultHookData = {
  isLoading: false,
  day: {
    locationSchedule: { opens_at: '09:00', closes_at: '17:00' },
    employeeSchedule: { lunch_break_start: null, lunch_break_end: null, has_lunch_break: false },
    workSchedules: [
      { day_of_week: 0, is_working: true },
      { day_of_week: 1, is_working: true },
      { day_of_week: 2, is_working: true },
      { day_of_week: 3, is_working: true },
      { day_of_week: 4, is_working: true },
      { day_of_week: 5, is_working: true },
      { day_of_week: 6, is_working: true },
    ],
    dayAppointments: [],
    clientDayAppointments: [],
  },
  month: {
    monthAppointments: [],
    monthAbsences: [],
  },
}

const baseProps = {
  service: baseService,
  selectedDate: null as Date | null,
  selectedTime: null as string | null,
  onSelectDate: vi.fn(),
  onSelectTime: vi.fn(),
  employeeId: 'emp-1',
  locationId: 'loc-1',
  businessId: 'biz-1',
}

describe('DateTimeSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReset()
    mockFrom.mockReturnValue(mockSupabaseChain({ data: { work_on_holidays: false }, error: null }))
    mockUseEmployeeTransferAvailability.mockReturnValue({
      validateAvailability: vi.fn().mockResolvedValue({ isAvailable: true }),
    })
    mockUsePublicHolidays.mockReturnValue({
      isHoliday: () => false,
      getHolidayName: () => null,
      holidays: [],
    })
    mockUseBusinessClosedDays.mockReturnValue({
      isClosedDay: () => false,
      getClosedDayReason: () => null,
    })
    mockUseWizardDateTimeData.mockReturnValue(defaultHookData)
  })

  it('renders calendar without slots when no date selected', () => {
    renderWithProviders(<DateTimeSelection {...baseProps} />)
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument()
    expect(screen.queryByText(/PM/)).not.toBeInTheDocument()
  })

  it('calls onSelectDate when calendar emits a future date', async () => {
    const onSelectDate = vi.fn()
    renderWithProviders(<DateTimeSelection {...baseProps} onSelectDate={onSelectDate} />)
    await userEvent.click(screen.getByText('pick-future-date'))
    expect(onSelectDate).toHaveBeenCalled()
  })

  it('renders time slots when a future date is selected', async () => {
    const futureDate = new Date('2099-06-15T00:00:00')
    renderWithProviders(<DateTimeSelection {...baseProps} selectedDate={futureDate} />)
    await waitFor(() => {
      expect(screen.getByText('09:00 AM')).toBeInTheDocument()
    })
    expect(screen.getByText('04:30 PM')).toBeInTheDocument()
  })

  it('calls onSelectTime when an available slot is clicked', async () => {
    const onSelectTime = vi.fn()
    const futureDate = new Date('2099-06-15T00:00:00')
    renderWithProviders(<DateTimeSelection {...baseProps} selectedDate={futureDate} onSelectTime={onSelectTime} />)
    await waitFor(() => screen.getByText('10:00 AM'))
    await userEvent.click(screen.getByText('10:00 AM'))
    expect(onSelectTime).toHaveBeenCalled()
    expect(onSelectTime.mock.calls[0][0]).toBe('10:00 AM')
  })

  it('does not call onSelectTime when slot is unavailable due to lunch break', async () => {
    const onSelectTime = vi.fn()
    mockUseWizardDateTimeData.mockReturnValue({
      ...defaultHookData,
      day: {
        ...defaultHookData.day,
        employeeSchedule: { lunch_break_start: '12:00', lunch_break_end: '13:00', has_lunch_break: true },
      },
    })
    const futureDate = new Date('2099-06-15T00:00:00')
    renderWithProviders(<DateTimeSelection {...baseProps} selectedDate={futureDate} onSelectTime={onSelectTime} />)
    await waitFor(() => screen.getByText('12:00 PM'))
    await userEvent.click(screen.getByText('12:00 PM'))
    expect(onSelectTime).not.toHaveBeenCalled()
  })

  it('renders no slots when employee has no working days configured', async () => {
    mockUseWizardDateTimeData.mockReturnValue({
      ...defaultHookData,
      day: { ...defaultHookData.day, workSchedules: [] },
    })
    const futureDate = new Date('2099-06-15T00:00:00')
    renderWithProviders(<DateTimeSelection {...baseProps} selectedDate={futureDate} />)
    await waitFor(() => {
      expect(screen.queryByText('09:00 AM')).not.toBeInTheDocument()
    })
  })
})
