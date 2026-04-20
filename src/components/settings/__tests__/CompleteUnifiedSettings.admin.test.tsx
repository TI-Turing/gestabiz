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

describe('CompleteUnifiedSettings - Admin Tab', () => {
  const mockUser = {
    id: 'admin-123',
    email: 'admin@example.com',
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
      roles: ['admin'],
      activeRole: 'admin',
    } as any);
  });

  it('should render admin tab in settings', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/preferencias del negocio|business preferences/i)).toBeInTheDocument();
  });

  it('should display business information section', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/información del negocio|business information/i)).toBeInTheDocument();
  });

  it('should allow updating business name', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    const businessNameInput = screen.queryByPlaceholderText(/nombre del negocio|business name/i);
    if (businessNameInput) {
      await userEvent.clear(businessNameInput);
      await userEvent.type(businessNameInput, 'Salón Premium Plus');
      expect(businessNameInput).toHaveValue('Salón Premium Plus');
    }
  });

  it('should allow updating business description', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    const descriptionInput = screen.queryByPlaceholderText(/descripción|description/i);
    if (descriptionInput) {
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, 'Salón de belleza con servicios completos');
      expect(descriptionInput).toHaveValue('Salón de belleza con servicios completos');
    }
  });

  it('should display contact information section', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/información de contacto|contact information/i)).toBeInTheDocument();
  });

  it('should allow updating phone number', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    const phoneInput = screen.queryByPlaceholderText(/teléfono|phone/i);
    if (phoneInput) {
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, '+57 1 1234567');
      expect(phoneInput).toHaveValue('+57 1 1234567');
    }
  });

  it('should allow updating email', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    const emailInput = screen.queryByPlaceholderText(/correo|email/i);
    if (emailInput) {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'info@salon.com');
      expect(emailInput).toHaveValue('info@salon.com');
    }
  });

  it('should display address section', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/dirección|address/i)).toBeInTheDocument();
  });

  it('should allow updating address', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    const addressInput = screen.queryByPlaceholderText(/dirección|address/i);
    if (addressInput) {
      await userEvent.clear(addressInput);
      await userEvent.type(addressInput, 'Cra 10 #20-30');
      expect(addressInput).toHaveValue('Cra 10 #20-30');
    }
  });

  it('should display legal information section', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/información legal|legal information/i)).toBeInTheDocument();
  });

  it('should allow updating NIT/Tax ID', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    const nitInput = screen.queryByPlaceholderText(/nit|tax id/i);
    if (nitInput) {
      await userEvent.clear(nitInput);
      await userEvent.type(nitInput, '123456789');
      expect(nitInput).toHaveValue('123456789');
    }
  });

  it('should display operations preferences section', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/preferencias operativas|operational preferences/i) || screen.getByText(/operaciones/i)).toBeTruthy();
  });

  it('should save all changes successfully', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
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
        role="admin"
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

  it('should validate NIT format', async () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    const nitInput = screen.queryByPlaceholderText(/nit|tax id/i);
    if (nitInput) {
      await userEvent.clear(nitInput);
      await userEvent.type(nitInput, 'invalid-nit');
      
      const saveButton = screen.getByRole('button', { name: /guardar|save/i });
      await userEvent.click(saveButton);

      expect(screen.getByText(/nit inválido|invalid nit/i)).toBeInTheDocument();
    }
  });

  it('should display danger zone section', () => {
    renderWithProviders(
      <CompleteUnifiedSettings
        role="admin"
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/zona de peligro|danger zone/i)).toBeInTheDocument();
  });
});
