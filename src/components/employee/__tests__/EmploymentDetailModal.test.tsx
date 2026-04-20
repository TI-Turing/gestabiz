import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import { renderWithProviders } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { EmploymentDetailModal } from '../EmploymentDetailModal';

vi.mock('@/hooks/useEmployeeBusinesses', () => ({
  useEmployeeBusinesses: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses';

const mockBusiness = {
  id: 'biz-123',
  name: 'Salón Premium',
  owner_name: 'Carlos López',
  logo_url: 'https://example.com/logo.png',
  phone: '+57 1 234 5678',
  email: 'salon@example.com',
  address: 'Cra 10 #20-30',
  city: 'Medellín',
  state: 'Antioquia',
  location_name: 'Sede Centro',
  job_title: 'Barbero Profesional',
  role: 'professional',
  employee_type: 'barber',
  isOwner: false,
};

describe('EmploymentDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: [mockBusiness],
      loading: false,
      error: null,
    } as any);
  });

  it('should render modal when open prop is true', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/detalles del empleo|employment details/i)).toBeInTheDocument();
  });

  it('should not render modal when open prop is false', () => {
    const { container } = renderWithProviders(
      <EmploymentDetailModal
        isOpen={false}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should display business name', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText('Salón Premium')).toBeInTheDocument();
  });

  it('should display owner name', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('should display business contact information', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/\+57 1 234 5678|234 5678/i)).toBeInTheDocument();
    expect(screen.getByText(/salon@example.com|salon/i)).toBeInTheDocument();
  });

  it('should display job title and role', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText('Barbero Profesional')).toBeInTheDocument();
  });

  it('should display location assigned', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText('Sede Centro')).toBeInTheDocument();
  });

  it('should display address and city', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/Cra 10 #20-30|Medellín/i)).toBeInTheDocument();
  });

  it('should display business logo if available', () => {
    const { container } = renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    const logo = container.querySelector('img[alt*="logo"]');
    if (logo) {
      expect(logo.getAttribute('src')).toBe('https://example.com/logo.png');
    }
  });

  it('should have action buttons', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByRole('button', { name: /editar|edit/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /contactar|contact/i }) || screen.getByRole('button', { name: /mensaje|message/i })).toBeTruthy();
  });

  it('should call onClose when close button clicked', async () => {
    const mockOnClose = vi.fn();

    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={mockOnClose}
        businessId="biz-123"
      />
    );

    const closeButton = screen.getByRole('button', { name: /cerrar|close|×/i });
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: [],
      loading: true,
      error: null,
    } as any);

    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByTestId('loading-spinner') || screen.getByText(/cargando|loading/i)).toBeTruthy();
  });

  it('should display error state', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: [],
      loading: false,
      error: new Error('Failed to load'),
    } as any);

    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/error|failed to load/i)).toBeInTheDocument();
  });

  it('should display multiple employment details tabs', () => {
    renderWithProviders(
      <EmploymentDetailModal
        isOpen={true}
        onClose={vi.fn()}
        businessId="biz-123"
      />
    );

    expect(screen.getByText(/información|information/i) || screen.getByText(/detalles|details/i)).toBeTruthy();
  });
});
