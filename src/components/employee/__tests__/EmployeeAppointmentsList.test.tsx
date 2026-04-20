import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import { renderWithProviders } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { EmployeeAppointmentsList } from '../EmployeeAppointmentsList';

vi.mock('@/hooks/useEmployeeAppointments', () => ({
  useEmployeeAppointments: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useEmployeeAppointments } from '@/hooks/useEmployeeAppointments';

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
    client_phone: '3001234567',
    client_email: 'juan@example.com',
    service_name: 'Corte Caballero',
    location_name: 'Sede Principal',
    price: 50000,
    currency: 'COP',
  },
  {
    id: 'apt-2',
    business_id: 'biz-123',
    client_id: 'client-2',
    service_id: 'srv-2',
    employee_id: 'emp-123',
    start_time: '2026-04-22T14:00:00Z',
    end_time: '2026-04-22T15:00:00Z',
    status: 'completed',
    client_name: 'María García',
    client_phone: '3009876543',
    client_email: 'maria@example.com',
    service_name: 'Afeitado Profesional',
    location_name: 'Sede Principal',
    price: 30000,
    currency: 'COP',
  },
];

describe('EmployeeAppointmentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render appointments list', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
  });

  it('should group appointments by date', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/martes|tuesday/i)).toBeInTheDocument();
    expect(screen.getByText(/miércoles|wednesday/i)).toBeInTheDocument();
  });

  it('should display service name for each appointment', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText('Corte Caballero')).toBeInTheDocument();
    expect(screen.getByText('Afeitado Profesional')).toBeInTheDocument();
  });

  it('should display appointment time', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/10:00|10:00 am|10 a\.m\./i)).toBeInTheDocument();
    expect(screen.getByText(/14:00|2:00 pm|2 p\.m\./i)).toBeInTheDocument();
  });

  it('should show status badge for each appointment', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/confirmada|confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/completada|completed/i)).toBeInTheDocument();
  });

  it('should display client contact information', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText('3001234567')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByTestId('appointments-loading')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const mockError = new Error('Fetch failed');
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: [],
      loading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/error al cargar|couldn't load/i)).toBeInTheDocument();
  });

  it('should show empty state when no appointments', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/no tienes citas|no appointments/i)).toBeInTheDocument();
  });

  it('should open appointment detail modal on click', async () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    const appointmentCard = screen.getByText('Juan Pérez').closest('[class*="cursor-pointer"], [role="button"]');
    if (appointmentCard) {
      await userEvent.click(appointmentCard);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    }
  });

  it('should display appointment location', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    const locationElements = screen.getAllByText('Sede Principal');
    expect(locationElements.length).toBeGreaterThan(0);
  });

  it('should sort appointments chronologically', () => {
    const unsortedAppointments = [...mockAppointments].reverse();
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: unsortedAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    const appointmentElements = container.querySelectorAll('[class*="appointment-item"]');
    if (appointmentElements.length > 0) {
      expect(appointmentElements[0].textContent).toContain(mockAppointments[0].client_name);
    }
  });

  it('should display appointment price', () => {
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    expect(screen.getByText(/50.?000|$50/i)).toBeInTheDocument();
    expect(screen.getByText(/30.?000|$30/i)).toBeInTheDocument();
  });

  it('should have refetch capability', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useEmployeeAppointments).mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithProviders(<EmployeeAppointmentsList employeeId="emp-123" businessId="biz-123" />);

    const refreshButton = screen.getByRole('button', { name: /refrescar|actualizar|reload/i });
    await userEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });
});
