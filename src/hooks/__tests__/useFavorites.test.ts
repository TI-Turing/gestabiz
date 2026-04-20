import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { useFavorites } from '../useFavorites';
import { createWrapper } from '@/test-utils/render-with-providers';

const getWrapper = () => createWrapper().Wrapper;

// Mock supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      channel: vi.fn(),
    },
  };
});

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
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const mockRpc = supabase.rpc as Mock;
const mockChannel = supabase.channel as Mock;

function makeChannelObj() {
  const obj: Record<string, any> = {};
  obj.on = vi.fn().mockReturnValue(obj);
  obj.subscribe = vi.fn().mockReturnValue(obj);
  obj.unsubscribe = vi.fn();
  return obj;
}

const sampleFavorites = [
  {
    id: 'biz-1',
    name: 'Salon Luna',
    description: 'Best salon',
    logo_url: null,
    banner_url: null,
    address: 'Calle 123',
    city: 'Bogota',
    phone: '555-1234',
    average_rating: 4.5,
    review_count: 20,
    is_active: true,
    favorited_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'biz-2',
    name: 'Spa Sol',
    description: null,
    logo_url: null,
    banner_url: null,
    address: null,
    city: null,
    phone: null,
    average_rating: 3.8,
    review_count: 5,
    is_active: true,
    favorited_at: '2024-06-02T10:00:00Z',
  },
];

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: [], error: null });
    mockChannel.mockReturnValue(makeChannelObj());
  });

  it('should return empty favorites and stop loading when userId is undefined', async () => {
    const { result } = renderHook(() => useFavorites(undefined), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.favorites).toEqual([]);
    expect(result.current.favoriteIds.size).toBe(0);
  });

  it('should fetch favorites via RPC on mount', async () => {
    mockRpc.mockResolvedValue({ data: sampleFavorites, error: null });

    const { result } = renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockRpc).toHaveBeenCalledWith('get_user_favorite_businesses');
    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.favoriteIds.has('biz-1')).toBe(true);
    expect(result.current.favoriteIds.has('biz-2')).toBe(true);
  });

  it('should handle RPC fetch error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { result } = renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar favoritos');
  });

  it('isFavorite should check from local Set', async () => {
    mockRpc.mockResolvedValue({ data: sampleFavorites, error: null });

    const { result } = renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isFavorite('biz-1')).toBe(true);
    expect(result.current.isFavorite('biz-999')).toBe(false);
  });

  it('toggleFavorite should show error when userId is undefined', async () => {
    const { result } = renderHook(() => useFavorites(undefined), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let toggleResult: boolean | undefined;
    await act(async () => {
      toggleResult = await result.current.toggleFavorite('biz-1');
    });

    expect(toggleResult).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Debes iniciar sesión para marcar favoritos');
  });

  it('toggleFavorite should add favorite with optimistic update', async () => {
    // Initial fetch
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    // Toggle RPC
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    // Refetch after toggle
    mockRpc.mockResolvedValueOnce({ data: sampleFavorites.slice(0, 1), error: null });

    const { result } = renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('biz-1', 'Salon Luna');
    });

    expect(mockRpc).toHaveBeenCalledWith('toggle_business_favorite', { p_business_id: 'biz-1' });
    expect(toast.success).toHaveBeenCalledWith('Salon Luna agregado a favoritos');
  });

  it('toggleFavorite should remove favorite and show info toast', async () => {
    // Initial fetch with existing favorites
    mockRpc.mockResolvedValueOnce({ data: sampleFavorites, error: null });
    // Toggle RPC returns false (removed)
    mockRpc.mockResolvedValueOnce({ data: false, error: null });
    // Refetch after toggle
    mockRpc.mockResolvedValueOnce({ data: sampleFavorites.slice(1), error: null });

    const { result } = renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('biz-1', 'Salon Luna');
    });

    expect(toast.info).toHaveBeenCalledWith('Salon Luna eliminado de favoritos');
  });

  it('toggleFavorite should revert on error', async () => {
    // Initial fetch
    mockRpc.mockResolvedValueOnce({ data: sampleFavorites, error: null });
    // Toggle RPC fails
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Toggle failed' } });
    // Refetch after revert
    mockRpc.mockResolvedValueOnce({ data: sampleFavorites, error: null });

    const { result } = renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('biz-1');
    });

    expect(toast.error).toHaveBeenCalledWith('Error al actualizar favorito');
  });

  it('checkIsFavorite should call RPC and return result', async () => {
    // Initial fetch
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    // checkIsFavorite RPC
    mockRpc.mockResolvedValueOnce({ data: true, error: null });

    const { result } = renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let isFav: boolean | undefined;
    await act(async () => {
      isFav = await result.current.checkIsFavorite('biz-1');
    });

    expect(isFav).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('is_business_favorite', { p_business_id: 'biz-1' });
  });

  it('checkIsFavorite should return false when userId is undefined', async () => {
    const { result } = renderHook(() => useFavorites(undefined), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let isFav: boolean | undefined;
    await act(async () => {
      isFav = await result.current.checkIsFavorite('biz-1');
    });

    expect(isFav).toBe(false);
  });

  it('should setup realtime subscription when userId is provided', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    renderHook(() => useFavorites('user-001'), { wrapper: getWrapper() });

    expect(supabase.channel).toHaveBeenCalledWith('favorites:user-001');
  });

  it('should not setup realtime subscription when userId is undefined', () => {
    renderHook(() => useFavorites(undefined), { wrapper: getWrapper() });

    expect(supabase.channel).not.toHaveBeenCalled();
  });
});
