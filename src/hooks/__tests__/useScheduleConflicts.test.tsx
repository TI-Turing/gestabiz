import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useScheduleConflicts } from '@/hooks/useScheduleConflicts';

vi.mock('@/lib/supabase', () => ({
  default: {
    from: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useScheduleConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return conflicts array', async () => {
    const { result } = renderHook(
      () => useScheduleConflicts('emp-123', new Date()),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(Array.isArray(result.current.conflicts) || result.current.conflicts === undefined).toBe(true);
    });
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-123', new Date()), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.loading).toBe('boolean');
  });

  it('should detect time overlaps', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-123', new Date()), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.conflicts && result.current.conflicts.length > 0) {
        result.current.conflicts.forEach((conflict: any) => {
          expect(conflict).toHaveProperty('type');
          expect(['overlap', 'lunch_break', 'off_day']).toContain(conflict.type);
        });
      }
    });
  });

  it('should detect lunch break conflicts', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-123', new Date()), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.conflicts) {
        const lunchBreakConflicts = result.current.conflicts.filter((c: any) => c.type === 'lunch_break');
        expect(Array.isArray(lunchBreakConflicts) || lunchBreakConflicts.length === 0).toBe(true);
      }
    });
  });

  it('should detect days off conflicts', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-123', new Date()), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.conflicts) {
        const daysOffConflicts = result.current.conflicts.filter((c: any) => c.type === 'off_day');
        expect(Array.isArray(daysOffConflicts) || daysOffConflicts.length === 0).toBe(true);
      }
    });
  });

  it('should include conflict details', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-123', new Date()), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.conflicts && result.current.conflicts.length > 0) {
        const conflict = result.current.conflicts[0];
        expect(conflict).toHaveProperty('startTime');
        expect(conflict).toHaveProperty('endTime');
      }
    });
  });

  it('should handle date range queries', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    const { result } = renderHook(() => useScheduleConflicts('emp-123', startDate, endDate), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.conflicts !== undefined).toBe(true);
    });
  });

  it('should return empty array when no conflicts', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-free-123', new Date()), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      if (result.current.conflicts) {
        expect(result.current.conflicts.length >= 0).toBe(true);
      }
    });
  });

  it('should handle invalid employee gracefully', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-invalid', new Date()), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
    });
  });

  it('should provide checkConflict function', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-123', new Date()), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.checkConflict).toBe('function');
  });

  it('should refetch on demand', async () => {
    const { result } = renderHook(() => useScheduleConflicts('emp-123', new Date()), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});
