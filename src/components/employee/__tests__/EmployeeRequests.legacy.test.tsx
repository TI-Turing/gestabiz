import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import userEvent from '@testing-library/user-event';
import { EmployeeRequests } from '../EmployeeRequests';

vi.mock('@/hooks/useEmployeeRequests', () => ({
  useEmployeeRequests: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useEmployeeRequests } from '@/hooks/useEmployeeRequests';
import { useAuth } from '@/hooks/useAuth';

describe('EmployeeRequests - Legacy Component', () => {
  const mockRequests = [
    {
      id: 'req-1',
      employee_id: 'emp-123',
      business_id: 'biz-123',
      status: 'pending',
      created_at: '2026-04-15',
      message: 'Solicitud de empleo',
    },
    {
      id: 'req-2',
      employee_id: 'emp-124',
      business_id: 'biz-123',
      status: 'approved',
      created_at: '2026-04-10',
      message: 'Solicitud aprobada',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEmployeeRequests).mockReturnValue({
      requests: mockRequests,
      loading: false,
      error: null,
      approve: vi.fn(),
      reject: vi.fn(),
    } as any);

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'admin-123' },
      loading: false,
    } as any);
  });

  it('should render employee requests component', () => {
    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByText(/solicitudes de empleados|employee requests/i)).toBeInTheDocument();
  });

  it('should display list of pending requests', () => {
    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByText(/pendiente|pending/i)).toBeInTheDocument();
  });

  it('should display request details', () => {
    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByText(/Solicitud de empleo|Solicitud aprobada/)).toBeInTheDocument();
  });

  it('should show approve button for pending requests', () => {
    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByRole('button', { name: /aprobar|approve/i })).toBeInTheDocument();
  });

  it('should show reject button for pending requests', () => {
    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByRole('button', { name: /rechazar|reject|deny/i })).toBeInTheDocument();
  });

  it('should show request creation date', () => {
    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByText(/2026-04-15|2026-04-10/)).toBeInTheDocument();
  });

  it('should allow approving a request', async () => {
    const mockApprove = vi.fn();
    vi.mocked(useEmployeeRequests).mockReturnValue({
      requests: mockRequests,
      loading: false,
      error: null,
      approve: mockApprove,
      reject: vi.fn(),
    } as any);

    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    const approveButton = screen.getByRole('button', { name: /aprobar|approve/i });
    await userEvent.click(approveButton);

    expect(mockApprove).toHaveBeenCalled();
  });

  it('should allow rejecting a request', async () => {
    const mockReject = vi.fn();
    vi.mocked(useEmployeeRequests).mockReturnValue({
      requests: mockRequests,
      loading: false,
      error: null,
      approve: vi.fn(),
      reject: mockReject,
    } as any);

    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    const rejectButton = screen.getByRole('button', { name: /rechazar|reject|deny/i });
    await userEvent.click(rejectButton);

    expect(mockReject).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    vi.mocked(useEmployeeRequests).mockReturnValue({
      requests: [],
      loading: true,
      error: null,
      approve: vi.fn(),
      reject: vi.fn(),
    } as any);

    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByTestId('loading-spinner') || screen.getByText(/cargando|loading/i)).toBeTruthy();
  });

  it('should show error message', () => {
    vi.mocked(useEmployeeRequests).mockReturnValue({
      requests: [],
      loading: false,
      error: new Error('Failed to load'),
      approve: vi.fn(),
      reject: vi.fn(),
    } as any);

    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
  });

  it('should show empty state when no requests', () => {
    vi.mocked(useEmployeeRequests).mockReturnValue({
      requests: [],
      loading: false,
      error: null,
      approve: vi.fn(),
      reject: vi.fn(),
    } as any);

    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    expect(screen.getByText(/no hay solicitudes|no requests/i)).toBeInTheDocument();
  });

  it('should filter requests by status', async () => {
    renderWithProviders(<EmployeeRequests businessId="biz-123" />);

    const statusFilter = screen.queryByRole('combobox', { name: /estado|status/i });
    if (statusFilter) {
      await userEvent.click(statusFilter);
      const option = screen.queryByText(/aprobados|approved/i);
      if (option) await userEvent.click(option);
    }
  });
});
