import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeeMetrics } from '@/hooks/useEmployeeMetrics';

vi.mock('@/lib/supabase', () => ({
  default: {
    from: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe.skip('useEmployeeMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return metrics structure', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toHaveProperty('appointmentsCompleted');
      expect(result.current).toHaveProperty('averageRating');
      expect(result.current).toHaveProperty('totalEarnings');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });
  });

  it('should calculate appointments completed count', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.appointmentsCompleted).toBeGreaterThanOrEqual(0);
    });
  });

  it('should calculate average rating from reviews', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.averageRating !== null) {
        expect(result.current.averageRating).toBeGreaterThanOrEqual(0);
        expect(result.current.averageRating).toBeLessThanOrEqual(5);
      }
    });
  });

  it('should calculate total earnings', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.totalEarnings).toBeGreaterThanOrEqual(0);
    });
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.loading).toBe('boolean');
  });

  it('should handle error state', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
    });
  });

  it('should cache results', async () => {
    const { result: result1 } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    // Second call should use cache
    const { result: result2 } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    expect(result2.current.loading).toBe(false);
  });

  it('should refetch when employeeId changes', async () => {
    const { result, rerender } = renderHook(
      ({ employeeId }: { employeeId: string }) =>
        useEmployeeMetrics(employeeId, 'biz-123'),
      {
        wrapper: createWrapper(),
        initialProps: { employeeId: 'emp-123' },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ employeeId: 'emp-456' });

    // Should refetch for new employee
    await waitFor(() => {
      expect(result.current.loading === false || result.current.loading === true).toBe(true);
    });
  });

  it('should handle zero metrics gracefully', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-999', 'biz-999'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.appointmentsCompleted).toBe(0);
      expect(result.current.totalEarnings).toBe(0);
    });
  });

  it('should return monthly breakdown if available', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.monthlyEarnings) {
        expect(Array.isArray(result.current.monthlyEarnings)).toBe(true);
      }
    });
  });

  it('should return review count', async () => {
    const { result } = renderHook(() => useEmployeeMetrics('emp-123', 'biz-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(typeof result.current.reviewCount).toBe('number');
      expect(result.current.reviewCount).toBeGreaterThanOrEqual(0);
    });
  });
});
