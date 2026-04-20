import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeOffRequestModal } from '../TimeOffRequestModal';

vi.mock('@/hooks/useEmployeeTimeOff', () => ({
  useEmployeeTimeOff: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useEmployeeTimeOff } from '@/hooks/useEmployeeTimeOff';

describe('TimeOffRequestModal', () => {
  const mockCreateRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEmployeeTimeOff).mockReturnValue({
      createRequest: mockCreateRequest,
      requests: [],
      loading: false,
      error: null,
    } as any);
  });

  it('should render modal when open prop is true', () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    expect(screen.getByText(/solicitar ausencia|request time off/i)).toBeInTheDocument();
  });

  it('should not render modal when open prop is false', () => {
    const { container } = render(
      <TimeOffRequestModal
        isOpen={false}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should display time off type options', () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    expect(screen.getByText(/vacaciones|vacation/i)).toBeInTheDocument();
    expect(screen.getByText(/ausencia médica|sick leave/i)).toBeInTheDocument();
  });

  it('should select start date', async () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const startDateInput = screen.getByLabelText(/fecha inicio|start date/i);
    if (startDateInput) {
      await userEvent.click(startDateInput);
      await userEvent.type(startDateInput, '20/04/2026');
    }
  });

  it('should select end date', async () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const endDateInput = screen.getByLabelText(/fecha fin|end date/i);
    if (endDateInput) {
      await userEvent.click(endDateInput);
      await userEvent.type(endDateInput, '22/04/2026');
    }
  });

  it('should validate date range', async () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const submitButton = screen.getByRole('button', { name: /solicitar|request|submit/i });
    await userEvent.click(submitButton);

    // Should show validation error if dates are invalid
    expect(screen.queryByText(/fecha inválida|invalid date/i)).toBeTruthy();
  });

  it('should submit time off request', async () => {
    mockCreateRequest.mockResolvedValueOnce({ success: true });

    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const vacationTypeButton = screen.getByRole('button', { name: /vacaciones/i });
    await userEvent.click(vacationTypeButton);

    const submitButton = screen.getByRole('button', { name: /solicitar|submit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalled();
    });
  });

  it('should display reason/notes field', () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const notesField = screen.getByPlaceholderText(/notas|reason|notes/i);
    expect(notesField).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const mockOnClose = vi.fn();

    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={mockOnClose}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar|cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    mockCreateRequest.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const submitButton = screen.getByRole('button', { name: /solicitar|submit/i });
    await userEvent.click(submitButton);

    expect(screen.getByTestId('loading-spinner') || screen.getByText(/cargando|loading/i)).toBeTruthy();
  });

  it('should show error message on failure', async () => {
    mockCreateRequest.mockRejectedValueOnce(new Error('Network error'));

    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
      />
    );

    const submitButton = screen.getByRole('button', { name: /solicitar|submit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('should limit end date to max days allowed', () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
        maxDays={15}
      />
    );

    expect(screen.getByText(/máximo 15 días|max 15 days/i)).toBeInTheDocument();
  });

  it('should show available vacation days balance', () => {
    render(
      <TimeOffRequestModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
        employeeId="emp-123"
        availableDays={10}
      />
    );

    expect(screen.getByText(/10.*días disponibles|10.*days available/i)).toBeInTheDocument();
  });
});
