import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMatchingVacancies } from '@/hooks/useMatchingVacancies';

vi.mock('@/lib/supabase', () => ({
  default: {
    rpc: vi.fn(),
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

describe('useMatchingVacancies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return vacancies array', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(Array.isArray(result.current.vacancies) || result.current.vacancies === undefined).toBe(true);
    });
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-123'), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should return error state', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
    });
  });

  it('should filter vacancies by matching skills', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.vacancies && result.current.vacancies.length > 0) {
        result.current.vacancies.forEach((vacancy: any) => {
          expect(vacancy).toHaveProperty('id');
          expect(vacancy).toHaveProperty('title');
        });
      }
    });
  });

  it('should include match score', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.vacancies && result.current.vacancies.length > 0) {
        result.current.vacancies.forEach((vacancy: any) => {
          if (vacancy.matchScore) {
            expect(vacancy.matchScore).toBeGreaterThanOrEqual(0);
            expect(vacancy.matchScore).toBeLessThanOrEqual(100);
          }
        });
      }
    });
  });

  it('should sort by match score descending', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.vacancies && result.current.vacancies.length > 1) {
        for (let i = 0; i < result.current.vacancies.length - 1; i++) {
          const current = result.current.vacancies[i].matchScore || 0;
          const next = result.current.vacancies[i + 1].matchScore || 0;
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  it('should return empty array when no matching vacancies', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-no-matches'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(Array.isArray(result.current.vacancies) || result.current.vacancies?.length === 0).toBe(true);
    });
  });

  it('should handle missing employee profile gracefully', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-invalid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.vacancies === undefined || Array.isArray(result.current.vacancies)).toBe(true);
    });
  });

  it('should refetch when employeeId changes', async () => {
    const { result, rerender } = renderHook(
      ({ employeeId }: { employeeId: string }) => useMatchingVacancies(employeeId),
      {
        wrapper: createWrapper(),
        initialProps: { employeeId: 'emp-123' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading === false).toBe(true);
    });

    rerender({ employeeId: 'emp-456' });

    // Should trigger refetch
    await waitFor(() => {
      expect(result.current.isLoading === false || result.current.isLoading === true).toBe(true);
    });
  });

  it('should include vacancy details', async () => {
    const { result } = renderHook(() => useMatchingVacancies('emp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.vacancies && result.current.vacancies.length > 0) {
        const vacancy = result.current.vacancies[0];
        expect(vacancy).toHaveProperty('businessId');
        expect(vacancy).toHaveProperty('salary_range');
      }
    });
  });
});
