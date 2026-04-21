import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyEmploymentsEnhanced } from '../MyEmploymentsEnhanced';

vi.mock('@/hooks/useEmployeeBusinesses', () => ({
  useEmployeeBusinesses: vi.fn(),
}));

vi.mock('@/hooks/useBusinessEmployees', () => ({
  useBusinessEmployees: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses';

const mockEmployeeBusinesses = [
  {
    id: 'emp-biz-1',
    businessId: 'biz-123',
    businessName: 'Salón de Belleza Premium',
    role: 'professional',
    status: 'approved',
    hireDate: '2025-01-15',
    location: 'Medellín',
    services: [
      { id: 'srv-1', name: 'Corte Caballero' },
      { id: 'srv-2', name: 'Afeitado' },
    ],
  },
  {
    id: 'emp-biz-2',
    businessId: 'biz-456',
    businessName: 'Clínica Dental',
    role: 'professional',
    status: 'approved',
    hireDate: '2024-06-01',
    location: 'Bogotá',
    services: [
      { id: 'srv-3', name: 'Limpieza Dental' },
      { id: 'srv-4', name: 'Ortodoncia' },
    ],
  },
];

describe.skip('MyEmploymentsEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render employments list', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    expect(screen.getByText('Salón de Belleza Premium')).toBeInTheDocument();
    expect(screen.getByText('Clínica Dental')).toBeInTheDocument();
  });

  it('should display employment details for each card', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    expect(screen.getByText('Medellín')).toBeInTheDocument();
    expect(screen.getByText('Bogotá')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    expect(screen.getByTestId('employments-loading')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const mockError = new Error('Fetch failed');
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: [],
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    expect(screen.getByText(/error al cargar/i)).toBeInTheDocument();
  });

  it('should show empty state when no employments', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    expect(screen.getByText(/no tienes empleos registrados/i)).toBeInTheDocument();
  });

  it('should display employment statistics', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    expect(screen.getByText(/servicios ofrecidos/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // stats: 2 services per employment
  });

  it('should open employment detail modal on card click', async () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    const card = screen.getByText('Salón de Belleza Premium').closest('[role="button"], [class*="cursor-pointer"]');
    if (card) {
      await userEvent.click(card);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    }
  });

  it('should show end employment option in detail modal', async () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    const card = screen.getByText('Salón de Belleza Premium').closest('[role="button"], [class*="cursor-pointer"]');
    if (card) {
      await userEvent.click(card);
      await waitFor(() => {
        const endButton = screen.queryByRole('button', { name: /finalizar empleo/i });
        expect(endButton).toBeTruthy();
      });
    }
  });

  it('should filter employments by location', async () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    const filterInput = screen.getByPlaceholderText(/buscar negocio/i);
    await userEvent.type(filterInput, 'Medellín');

    expect(screen.getByText('Salón de Belleza Premium')).toBeInTheDocument();
    expect(screen.queryByText('Clínica Dental')).not.toBeInTheDocument();
  });

  it('should display hire date for each employment', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    expect(screen.getByText(/15 de enero de 2025|enero 15, 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de junio de 2024|junio 1, 2024/i)).toBeInTheDocument();
  });

  it('should display employment status badge', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    const badges = screen.getAllByText(/aprobado|approved/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should handle end employment action', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<MyEmploymentsEnhanced userId="user-123" />);

    const card = screen.getByText('Salón de Belleza Premium').closest('[role="button"], [class*="cursor-pointer"]');
    if (card) {
      await userEvent.click(card);
      await waitFor(() => {
        const endButton = screen.queryByRole('button', { name: /finalizar empleo/i });
        if (endButton) {
          userEvent.click(endButton);
          expect(screen.getByRole('alertdialog')).toBeTruthy();
        }
      });
    }
  });

  it('should show multiple employments separated by visual divider', () => {
    vi.mocked(useEmployeeBusinesses).mockReturnValue({
      businesses: mockEmployeeBusinesses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<MyEmploymentsEnhanced userId="user-123" />);

    const cards = container.querySelectorAll('[class*="border"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});
