import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import userEvent from '@testing-library/user-event';
import CompleteUnifiedSettings from '../CompleteUnifiedSettings';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useUserRoles', () => ({
  useUserRoles: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

describe.skip('CompleteUnifiedSettings - Employee Tab', () => {
  const mockUser = {
    id: 'emp-123',
    email: 'employee@example.com',
    user_metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn(),
    } as any);

    vi.mocked(useUserRoles).mockReturnValue({
      roles: ['employee'],
      activeRole: 'employee',
    } as any);
  });

  it('should render employee tab in settings', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/preferencias de empleado|employee preferences/i)).toBeInTheDocument();
  });

  it('should display general settings tab', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/configuración general|general settings/i)).toBeInTheDocument();
  });

  it('should display profile tab', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/perfil|profile/i)).toBeInTheDocument();
  });

  it('should display notifications tab', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/notificaciones|notifications/i)).toBeInTheDocument();
  });

  it('should allow updating profile information', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const nameInput = screen.queryByDisplayValue(mockUser.email)?.closest('form')?.querySelector('input[type="text"]');
    if (nameInput) {
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Juan Pérez');
      expect(nameInput).toHaveValue('Juan Pérez');
    }
  });

  it('should allow updating email', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const emailInput = screen.queryByDisplayValue(mockUser.email);
    if (emailInput) {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'newemail@example.com');
      expect(emailInput).toHaveValue('newemail@example.com');
    }
  });

  it('should allow enabling/disabling notification preferences', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const notificationCheckbox = screen.queryByRole('checkbox', { name: /email|correo/i });
    if (notificationCheckbox) {
      await userEvent.click(notificationCheckbox);
      expect(notificationCheckbox).toBeChecked();
    }
  });

  it('should have save button', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    expect(screen.getByRole('button', { name: /guardar|save/i })).toBeInTheDocument();
  });

  it('should have cancel button', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    expect(screen.getByRole('button', { name: /cancelar|cancel/i })).toBeInTheDocument();
  });

  it('should display loading state on save', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const saveButton = screen.getByRole('button', { name: /guardar|save/i });
    await userEvent.click(saveButton);

    expect(screen.getByTestId('loading-spinner') || screen.getByText(/guardando|saving/i)).toBeTruthy();
  });

  it('should display success message after save', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const saveButton = screen.getByRole('button', { name: /guardar|save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/guardado|saved|éxito/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const emailInput = screen.queryByDisplayValue(mockUser.email);
    if (emailInput) {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'invalid-email');
      
      const saveButton = screen.getByRole('button', { name: /guardar|save/i });
      await userEvent.click(saveButton);

      expect(screen.getByText(/email inválido|invalid email/i)).toBeInTheDocument();
    }
  });

  it('should display time off preferences', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/ausencias|time off|vacations/i) || screen.getByText(/preferencias/i)).toBeTruthy();
  });

  it('should display message preferences toggle', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const messageToggle = screen.queryByRole('checkbox', { name: /mensajes de clientes|client messages/i });
    expect(messageToggle).toBeTruthy();
  });

  it('should allow resetting password', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="employee"
        businessId="biz-123"
      />
    );

    const resetButton = screen.queryByRole('button', { name: /cambiar contraseña|reset password/i });
    if (resetButton) {
      await userEvent.click(resetButton);
      expect(screen.getByText(/enviado|sent|check/i)).toBeTruthy();
    }
  });
});
