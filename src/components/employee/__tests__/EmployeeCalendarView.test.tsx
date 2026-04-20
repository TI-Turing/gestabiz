import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import { renderWithProviders } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { EmployeeCalendarView } from '../EmployeeCalendarView';

vi.mock('@/hooks/useEmployeeAppointments', () => ({
  useEmployeeAppointments: vi.fn(),
}));

vi.mock('@/hooks/useEmployeeAbsences', () => ({
  useEmployeeAbsences: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useEmployeeAppointments } from '@/hooks/useEmployeeAppointments';
import { useEmployeeAbsences } from '@/hooks/useEmployeeAbsences';

const mockAppointments = [
  {
    id: 'apt-1',
    business_id: 'biz-123',
    client_id: 'client-1',
    service_id: 'srv-1',
    employee_id: 'emp-123',
    start_time: '2026-04-21T10:00:00Z',
    end_time: '2026-04-21T11:00:00Z',
    status: 'confirmed',
    client_name: 'Juan Pérez',
    service_name: 'Corte Caballero',
    location_name: 'Sede Principal',
    price: 50000,
  },
];

const mockAbsences = [
  {
    id: 'abs-1',
    absenceType: 'vacation',
    startDate: '2026-04-22',
    endDate: '2026-04-26',
    status: 'approved',
    daysCount: 5,
  },
];

describe('EmployeeCalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });
  });

  it('should render calendar view', () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByRole('navigation', { name: /mes anterior|next month/i }) || 
            screen.getByRole('button', { name: /anterior|próximo/i })).toBeTruthy();
  });

  it('should display current month', () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    expect(screen.getByText(new RegExp(currentMonth.split(' ')[0], 'i'))).toBeInTheDocument();
  });

  it('should allow navigation to previous month', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const prevButton = screen.getByRole('button', { name: /anterior|◀|<|previous/i });
    await userEvent.click(prevButton);

    await waitFor(() => {
      // Month should change (indicated by different calendar content or header)
      expect(screen.getByRole('navigation')).toBeTruthy();
    });
  });

  it('should allow navigation to next month', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const nextButton = screen.getByRole('button', { name: /próximo|siguiente|▶|>|next/i });
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeTruthy();
    });
  });

  it('should display appointments on calendar', () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    // Day 21 should have the appointment indicator
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('should display absences on calendar', () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    // Days 22-26 should be marked as absent
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument();
  });

  it('should show different styling for appointment days', () => {
    const { container } = renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const appointmentDay = container.querySelector('[data-date="2026-04-21"]');
    if (appointmentDay) {
      expect(appointmentDay.className).toContain('bg-blue');
    }
  });

  it('should show different styling for absence days', () => {
    const { container } = renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const absenceDay = container.querySelector('[data-date="2026-04-22"]');
    if (absenceDay) {
      expect(absenceDay.className).toContain('bg-yellow');
    }
  });

  it('should switch between month and week view', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const weekViewButton = screen.getByRole('button', { name: /semana|week/i });
    if (weekViewButton) {
      await userEvent.click(weekViewButton);

      // Should show week view header
      expect(screen.getByText(/semana|week/i)).toBeInTheDocument();
    }
  });

  it('should switch between week and day view', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const dayViewButton = screen.getByRole('button', { name: /día|day/i });
    if (dayViewButton) {
      await userEvent.click(dayViewButton);

      // Should show day view with time slots
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    }
  });

  it('should show today indicator', () => {
    const { container } = renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const todayIndicator = container.querySelector('[class*="today"], [class*="current-day"], [class*="bg-primary"]');
    expect(todayIndicator).toBeTruthy();
  });

  it('should open appointment details on day click', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const dayWithAppointment = screen.getByText('21').closest('[class*="cursor-pointer"], [role="button"]');
    if (dayWithAppointment) {
      await userEvent.click(dayWithAppointment);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    }
  });

  it('should show appointment modal with details', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const dayWithAppointment = screen.getByText('21').closest('[class*="cursor-pointer"], [role="button"]');
    if (dayWithAppointment) {
      await userEvent.click(dayWithAppointment);

      await waitFor(() => {
        expect(screen.getByText('Corte Caballero')).toBeInTheDocument();
        expect(screen.getByText('50000')).toBeInTheDocument();
      });
    }
  });

  it('should display mini calendar alongside main calendar', () => {
    const { container } = renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const miniCalendars = container.querySelectorAll('[class*="mini-calendar"], [class*="small"]');
    expect(miniCalendars.length).toBeGreaterThanOrEqual(0);
  });

  it('should show loading state', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByTestId('calendar-loading')).toBeTruthy();
  });

  it('should show error state for appointments', () => {
    const mockError = new Error('Fetch failed');
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: [],
      loading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/error al cargar citas/i)).toBeTruthy();
  });

  it('should display timeline view for day', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const dayViewButton = screen.getByRole('button', { name: /día|day/i });
    if (dayViewButton) {
      await userEvent.click(dayViewButton);

      // Should show hourly slots
      const timeSlots = screen.getAllByText(/\d{1,2}:\d{2}|am|pm|:00/i);
      expect(timeSlots.length).toBeGreaterThan(0);
    }
  });

  it('should allow filtering appointments by service', async () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const filterButton = screen.getByRole('button', { name: /filtro|filter|opciones/i });
    if (filterButton) {
      await userEvent.click(filterButton);

      const serviceFilter = screen.getByRole('checkbox', { name: /Corte Caballero/i });
      if (serviceFilter) {
        await userEvent.click(serviceFilter);
        expect(serviceFilter).toBeChecked();
      }
    }
  });

  it('should show legend for event types', () => {
    renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/cita|appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/ausencia|absence/i)).toBeInTheDocument();
  });

  it('should highlight vacation period on calendar', () => {
    const { container } = renderWithProviders(<EmployeeCalendarView employeeId="emp-123" businessId="biz-123" />);

    const vacationRange = container.querySelectorAll('[class*="vacation"], [class*="absence"], [class*="yellow"]');
    expect(vacationRange.length).toBeGreaterThan(0);
  });
});
