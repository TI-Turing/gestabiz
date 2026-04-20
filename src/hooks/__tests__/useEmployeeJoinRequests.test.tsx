import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeeJoinRequests } from '../useEmployeeJoinRequests';
import { useAuth } from '@/contexts/AuthContext';

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
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

// Mock imports
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockBusinessId = 'biz-456';

// Helper for mock Supabase chain
function mockSupabaseChain(data = null, error = null) {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  chainMethods.select.mockResolvedValueOnce({ data, error });
  chainMethods.insert.mockResolvedValueOnce({ data, error });
  chainMethods.update.mockResolvedValueOnce({ data, error });
  chainMethods.delete.mockResolvedValueOnce({ data, error });

  return chainMethods;
}

describe('useEmployeeJoinRequests', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, loading: false } as any);
  });

  describe('useMyJoinRequests', () => {
    it('should fetch my join requests successfully', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          user_id: mockUser.id,
          business_id: mockBusinessId,
          status: 'pending',
          created_at: '2026-04-20',
        },
      ];

      const chainMethods = mockSupabaseChain(mockRequests);
      vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should return empty array when user is null', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);

      const chainMethods = mockSupabaseChain([]);
      vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

      const { result } = renderHook(() => useEmployeeJoinRequests(null), { wrapper });

      expect(result.current.requests).toEqual([]);
    });
  });

  describe('useBusinessJoinRequests', () => {
    it('should fetch business join requests successfully', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          user_id: 'user-100',
          business_id: mockBusinessId,
          status: 'pending',
          user: { full_name: 'Juan Pérez', email: 'juan@example.com' },
        },
      ];

      const chainMethods = mockSupabaseChain(mockRequests);
      vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

      const { result } = renderHook(() => useEmployeeJoinRequests(mockBusinessId), { wrapper });

      await waitFor(() => {
        expect(result.current.requests).toBeDefined();
      });
    });

    it('should return empty array when businessId is null', () => {
      const chainMethods = mockSupabaseChain([]);
      vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

      const { result } = renderHook(() => useEmployeeJoinRequests(null), { wrapper });

      expect(result.current.requests).toEqual([]);
    });
  });

  describe('useClaimInviteCode', () => {
    it('should claim invite code successfully', async () => {
      const mockResult = {
        success: true,
        businessId: mockBusinessId,
        businessName: 'Mi Negocio',
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockResult, error: null });

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      const claimResult = await result.current.claimInviteCode('ABC123');

      expect(claimResult).toBeDefined();
      expect(supabase.rpc).toHaveBeenCalledWith('claim_invite_code', {
        p_code: 'ABC123',
      });
    });

    it('should handle invalid invite code', async () => {
      const mockError = new Error('Código inválido');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: mockError });

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await expect(result.current.claimInviteCode('INVALID')).rejects.toThrow('Código inválido');
    });

    it('should trim and uppercase code before claiming', async () => {
      const mockResult = { success: true, businessId: mockBusinessId };
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockResult, error: null });

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await result.current.claimInviteCode('  abc123  ');

      expect(supabase.rpc).toHaveBeenCalledWith('claim_invite_code', {
        p_code: 'ABC123',
      });
    });
  });

  describe('createJoinRequest', () => {
    it('should create join request successfully', async () => {
      const newRequest = {
        id: 'req-new',
        user_id: mockUser.id,
        business_id: mockBusinessId,
        status: 'pending',
      };

      const chainMethods = mockSupabaseChain(newRequest);
      vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await result.current.createJoinRequest(mockBusinessId);

      expect(supabase.from).toHaveBeenCalledWith('employee_requests');
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle duplicate request error', async () => {
      const mockError = new Error('Ya existe una solicitud pendiente');
      const chainMethods = mockSupabaseChain(null, mockError);
      vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await expect(result.current.createJoinRequest(mockBusinessId)).rejects.toThrow(
        'Ya existe una solicitud'
      );
    });

    it('should require user id', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);

      const chainMethods = mockSupabaseChain({});
      vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

      const { result } = renderHook(() => useEmployeeJoinRequests(null), { wrapper });

      await expect(result.current.createJoinRequest(mockBusinessId)).rejects.toThrow();
    });
  });

  describe('approveJoinRequest', () => {
    it('should approve request successfully', async () => {
      const mockResult = { success: true };
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockResult, error: null });

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await result.current.approveJoinRequest('req-1');

      expect(supabase.rpc).toHaveBeenCalledWith('approve_employee_request', {
        p_request_id: 'req-1',
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle approve error', async () => {
      const mockError = new Error('Approve failed');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: mockError });

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await expect(result.current.approveJoinRequest('req-1')).rejects.toThrow('Approve failed');
    });
  });

  describe('rejectJoinRequest', () => {
    it('should reject request successfully', async () => {
      const mockResult = { success: true };
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockResult, error: null });

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await result.current.rejectJoinRequest('req-1');

      expect(supabase.rpc).toHaveBeenCalledWith('reject_employee_request', {
        p_request_id: 'req-1',
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle reject error', async () => {
      const mockError = new Error('Reject failed');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: mockError });

      const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

      await expect(result.current.rejectJoinRequest('req-1')).rejects.toThrow('Reject failed');
    });
  });

  it('should provide pendingCount', async () => {
    const mockRequests = [
      { id: 'req-1', status: 'pending' },
      { id: 'req-2', status: 'pending' },
      { id: 'req-3', status: 'approved' },
    ];

    const chainMethods = mockSupabaseChain(mockRequests);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

    await waitFor(() => {
      expect(result.current.pendingCount).toBeDefined();
    });
  });

  it('should provide isLoading state', () => {
    const chainMethods = mockSupabaseChain([]);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should provide error state', async () => {
    const mockError = new Error('Fetch failed');
    const chainMethods = mockSupabaseChain(null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeJoinRequests(mockUser.id), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
