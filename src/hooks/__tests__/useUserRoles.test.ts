import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { useUserRoles } from '../useUserRoles';
import type { User } from '@/types/types';

// Mock supabase
vi.mock('@/lib/supabase', () => { const __sb = {
    from: vi.fn(),
  }; return { supabase: __sb, default: __sb } });

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const mockFrom = supabase.from as Mock;

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-001',
    email: 'test@test.com',
    created_at: '2024-01-01T00:00:00Z',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  } as User;
}

// Helper to setup supabase.from chain for multiple tables
function setupFromChain(tableResponses: Record<string, { data: unknown; error: unknown }>) {
  mockFrom.mockImplementation((table: string) => {
    const response = tableResponses[table] || { data: null, error: null };
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(response),
      then: vi.fn((resolve: (v: unknown) => void) => resolve(response)),
    };
    // Make the chain itself thenable for await
    Object.assign(chain, {
      then: (resolve: (v: unknown) => void) => Promise.resolve(response).then(resolve),
    });
    return chain;
  });
}

describe('useUserRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should return default client role when user is null', () => {
    const { result } = renderHook(() => useUserRoles(null));

    expect(result.current.activeRole).toBe('client');
    expect(result.current.activeBusiness).toBeUndefined();
    expect(result.current.roles).toEqual([]);
  });

  it('should fetch roles and include admin when user owns a business', async () => {
    const user = createUser();

    // businesses query returns owned business
    // business_employees query returns no employee relations
    setupFromChain({
      businesses: { data: [{ id: 'biz-001', name: 'My Salon' }], error: null },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    // Should have admin role for owned business
    const adminRoles = result.current.roles.filter(r => r.role === 'admin');
    expect(adminRoles.length).toBeGreaterThanOrEqual(1);
    expect(adminRoles.some(r => r.business_id === 'biz-001')).toBe(true);

    // Should always have client role
    const clientRoles = result.current.roles.filter(r => r.role === 'client');
    expect(clientRoles.length).toBe(1);
  });

  it('should fetch roles and include employee when user is an approved employee', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: [], error: null },
      business_employees: {
        data: [
          {
            business_id: 'biz-002',
            status: 'approved',
            businesses: { id: 'biz-002', name: 'Other Salon' },
          },
        ],
        error: null,
      },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    // Should have employee role for that business
    const employeeRoles = result.current.roles.filter(r => r.role === 'employee');
    expect(employeeRoles.some(r => r.business_id === 'biz-002')).toBe(true);
  });

  it('should always include generic admin, employee and client roles', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: [], error: null },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    // Generic admin (no business)
    expect(result.current.roles.some(r => r.role === 'admin' && r.business_id === null)).toBe(true);
    // Generic employee (no business)
    expect(result.current.roles.some(r => r.role === 'employee' && r.business_id === null)).toBe(true);
    // Client role
    expect(result.current.roles.some(r => r.role === 'client')).toBe(true);
  });

  it('should handle Supabase error on businesses query', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: null, error: { message: 'DB error' } },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith('Error al cargar roles disponibles');
  });

  it('should restore role from localStorage on mount', async () => {
    const user = createUser();
    const stored = JSON.stringify({ role: 'admin', businessId: 'biz-001', businessName: 'My Salon' });
    localStorage.setItem(`user-active-role:${user.id}`, stored);

    setupFromChain({
      businesses: { data: [{ id: 'biz-001', name: 'My Salon' }], error: null },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    // Should restore admin from localStorage immediately (before fetch completes)
    expect(result.current.activeRole).toBe('admin');
  });

  it('switchRole should update activeRole and show toast', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: [{ id: 'biz-001', name: 'My Salon' }], error: null },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    // Switch to client
    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.switchRole('client');
    });

    expect(success).toBe(true);
    expect(result.current.activeRole).toBe('client');
    expect(toast.success).toHaveBeenCalledWith('Cambiado a rol Cliente');
  });

  it('switchRole should set activeBusiness when switching to admin with businessId', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: [{ id: 'biz-001', name: 'My Salon' }], error: null },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.switchRole('admin', 'biz-001');
    });

    expect(result.current.activeRole).toBe('admin');
    expect(result.current.activeBusiness).toEqual({ id: 'biz-001', name: 'My Salon' });
    expect(toast.success).toHaveBeenCalledWith('Cambiado a rol Administrador');
  });

  it('switchRole should fail when user is null', async () => {
    const { result } = renderHook(() => useUserRoles(null));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.switchRole('admin');
    });

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Usuario no autenticado');
  });

  it('hasRole should return true for existing roles', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: [], error: null },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    expect(result.current.hasRole('client')).toBe(true);
    expect(result.current.hasRole('admin')).toBe(true);
  });

  it('getRolesByType should return filtered roles', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: [{ id: 'biz-001', name: 'Salon A' }, { id: 'biz-002', name: 'Salon B' }], error: null },
      business_employees: { data: [], error: null },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    const adminRoles = result.current.getRolesByType('admin');
    // Should have at least the generic admin + one per owned business
    expect(adminRoles.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle array-wrapped businesses relation in employee data', async () => {
    const user = createUser();

    setupFromChain({
      businesses: { data: [], error: null },
      business_employees: {
        data: [
          {
            business_id: 'biz-003',
            status: 'approved',
            businesses: [{ id: 'biz-003', name: 'Spa Central' }], // array wrapped
          },
        ],
        error: null,
      },
    });

    const { result } = renderHook(() => useUserRoles(user));

    await waitFor(() => {
      expect(result.current.roles.length).toBeGreaterThan(0);
    });

    const employeeRoles = result.current.roles.filter(r => r.role === 'employee' && r.business_id === 'biz-003');
    expect(employeeRoles.length).toBe(1);
    expect(employeeRoles[0].business_name).toBe('Spa Central');
  });
});
