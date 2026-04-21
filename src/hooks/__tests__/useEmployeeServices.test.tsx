import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeeServices } from '../useEmployeeServices';

// Mock modules
vi.mock('@/lib/supabase', () => {
  const supabase = { from: vi.fn() };
  return { supabase, default: supabase };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock imports
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const mockEmployeeId = 'emp-123';
const mockServiceId = 'svc-456';
const mockLocationId = 'loc-789';

// Helper for mock Supabase chain
function mockSupabaseChain(data = null, error = null) {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  chainMethods.select.mockResolvedValueOnce({ data, error });
  chainMethods.in.mockResolvedValueOnce({ data, error });
  chainMethods.order.mockResolvedValueOnce({ data, error });
  chainMethods.insert.mockResolvedValueOnce({ data, error });
  chainMethods.update.mockResolvedValueOnce({ data, error });
  chainMethods.delete.mockResolvedValueOnce({ data, error });

  return chainMethods;
}

describe.skip('useEmployeeServices', () => {
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

  it('should fetch employee services successfully', async () => {
    const mockServices = [
      {
        id: 'emp-svc-1',
        employee_id: mockEmployeeId,
        service_id: mockServiceId,
        location_id: mockLocationId,
        custom_price: null,
        commission_percentage: 15,
      },
    ];

    const chainMethods = mockSupabaseChain(mockServices);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await waitFor(() => {
      expect(result.current.services).toBeDefined();
    });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Fetch failed');
    const chainMethods = mockSupabaseChain(null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should add service to employee successfully', async () => {
    const newService = {
      employee_id: mockEmployeeId,
      service_id: mockServiceId,
      location_id: mockLocationId,
      commission_percentage: 15,
    };

    const chainMethods = mockSupabaseChain(newService);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await result.current.addServiceToEmployee(mockEmployeeId, mockServiceId, mockLocationId, 15);

    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle add service error', async () => {
    const mockError = new Error('Add failed');
    const chainMethods = mockSupabaseChain(null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await expect(
      result.current.addServiceToEmployee(mockEmployeeId, mockServiceId, mockLocationId, 15)
    ).rejects.toThrow();
  });

  it('should update employee service successfully', async () => {
    const updated = {
      id: 'emp-svc-1',
      commission_percentage: 20,
      custom_price: 50000,
    };

    const chainMethods = mockSupabaseChain(updated);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await result.current.updateEmployeeService('emp-svc-1', { commission_percentage: 20 });

    expect(toast.success).toHaveBeenCalled();
  });

  it('should remove service from employee successfully', async () => {
    const chainMethods = mockSupabaseChain({});
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await result.current.removeServiceFromEmployee('emp-svc-1');

    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle remove service error', async () => {
    const mockError = new Error('Remove failed');
    const chainMethods = mockSupabaseChain(null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await expect(result.current.removeServiceFromEmployee('emp-svc-1')).rejects.toThrow();
  });

  it('should get employees for service by location', async () => {
    const mockEmployees = [
      {
        employee_id: 'emp-1',
        full_name: 'Juan García',
        commission_percentage: 15,
      },
      {
        employee_id: 'emp-2',
        full_name: 'María López',
        commission_percentage: 20,
      },
    ];

    const chainMethods = mockSupabaseChain(mockEmployees);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await waitFor(() => {
      expect(result.current.getEmployeesForService).toBeDefined();
    });

    const employees = await result.current.getEmployeesForService(mockServiceId, mockLocationId);

    expect(Array.isArray(employees)).toBe(true);
  });

  it('should handle get employees error', async () => {
    const mockError = new Error('Query failed');
    const chainMethods = mockSupabaseChain(null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    await expect(result.current.getEmployeesForService(mockServiceId, mockLocationId)).rejects.toThrow();
  });

  it('should provide refetch function', async () => {
    const chainMethods = mockSupabaseChain([]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    expect(typeof result.current.refetch).toBe('function');

    await result.current.refetch();

    expect(supabase.from).toHaveBeenCalled();
  });

  it('should have loading state', async () => {
    const chainMethods = mockSupabaseChain([]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeServices(), { wrapper });

    expect(typeof result.current.loading).toBe('boolean');
  });
});
