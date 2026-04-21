import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { from: (...args: unknown[]) => mocks.mockFrom(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@/lib/normalizers', () => ({
  normalizeUserSettings: (row: Record<string, unknown> | null) =>
    row ? { ...row, normalized: true } : null,
}))

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'upsert', 'eq']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.single = vi.fn().mockResolvedValue(resolvedValue)
  return self
}

beforeEach(() => {
  mocks.mockFrom.mockReset()
})

describe('userSettingsService.getByUser', () => {
  it('obtiene settings filtrando por user_id', async () => {
    const { userSettingsService } = await import('@/lib/services/userSettings')
    const chain = buildChain({ data: { user_id: 'u1', theme: 'dark' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await userSettingsService.getByUser('u1')

    expect(mocks.mockFrom).toHaveBeenCalledWith('user_settings')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(chain.single).toHaveBeenCalled()
    expect(result).toMatchObject({ user_id: 'u1', theme: 'dark', normalized: true })
  })

  it('lanza error cuando supabase falla', async () => {
    const { userSettingsService } = await import('@/lib/services/userSettings')
    const chain = buildChain({ data: null, error: { message: 'no row' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(userSettingsService.getByUser('u1')).rejects.toBeTruthy()
  })
})

describe('userSettingsService.upsert', () => {
  it('upserta merge de user_id con updates', async () => {
    const { userSettingsService } = await import('@/lib/services/userSettings')
    const chain = buildChain({
      data: { user_id: 'u1', theme: 'light', language: 'es' },
      error: null,
    })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await userSettingsService.upsert('u1', { theme: 'light' } as never)

    expect(chain.upsert).toHaveBeenCalledWith({ user_id: 'u1', theme: 'light' })
    expect(result).toMatchObject({ user_id: 'u1', normalized: true })
  })

  it('lanza error si upsert falla', async () => {
    const { userSettingsService } = await import('@/lib/services/userSettings')
    const chain = buildChain({ data: null, error: { message: 'conflict' } })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(userSettingsService.upsert('u1', {} as never)).rejects.toBeTruthy()
  })
})
