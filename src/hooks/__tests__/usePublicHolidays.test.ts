import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ──────────────────────────────────────────────────────────────────────────────
// MOCKS
// ──────────────────────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = { from: mockFrom }
  return { supabase: __sb, default: __sb }
})

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0 },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0 },
  },
}))

// ──────────────────────────────────────────────────────────────────────────────
// Importar hook DESPUÉS de los mocks
// ──────────────────────────────────────────────────────────────────────────────

import { usePublicHolidays, Holiday } from '../usePublicHolidays'

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

const COLOMBIA_UUID = '01b4e9d1-a84e-41c9-8768-253209225a21'

function mockHolidayQuery(holidays: Partial<Holiday>[], error: Error | null = null) {
  const orderMock = vi.fn().mockResolvedValue({ data: holidays, error })
  const lteMock = vi.fn().mockReturnValue({ order: orderMock })
  const gteMock = vi.fn().mockReturnValue({ lte: lteMock })
  const eqMock = vi.fn().mockReturnValue({ gte: gteMock })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  mockFrom.mockReturnValue({ select: selectMock })
  return { orderMock, lteMock, gteMock, eqMock, selectMock }
}

const sampleHolidays: Holiday[] = [
  {
    id: 'h-1',
    country_id: COLOMBIA_UUID,
    name: 'Año Nuevo',
    holiday_date: '2025-01-01',
    is_recurring: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'h-2',
    country_id: COLOMBIA_UUID,
    name: 'Día del Trabajo',
    holiday_date: '2025-05-01',
    is_recurring: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// SUITE
// ──────────────────────────────────────────────────────────────────────────────

describe('usePublicHolidays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Consulta y datos ─────────────────────────────────────────────────────

  it('retorna lista de festivos cuando la consulta es exitosa', async () => {
    mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.holidays).toHaveLength(2)
    expect(result.current.holidays[0].name).toBe('Año Nuevo')
    expect(result.current.error).toBeNull()
  })

  it('consulta la tabla public_holidays con el country_id correcto', async () => {
    const { eqMock } = mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(eqMock).toHaveBeenCalledWith('country_id', COLOMBIA_UUID))
    expect(mockFrom).toHaveBeenCalledWith('public_holidays')
  })

  it('retorna array vacío cuando countryId es null', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(null, 2025), { wrapper: Wrapper })

    // enabled: false — no hace fetch
    await new Promise((r) => setTimeout(r, 30))
    expect(result.current.holidays).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('retorna array vacío cuando countryId es undefined', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(undefined, 2025), { wrapper: Wrapper })

    await new Promise((r) => setTimeout(r, 30))
    expect(result.current.holidays).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('retorna error cuando la consulta falla', async () => {
    const dbError = new Error('DB error')
    mockHolidayQuery([], dbError)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.holidays).toEqual([])
  })

  // ── Normalización de countryId ───────────────────────────────────────────

  it('normaliza "Colombia" al UUID correcto', async () => {
    const { eqMock } = mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    renderHook(() => usePublicHolidays('Colombia', 2025), { wrapper: Wrapper })

    await waitFor(() => expect(eqMock).toHaveBeenCalledWith('country_id', COLOMBIA_UUID))
  })

  it('normaliza "colombia" (minúsculas) al UUID correcto', async () => {
    const { eqMock } = mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    renderHook(() => usePublicHolidays('colombia', 2025), { wrapper: Wrapper })

    await waitFor(() => expect(eqMock).toHaveBeenCalledWith('country_id', COLOMBIA_UUID))
  })

  it('normaliza código "CO" al UUID correcto', async () => {
    const { eqMock } = mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    renderHook(() => usePublicHolidays('CO', 2025), { wrapper: Wrapper })

    await waitFor(() => expect(eqMock).toHaveBeenCalledWith('country_id', COLOMBIA_UUID))
  })

  it('deja pasar UUID directamente sin transformación', async () => {
    const { eqMock } = mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(eqMock).toHaveBeenCalledWith('country_id', COLOMBIA_UUID))
  })

  // ── isHoliday ────────────────────────────────────────────────────────────

  it('isHoliday() retorna true para fecha festiva (string)', async () => {
    mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isHoliday('2025-01-01')).toBe(true)
    expect(result.current.isHoliday('2025-05-01')).toBe(true)
  })

  it('isHoliday() retorna false para fecha no festiva (string)', async () => {
    mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isHoliday('2025-03-15')).toBe(false)
  })

  it('isHoliday() acepta objetos Date', async () => {
    mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Usar constructor local (año, mes-0, día) para evitar parsing UTC
    expect(result.current.isHoliday(new Date(2025, 0, 1))).toBe(true)
    expect(result.current.isHoliday(new Date(2025, 6, 4))).toBe(false)
  })

  it('isHoliday() retorna false cuando holidays está vacío', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(null, 2025), { wrapper: Wrapper })

    expect(result.current.isHoliday('2025-01-01')).toBe(false)
  })

  // ── getHolidayName ───────────────────────────────────────────────────────

  it('getHolidayName() retorna nombre del festivo para fecha correcta', async () => {
    mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.getHolidayName('2025-01-01')).toBe('Año Nuevo')
    expect(result.current.getHolidayName('2025-05-01')).toBe('Día del Trabajo')
  })

  it('getHolidayName() retorna null para fecha no festiva', async () => {
    mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.getHolidayName('2025-06-15')).toBeNull()
  })

  it('getHolidayName() acepta objetos Date', async () => {
    mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(COLOMBIA_UUID, 2025), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Usar constructor local (año, mes-0, día) para evitar parsing UTC
    expect(result.current.getHolidayName(new Date(2025, 0, 1))).toBe('Año Nuevo')
  })

  it('getHolidayName() retorna null cuando holidays está vacío', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePublicHolidays(null, 2025), { wrapper: Wrapper })

    expect(result.current.getHolidayName('2025-01-01')).toBeNull()
  })

  // ── Año actual por defecto ───────────────────────────────────────────────

  it('usa el año actual cuando no se pasa el parámetro year', async () => {
    const { gteMock } = mockHolidayQuery(sampleHolidays)
    const { Wrapper } = createWrapper()
    const currentYear = new Date().getFullYear()
    renderHook(() => usePublicHolidays(COLOMBIA_UUID), { wrapper: Wrapper })

    await waitFor(() =>
      expect(gteMock).toHaveBeenCalledWith('holiday_date', `${currentYear}-01-01`)
    )
  })
})
