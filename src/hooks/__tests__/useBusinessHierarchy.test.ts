import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { useBusinessHierarchy } from '../useBusinessHierarchy'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  __esModule: true,
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  })

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useBusinessHierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.skip('includes the business owner when the owner is not returned by the hierarchy RPC', async () => {
    const ownerId = 'owner-1'
    const businessId = 'biz-1'

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        {
          employee_id: 'employee-1',
          business_id: businessId,
          full_name: 'Empleado Uno',
          email: 'employee@example.com',
          role: 'professional',
          employee_type: 'staff',
          hierarchy_level: 2,
          reports_to: ownerId,
          is_active: true,
          total_appointments: 0,
          completed_appointments: 0,
          cancelled_appointments: 0,
          average_rating: 0,
          total_reviews: 0,
          occupancy_rate: 0,
          gross_revenue: 0,
          direct_reports_count: 0,
          all_reports_count: 0,
        },
      ],
      error: null,
    })

    const fromMock = vi.fn((table: string) => {
      const single = vi.fn()

      if (table === 'businesses') {
        single.mockResolvedValue({ data: { owner_id: ownerId }, error: null })
      } else if (table === 'profiles') {
        single.mockResolvedValue({
          data: {
            id: ownerId,
            full_name: 'Dueño del Negocio',
            email: 'owner@example.com',
            avatar_url: null,
            phone: '3001234567',
          },
          error: null,
        })
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single,
          })),
        })),
      }
    })

    vi.mocked(supabase.from).mockImplementation(fromMock as never)

    const { result } = renderHook(() => useBusinessHierarchy(businessId), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data.length).toBe(2)
    expect(result.current.data.some(emp => emp.user_id === ownerId)).toBe(true)

    const owner = result.current.data.find(emp => emp.user_id === ownerId)
    expect(owner).toMatchObject({
      role: 'owner',
      full_name: 'Dueño del Negocio',
      email: 'owner@example.com',
      hierarchy_level: 0,
      reports_to: null,
    })
    expect(vi.mocked(supabase.from).mock.calls.map(args => args[0])).toEqual(['businesses', 'profiles'])
  })
})
