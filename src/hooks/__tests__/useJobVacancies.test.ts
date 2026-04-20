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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { useJobVacancies } from '../useJobVacancies'

/**
 * Helper: returns fresh chain mocks per call.
 * - vacanciesData: rows returned for queries against `job_vacancies`
 * - applicationsData: rows returned when querying `job_applications` (delete pre-check)
 * - mutationData: row returned by .insert(...).select().single()
 * - errorOnMutation: when set, mutation chain resolves with this error
 * - errorOnFetch: when set, fetch chain resolves with this error
 */
function setupRouter(opts: {
  vacanciesData?: unknown[]
  applicationsData?: unknown[]
  mutationData?: unknown
  errorOnMutation?: unknown
  errorOnFetch?: unknown
} = {}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'job_applications') {
      return mockSupabaseChain({
        data: opts.applicationsData ?? [],
        error: null,
      })
    }
    // job_vacancies → if mutation flag, return mutation chain
    // We can't differentiate without tracking call signatures; the hook
    // chain pattern works for both fetch (.select().order().eq()) and
    // mutations (.insert/.update/.delete...) because every method returns
    // self and `then` resolves with {data, error}.
    return mockSupabaseChain({
      data: opts.mutationData ?? opts.vacanciesData ?? [],
      error: opts.errorOnMutation ?? opts.errorOnFetch ?? null,
    })
  })
}

describe('useJobVacancies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Initial fetch ───────────────────────────────────────────────────────────

  it('fetches without business_id filter when none is provided', async () => {
    const chain = mockSupabaseChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFrom).toHaveBeenCalledWith('job_vacancies')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(chain.eq).not.toHaveBeenCalled()
  })

  it('filters by business_id when provided', async () => {
    const chain = mockSupabaseChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(chain.eq).toHaveBeenCalledWith('business_id', 'biz-1')
  })

  it('exposes error and shows toast on fetch failure', async () => {
    mockFrom.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: 'boom' } }),
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
    expect(toast.error).toHaveBeenCalledWith('Error al cargar vacantes')
  })

  // ── createVacancy ───────────────────────────────────────────────────────────

  it('createVacancy validates that title is required', async () => {
    setupRouter()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: unknown
    await act(async () => {
      res = await result.current.createVacancy({
        business_id: 'biz-1',
        title: '   ',
        description: 'a'.repeat(120),
      })
    })
    expect(res).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('El título es requerido')
  })

  it('createVacancy validates description length ≥100', async () => {
    setupRouter()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: unknown
    await act(async () => {
      res = await result.current.createVacancy({
        business_id: 'biz-1',
        title: 'Estilista',
        description: 'corto',
      })
    })
    expect(res).toBeNull()
    expect(toast.error).toHaveBeenCalledWith(
      'La descripción debe tener al menos 100 caracteres',
    )
  })

  it('createVacancy rejects when salary_min > salary_max', async () => {
    setupRouter()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: unknown
    await act(async () => {
      res = await result.current.createVacancy({
        business_id: 'biz-1',
        title: 'Estilista',
        description: 'a'.repeat(120),
        salary_min: 5_000_000,
        salary_max: 3_000_000,
      })
    })
    expect(res).toBeNull()
    expect(toast.error).toHaveBeenCalledWith(
      'El salario mínimo no puede ser mayor que el máximo',
    )
  })

  it('createVacancy inserts with defaults and shows success toast', async () => {
    const created = { id: 'v1', title: 'Estilista' }
    setupRouter({ mutationData: created })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res: unknown
    await act(async () => {
      res = await result.current.createVacancy({
        business_id: 'biz-1',
        title: 'Estilista',
        description: 'a'.repeat(120),
      })
    })

    expect(res).toEqual(created)
    expect(toast.success).toHaveBeenCalledWith('Vacante creada exitosamente')
  })

  it('createVacancy sets published_at when status=open', async () => {
    const created = { id: 'v1' }
    let insertedPayload: Record<string, unknown> | null = null

    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({ data: created, error: null })
      const realInsert = chain.insert
      chain.insert = vi.fn((payload: Record<string, unknown>) => {
        insertedPayload = payload
        return realInsert(payload)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createVacancy({
        business_id: 'biz-1',
        title: 'Estilista',
        description: 'a'.repeat(120),
        status: 'open',
      })
    })

    expect(insertedPayload).toBeTruthy()
    expect(insertedPayload!.published_at).toBeTruthy()
    expect(insertedPayload!.status).toBe('open')
  })

  // ── updateVacancy ───────────────────────────────────────────────────────────

  it('updateVacancy returns true and refetches on success', async () => {
    setupRouter()
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = false
    await act(async () => {
      res = await result.current.updateVacancy('v1', { title: 'Nuevo' })
    })
    expect(res).toBe(true)
    expect(toast.success).toHaveBeenCalledWith('Vacante actualizada')
  })

  it('updateVacancy returns false and shows error toast on failure', async () => {
    setupRouter({ errorOnMutation: { message: 'cannot-update' } })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = true
    await act(async () => {
      res = await result.current.updateVacancy('v1', { title: 'X' })
    })
    expect(res).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('cannot-update')
  })

  // ── deleteVacancy ───────────────────────────────────────────────────────────

  it('deleteVacancy refuses to delete when applications exist', async () => {
    setupRouter({ applicationsData: [{ id: 'app-1' }] })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = true
    await act(async () => {
      res = await result.current.deleteVacancy('v1')
    })
    expect(res).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(
      'No se puede eliminar una vacante con aplicaciones. Ciérrala en su lugar.',
    )
  })

  it('deleteVacancy succeeds when there are no applications', async () => {
    setupRouter({ applicationsData: [] })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = false
    await act(async () => {
      res = await result.current.deleteVacancy('v1')
    })
    expect(res).toBe(true)
    expect(toast.success).toHaveBeenCalledWith('Vacante eliminada')
  })

  // ── closeVacancy ────────────────────────────────────────────────────────────

  it('closeVacancy sets status=closed and filled_at, returns true', async () => {
    let updatedPayload: Record<string, unknown> | null = null
    mockFrom.mockImplementation(() => {
      const chain = mockSupabaseChain({ data: [], error: null })
      const realUpdate = chain.update
      chain.update = vi.fn((payload: Record<string, unknown>) => {
        updatedPayload = payload
        return realUpdate(payload)
      }) as never
      return chain
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res = false
    await act(async () => {
      res = await result.current.closeVacancy('v1')
    })

    expect(res).toBe(true)
    expect(updatedPayload).toMatchObject({ status: 'closed' })
    expect(updatedPayload!.filled_at).toBeTruthy()
    expect(toast.success).toHaveBeenCalledWith('Vacante cerrada')
  })

  // ── incrementViews ──────────────────────────────────────────────────────────

  it('incrementViews calls the increment_vacancy_views RPC', async () => {
    setupRouter()
    mockRpc.mockResolvedValue({ data: null, error: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.incrementViews('v1')
    })

    expect(mockRpc).toHaveBeenCalledWith('increment_vacancy_views', {
      vacancy_id: 'v1',
    })
  })

  it('incrementViews swallows RPC failures silently (no toast)', async () => {
    setupRouter()
    mockRpc.mockRejectedValue(new Error('rpc-fail'))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useJobVacancies('biz-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.incrementViews('v1')
    })

    expect(toast.error).not.toHaveBeenCalled()
  })
})
