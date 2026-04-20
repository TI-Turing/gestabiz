import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeeAbsences } from '../useEmployeeAbsences';
import { useAuth } from '@/contexts/AuthContext';

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock imports for setup
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockBusinessId = 'business-456';

// Helper for mock Supabase chain
function mockSupabaseChain(selectData = null, insertData = null, updateData = null, error = null) {
  const chainMethods = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };

  // Create chain that returns itself
  chainMethods.select.mockReturnValue(chainMethods);
  chainMethods.eq.mockReturnValue(chainMethods);
  chainMethods.single.mockReturnValue(chainMethods);
  chainMethods.order.mockReturnValue(chainMethods);
  chainMethods.insert.mockReturnValue(chainMethods);
  chainMethods.update.mockReturnValue(chainMethods);

  // Set final values
  if (error) {
    chainMethods.select.mockResolvedValueOnce({ data: null, error });
    chainMethods.insert.mockResolvedValueOnce({ data: null, error });
    chainMethods.update.mockResolvedValueOnce({ data: null, error });
  } else {
    chainMethods.select.mockResolvedValueOnce({ data: selectData, error: null });
    chainMethods.insert.mockResolvedValueOnce({ data: insertData, error: null });
    chainMethods.update.mockResolvedValueOnce({ data: updateData, error: null });
  }

  return chainMethods;
}

describe('useEmployeeAbsences', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('should return empty data when user is null', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    expect(result.current.absences).toEqual([]);
    expect(result.current.vacationBalance).toBeNull();
  });

  it('should return empty data when businessId is empty', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const { result } = renderHook(() => useEmployeeAbsences(''), { wrapper });

    expect(result.current.absences).toEqual([]);
  });

  it('should fetch employee absences successfully', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const mockAbsences = [
      {
        id: 'abs-1',
        business_id: mockBusinessId,
        employee_id: mockUser.id,
        absence_type: 'vacation',
        start_date: '2026-05-01',
        end_date: '2026-05-10',
        reason: 'Vacaciones',
        employee_notes: 'Beach trip',
        admin_notes: null,
        status: 'pending',
        approved_by: null,
        approved_at: null,
        created_at: '2026-04-20',
      },
    ];

    const chainMethods = mockSupabaseChain(mockAbsences);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    await waitFor(() => {
      expect(result.current.absences.length).toBeGreaterThan(0);
    });

    expect(result.current.absences[0].id).toBe('abs-1');
    expect(result.current.absences[0].absenceType).toBe('vacation');
  });

  it('should handle error fetching absences', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const mockError = new Error('Network error');
    const chainMethods = mockSupabaseChain(null, null, null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toContain('Network error');
  });

  it('should fetch vacation balance successfully', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const mockBalance = {
      id: 'bal-1',
      business_id: mockBusinessId,
      employee_id: mockUser.id,
      year: 2026,
      total_vacation_days: 20,
      days_used: 5,
      days_pending: 2,
      days_remaining: 13,
    };

    const chainMethods = mockSupabaseChain(mockBalance);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    await waitFor(() => {
      expect(result.current.vacationBalance).toBeTruthy();
    });

    expect(result.current.vacationBalance?.totalDaysAvailable).toBe(20);
    expect(result.current.vacationBalance?.daysRemaining).toBe(13);
  });

  it('should handle vacation balance not found', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const chainMethods = mockSupabaseChain(null);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    await waitFor(() => {
      expect(result.current.vacationBalance).toBeNull();
    });
  });

  it('should request absence successfully', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const chainMethods = mockSupabaseChain([], {});
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    const params = {
      absenceType: 'vacation' as const,
      startDate: '2026-05-01',
      endDate: '2026-05-10',
      reason: 'Vacaciones',
      employeeNotes: 'Beach trip',
    };

    await result.current.requestAbsence(params);

    expect(supabase.from).toHaveBeenCalledWith('employee_absences');
    expect(toast.success).toHaveBeenCalledWith('Solicitud de ausencia enviada exitosamente');
  });

  it('should reject absence request with invalid date range', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const chainMethods = mockSupabaseChain([], {});
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    const params = {
      absenceType: 'vacation' as const,
      startDate: '2026-05-10',
      endDate: '2026-05-01', // End before start
      reason: 'Vacaciones',
    };

    await expect(result.current.requestAbsence(params)).rejects.toThrow('fecha de fin debe ser posterior');
  });

  it('should cancel absence successfully', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const chainMethods = mockSupabaseChain(null, null, {});
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    await result.current.cancelAbsence('abs-1');

    expect(supabase.from).toHaveBeenCalledWith('employee_absences');
    expect(toast.success).toHaveBeenCalledWith('La solicitud ha sido cancelada exitosamente');
  });

  it('should handle error cancelling absence', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const mockError = new Error('Cancel failed');
    const chainMethods = mockSupabaseChain(null, null, null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    await expect(result.current.cancelAbsence('abs-1')).rejects.toThrow();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should validate work days correctly', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const chainMethods = mockSupabaseChain([]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    // Friday (2026-05-01) to Sunday (2026-05-03)
    const validation = await result.current.validateWorkDays('2026-05-01', '2026-05-03');

    expect(validation.isValid).toBe(false);
    expect(validation.invalidDays.length).toBeGreaterThan(0);
  });

  it('should validate work days with all valid days', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);

    const chainMethods = mockSupabaseChain([]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAbsences(mockBusinessId), { wrapper });

    // Monday (2026-04-27) to Friday (2026-05-01)
    const validation = await result.current.validateWorkDays('2026-04-27', '2026-05-01');

    expect(validation.isValid).toBe(true);
    expect(validation.invalidDays.length).toBe(0);
  });
});
