import { describe, it, expect } from 'vitest'
import {
  getAccessibleModules,
  getRequiredPlan,
  planIncludes,
  PRICING_PLANS,
  MODULES_ALWAYS,
  MODULES_BASICO,
  MODULES_PRO,
} from '@/lib/pricingPlans'

describe('getAccessibleModules', () => {
  it('plan free retorna MODULES_ALWAYS', () => {
    const result = getAccessibleModules('free')
    expect(result).toEqual(MODULES_ALWAYS)
    expect(result).toContain('overview')
    expect(result).toContain('appointments')
    expect(result).toContain('clients')
    expect(result).not.toContain('employees')
    expect(result).not.toContain('expenses')
  })

  it('plan basico retorna MODULES_BASICO (incluye always)', () => {
    const result = getAccessibleModules('basico')
    expect(result).toEqual(MODULES_BASICO)
    expect(result).toContain('overview')
    expect(result).toContain('employees')
    expect(result).toContain('absences')
    expect(result).toContain('sales')
    expect(result).not.toContain('expenses')
    expect(result).not.toContain('recruitment')
  })

  it('plan pro retorna MODULES_PRO (incluye basico + always)', () => {
    const result = getAccessibleModules('pro')
    expect(result).toEqual(MODULES_PRO)
    expect(result).toContain('overview')
    expect(result).toContain('employees')
    expect(result).toContain('expenses')
    expect(result).toContain('recruitment')
    expect(result).toContain('resources')
  })

  it('plan desconocido retorna MODULES_ALWAYS por seguridad', () => {
    const result = getAccessibleModules('unknown' as never)
    expect(result).toEqual(MODULES_ALWAYS)
  })
})

describe('getRequiredPlan', () => {
  it('retorna null para módulos siempre disponibles', () => {
    expect(getRequiredPlan('overview')).toBeNull()
    expect(getRequiredPlan('appointments')).toBeNull()
    expect(getRequiredPlan('billing')).toBeNull()
  })

  it('retorna basico para módulos del plan básico', () => {
    expect(getRequiredPlan('employees')).toBe('basico')
    expect(getRequiredPlan('absences')).toBe('basico')
    expect(getRequiredPlan('reports')).toBe('basico')
  })

  it('retorna pro para módulos exclusivos del plan pro', () => {
    expect(getRequiredPlan('expenses')).toBe('pro')
    expect(getRequiredPlan('recruitment')).toBe('pro')
    expect(getRequiredPlan('resources')).toBe('pro')
  })

  it('retorna null para módulo desconocido', () => {
    expect(getRequiredPlan('inexistente')).toBeNull()
  })
})

describe('planIncludes', () => {
  it('free no incluye basico ni pro', () => {
    expect(planIncludes('free', 'free')).toBe(true)
    expect(planIncludes('free', 'basico')).toBe(false)
    expect(planIncludes('free', 'pro')).toBe(false)
  })

  it('basico incluye free pero no pro', () => {
    expect(planIncludes('basico', 'free')).toBe(true)
    expect(planIncludes('basico', 'basico')).toBe(true)
    expect(planIncludes('basico', 'pro')).toBe(false)
  })

  it('pro incluye free y basico', () => {
    expect(planIncludes('pro', 'free')).toBe(true)
    expect(planIncludes('pro', 'basico')).toBe(true)
    expect(planIncludes('pro', 'pro')).toBe(true)
  })
})

describe('PRICING_PLANS', () => {
  it('contiene 3 planes (free, basico, pro)', () => {
    expect(PRICING_PLANS).toHaveLength(3)
    const ids = PRICING_PLANS.map(p => p.id)
    expect(ids).toEqual(['free', 'basico', 'pro'])
  })

  it('plan free tiene precio 0 y limits restrictivos', () => {
    const free = PRICING_PLANS.find(p => p.id === 'free')!
    expect(free.price).toBe(0)
    expect(free.priceAnnual).toBe(0)
    expect(free.limits.locations).toBe(1)
    expect(free.limits.employees).toBe(1)
    expect(free.limits.appointments).toBe(50)
  })

  it('plan basico está marcado como popular', () => {
    const basico = PRICING_PLANS.find(p => p.id === 'basico')!
    expect(basico.popular).toBe(true)
    expect(basico.price).toBeGreaterThan(0)
    expect(basico.limits.appointments).toBeNull() // ilimitado
  })

  it('plan pro tiene mayor precio y mayores limits', () => {
    const basico = PRICING_PLANS.find(p => p.id === 'basico')!
    const pro = PRICING_PLANS.find(p => p.id === 'pro')!
    expect(pro.price).toBeGreaterThan(basico.price)
    expect(pro.limits.locations).toBeGreaterThan(basico.limits.locations!)
    expect(pro.limits.employees).toBeGreaterThan(basico.limits.employees!)
  })

  it('priceAnnual = price * 10 (2 meses gratis) en basico y pro', () => {
    const basico = PRICING_PLANS.find(p => p.id === 'basico')!
    const pro = PRICING_PLANS.find(p => p.id === 'pro')!
    expect(basico.priceAnnual).toBe(basico.price * 10)
    expect(pro.priceAnnual).toBe(pro.price * 10)
  })

  it('cada plan tiene features definidas', () => {
    for (const plan of PRICING_PLANS) {
      expect(plan.features.length).toBeGreaterThan(0)
      expect(plan.name).toBeTruthy()
      expect(plan.description).toBeTruthy()
    }
  })
})
