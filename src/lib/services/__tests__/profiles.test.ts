import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/react'

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { from: (...args: unknown[]) => mocks.mockFrom(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

function buildChain(resolvedValue: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'limit']
  for (const m of methods) {
    self[m] = vi.fn().mockReturnValue(self)
  }
  self.maybeSingle = vi.fn().mockResolvedValue(resolvedValue)
  self.single = vi.fn().mockResolvedValue(resolvedValue)
  return self
}

beforeEach(() => {
  mocks.mockFrom.mockReset()
  vi.mocked(Sentry.captureException).mockClear()
})

describe('profilesService.findByPhone', () => {
  it('retorna null si phone vacío después de trim', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const result = await profilesService.findByPhone('   ')
    expect(result).toBeNull()
    expect(mocks.mockFrom).not.toHaveBeenCalled()
  })

  it('limpia espacios y consulta por phone', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({ data: { id: 'p1', email: 'a@b.com' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await profilesService.findByPhone('  +57 300 1234  ')
    expect(mocks.mockFrom).toHaveBeenCalledWith('profiles')
    expect(chain.eq).toHaveBeenCalledWith('phone', '+573001234')
    expect(chain.limit).toHaveBeenCalledWith(1)
    expect(result).toEqual({ id: 'p1', email: 'a@b.com' })
  })

  it('retorna null y captura excepción si hay error', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({ data: null, error: new Error('rls') })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await profilesService.findByPhone('300')
    expect(result).toBeNull()
    expect(Sentry.captureException).toHaveBeenCalledOnce()
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { service: 'profiles', operation: 'findByPhone' } })
    )
  })

  it('retorna null si no encuentra', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await profilesService.findByPhone('300')
    expect(result).toBeNull()
  })
})

describe('profilesService.findByEmail', () => {
  it('retorna null si email vacío', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const result = await profilesService.findByEmail('   ')
    expect(result).toBeNull()
    expect(mocks.mockFrom).not.toHaveBeenCalled()
  })

  it('normaliza email a lowercase y trim', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({ data: { id: 'p1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await profilesService.findByEmail('  USER@EXAMPLE.COM  ')
    expect(chain.eq).toHaveBeenCalledWith('email', 'user@example.com')
  })

  it('retorna null si hay error', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({ data: null, error: new Error('boom') })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await profilesService.findByEmail('a@b.com')
    expect(result).toBeNull()
  })
})

describe('profilesService.get', () => {
  it('lanza error si query falla', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({ data: null, error: new Error('not found') })
    mocks.mockFrom.mockReturnValue(chain)

    await expect(profilesService.get('p1')).rejects.toThrow('not found')
  })

  it('retorna null si no hay data', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({ data: null, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await profilesService.get('p1')
    expect(result).toBeNull()
  })

  it('mapea data a User con valores por defecto', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({
      data: {
        id: 'p1',
        email: 'a@b.com',
        full_name: 'Juan Pérez',
        avatar_url: null,
        role: 'client',
        phone: null,
        created_at: '2025-01-01',
        updated_at: '2025-01-02',
        is_active: true,
        settings: null,
      },
      error: null,
    })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await profilesService.get('p1')
    expect(result?.email).toBe('a@b.com')
    expect(result?.name).toBe('Juan Pérez')
    expect(result?.language).toBe('es')
    expect(result?.timezone).toBe('America/Bogota')
    expect(result?.role).toBe('client')
    expect(result?.activeRole).toBe('client')
    expect(result?.is_active).toBe(true)
  })

  it('respeta language en settings', async () => {
    const { profilesService } = await import('@/lib/services/profiles')
    const chain = buildChain({
      data: {
        id: 'p1',
        email: 'a@b.com',
        full_name: '',
        avatar_url: 'http://x',
        role: 'admin',
        phone: '300',
        created_at: '2025-01-01',
        updated_at: '2025-01-02',
        is_active: true,
        settings: { language: 'en' },
      },
      error: null,
    })
    mocks.mockFrom.mockReturnValue(chain)

    const result = await profilesService.get('p1')
    expect(result?.language).toBe('en')
    expect(result?.avatar_url).toBe('http://x')
    expect(result?.phone).toBe('300')
  })
})
