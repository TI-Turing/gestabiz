import { describe, it, expect } from 'vitest'
import { getCategoryLabel } from '@/lib/categoryLabels'

describe('getCategoryLabel', () => {
  it('traduce categorías de income en español', () => {
    expect(getCategoryLabel('appointment_payment', 'es')).toBe('Pagos de citas')
    expect(getCategoryLabel('service_sale', 'es')).toBe('Venta de servicios')
    expect(getCategoryLabel('tip', 'es')).toBe('Propinas')
  })

  it('traduce categorías de income en inglés', () => {
    expect(getCategoryLabel('appointment_payment', 'en')).toBe('Appointment payments')
    expect(getCategoryLabel('service_sale', 'en')).toBe('Service sales')
    expect(getCategoryLabel('tip', 'en')).toBe('Tips')
  })

  it('traduce categorías de payroll', () => {
    expect(getCategoryLabel('salary', 'es')).toBe('Salarios')
    expect(getCategoryLabel('commission', 'en')).toBe('Commissions')
  })

  it('traduce categorías de impuestos colombianos', () => {
    expect(getCategoryLabel('vat', 'es')).toBe('IVA')
    expect(getCategoryLabel('withholding', 'es')).toBe('Retención en la fuente')
    expect(getCategoryLabel('income_tax', 'es')).toBe('Impuesto de renta')
  })

  it('traduce categorías de marketing', () => {
    expect(getCategoryLabel('marketing', 'es')).toBe('Marketing')
    expect(getCategoryLabel('social_media', 'en')).toBe('Social media')
  })

  it('default es español cuando no se pasa locale', () => {
    expect(getCategoryLabel('rent')).toBe('Alquiler')
    expect(getCategoryLabel('utilities')).toBe('Servicios públicos')
  })

  it('hace fallback al raw category cuando no hay traducción', () => {
    expect(getCategoryLabel('inexistente_xyz', 'es')).toBe('inexistente_xyz')
    expect(getCategoryLabel('inexistente_xyz', 'en')).toBe('inexistente_xyz')
  })

  it('cubre múltiples categorías de gastos', () => {
    expect(getCategoryLabel('cleaning', 'es')).toBe('Limpieza')
    expect(getCategoryLabel('repairs', 'en')).toBe('Repairs')
    expect(getCategoryLabel('insurance', 'es')).toBe('Seguros')
    expect(getCategoryLabel('training', 'en')).toBe('Training')
    expect(getCategoryLabel('depreciation', 'es')).toBe('Depreciación')
    expect(getCategoryLabel('other_expense', 'en')).toBe('Other expenses')
  })
})
