import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import userEvent from '@testing-library/user-event';
import { EmployeeOnboarding } from '../EmployeeOnboarding';

vi.mock('@/hooks/useEmployeeJoinRequests', () => ({
  useEmployeeJoinRequests: vi.fn(),
}));

vi.mock('@/hooks/useBusinessHierarchy', () => ({
  useBusinessHierarchy: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useEmployeeJoinRequests } from '@/hooks/useEmployeeJoinRequests';
import { toast } from 'sonner';

describe('EmployeeOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: vi.fn(),
      createJoinRequest: vi.fn(),
      requests: [],
      isLoading: false,
      error: null,
    } as any);
  });

  it('should render invite code input field', () => {
    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i);
    expect(input).toBeInTheDocument();
  });

  it('should accept uppercase invite code', async () => {
    const mockClaimCode = vi.fn().mockResolvedValue({
      success: true,
      businessId: 'biz-123',
      businessName: 'Mi Negocio',
    });

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: vi.fn(),
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, 'abc123');

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockClaimCode).toHaveBeenCalledWith(expect.stringContaining('ABC'));
    });
  });

  it('should trim whitespace from invite code', async () => {
    const mockClaimCode = vi.fn().mockResolvedValue({
      success: true,
      businessId: 'biz-123',
      businessName: 'Mi Negocio',
    });

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: vi.fn(),
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, '  abc123  ');

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockClaimCode).toHaveBeenCalledWith('ABC123');
    });
  });

  it('should require code validation before submission', async () => {
    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });

    expect(submitButton).toBeDisabled();
  });

  it('should show error message for invalid code', async () => {
    const mockClaimCode = vi.fn().mockRejectedValue(new Error('Código inválido'));

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: vi.fn(),
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, 'invalid');

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/código inválido|no válido/i)).toBeInTheDocument();
    });
  });

  it('should show confirmation when code is valid', async () => {
    const mockClaimCode = vi.fn().mockResolvedValue({
      success: true,
      businessId: 'biz-123',
      businessName: 'Salón Premium',
    });

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: vi.fn(),
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, 'abc123');

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Salón Premium')).toBeInTheDocument();
    });
  });

  it('should trigger join request after confirming', async () => {
    const mockClaimCode = vi.fn().mockResolvedValue({
      success: true,
      businessId: 'biz-123',
      businessName: 'Salón Premium',
    });
    const mockCreateJoinRequest = vi.fn().mockResolvedValue({ success: true });

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: mockCreateJoinRequest,
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, 'abc123');

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Salón Premium')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirmar|continuar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockCreateJoinRequest).toHaveBeenCalledWith('biz-123');
    });
  });

  it('should show success message after join request', async () => {
    const mockClaimCode = vi.fn().mockResolvedValue({
      success: true,
      businessId: 'biz-123',
      businessName: 'Salón Premium',
    });
    const mockCreateJoinRequest = vi.fn().mockResolvedValue({ success: true });

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: mockCreateJoinRequest,
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, 'abc123');

    let submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Salón Premium')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirmar|continuar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Solicitud enviada'));
    });
  });

  it('should show loading state during code validation', async () => {
    const mockClaimCode = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: vi.fn(),
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, 'abc123');

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    expect(screen.getByTestId('onboarding-loading')).toBeInTheDocument();
  });

  it('should allow manual business search as alternative', async () => {
    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const searchToggle = screen.getByRole('button', { name: /buscar negocio|sin código/i });
    await userEvent.click(searchToggle);

    expect(screen.getByPlaceholderText(/buscar por nombre|categoría/i)).toBeInTheDocument();
  });

  it('should handle RPC errors gracefully', async () => {
    const mockClaimCode = vi.fn().mockRejectedValue(new Error('RPC failed'));

    vi.mocked(useEmployeeJoinRequests).mockReturnValue({
      claimInviteCode: mockClaimCode,
      createJoinRequest: vi.fn(),
      requests: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<EmployeeOnboarding userId="user-123" />);

    const input = screen.getByPlaceholderText(/código de invitación/i) as HTMLInputElement;
    await userEvent.type(input, 'abc123');

    const submitButton = screen.getByRole('button', { name: /unirse|validar|enviar/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error|intenta de nuevo/i)).toBeInTheDocument();
    });
  });
});
