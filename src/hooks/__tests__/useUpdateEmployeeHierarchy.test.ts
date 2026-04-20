import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'
import { toast } from 'sonner'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1' },
    session: { access_token: 'fake-token' },
    loading: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

import { useUpdateEmployeeHierarchy } from '../useUpdateEmployeeHierarchy'

const fetchMock = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  globalThis.fetch = fetchMock as never
  // Provide VITE_SUPABASE_URL via stubEnv
  vi.stubEnv('VITE_SUPABASE_URL', 'https://fake.supabase.co')
})

describe('useUpdateEmployeeHierarchy', () => {
  const baseParams = {
    userId: 'emp-1',
    businessId: 'biz-1',
    newLevel: 2,
    employeeName: 'Ana Pérez',
  }

  it('rejects invalid hierarchy levels (out of 0-4 range)', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateEmployeeHierarchy(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await expect(
        result.current.updateHierarchyLevel({ ...baseParams, newLevel: 99 }),
      ).rejects.toThrow(/Nivel jerárquico inválido/)
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('calls the update-hierarchy edge function with the correct payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateEmployeeHierarchy(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.updateHierarchyLevel(baseParams)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://fake.supabase.co/functions/v1/update-hierarchy',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        }),
        body: JSON.stringify({ uid: 'emp-1', bid: 'biz-1', lvl: 2 }),
      }),
    )
  })

  it('shows success toast on completion', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateEmployeeHierarchy(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.updateHierarchyLevel(baseParams)
    })

    expect(toast.loading).toHaveBeenCalledWith(
      expect.stringContaining('Ana Pérez'),
      expect.objectContaining({ id: 'hierarchy-update-emp-1' }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Ana Pérez'),
      expect.objectContaining({ id: 'hierarchy-update-emp-1' }),
    )
  })

  it('throws and shows error toast when edge function returns non-OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'database failed' }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateEmployeeHierarchy(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await expect(
        result.current.updateHierarchyLevel(baseParams),
      ).rejects.toThrow('database failed')
    })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('database failed'),
      expect.any(Object),
    )
  })

  it('falls back to status code when error message is missing', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateEmployeeHierarchy(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await expect(
        result.current.updateHierarchyLevel(baseParams),
      ).rejects.toThrow(/503/)
    })
  })

  it('isUpdating is false after the mutation settles', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateEmployeeHierarchy(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.updateHierarchyLevel(baseParams)
    })
    expect(result.current.isUpdating).toBe(false)
  })

  it('accepts level 0 as valid', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateEmployeeHierarchy(), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.updateHierarchyLevel({ ...baseParams, newLevel: 0 })
    })
    expect(fetchMock).toHaveBeenCalled()
  })
})
