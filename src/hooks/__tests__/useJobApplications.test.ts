import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { mockSupabaseChain } from '@/test-utils/supabase-mock'
import { toast } from 'sonner'

const mockFrom = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
  default: { from: mockFrom, rpc: mockRpc },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'u@test.com' },
    session: { access_token: 'tok' },
    loading: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { useJobApplications } from '../useJobApplications'

const baseApplication = {
  id: 'app-1',
  vacancy_id: 'vac-1',
  user_id: 'user-2',
  status: 'pending' as const,
  cover_letter: 'Estoy muy interesado en este puesto y tengo experiencia.',
  cv_url: 'cvs/cv-1.pdf',
  expected_salary: 3_000_000,
  available_from: '2026-06-01',
  availability_notes: 'De inmediato',
  created_at: '2026-04-01T10:00:00Z',
  updated_at: '2026-04-01T10:00:00Z',
  vacancy: {
    id: 'vac-1',
    title: 'Estilista',
    business_id: 'biz-1',
    position_type: 'full_time',
    salary_min: 2_000_000,
    salary_max: 4_000_000,
    currency: 'COP',
    status: 'open',
    businesses: { name: 'Salón XYZ' },
  },
}

describe('useJobApplications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches applications and maps business_name from joined businesses', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'job_applications') {
        return mockSupabaseChain({ data: [baseApplication], error: null })
      }
      if (table === 'profiles') {
        return mockSupabaseChain({
          data: { id: 'user-2', full_name: 'María', email: 'm@test.com' },
          error: null,
        })
      }
      return mockSupabaseChain({ data: [], error: null })
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobApplications(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.applications).toHaveLength(1)
    expect(result.current.applications[0].vacancy?.business_name).toBe('Salón XYZ')
    expect(result.current.applications[0].applicant?.full_name).toBe('María')
  })

  it('applies vacancyId/userId/status filters when provided', async () => {
    const chain = mockSupabaseChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    renderHook(
      () =>
        useJobApplications({
          vacancyId: 'vac-1',
          userId: 'user-2',
          status: 'pending',
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('vacancy_id', 'vac-1')
    })
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-2')
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
  })

  it('fetch error sets state and shows toast', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'fetch-failed' } }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobApplications(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('fetch-failed')
    expect(toast.error).toHaveBeenCalledWith(
      'Error al cargar aplicaciones',
      expect.objectContaining({ description: 'fetch-failed' }),
    )
  })

  it('updateApplicationStatus updates and toasts success', async () => {
    let updatedPayload: Record<string, unknown> | null = null
    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({ data: [], error: null })
      const realUpdate = chain.update
      chain.update = vi.fn((p: Record<string, unknown>) => {
        updatedPayload = p
        return realUpdate(p)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobApplications(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = false
    await act(async () => {
      res = await result.current.updateApplicationStatus('app-1', 'reviewing')
    })

    expect(res).toBe(true)
    expect(updatedPayload).toMatchObject({ status: 'reviewing' })
    expect(updatedPayload!.reviewed_at).toBeTruthy()
    expect(toast.success).toHaveBeenCalledWith(
      'Estado actualizado',
      expect.any(Object),
    )
  })

  it('rejectApplication stores rejection reason in decision_notes', async () => {
    let updatedPayload: Record<string, unknown> | null = null
    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({ data: [], error: null })
      const realUpdate = chain.update
      chain.update = vi.fn((p: Record<string, unknown>) => {
        updatedPayload = p
        return realUpdate(p)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobApplications(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.rejectApplication('app-1', 'No cumple requisitos')
    })

    expect(updatedPayload).toMatchObject({
      status: 'rejected',
      decision_notes: 'No cumple requisitos',
    })
  })

  it('updateApplicationStatus returns false and toasts on error', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'update-failed' } }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobApplications(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = true
    await act(async () => {
      res = await result.current.updateApplicationStatus('app-1', 'reviewing')
    })
    expect(res).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(
      'Error al actualizar estado',
      expect.any(Object),
    )
  })

  it('withdrawApplication blocks when application belongs to another user', async () => {
    mockFrom.mockImplementation(() => {
      return mockSupabaseChain({
        data: { user_id: 'someone-else' },
        error: null,
      })
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobApplications(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = true
    await act(async () => {
      res = await result.current.withdrawApplication('app-1')
    })
    expect(res).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(
      'Error al retirar aplicación',
      expect.objectContaining({
        description: 'No tienes permiso para retirar esta aplicación',
      }),
    )
  })

  it('withdrawApplication updates status to "withdrawn" when user owns it', async () => {
    let updatedPayload: Record<string, unknown> | null = null
    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({
        data: { user_id: 'user-1' },
        error: null,
      })
      const realUpdate = chain.update
      chain.update = vi.fn((p: Record<string, unknown>) => {
        updatedPayload = p
        return realUpdate(p)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobApplications(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = false
    await act(async () => {
      res = await result.current.withdrawApplication('app-1')
    })
    expect(res).toBe(true)
    expect(updatedPayload).toEqual({ status: 'withdrawn' })
  })
})
