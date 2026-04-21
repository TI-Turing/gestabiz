import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useCompletedAppointments } from '../useCompletedAppointments';
import { createWrapper } from '@/test-utils/render-with-providers';
import { setupFromMock } from '@/test-utils/supabase-mock';

vi.mock('@/lib/supabase', () => { const __sb = {
    from: vi.fn(),
  }; return { supabase: __sb, default: __sb } });

// Import the mocked module to configure it per-test
import { supabase } from '@/lib/supabase';
const mockClient = supabase as unknown as { from: ReturnType<typeof vi.fn> };

// Helper to get the wrapper component
function getWrapper() {
  return createWrapper().Wrapper;
}

// Minimal mock data
const mockAppointments = [
  {
    id: 'apt-1',
    start_time: '2025-03-01T10:00:00Z',
    end_time: '2025-03-01T11:00:00Z',
    status: 'completed',
    notes: null,
    business_id: 'biz-1',
    service_id: 'svc-1',
    employee_id: 'emp-1',
    location_id: 'loc-1',
    created_at: '2025-03-01T09:00:00Z',
    updated_at: '2025-03-01T11:00:00Z',
    businesses: { id: 'biz-1', name: 'Salon A' },
    services: { id: 'svc-1', name: 'Corte', price: 30000 },
  },
  {
    id: 'apt-2',
    start_time: '2025-02-15T14:00:00Z',
    end_time: '2025-02-15T15:00:00Z',
    status: 'completed',
    notes: 'VIP',
    business_id: 'biz-2',
    service_id: 'svc-2',
    employee_id: 'emp-2',
    location_id: 'loc-2',
    created_at: '2025-02-15T13:00:00Z',
    updated_at: '2025-02-15T15:00:00Z',
    businesses: { id: 'biz-2', name: 'Spa B' },
    services: { id: 'svc-2', name: 'Masaje', price: 80000 },
  },
];

describe('useCompletedAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when clientId is null', () => {
    const { result } = renderHook(() => useCompletedAppointments(null), {
      wrapper: getWrapper(),
    });

    expect(result.current.appointments).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it('should not fetch when clientId is undefined', () => {
    const { result } = renderHook(() => useCompletedAppointments(undefined), {
      wrapper: getWrapper(),
    });

    expect(result.current.appointments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch completed appointments for a client', async () => {
    setupFromMock(mockClient, 'appointments', mockAppointments);

    const { result } = renderHook(() => useCompletedAppointments('client-1'), {
      wrapper: getWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.appointments).toHaveLength(2);
    expect(result.current.count).toBe(2);
    expect(result.current.appointments[0].id).toBe('apt-1');
    expect(result.current.appointments[0].businesses.name).toBe('Salon A');
  });

  it('should handle Supabase error', async () => {
    setupFromMock(mockClient, 'appointments', null, { message: 'DB error', code: '42P01' });

    const { result } = renderHook(() => useCompletedAppointments('client-1'), {
      wrapper: getWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.appointments).toEqual([]);
  });

  it('should return empty array when no completed appointments exist', async () => {
    setupFromMock(mockClient, 'appointments', []);

    const { result } = renderHook(() => useCompletedAppointments('client-1'), {
      wrapper: getWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.appointments).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  describe('helper functions', () => {
    beforeEach(() => {
      setupFromMock(mockClient, 'appointments', mockAppointments);
    });

    it('getByBusinessId should filter by business', async () => {
      const { result } = renderHook(() => useCompletedAppointments('client-1'), {
        wrapper: getWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const biz1Apts = result.current.getByBusinessId('biz-1');
      expect(biz1Apts).toHaveLength(1);
      expect(biz1Apts[0].id).toBe('apt-1');
    });

    it('getByBusinessId should return empty for non-matching business', async () => {
      const { result } = renderHook(() => useCompletedAppointments('client-1'), {
        wrapper: getWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getByBusinessId('biz-999')).toEqual([]);
    });

    it('getIds should return all appointment IDs', async () => {
      const { result } = renderHook(() => useCompletedAppointments('client-1'), {
        wrapper: getWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getIds()).toEqual(['apt-1', 'apt-2']);
    });
  });

  it('should handle array-wrapped relations (businesses as array)', async () => {
    const aptWithArrayRelation = [
      {
        ...mockAppointments[0],
        businesses: [{ id: 'biz-1', name: 'Salon A' }],
        services: [{ id: 'svc-1', name: 'Corte', price: 30000 }],
      },
    ];
    setupFromMock(mockClient, 'appointments', aptWithArrayRelation);

    const { result } = renderHook(() => useCompletedAppointments('client-1'), {
      wrapper: getWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should unwrap array to single object
    expect(result.current.appointments[0].businesses.name).toBe('Salon A');
    expect(result.current.appointments[0].services.name).toBe('Corte');
  });

  it('should default missing relations to empty objects', async () => {
    const aptWithNullRelations = [
      {
        ...mockAppointments[0],
        businesses: null,
        services: null,
      },
    ];
    setupFromMock(mockClient, 'appointments', aptWithNullRelations);

    const { result } = renderHook(() => useCompletedAppointments('client-1'), {
      wrapper: getWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.appointments[0].businesses).toEqual({ id: '', name: '' });
    expect(result.current.appointments[0].services).toEqual({ id: '', name: '', price: 0 });
  });
});
