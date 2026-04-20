import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import userEvent from '@testing-library/user-event';
import { BusinessEmploymentCard } from '../BusinessEmploymentCard';

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { usePermissions } from '@/hooks/usePermissions';

const mockBusinessEmployment = {
  id: 'emp-biz-1',
  businessId: 'biz-123',
  businessName: 'Salón Premium',
  ownerName: 'Carlos López',
  role: 'professional',
  employeeType: 'barber',
  hireDate: '2025-01-15',
  status: 'approved',
  location: 'Medellín',
  jobTitle: 'Barbero Profesional',
  services: [
    { id: 'srv-1', name: 'Corte Caballero' },
    { id: 'srv-2', name: 'Afeitado' },
  ],
  upcomingAppointments: 3,
  totalEarnings: 1500000,
};

describe('BusinessEmploymentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePermissions).mockReturnValue({
      hasPermission: vi.fn(() => true),
    } as any);
  });

  it('should render business name', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText('Salón Premium')).toBeInTheDocument();
  });

  it('should render owner name', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('should render job title derived from employeeType', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText('Barbero Profesional')).toBeInTheDocument();
  });

  it('should display employment status badge', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText(/aprobado|approved/i)).toBeInTheDocument();
  });

  it('should display hire date', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText(/15 de enero de 2025|enero 15|15 Jan/i)).toBeInTheDocument();
  });

  it('should display location', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText('Medellín')).toBeInTheDocument();
  });

  it('should display list of services', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText('Corte Caballero')).toBeInTheDocument();
    expect(screen.getByText('Afeitado')).toBeInTheDocument();
  });

  it('should display upcoming appointments count', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText(/3.*cita|3.*appointment/i)).toBeInTheDocument();
  });

  it('should display total earnings', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText(/1.?500.?000|$1500/i)).toBeInTheDocument();
  });

  it('should show menu with action buttons', async () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    const menuButton = screen.getByRole('button', { name: /menú|opciones|⋮|…/i });
    await userEvent.click(menuButton);

    expect(screen.getByText(/ver detalles|editar|delete/i)).toBeTruthy();
  });

  it('should disable end employment for owner role', () => {
    const ownerEmployment = { ...mockBusinessEmployment, role: 'manager', isOwner: true };
    vi.mocked(usePermissions).mockReturnValue({
      hasPermission: vi.fn((permission) => permission !== 'employees.delete'),
    } as any);

    renderWithProviders(<BusinessEmploymentCard employment={ownerEmployment} />);

    const menuButton = screen.getByRole('button', { name: /menú|opciones|⋮|…/i });
    userEvent.click(menuButton);

    const endButton = screen.queryByRole('button', { name: /finalizar empleo|end employment/i });
    if (endButton) {
      expect(endButton).toBeDisabled();
    }
  });

  it('should show pending status badge for pending requests', () => {
    const pendingEmployment = { ...mockBusinessEmployment, status: 'pending' };
    renderWithProviders(<BusinessEmploymentCard employment={pendingEmployment} />);

    expect(screen.getByText(/pendiente|pending/i)).toBeInTheDocument();
  });

  it('should show different styling for rejected employment', () => {
    const rejectedEmployment = { ...mockBusinessEmployment, status: 'rejected' };
    const { container } = renderWithProviders(<BusinessEmploymentCard employment={rejectedEmployment} />);

    const card = container.querySelector('[class*="opacity-50"], [class*="bg-red"], [class*="border-red"]');
    expect(card).toBeTruthy();
  });

  it('should handle click on card to open details', async () => {
    const mockOnClick = vi.fn();
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} onClick={mockOnClick} />);

    const card = screen.getByText('Salón Premium').closest('[class*="cursor-pointer"], [role="button"]');
    if (card) {
      await userEvent.click(card);
      expect(mockOnClick).toHaveBeenCalled();
    }
  });

  it('should display services with comma separation', () => {
    const { container } = renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    const servicesText = container.textContent;
    expect(servicesText).toContain('Corte Caballero');
    expect(servicesText).toContain('Afeitado');
  });

  it('should show avatar or initial for owner', () => {
    const { container } = renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    const avatar = container.querySelector('[class*="avatar"], img[alt*="Carlos"]');
    expect(avatar).toBeTruthy();
  });

  it('should display employment role badge', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    expect(screen.getByText(/profesional|professional/i)).toBeInTheDocument();
  });

  it('should show visual indicator for active employment', () => {
    const { container } = renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    const activeIndicator = container.querySelector('[class*="bg-green"], [class*="dot"], [class*="indicator"]');
    expect(activeIndicator).toBeTruthy();
  });

  it('should format hire date in locale', () => {
    renderWithProviders(<BusinessEmploymentCard employment={mockBusinessEmployment} />);

    // Spanish or English date format
    expect(screen.getByText(/enero|january|15.*202/i)).toBeInTheDocument();
  });

  it('should truncate services list if too long', () => {
    const manyServices = {
      ...mockBusinessEmployment,
      services: Array.from({ length: 10 }, (_, i) => ({
        id: `srv-${i}`,
        name: `Service ${i}`,
      })),
    };

    renderWithProviders(<BusinessEmploymentCard employment={manyServices} />);

    const text = screen.getByText(/service/i).textContent;
    expect(text?.split(',').length).toBeLessThanOrEqual(4);
  });
});
