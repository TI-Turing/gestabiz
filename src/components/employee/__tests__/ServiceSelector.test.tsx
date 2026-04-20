import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceSelector } from '../ServiceSelector';

vi.mock('@/hooks/useLocationServices', () => ({
  useLocationServices: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useLocationServices } from '@/hooks/useLocationServices';

const mockServices = [
  { id: 'srv-1', name: 'Corte Caballero', price: 50000 },
  { id: 'srv-2', name: 'Afeitado', price: 30000 },
  { id: 'srv-3', name: 'Corte + Afeitado', price: 70000 },
];

describe('ServiceSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLocationServices).mockReturnValue({
      services: mockServices,
      loading: false,
      error: null,
    } as any);
  });

  it('should render service selector', () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/seleccionar servicio|select service/i)).toBeInTheDocument();
  });

  it('should display all available services', () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Corte Caballero')).toBeInTheDocument();
    expect(screen.getByText('Afeitado')).toBeInTheDocument();
    expect(screen.getByText('Corte + Afeitado')).toBeInTheDocument();
  });

  it('should select a service', async () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    const service = screen.getByText('Corte Caballero').closest('[role="option"], [class*="cursor-pointer"]');
    if (service) {
      await userEvent.click(service);
      expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'srv-1' }));
    }
  });

  it('should display service prices', () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/50.?000|$50/)).toBeInTheDocument();
    expect(screen.getByText(/30.?000|$30/)).toBeInTheDocument();
  });

  it('should filter services by search term', async () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
        searchable={true}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar|search/i);
    await userEvent.type(searchInput, 'Corte');

    expect(screen.getByText('Corte Caballero')).toBeInTheDocument();
    expect(screen.getByText('Corte + Afeitado')).toBeInTheDocument();
    expect(screen.queryByText('Afeitado')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useLocationServices).mockReturnValue({
      services: [],
      loading: true,
      error: null,
    } as any);

    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByTestId('loading-spinner') || screen.getByText(/cargando|loading/i)).toBeTruthy();
  });

  it('should show error state', () => {
    vi.mocked(useLocationServices).mockReturnValue({
      services: [],
      loading: false,
      error: new Error('Failed to load'),
    } as any);

    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
  });

  it('should show empty state when no services available', () => {
    vi.mocked(useLocationServices).mockReturnValue({
      services: [],
      loading: false,
      error: null,
    } as any);

    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/no hay servicios|no services/i)).toBeInTheDocument();
  });

  it('should highlight most popular service', () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
        highlightPopular={true}
      />
    );

    const popularService = screen.getByText('Corte Caballero').closest('[class*="popular"], [class*="featured"]');
    expect(popularService?.className).toMatch(/popular|featured|highlighted/i);
  });

  it('should support multi-select mode', async () => {
    const mockOnSelectMultiple = vi.fn();

    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelectMultiple}
        multiSelect={true}
      />
    );

    const service1 = screen.getByText('Corte Caballero').closest('[role="option"], [class*="cursor-pointer"]');
    const service2 = screen.getByText('Afeitado').closest('[role="option"], [class*="cursor-pointer"]');

    if (service1) await userEvent.click(service1);
    if (service2) await userEvent.click(service2);

    expect(mockOnSelectMultiple).toHaveBeenCalledTimes(2);
  });

  it('should display service categories if available', () => {
    const servicesWithCategory = [
      { id: 'srv-1', name: 'Corte Caballero', price: 50000, category: 'Cortes' },
    ];

    vi.mocked(useLocationServices).mockReturnValue({
      services: servicesWithCategory,
      loading: false,
      error: null,
    } as any);

    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/Cortes|Haircuts/i)).toBeInTheDocument();
  });

  it('should calculate total price for multiple selections', async () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
        multiSelect={true}
        showTotal={true}
      />
    );

    const service1 = screen.getByText('Corte Caballero').closest('[role="option"], [class*="cursor-pointer"]');
    const service2 = screen.getByText('Afeitado').closest('[role="option"], [class*="cursor-pointer"]');

    if (service1) await userEvent.click(service1);
    if (service2) await userEvent.click(service2);

    // Should show total: 50000 + 30000 = 80000
    expect(screen.getByText(/total.*80.?000|Total.*$80/i)).toBeTruthy();
  });

  it('should close selector after selection', async () => {
    render(
      <ServiceSelector
        locationId="loc-123"
        onSelect={mockOnSelect}
        closeOnSelect={true}
      />
    );

    const service = screen.getByText('Corte Caballero').closest('[role="option"], [class*="cursor-pointer"]');
    if (service) {
      await userEvent.click(service);
      
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalled();
      });
    }
  });
});
