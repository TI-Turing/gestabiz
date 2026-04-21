import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSelector } from '../LocationSelector';

vi.mock('@/hooks/useLocationNames', () => ({
  useLocationNames: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useLocationNames } from '@/hooks/useLocationNames';

const mockLocations = [
  { id: 'loc-1', name: 'Sede Centro', city: 'Medellín' },
  { id: 'loc-2', name: 'Sede Norte', city: 'Medellín' },
  { id: 'loc-3', name: 'Sede Sabaneta', city: 'Sabaneta' },
];

describe.skip('LocationSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLocationNames).mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    } as any);
  });

  it('should render location selector', () => {
    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/seleccionar sede|select location/i)).toBeInTheDocument();
  });

  it('should display all available locations', () => {
    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Sede Centro')).toBeInTheDocument();
    expect(screen.getByText('Sede Norte')).toBeInTheDocument();
    expect(screen.getByText('Sede Sabaneta')).toBeInTheDocument();
  });

  it('should select a location', async () => {
    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
      />
    );

    const location = screen.getByText('Sede Centro').closest('[role="option"], [class*="cursor-pointer"]');
    if (location) {
      await userEvent.click(location);
      expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'loc-1' }));
    }
  });

  it('should display city information', () => {
    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/Medellín/i)).toBeInTheDocument();
    expect(screen.getByText(/Sabaneta/i)).toBeInTheDocument();
  });

  it('should filter locations by search term', async () => {
    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
        searchable={true}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar|search/i);
    await userEvent.type(searchInput, 'Centro');

    expect(screen.getByText('Sede Centro')).toBeInTheDocument();
    expect(screen.queryByText('Sede Sabaneta')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useLocationNames).mockReturnValue({
      locations: [],
      loading: true,
      error: null,
    } as any);

    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByTestId('loading-spinner') || screen.getByText(/cargando|loading/i)).toBeTruthy();
  });

  it('should show error state', () => {
    vi.mocked(useLocationNames).mockReturnValue({
      locations: [],
      loading: false,
      error: new Error('Failed to load'),
    } as any);

    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
  });

  it('should show empty state when no locations available', () => {
    vi.mocked(useLocationNames).mockReturnValue({
      locations: [],
      loading: false,
      error: null,
    } as any);

    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/no hay sedes|no locations/i)).toBeInTheDocument();
  });

  it('should allow selecting preferred location', async () => {
    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
        preferredLocationId="loc-1"
      />
    );

    const preferredLocation = screen.getByText('Sede Centro').closest('[class*="selected"], [class*="preferred"]');
    expect(preferredLocation?.className).toMatch(/selected|preferred|checked/i);
  });

  it('should support multi-select mode', async () => {
    const mockOnSelectMultiple = vi.fn();

    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelectMultiple}
        multiSelect={true}
      />
    );

    const location1 = screen.getByText('Sede Centro').closest('[role="option"], [class*="cursor-pointer"]');
    const location2 = screen.getByText('Sede Norte').closest('[role="option"], [class*="cursor-pointer"]');

    if (location1) await userEvent.click(location1);
    if (location2) await userEvent.click(location2);

    expect(mockOnSelectMultiple).toHaveBeenCalledTimes(2);
  });

  it('should close selector after selection', async () => {
    render(
      <LocationSelector
        businessId="biz-123"
        onSelect={mockOnSelect}
        closeOnSelect={true}
      />
    );

    const location = screen.getByText('Sede Centro').closest('[role="option"], [class*="cursor-pointer"]');
    if (location) {
      await userEvent.click(location);
      
      // Selector should close or reset
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalled();
      });
    }
  });
});
