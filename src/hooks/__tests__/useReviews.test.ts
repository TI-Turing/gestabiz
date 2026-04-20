import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { useReviews } from '../useReviews';

// Mock supabase
vi.mock('@/lib/supabase', () => {
  const mockChain = () => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);
    chain.lte = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockResolvedValue({ data: [], error: null });
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    return chain;
  };

  return {
    default: {
      from: vi.fn(() => mockChain()),
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

import supabase from '@/lib/supabase';
import { toast } from 'sonner';

const mockFrom = supabase.from as Mock;

// Helper to setup the chain for query operations (thenable pattern)
function setupQueryChain(data: unknown[] | null, error: unknown = null) {
  const resolvedValue = { data, error };
  const self: Record<string, any> = {};
  const methods = ['select', 'eq', 'in', 'gte', 'lte', 'order', 'insert', 'update', 'delete', 'single', 'maybeSingle', 'limit'];
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self);
  }
  self.then = (resolve: (v: unknown) => void) => resolve(resolvedValue);
  return self;
}

const sampleReviews = [
  {
    id: 'rev-1',
    rating: 5,
    comment: 'Excellent service',
    is_visible: true,
    created_at: '2024-06-01T10:00:00Z',
    client: { id: 'c1', full_name: 'Client A', email: 'a@test.com', avatar_url: null },
    employee: { id: 'e1', full_name: 'Emp A', email: 'emp@test.com', avatar_url: null },
    appointment: { id: 'apt-1', start_time: '2024-05-30T10:00:00Z', service_id: 'svc-1' },
  },
  {
    id: 'rev-2',
    rating: 3,
    comment: 'Average',
    is_visible: true,
    created_at: '2024-06-02T10:00:00Z',
    client: { id: 'c2', full_name: 'Client B', email: 'b@test.com', avatar_url: null },
    employee: null,
    appointment: null,
  },
  {
    id: 'rev-3',
    rating: 5,
    comment: 'Great',
    is_visible: true,
    created_at: '2024-06-03T10:00:00Z',
    client: null,
    employee: null,
    appointment: null,
  },
];

describe('useReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch reviews on mount and set loading=false', async () => {
    const chain = setupQueryChain(sampleReviews);
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useReviews({ business_id: 'biz-1' }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.reviews).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it('should calculate stats correctly from reviews', async () => {
    const chain = setupQueryChain(sampleReviews);
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useReviews({ business_id: 'biz-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // (5 + 3 + 5) / 3 = 4.33
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.average_rating).toBe(4.33);
    expect(result.current.stats.rating_distribution[5]).toBe(2);
    expect(result.current.stats.rating_distribution[3]).toBe(1);
    expect(result.current.stats.rating_distribution[1]).toBe(0);
  });

  it('should handle empty reviews with zero stats', async () => {
    const chain = setupQueryChain([]);
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useReviews({ business_id: 'biz-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.reviews).toEqual([]);
    expect(result.current.stats.total).toBe(0);
    expect(result.current.stats.average_rating).toBe(0);
  });

  it('should handle fetch error and set error state', async () => {
    const chain = setupQueryChain(null, { message: 'Permission denied' });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useReviews({ business_id: 'biz-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should apply business_id filter', async () => {
    const chain = setupQueryChain([]);
    mockFrom.mockReturnValue(chain);

    renderHook(() => useReviews({ business_id: 'biz-1' }));

    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1');
    });
  });

  it('should apply employee_id filter', async () => {
    const chain = setupQueryChain([]);
    mockFrom.mockReturnValue(chain);

    renderHook(() => useReviews({ employee_id: 'emp-1' }));

    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('employee_id', 'emp-1');
    });
  });

  it('should apply rating filter with .in()', async () => {
    const chain = setupQueryChain([]);
    mockFrom.mockReturnValue(chain);

    renderHook(() => useReviews({ rating: [4, 5] }));

    await waitFor(() => {
      expect(chain.in).toHaveBeenCalledWith('rating', [4, 5]);
    });
  });

  it('createReview should insert and show success toast', async () => {
    const fetchChain = setupQueryChain([]);
    const insertChain = setupQueryChain([{ id: 'new-rev' }]);
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // 1st call = mount fetchReviews, 2nd = createReview insert, 3rd+ = refetch
      return callCount === 2 ? insertChain : fetchChain;
    });

    const { result } = renderHook(() => useReviews());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createReview('apt-1', 'c1', 'biz-1', 'emp-1', 5, 'Great!');
    });

    expect(insertChain.insert).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Review creada exitosamente');
  });

  it('respondToReview should update review and show success toast', async () => {
    const fetchChain = setupQueryChain(sampleReviews);
    const updateChain = setupQueryChain([]);
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount <= 1 ? fetchChain : updateChain;
    });

    const { result } = renderHook(() => useReviews());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.respondToReview('rev-1', 'Thank you!', 'owner-1');
    });

    expect(updateChain.update).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Respuesta publicada exitosamente');
  });

  it('deleteReview should delete and show success toast', async () => {
    const fetchChain = setupQueryChain(sampleReviews);
    const deleteChain = setupQueryChain([]);
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount <= 1 ? fetchChain : deleteChain;
    });

    const { result } = renderHook(() => useReviews());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteReview('rev-1');
    });

    expect(deleteChain.delete).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Review eliminada');
  });

  it('toggleReviewVisibility should update is_visible flag', async () => {
    const fetchChain = setupQueryChain(sampleReviews);
    const updateChain = setupQueryChain([]);
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount <= 1 ? fetchChain : updateChain;
    });

    const { result } = renderHook(() => useReviews());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleReviewVisibility('rev-1', false);
    });

    expect(updateChain.update).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Review oculta');
  });

  it('toggleReviewVisibility should show "publicada" when making visible', async () => {
    const fetchChain = setupQueryChain(sampleReviews);
    const updateChain = setupQueryChain([]);
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount <= 1 ? fetchChain : updateChain;
    });

    const { result } = renderHook(() => useReviews());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleReviewVisibility('rev-2', true);
    });

    expect(toast.success).toHaveBeenCalledWith('Review publicada');
  });
});
