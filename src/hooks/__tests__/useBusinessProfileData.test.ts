import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'

const mockFrom = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { useBusinessProfileData } from '../useBusinessProfileData'

const mockBusiness = {
  id: 'biz-1',
  name: 'Salón Test',
  description: 'Un salón de prueba',
  phone: '+573001234567',
  email: 'salon@test.com',
  website: null,
  logo_url: null,
  banner_url: null,
  slug: 'salon-test',
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  og_image_url: null,
  is_public: true,
  category_id: 'cat-1',
  business_categories: { id: 'cat-1', name: 'Belleza', icon_name: 'sparkle' },
}

describe('useBusinessProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: null }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessProfileData({ slug: 'salon-test' }),
      { wrapper: Wrapper },
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('returns error when neither businessId nor slug provided', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessProfileData({}),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.business).toBeNull()
  })

  it('fetches business data by slug', async () => {
    // Business query
    const bizChain = mockSupabaseChain({ data: mockBusiness, error: null })
    // Subcategories query
    const subChain = mockSupabaseChain({ data: [], error: null })
    // Locations RPC
    mockRpc.mockResolvedValue({ data: [], error: null })
    // Services query
    const svcChain = mockSupabaseChain({ data: [], error: null })
    // Employees query
    const empChain = mockSupabaseChain({ data: [], error: null })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return bizChain
      if (callCount === 2) return subChain
      if (callCount === 3) return svcChain
      return empChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessProfileData({ slug: 'salon-test' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.business).not.toBeNull()
    expect(result.current.business?.name).toBe('Salón Test')
    expect(result.current.error).toBeNull()
  })

  it('fetches business data by businessId', async () => {
    const bizChain = mockSupabaseChain({ data: mockBusiness, error: null })
    const subChain = mockSupabaseChain({ data: [], error: null })
    mockRpc.mockResolvedValue({ data: [], error: null })
    const svcChain = mockSupabaseChain({ data: [], error: null })
    const empChain = mockSupabaseChain({ data: [], error: null })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return bizChain
      if (callCount === 2) return subChain
      if (callCount === 3) return svcChain
      return empChain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessProfileData({ businessId: 'biz-1' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.business?.id).toBe('biz-1')
  })

  it('handles Supabase errors gracefully', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'not found' } }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useBusinessProfileData({ slug: 'not-exist' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.business).toBeNull()
  })
})
