import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeeProfile } from '../useEmployeeProfile';

// Mock modules
vi.mock('@/lib/supabase', () => { const __sb = {
    from: vi.fn(),
  }; return { supabase: __sb, default: __sb } });

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock imports
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const mockUserId = 'user-123';

// Helper for mock Supabase chain
function mockSupabaseChain(data = null, error = null, operation = 'select') {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  // Set final values based on operation
  if (operation === 'select' || operation === 'upsert') {
    chainMethods.select.mockResolvedValueOnce({ data, error });
    chainMethods.upsert.mockResolvedValueOnce({ data, error });
  } else if (operation === 'insert') {
    chainMethods.insert.mockResolvedValueOnce({ data, error });
  } else if (operation === 'update') {
    chainMethods.update.mockResolvedValueOnce({ data, error });
  } else if (operation === 'delete') {
    chainMethods.delete.mockResolvedValueOnce({ data, error });
  }

  return chainMethods;
}

describe('useEmployeeProfile', () => {
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

  it('should return undefined when userId is not provided', () => {
    const chainMethods = mockSupabaseChain(null);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeProfile(undefined), { wrapper });

    expect(result.current.profile).toBeUndefined();
  });

  it('should fetch employee profile successfully', async () => {
    const mockProfile = {
      id: 'prof-1',
      user_id: mockUserId,
      bio: 'Profesional con 5 años de experiencia',
      years_experience: 5,
      specializations: ['Cortes modernos', 'Barbería'],
      languages: ['Español', 'Inglés'],
      certifications: [
        { id: 'cert-1', name: 'Certificado de Barbería', issued_date: '2021-05-15' },
      ],
      created_at: '2026-01-01',
    };

    const chainMethods = mockSupabaseChain(mockProfile);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });

    expect(result.current.profile?.bio).toBe('Profesional con 5 años de experiencia');
    expect(result.current.profile?.years_experience).toBe(5);
  });

  it('should handle profile not found', async () => {
    const chainMethods = mockSupabaseChain(null);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await waitFor(() => {
      expect(result.current.profile).toBeUndefined();
    });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Fetch failed');
    const chainMethods = mockSupabaseChain(null, mockError);
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should update profile successfully', async () => {
    const mockProfile = {
      id: 'prof-1',
      user_id: mockUserId,
      bio: 'Original bio',
      years_experience: 5,
    };

    const updateChain = mockSupabaseChain({ ...mockProfile, bio: 'Updated bio' }, null, 'update');
    vi.mocked(supabase.from).mockReturnValue(updateChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await result.current.updateProfile({ bio: 'Updated bio', years_experience: 6 });

    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle update error', async () => {
    const mockError = new Error('Update failed');
    const updateChain = mockSupabaseChain(null, mockError, 'update');
    vi.mocked(supabase.from).mockReturnValue(updateChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await expect(result.current.updateProfile({ bio: 'New bio' })).rejects.toThrow();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should add certification successfully', async () => {
    const newCert = { name: 'Nuevo Certificado', issued_date: '2026-04-20' };
    const insertChain = mockSupabaseChain({ id: 'cert-2', ...newCert }, null, 'insert');
    vi.mocked(supabase.from).mockReturnValue(insertChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await result.current.addCertification(newCert);

    expect(toast.success).toHaveBeenCalledWith('Certificación agregada');
  });

  it('should remove certification successfully', async () => {
    const deleteChain = mockSupabaseChain(null, null, 'delete');
    vi.mocked(supabase.from).mockReturnValue(deleteChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await result.current.removeCertification('cert-1');

    expect(toast.success).toHaveBeenCalledWith('Certificación removida');
  });

  it('should add specialization successfully', async () => {
    const updateChain = mockSupabaseChain(
      { specializations: ['Cortes modernos', 'Nueva especialización'] },
      null,
      'update'
    );
    vi.mocked(supabase.from).mockReturnValue(updateChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await result.current.addSpecialization('Nueva especialización');

    expect(toast.success).toHaveBeenCalledWith('Especialización agregada');
  });

  it('should remove specialization successfully', async () => {
    const updateChain = mockSupabaseChain({ specializations: ['Cortes modernos'] }, null, 'update');
    vi.mocked(supabase.from).mockReturnValue(updateChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await result.current.removeSpecialization('Barbería');

    expect(toast.success).toHaveBeenCalledWith('Especialización removida');
  });

  it('should add language successfully', async () => {
    const updateChain = mockSupabaseChain({ languages: ['Español', 'Français'] }, null, 'update');
    vi.mocked(supabase.from).mockReturnValue(updateChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await result.current.addLanguage('Français');

    expect(toast.success).toHaveBeenCalledWith('Idioma agregado');
  });

  it('should remove language successfully', async () => {
    const updateChain = mockSupabaseChain({ languages: ['Español'] }, null, 'update');
    vi.mocked(supabase.from).mockReturnValue(updateChain as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    await result.current.removeLanguage('Inglés');

    expect(toast.success).toHaveBeenCalledWith('Idioma removido');
  });

  it('should provide fetchProfile function', async () => {
    const chainMethods = mockSupabaseChain({ id: 'prof-1' });
    vi.mocked(supabase.from).mockReturnValue(chainMethods as any);

    const { result } = renderHook(() => useEmployeeProfile(mockUserId), { wrapper });

    expect(typeof result.current.fetchProfile).toBe('function');

    await result.current.fetchProfile();

    expect(supabase.from).toHaveBeenCalledWith('employee_profiles');
  });
});
