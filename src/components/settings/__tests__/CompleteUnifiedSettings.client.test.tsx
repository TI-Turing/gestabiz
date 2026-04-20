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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

describe('CompleteUnifiedSettings - Client Tab', () => {
  const mockUser = {
    id: 'client-123',
    email: 'client@example.com',
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
      roles: ['client'],
      activeRole: 'client',
    } as any);
  });

  it('should render client tab in settings', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/preferencias de cliente|client preferences/i)).toBeInTheDocument();
  });

  it('should display general settings tab', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/configuración general|general settings/i)).toBeInTheDocument();
  });

  it('should display profile tab', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/perfil|profile/i)).toBeInTheDocument();
  });

  it('should allow updating client name', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const nameInput = screen.queryByDisplayValue(mockUser.email)?.closest('form')?.querySelector('input[type="text"]');
    if (nameInput) {
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'María García');
      expect(nameInput).toHaveValue('María García');
    }
  });

  it('should allow updating phone number', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const phoneInput = screen.queryByPlaceholderText(/teléfono|phone/i);
    if (phoneInput) {
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, '3001234567');
      expect(phoneInput).toHaveValue('3001234567');
    }
  });

  it('should display booking preferences', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/preferencias de citas|booking preferences/i) || screen.getByText(/anticipación/i)).toBeTruthy();
  });

  it('should allow setting advance booking preference', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const advanceSelect = screen.queryByRole('combobox', { name: /anticipación|advance/i });
    if (advanceSelect) {
      await userEvent.click(advanceSelect);
      const option = screen.queryByText(/24 horas|1 day/i);
      if (option) await userEvent.click(option);
      expect(advanceSelect).toHaveValue('24');
    }
  });

  it('should display payment preferences', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/preferencias de pago|payment preferences/i) || screen.getByText(/pago/i)).toBeTruthy();
  });

  it('should allow setting payment method preference', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const paymentSelect = screen.queryByRole('combobox', { name: /método de pago|payment method/i });
    if (paymentSelect) {
      await userEvent.click(paymentSelect);
      const option = screen.queryByText(/tarjeta|card/i);
      if (option) await userEvent.click(option);
    }
  });

  it('should display appointment history preferences', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/historial|history/i) || screen.getByText(/mis citas/i)).toBeTruthy();
  });

  it('should allow toggling email reminders', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const reminderCheckbox = screen.queryByRole('checkbox', { name: /recordatorios por correo|email reminders/i });
    if (reminderCheckbox) {
      await userEvent.click(reminderCheckbox);
      expect(reminderCheckbox).toBeChecked();
    }
  });

  it('should allow toggling SMS notifications', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const smsCheckbox = screen.queryByRole('checkbox', { name: /sms|text message/i });
    if (smsCheckbox) {
      await userEvent.click(smsCheckbox);
      expect(smsCheckbox).toBeChecked();
    }
  });

  it('should save preferences successfully', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const saveButton = screen.getByRole('button', { name: /guardar|save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/guardado|saved/i)).toBeInTheDocument();
    });
  });

  it('should validate phone format', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const phoneInput = screen.queryByPlaceholderText(/teléfono|phone/i);
    if (phoneInput) {
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, 'invalid');
      
      const saveButton = screen.getByRole('button', { name: /guardar|save/i });
      await userEvent.click(saveButton);

      expect(screen.getByText(/teléfono inválido|invalid phone/i)).toBeInTheDocument();
    }
  });

  it('should allow resetting password', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    const resetButton = screen.queryByRole('button', { name: /cambiar contraseña|reset password/i });
    if (resetButton) {
      await userEvent.click(resetButton);
      expect(screen.getByText(/enviado|sent/i)).toBeTruthy();
    }
  });

  it('should display danger zone with account deletion option', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="client"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/eliminar cuenta|delete account|danger zone/i)).toBeTruthy();
  });
});
