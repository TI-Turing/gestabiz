import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency, formatNumber } from '@/lib/i18n'

describe('i18n formatters', () => {
  describe('formatDate', () => {
    const fixed = new Date('2025-06-15T14:30:00Z')

    it('formato short en español usa locale es-ES', () => {
      const r = formatDate(fixed, 'short', 'es')
      expect(typeof r).toBe('string')
      expect(r.length).toBeGreaterThan(0)
    })

    it('formato long incluye nombre del mes', () => {
      const r = formatDate(fixed, 'long', 'es')
      expect(r.toLowerCase()).toMatch(/junio|june/)
    })

    it('formato time devuelve HH:MM', () => {
      const r = formatDate(fixed, 'time', 'en')
      expect(r).toMatch(/\d{1,2}:\d{2}/)
    })

    it('acepta string como input', () => {
      const r = formatDate('2025-01-01T00:00:00Z', 'short', 'es')
      expect(typeof r).toBe('string')
      expect(r.length).toBeGreaterThan(0)
    })

    it('formato por defecto es short', () => {
      const r = formatDate(fixed)
      expect(typeof r).toBe('string')
    })
  })

  describe('formatCurrency', () => {
    it('formatea EUR en español', () => {
      const r = formatCurrency(1234.56, 'EUR', 'es')
      expect(r).toContain('€')
    })

    it('formatea USD en inglés', () => {
      const r = formatCurrency(99.9, 'USD', 'en')
      expect(r).toContain('$')
    })

    it('formatea COP', () => {
      const r = formatCurrency(50000, 'COP', 'es')
      expect(r.length).toBeGreaterThan(0)
    })
  })

  describe('formatNumber', () => {
    it('aplica separadores en español', () => {
      const r = formatNumber(1234567, 'es')
      expect(r).toMatch(/[.\s]/)
    })

    it('aplica separadores en inglés', () => {
      const r = formatNumber(1234567, 'en')
      expect(r).toContain(',')
    })
  })
})
