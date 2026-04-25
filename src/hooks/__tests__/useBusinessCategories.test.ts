import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
  default: { from: mockFrom },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { useBusinessCategories } from '../useBusinessCategories'

const mockCategoriesData = [
  { id: 'cat-1', name: 'Salud', parent_id: null, is_active: true, icon: null },
  { id: 'cat-2', name: 'Belleza', parent_id: null, is_active: true, icon: null },
  { id: 'sub-1', name: 'Spa', parent_id: 'cat-1', is_active: true, icon: null },
  { id: 'sub-2', name: 'Peluquería', parent_id: 'cat-2', is_active: true, icon: null },
  { id: 'sub-3', name: 'Clínica', parent_id: 'cat-1', is_active: true, icon: null },
]

describe('useBusinessCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all categories split into main, subcategories, and flat list', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: mockCategoriesData, error: null }))

    const { result } = renderHook(() => useBusinessCategories())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.mainCategories).toHaveLength(2)
    expect(result.current.allCategories).toHaveLength(5)
    expect(result.current.error).toBeNull()
  })

  it('builds hierarchical structure with subcategories nested under their parent', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: mockCategoriesData, error: null }))

    const { result } = renderHook(() => useBusinessCategories())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const salud = result.current.categories.find((c) => c.id === 'cat-1')
    expect(salud).toBeDefined()
    expect(salud?.subcategories).toHaveLength(2)

    const belleza = result.current.categories.find((c) => c.id === 'cat-2')
    expect(belleza?.subcategories).toHaveLength(1)
  })

  it('returns empty arrays when no categories exist', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: [], error: null }))

    const { result } = renderHook(() => useBusinessCategories())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.mainCategories).toEqual([])
    expect(result.current.allCategories).toEqual([])
    expect(result.current.categories).toEqual([])
  })

  it('sets error message on fetch failure', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'DB connection error' } }),
    )

    const { result } = renderHook(() => useBusinessCategories())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeTruthy()
    expect(result.current.mainCategories).toEqual([])
  })

  it('starts with isLoading=true then transitions to false', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: mockCategoriesData, error: null }))

    const { result } = renderHook(() => useBusinessCategories())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('refetch re-executes the query', async () => {
    mockFrom.mockReturnValue(mockSupabaseChain({ data: mockCategoriesData, error: null }))

    const { result } = renderHook(() => useBusinessCategories())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Call refetch
    await result.current.refetch()

    // from() should have been called twice (initial + refetch)
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })

  it('categories without parent_id are treated as main categories', async () => {
    const onlyRoots = [
      { id: 'cat-A', name: 'Tecnología', parent_id: null, is_active: true },
    ]
    mockFrom.mockReturnValue(mockSupabaseChain({ data: onlyRoots, error: null }))

    const { result } = renderHook(() => useBusinessCategories())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.mainCategories).toHaveLength(1)
    expect(result.current.categories[0]?.subcategories).toEqual([])
  })
})
