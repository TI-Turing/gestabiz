import { renderHook, waitFor, act } from '@testing-library/react'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { useBusinessSubcategories, useSubcategoriesByParent } from '../useBusinessSubcategories'

const mockSubcategoryRow = {
  id: 'sub-1',
  business_id: 'biz-1',
  subcategory_id: 'cat-sub-1',
  subcategory: { id: 'cat-sub-1', name: 'Spa', parent_id: 'cat-parent-1', is_active: true },
}

describe('useBusinessSubcategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty subcategories and no loading when businessId is null', async () => {
    const { result } = renderHook(() => useBusinessSubcategories(null))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.subcategories).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetches subcategories on mount with valid businessId', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [mockSubcategoryRow], error: null }))

    const { result } = renderHook(() => useBusinessSubcategories('biz-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockFrom).toHaveBeenCalledWith('business_subcategories')
    expect(result.current.subcategories).toHaveLength(1)
    expect(result.current.subcategories[0].id).toBe('sub-1')
    expect(result.current.error).toBeNull()
  })

  it('sets error when fetch fails', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: new Error('DB error') })
    )

    const { result } = renderHook(() => useBusinessSubcategories('biz-1'))

    await waitFor(() => expect(result.current.error).not.toBeNull())

    expect(result.current.subcategories).toEqual([])
    expect(result.current.error).toContain('DB error')
  })

  it('returns false from addSubcategory when businessId is null', async () => {
    const { result } = renderHook(() => useBusinessSubcategories(null))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success = true
    await act(async () => {
      success = await result.current.addSubcategory('cat-sub-1')
    })

    expect(success).toBe(false)
  })

  it('returns false and sets error when trying to add beyond max 3 subcategories', async () => {
    const threeRows = [
      { ...mockSubcategoryRow, id: 's1' },
      { ...mockSubcategoryRow, id: 's2' },
      { ...mockSubcategoryRow, id: 's3' },
    ]
    mockFrom.mockReturnValue(mockSupabaseChain({ data: threeRows, error: null }))

    const { result } = renderHook(() => useBusinessSubcategories('biz-1'))
    await waitFor(() => expect(result.current.subcategories).toHaveLength(3))

    let success = true
    await act(async () => {
      success = await result.current.addSubcategory('cat-sub-new')
    })

    expect(success).toBe(false)
    expect(result.current.error).toContain('3')
  })

  it('inserts and refetches on successful addSubcategory', async () => {
    const refetchedData = [mockSubcategoryRow]
    // Call 1: initial fetch (empty), Call 2: insert, Call 3: refetch after insert
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: null, error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: refetchedData, error: null }))

    const { result } = renderHook(() => useBusinessSubcategories('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success = false
    await act(async () => {
      success = await result.current.addSubcategory('cat-sub-1')
    })

    expect(success).toBe(true)
    await waitFor(() => expect(result.current.subcategories).toHaveLength(1))
  })

  it('returns false and sets error when insert fails', async () => {
    // Call 1: initial fetch, Call 2: insert error
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: null, error: new Error('Insert failed') }))

    const { result } = renderHook(() => useBusinessSubcategories('biz-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success = true
    await act(async () => {
      success = await result.current.addSubcategory('cat-sub-1')
    })

    expect(success).toBe(false)
    expect(result.current.error).toContain('Insert failed')
  })

  it('deletes and refetches on successful removeSubcategory', async () => {
    // Call 1: initial fetch (1 item), Call 2: delete, Call 3: refetch (empty)
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [mockSubcategoryRow], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: null, error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => useBusinessSubcategories('biz-1'))
    await waitFor(() => expect(result.current.subcategories).toHaveLength(1))

    let success = false
    await act(async () => {
      success = await result.current.removeSubcategory('cat-sub-1')
    })

    expect(success).toBe(true)
    await waitFor(() => expect(result.current.subcategories).toHaveLength(0))
  })

  it('returns false and sets error when delete fails', async () => {
    mockFrom
      .mockReturnValueOnce(mockSupabaseChain({ data: [mockSubcategoryRow], error: null }))
      .mockReturnValueOnce(mockSupabaseChain({ data: null, error: new Error('Delete failed') }))

    const { result } = renderHook(() => useBusinessSubcategories('biz-1'))
    await waitFor(() => expect(result.current.subcategories).toHaveLength(1))

    let success = true
    await act(async () => {
      success = await result.current.removeSubcategory('cat-sub-1')
    })

    expect(success).toBe(false)
    expect(result.current.error).toContain('Delete failed')
  })
})

describe('useSubcategoriesByParent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const parentCategoryData = [
    { id: 'sub-a', name: 'Spa', parent_id: 'parent-1', is_active: true, sort_order: 1 },
    { id: 'sub-b', name: 'Masajes', parent_id: 'parent-1', is_active: true, sort_order: 2 },
  ]

  it('returns empty when parentId is null', async () => {
    const { result } = renderHook(() => useSubcategoriesByParent(null))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.subcategories).toEqual([])
  })

  it('fetches subcategories for a given parentId', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: parentCategoryData, error: null }))

    const { result } = renderHook(() => useSubcategoriesByParent('parent-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.subcategories).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: new Error('Fetch error') })
    )

    const { result } = renderHook(() => useSubcategoriesByParent('parent-1'))

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.subcategories).toEqual([])
  })
})
