import { describe, it, expect } from 'vitest'
import {
  calculateAppointmentFees,
  calculateRefundAmount,
  PLATFORM_FEE_RATE,
  DEFAULT_GATEWAY_RATES,
  type FeeCalculationInput,
  type CancellationPolicy,
} from './calculateAppointmentFees'

describe('calculateAppointmentFees', () => {
  const baseInput: FeeCalculationInput = {
    servicePrice: 100_000,
    advancePaymentEnabled: true,
    advancePaymentRequired: true,
    advancePaymentPercentage: 50,
    settlementMode: 'standard',
  }

  describe('happy paths', () => {
    it('caso ejemplo del usuario: $100k servicio, 50% anticipo, modo standard', () => {
      const r = calculateAppointmentFees(baseInput)
      expect(r.servicePrice).toBe(100_000)
      expect(r.depositRequired).toBe(50_000)
      expect(r.depositPercentage).toBe(50)
      // 50000 * 0.0399 * 1.19 = 2374.05
      expect(r.gatewayFee).toBeCloseTo(2374.05, 2)
      // 50000 * 0.05 = 2500
      expect(r.platformFee).toBe(2_500)
      // 50000 - 2374.05 - 2500 = 45125.95
      expect(r.netToBusiness).toBeCloseTo(45_125.95, 2)
      expect(r.remainingBalance).toBe(50_000)
      expect(r.isEnabled).toBe(true)
      expect(r.isRequired).toBe(true)
      expect(r.currency).toBe('COP')
    })

    it('100% anticipo: cliente paga todo upfront, saldo=0', () => {
      const r = calculateAppointmentFees({ ...baseInput, advancePaymentPercentage: 100 })
      expect(r.depositRequired).toBe(100_000)
      expect(r.remainingBalance).toBe(0)
      expect(r.platformFee).toBe(5_000)
    })

    it('10% anticipo (mínimo del rango)', () => {
      const r = calculateAppointmentFees({ ...baseInput, advancePaymentPercentage: 10 })
      expect(r.depositRequired).toBe(10_000)
      expect(r.platformFee).toBe(500)
      // 10000 * 0.0399 * 1.19 = 474.81
      expect(r.gatewayFee).toBeCloseTo(474.81, 2)
    })

    it('modo immediate (5.99%) cobra más comisión', () => {
      const r = calculateAppointmentFees({ ...baseInput, settlementMode: 'immediate' })
      // 50000 * 0.0599 * 1.19 = 3564.05
      expect(r.gatewayFee).toBeCloseTo(3_564.05, 2)
      expect(r.platformFee).toBe(2_500) // platform fee no cambia
    })

    it('modo deferred_14d (2.99%) cobra menos comisión', () => {
      const r = calculateAppointmentFees({ ...baseInput, settlementMode: 'deferred_14d' })
      // 50000 * 0.0299 * 1.19 = 1779.05
      expect(r.gatewayFee).toBeCloseTo(1_779.05, 2)
    })
  })

  describe('bypass cases (no se cobra)', () => {
    it('servicio gratis (price=0) no cobra anticipo aunque esté habilitado', () => {
      const r = calculateAppointmentFees({ ...baseInput, servicePrice: 0 })
      expect(r.depositRequired).toBe(0)
      expect(r.gatewayFee).toBe(0)
      expect(r.platformFee).toBe(0)
      expect(r.isEnabled).toBe(false)
    })

    it('servicio negativo (precio inválido) → tratado como 0', () => {
      const r = calculateAppointmentFees({ ...baseInput, servicePrice: -100 })
      expect(r.depositRequired).toBe(0)
      expect(r.isEnabled).toBe(false)
    })

    it('negocio con anticipos deshabilitados → no cobra', () => {
      const r = calculateAppointmentFees({ ...baseInput, advancePaymentEnabled: false })
      expect(r.depositRequired).toBe(0)
      expect(r.isEnabled).toBe(false)
      expect(r.remainingBalance).toBe(100_000)
    })

    it('porcentaje 0 → no cobra aunque enabled', () => {
      const r = calculateAppointmentFees({ ...baseInput, advancePaymentPercentage: 0 })
      expect(r.depositRequired).toBe(0)
      expect(r.gatewayFee).toBe(0)
      expect(r.platformFee).toBe(0)
    })
  })

  describe('overrides por servicio', () => {
    it('serviceOverridePercentage tiene prioridad sobre el del negocio', () => {
      const r = calculateAppointmentFees({
        ...baseInput,
        advancePaymentPercentage: 50,
        serviceOverridePercentage: 100,
      })
      expect(r.depositRequired).toBe(100_000)
      expect(r.depositPercentage).toBe(100)
    })

    it('serviceOverridePercentage = 0 fuerza no cobro para ese servicio', () => {
      const r = calculateAppointmentFees({
        ...baseInput,
        advancePaymentPercentage: 50,
        serviceOverridePercentage: 0,
      })
      expect(r.depositRequired).toBe(0)
      expect(r.isEnabled).toBe(true)
    })

    it('serviceOverridePercentage null/undefined → usa el del negocio', () => {
      const r = calculateAppointmentFees({
        ...baseInput,
        serviceOverridePercentage: null,
      })
      expect(r.depositRequired).toBe(50_000)
    })
  })

  describe('redondeo y precisión', () => {
    it('precio impar como $33.333: deposit redondeado a 2 decimales', () => {
      const r = calculateAppointmentFees({ ...baseInput, servicePrice: 33_333, advancePaymentPercentage: 50 })
      // 33333 * 0.5 = 16666.5 → 16666.50
      expect(r.depositRequired).toBe(16_666.5)
      // Verificar que no hay errores de precisión flotante en los cálculos
      expect(r.netToBusiness).toBe(r.depositRequired - r.gatewayFee - r.platformFee)
    })

    it('porcentaje fraccional: 33.5%', () => {
      const r = calculateAppointmentFees({ ...baseInput, servicePrice: 100_000, advancePaymentPercentage: 33.5 })
      expect(r.depositRequired).toBe(33_500)
    })
  })

  describe('errores de input', () => {
    it('porcentaje > 100 → throws', () => {
      expect(() => calculateAppointmentFees({ ...baseInput, advancePaymentPercentage: 150 })).toThrow(/percentage/i)
    })

    it('porcentaje < 0 → throws', () => {
      expect(() => calculateAppointmentFees({ ...baseInput, advancePaymentPercentage: -10 })).toThrow(/percentage/i)
    })

    it('serviceOverridePercentage > 100 → throws', () => {
      expect(() =>
        calculateAppointmentFees({ ...baseInput, serviceOverridePercentage: 200 })
      ).toThrow(/percentage/i)
    })
  })

  describe('constants exposure', () => {
    it('PLATFORM_FEE_RATE = 0.05 (5%)', () => {
      expect(PLATFORM_FEE_RATE).toBe(0.05)
    })

    it('DEFAULT_GATEWAY_RATES has 3 modes for CO', () => {
      expect(DEFAULT_GATEWAY_RATES.immediate).toBe(0.0599)
      expect(DEFAULT_GATEWAY_RATES.standard).toBe(0.0399)
      expect(DEFAULT_GATEWAY_RATES.deferred_14d).toBe(0.0299)
    })
  })
})

describe('calculateRefundAmount', () => {
  const policy: CancellationPolicy = {
    full_refund_hours: 48,
    partial_refund_hours: 24,
    partial_refund_percentage: 50,
  }

  // Helper: fecha relativa al "now" para cálculos predecibles
  const startTimeIn = (hours: number) =>
    new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

  it('cancelar 60h antes → 100% refund', () => {
    const r = calculateRefundAmount({
      depositPaid: 50_000,
      startTime: startTimeIn(60),
      policy,
    })
    expect(r.refundAmount).toBe(50_000)
    expect(r.refundPercentage).toBe(100)
    expect(r.tier).toBe('full')
    expect(r.eligible).toBe(true)
  })

  it('cancelar exactamente 48h antes → 100% refund (boundary)', () => {
    const r = calculateRefundAmount({
      depositPaid: 50_000,
      startTime: startTimeIn(48.01),
      policy,
    })
    expect(r.refundPercentage).toBe(100)
  })

  it('cancelar 30h antes → 50% refund (tier partial)', () => {
    const r = calculateRefundAmount({
      depositPaid: 50_000,
      startTime: startTimeIn(30),
      policy,
    })
    expect(r.refundAmount).toBe(25_000)
    expect(r.refundPercentage).toBe(50)
    expect(r.tier).toBe('partial')
  })

  it('cancelar 5h antes → 0% refund (tier none)', () => {
    const r = calculateRefundAmount({
      depositPaid: 50_000,
      startTime: startTimeIn(5),
      policy,
    })
    expect(r.refundAmount).toBe(0)
    expect(r.refundPercentage).toBe(0)
    expect(r.tier).toBe('none')
    expect(r.eligible).toBe(false)
  })

  it('depositPaid = 0 → no refund posible', () => {
    const r = calculateRefundAmount({
      depositPaid: 0,
      startTime: startTimeIn(60),
      policy,
    })
    expect(r.refundAmount).toBe(0)
    expect(r.tier).toBe('no_deposit')
    expect(r.eligible).toBe(false)
  })

  it('cita ya pasó (startTime en el pasado) → 0% refund', () => {
    const r = calculateRefundAmount({
      depositPaid: 50_000,
      startTime: startTimeIn(-2),
      policy,
    })
    expect(r.tier).toBe('none')
    expect(r.refundAmount).toBe(0)
  })

  it('política custom: 72h/12h/30%', () => {
    const customPolicy: CancellationPolicy = {
      full_refund_hours: 72,
      partial_refund_hours: 12,
      partial_refund_percentage: 30,
    }
    const r = calculateRefundAmount({
      depositPaid: 100_000,
      startTime: startTimeIn(20),
      policy: customPolicy,
    })
    expect(r.refundPercentage).toBe(30)
    expect(r.refundAmount).toBe(30_000)
  })
})
