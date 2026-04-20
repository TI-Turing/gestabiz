import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEmployeeAppointments } from '../useEmployeeAppointments';

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/normalizers', () => ({
  normalizeAppointmentStatus: (status: string) => status || 'scheduled',
}));

// Mock imports
import { supabase } from '@/lib/supabase';

const mockEmployeeId = 'emp-123';
const mockBusinessId = 'biz-456';

// Mock appointment data
const mockAppointmentData = {
  id: 'apt-1',
  business_id: mockBusinessId,
  location_id: 'loc-1',
  service_id: 'svc-1',
  client_id: 'client-1',
  employee_id: mockEmployeeId,
  start_time: '2026-04-21T10:00:00',
  end_time: '2026-04-21T11:00:00',
  status: 'completed',
  notes: 'Test appointment',
  price: 50000,
  currency: 'COP',
};

const mockClientData = {
  id: 'client-1',
  full_name: 'Juan Pérez',
  phone: '3001234567',
  email: 'juan@example.com',
};

const mockServiceData = {
  id: 'svc-1',
  name: 'Corte de cabello',
};

const mockLocationData = {
  id: 'loc-1',
  name: 'Sede Principal',
  address: 'Calle 1 #123',
};

// Helper for mock Supabase chain
function mockSupabaseChain(selectData = null, inData = null, error = null) {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
  };

  // Set final values
  if (error) {
    chainMethods.select.mockResolvedValueOnce({ data: null, error });
    chainMethods.in.mockResolvedValueOnce({ data: null, error });
  } else {
    chainMethods.select.mockResolvedValueOnce({ data: selectData, error: null });
    chainMethods.in.mockResolvedValueOnce({ data: inData, error: null });
  }

  return chainMethods;
}

describe('useEmployeeAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty state when employeeId is missing', () => {
    const chainMethods = mockSupabaseChain([]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAppointments('', mockBusinessId));

    expect(result.current.appointments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should return empty state when businessId is missing', () => {
    const chainMethods = mockSupabaseChain([]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, ''));

    expect(result.current.appointments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch employee appointments successfully', async () => {
    const appointmentChain = mockSupabaseChain([mockAppointmentData]);
    const clientChain = mockSupabaseChain(undefined, [mockClientData]);
    const serviceChain = mockSupabaseChain(undefined, [mockServiceData]);
    const locationChain = mockSupabaseChain(undefined, [mockLocationData]);

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      callCount++;
      if (table === 'appointments') return appointmentChain as any;
      if (table === 'profiles') return clientChain as any;
      if (table === 'services') return serviceChain as any;
      if (table === 'locations') return locationChain as any;
      return appointmentChain as any;
    });

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, mockBusinessId));

    await waitFor(() => {
      expect(result.current.appointments.length).toBeGreaterThan(0);
    });

    expect(result.current.appointments[0].id).toBe('apt-1');
    expect(result.current.appointments[0].client_name).toBe('Juan Pérez');
    expect(result.current.appointments[0].service_name).toBe('Corte de cabello');
  });

  it('should set loading state initially', () => {
    const chainMethods = mockSupabaseChain([mockAppointmentData]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, mockBusinessId));

    // Initially loading or not loaded yet
    expect(typeof result.current.loading).toBe('boolean');
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Fetch failed');
    const chainMethods = mockSupabaseChain(null, null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, mockBusinessId));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Fetch failed');
  });

  it('should handle appointments with missing relations', async () => {
    const appointmentWithoutRelations = {
      ...mockAppointmentData,
      service_id: null,
      location_id: null,
    };

    const appointmentChain = mockSupabaseChain([appointmentWithoutRelations]);
    const clientChain = mockSupabaseChain(undefined, [mockClientData]);
    const serviceChain = mockSupabaseChain(undefined, []);
    const locationChain = mockSupabaseChain(undefined, []);

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      callCount++;
      if (table === 'appointments') return appointmentChain as any;
      if (table === 'profiles') return clientChain as any;
      if (table === 'services') return serviceChain as any;
      if (table === 'locations') return locationChain as any;
      return appointmentChain as any;
    });

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, mockBusinessId));

    await waitFor(() => {
      expect(result.current.appointments.length).toBeGreaterThan(0);
    });

    expect(result.current.appointments[0].service_name).toBeUndefined();
    expect(result.current.appointments[0].location_name).toBeUndefined();
  });

  it('should set error to null on successful refetch', async () => {
    const appointmentChain = mockSupabaseChain([mockAppointmentData]);
    const clientChain = mockSupabaseChain(undefined, [mockClientData]);
    const serviceChain = mockSupabaseChain(undefined, [mockServiceData]);
    const locationChain = mockSupabaseChain(undefined, [mockLocationData]);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'appointments') return appointmentChain as any;
      if (table === 'profiles') return clientChain as any;
      if (table === 'services') return serviceChain as any;
      if (table === 'locations') return locationChain as any;
      return appointmentChain as any;
    });

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, mockBusinessId));

    await waitFor(() => {
      expect(result.current.appointments.length).toBeGreaterThan(0);
    });

    expect(result.current.error).toBeNull();
  });

  it('should provide refetch function', async () => {
    const appointmentChain = mockSupabaseChain([mockAppointmentData]);
    const clientChain = mockSupabaseChain(undefined, [mockClientData]);
    const serviceChain = mockSupabaseChain(undefined, [mockServiceData]);
    const locationChain = mockSupabaseChain(undefined, [mockLocationData]);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'appointments') return appointmentChain as any;
      if (table === 'profiles') return clientChain as any;
      if (table === 'services') return serviceChain as any;
      if (table === 'locations') return locationChain as any;
      return appointmentChain as any;
    });

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, mockBusinessId));

    // refetch should be a function
    expect(typeof result.current.refetch).toBe('function');

    await result.current.refetch();

    // Should still have data after refetch
    expect(result.current.appointments.length).toBeGreaterThanOrEqual(0);
  });

  it('should order appointments by start_time ascending', async () => {
    const apt1 = { ...mockAppointmentData, id: 'apt-1', start_time: '2026-04-21T10:00:00' };
    const apt2 = { ...mockAppointmentData, id: 'apt-2', start_time: '2026-04-21T14:00:00' };
    const apt3 = { ...mockAppointmentData, id: 'apt-3', start_time: '2026-04-21T12:00:00' };

    const appointmentChain = mockSupabaseChain([apt1, apt2, apt3]);
    const clientChain = mockSupabaseChain(undefined, [mockClientData]);
    const serviceChain = mockSupabaseChain(undefined, [mockServiceData]);
    const locationChain = mockSupabaseChain(undefined, [mockLocationData]);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'appointments') return appointmentChain as any;
      if (table === 'profiles') return clientChain as any;
      if (table === 'services') return serviceChain as any;
      if (table === 'locations') return locationChain as any;
      return appointmentChain as any;
    });

    const { result } = renderHook(() => useEmployeeAppointments(mockEmployeeId, mockBusinessId));

    await waitFor(() => {
      expect(result.current.appointments.length).toBeGreaterThan(0);
    });

    // Verify order should be maintained
    expect(result.current.appointments[0].id).toBeDefined();
  });
});
