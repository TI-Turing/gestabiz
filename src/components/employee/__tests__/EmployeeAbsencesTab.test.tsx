import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import userEvent from '@testing-library/user-event';
import { EmployeeAbsencesTab } from '../EmployeeAbsencesTab';

// Mock del hook
vi.mock('@/hooks/useEmployeeAbsences', () => ({
  useEmployeeAbsences: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useEmployeeAbsences } from '@/hooks/useEmployeeAbsences';
import type { EmployeeAbsence } from '@/hooks/useEmployeeAbsences';

const mockAbsences: EmployeeAbsence[] = [
  {
    id: 'abs-1',
    absenceType: 'vacation',
    startDate: '2026-04-22',
    endDate: '2026-04-26',
    status: 'pending',
    daysCount: 5,
    approvedBy: null,
    createdAt: '2026-04-20',
  },
  {
    id: 'abs-2',
    absenceType: 'sick_leave',
    startDate: '2026-04-15',
    endDate: '2026-04-16',
    status: 'approved',
    daysCount: 2,
    approvedBy: 'admin-123',
    createdAt: '2026-04-14',
  },
  {
    id: 'abs-3',
    absenceType: 'emergency',
    startDate: '2026-04-10',
    endDate: '2026-04-11',
    status: 'rejected',
    daysCount: 2,
    approvedBy: null,
    createdAt: '2026-04-09',
  },
];

describe.skip('EmployeeAbsencesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render tabs for different absence statuses', () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    expect(screen.getByRole('tab', { name: /pendiente/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aprobada/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /rechazada/i })).toBeInTheDocument();
  });

  it('should display pending absences in pending tab', async () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    const pendingTab = screen.getByRole('tab', { name: /pendiente/i });
    await userEvent.click(pendingTab);

    expect(screen.getByText('Vacaciones')).toBeInTheDocument();
    expect(screen.getByText(/22 de abril - 26 de abril/i)).toBeInTheDocument();
  });

  it('should display approved absences in approved tab', async () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    const approvedTab = screen.getByRole('tab', { name: /aprobada/i });
    await userEvent.click(approvedTab);

    expect(screen.getByText('Ausencia Médica')).toBeInTheDocument();
  });

  it('should display rejected absences in rejected tab', async () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    const rejectedTab = screen.getByRole('tab', { name: /rechazada/i });
    await userEvent.click(rejectedTab);

    expect(screen.getByText('Emergencia')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: [],
      isLoading: true,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    expect(screen.getByTestId('absences-loading')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const mockError = new Error('Fetch failed');
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: [],
      isLoading: false,
      error: mockError,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    expect(screen.getByText(/error al cargar/i)).toBeInTheDocument();
  });

  it('should show empty state when no absences', () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: [],
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    expect(screen.getByText(/no tienes solicitudes de ausencia/i)).toBeInTheDocument();
  });

  it('should cancel pending absence with confirmation', async () => {
    const mockCancelAbsence = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: mockCancelAbsence,
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    const pendingTab = screen.getByRole('tab', { name: /pendiente/i });
    await userEvent.click(pendingTab);

    const cancelButton = screen.getAllByRole('button', { name: /cancelar solicitud/i })[0];
    await userEvent.click(cancelButton);

    // Confirm in alert dialog
    const confirmButton = screen.getByRole('button', { name: /continuar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockCancelAbsence).toHaveBeenCalledWith('abs-1');
    });
  });

  it('should disable cancel button for approved/rejected absences', async () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    const approvedTab = screen.getByRole('tab', { name: /aprobada/i });
    await userEvent.click(approvedTab);

    const cancelButtons = screen.queryAllByRole('button', { name: /cancelar solicitud/i });
    expect(cancelButtons.length).toBe(0);
  });

  it('should display day count correctly', async () => {
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: vi.fn(),
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    const pendingTab = screen.getByRole('tab', { name: /pendiente/i });
    await userEvent.click(pendingTab);

    expect(screen.getByText('5 días')).toBeInTheDocument();
  });

  it('should handle cancel error gracefully', async () => {
    const mockError = new Error('Cancel failed');
    const mockCancelAbsence = vi.fn().mockRejectedValue(mockError);
    vi.mocked(useEmployeeAbsences).mockReturnValue({
      absences: mockAbsences,
      isLoading: false,
      error: null,
      cancelAbsence: mockCancelAbsence,
    });

    renderWithProviders(<EmployeeAbsencesTab employeeId="emp-123" businessId="biz-456" />);

    const pendingTab = screen.getByRole('tab', { name: /pendiente/i });
    await userEvent.click(pendingTab);

    const cancelButton = screen.getAllByRole('button', { name: /cancelar solicitud/i })[0];
    await userEvent.click(cancelButton);

    const confirmButton = screen.getByRole('button', { name: /continuar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/error al cancelar/i)).toBeInTheDocument();
    });
  });
});
