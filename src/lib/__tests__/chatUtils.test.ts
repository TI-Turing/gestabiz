import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatChatDate } from '@/lib/chatUtils'

describe('formatChatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-04T12:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('retorna "Hoy" para la fecha actual', () => {
    expect(formatChatDate(new Date('2026-04-04T08:00:00Z'))).toBe('Hoy')
  })

  it('retorna "Ayer" para el día anterior', () => {
    expect(formatChatDate(new Date('2026-04-03T08:00:00Z'))).toBe('Ayer')
  })

  it('retorna formato largo en español para fechas previas', () => {
    const result = formatChatDate(new Date('2026-01-12T08:00:00Z'))
    expect(result).toContain('enero')
    expect(result).toContain('2026')
    expect(result).toContain('12')
  })

  it('formato incluye día de la semana en español', () => {
    // 12 de enero de 2026 es lunes
    const result = formatChatDate(new Date('2026-01-12T12:00:00Z'))
    expect(result.toLowerCase()).toContain('lunes')
  })
})
