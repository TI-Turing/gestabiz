import { describe, it, expect } from 'vitest'
import { PAGINATION, QUERY_CONFIG } from '../queryConfig'

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — PAGINATION
// ──────────────────────────────────────────────────────────────────────────────

describe('PAGINATION', () => {
  it('MESSAGES es 50', () => {
    expect(PAGINATION.MESSAGES).toBe(50)
  })

  it('NOTIFICATIONS es 50', () => {
    expect(PAGINATION.NOTIFICATIONS).toBe(50)
  })

  it('CONVERSATIONS es 20', () => {
    expect(PAGINATION.CONVERSATIONS).toBe(20)
  })

  it('APPOINTMENTS es 25', () => {
    expect(PAGINATION.APPOINTMENTS).toBe(25)
  })

  it('TRANSACTIONS es 50', () => {
    expect(PAGINATION.TRANSACTIONS).toBe(50)
  })

  it('ABSENCES es 30', () => {
    expect(PAGINATION.ABSENCES).toBe(30)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — QUERY_CONFIG.STABLE
// ──────────────────────────────────────────────────────────────────────────────

describe('QUERY_CONFIG.STABLE', () => {
  const { STABLE } = QUERY_CONFIG

  it('staleTime es 5 minutos', () => {
    expect(STABLE.staleTime).toBe(5 * 60 * 1000)
  })

  it('gcTime es 24 horas', () => {
    expect(STABLE.gcTime).toBe(24 * 60 * 60 * 1000)
  })

  it('refetchOnWindowFocus es false', () => {
    expect(STABLE.refetchOnWindowFocus).toBe(false)
  })

  it('refetchOnReconnect es false', () => {
    expect(STABLE.refetchOnReconnect).toBe(false)
  })

  it('refetchOnMount es false', () => {
    expect(STABLE.refetchOnMount).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — QUERY_CONFIG.FREQUENT
// ──────────────────────────────────────────────────────────────────────────────

describe('QUERY_CONFIG.FREQUENT', () => {
  const { FREQUENT } = QUERY_CONFIG

  it('staleTime es 1 minuto', () => {
    expect(FREQUENT.staleTime).toBe(1 * 60 * 1000)
  })

  it('gcTime es 10 minutos', () => {
    expect(FREQUENT.gcTime).toBe(10 * 60 * 1000)
  })

  it('refetchOnWindowFocus es true', () => {
    expect(FREQUENT.refetchOnWindowFocus).toBe(true)
  })

  it('refetchOnReconnect es true', () => {
    expect(FREQUENT.refetchOnReconnect).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — QUERY_CONFIG.REALTIME
// ──────────────────────────────────────────────────────────────────────────────

describe('QUERY_CONFIG.REALTIME', () => {
  const { REALTIME } = QUERY_CONFIG

  it('staleTime es 0 (siempre obsoleto)', () => {
    expect(REALTIME.staleTime).toBe(0)
  })

  it('gcTime es 5 minutos', () => {
    expect(REALTIME.gcTime).toBe(5 * 60 * 1000)
  })

  it('refetchInterval es 30 segundos', () => {
    expect(REALTIME.refetchInterval).toBe(30 * 1000)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — QUERY_CONFIG.KEYS (query key factories)
// ──────────────────────────────────────────────────────────────────────────────

describe('QUERY_CONFIG.KEYS', () => {
  const { KEYS } = QUERY_CONFIG

  it('BUSINESS_EMPLOYEES incluye businessId', () => {
    const key = KEYS.BUSINESS_EMPLOYEES('biz-1')
    expect(key).toContain('biz-1')
    expect(Array.isArray(key)).toBe(true)
  })

  it('EMPLOYEE_BUSINESSES incluye employeeId', () => {
    const key = KEYS.EMPLOYEE_BUSINESSES('emp-1')
    expect(key).toContain('emp-1')
  })

  it('COMPLETED_APPOINTMENTS incluye clientId', () => {
    const key = KEYS.COMPLETED_APPOINTMENTS('client-1')
    expect(key).toContain('client-1')
  })

  it('APPOINTMENTS incluye businessId y valores por defecto', () => {
    const key = KEYS.APPOINTMENTS('biz-1')
    expect(key).toContain('biz-1')
  })

  it('APPOINTMENTS incluye page y limit cuando se pasan', () => {
    const key = KEYS.APPOINTMENTS('biz-1', 2, 25)
    expect(key).toContain(2)
    expect(key).toContain(25)
  })

  it('EMPLOYEE_ABSENCES incluye employeeId y businessId', () => {
    const key = KEYS.EMPLOYEE_ABSENCES('emp-1', 'biz-1')
    expect(key).toContain('emp-1')
    expect(key).toContain('biz-1')
  })

  it('VACATION_BALANCE incluye empleado, negocio y año', () => {
    const key = KEYS.VACATION_BALANCE('emp-1', 'biz-1', 2025)
    expect(key).toContain('emp-1')
    expect(key).toContain('biz-1')
    expect(key).toContain(2025)
  })

  it('PUBLIC_HOLIDAYS incluye country y year', () => {
    const key = KEYS.PUBLIC_HOLIDAYS('CO', 2025)
    expect(key).toContain('CO')
    expect(key).toContain(2025)
  })

  it('IN_APP_NOTIFICATIONS incluye userId', () => {
    const key = KEYS.IN_APP_NOTIFICATIONS('user-1')
    expect(key).toContain('user-1')
  })

  it('TRANSACTIONS incluye businessId', () => {
    const key = KEYS.TRANSACTIONS('biz-1')
    expect(key).toContain('biz-1')
  })

  it('TRANSACTIONS incluye page y limit cuando se pasan', () => {
    const key = KEYS.TRANSACTIONS('biz-1', 3, 50)
    expect(key).toContain(3)
    expect(key).toContain(50)
  })

  it('CONVERSATIONS incluye userId', () => {
    const key = KEYS.CONVERSATIONS('user-1')
    expect(key).toContain('user-1')
  })

  it('MESSAGES incluye conversationId', () => {
    const key = KEYS.MESSAGES('conv-1')
    expect(key).toContain('conv-1')
  })

  it('PLAN_FEATURES incluye businessId', () => {
    const key = KEYS.PLAN_FEATURES('biz-1')
    expect(key).toContain('biz-1')
  })

  it('CLIENT_DASHBOARD incluye clientId', () => {
    const key = KEYS.CLIENT_DASHBOARD('client-1')
    expect(key).toContain('client-1')
  })

  it('CLIENT_DASHBOARD incluye cityName y regionName cuando se pasan', () => {
    const key = KEYS.CLIENT_DASHBOARD('client-1', 'Bogotá', 'Cundinamarca')
    expect(key).toContain('Bogotá')
    expect(key).toContain('Cundinamarca')
  })

  it('BUSINESS incluye businessId', () => {
    const key = KEYS.BUSINESS('biz-1')
    expect(key).toContain('biz-1')
  })

  it('WIZARD_DATA incluye businessId', () => {
    const key = KEYS.WIZARD_DATA('biz-1')
    expect(key).toContain('biz-1')
  })

  it('WIZARD_EMPLOYEES incluye businessId', () => {
    const key = KEYS.WIZARD_EMPLOYEES('biz-1')
    expect(key).toContain('biz-1')
  })

  it('WIZARD_EMPLOYEES incluye serviceId y locationId cuando se pasan', () => {
    const key = KEYS.WIZARD_EMPLOYEES('biz-1', 'svc-1', 'loc-1')
    expect(key).toContain('svc-1')
    expect(key).toContain('loc-1')
  })

  it('WIZARD_DATETIME_DAY incluye assigneeId, type y date', () => {
    const key = KEYS.WIZARD_DATETIME_DAY('assignee-1', 'employee', '2025-01-01')
    expect(key).toContain('assignee-1')
    expect(key).toContain('employee')
    expect(key).toContain('2025-01-01')
  })

  it('WIZARD_DATETIME_MONTH incluye assigneeId, type y yearMonth', () => {
    const key = KEYS.WIZARD_DATETIME_MONTH('assignee-1', 'resource', '2025-01')
    expect(key).toContain('assignee-1')
    expect(key).toContain('resource')
    expect(key).toContain('2025-01')
  })

  it('BUSINESS_CLOSED_DAYS incluye businessId y yearMonth', () => {
    const key = KEYS.BUSINESS_CLOSED_DAYS('biz-1', '2025-06')
    expect(key).toContain('biz-1')
    expect(key).toContain('2025-06')
  })

  it('HOLIDAY_POLICY incluye businessId', () => {
    const key = KEYS.HOLIDAY_POLICY('biz-1')
    expect(key).toContain('biz-1')
  })

  it('HOLIDAY_POLICY incluye locationId cuando se pasa', () => {
    const key = KEYS.HOLIDAY_POLICY('biz-1', 'loc-1')
    expect(key).toContain('loc-1')
  })

  // ── Keys son arrays ────────────────────────────────────────────────────────

  it('todas las keys son arrays', () => {
    expect(Array.isArray(KEYS.BUSINESS_EMPLOYEES('x'))).toBe(true)
    expect(Array.isArray(KEYS.PUBLIC_HOLIDAYS('CO', 2025))).toBe(true)
    expect(Array.isArray(KEYS.TRANSACTIONS('biz-1'))).toBe(true)
  })

  // ── Keys distintas son distintas ──────────────────────────────────────────

  it('keys con distinto businessId son distintas', () => {
    const k1 = KEYS.BUSINESS('biz-1')
    const k2 = KEYS.BUSINESS('biz-2')
    expect(JSON.stringify(k1)).not.toBe(JSON.stringify(k2))
  })

  it('keys de diferentes factories son distintas', () => {
    const k1 = KEYS.BUSINESS('id-1')
    const k2 = KEYS.BUSINESS_EMPLOYEES('id-1')
    expect(JSON.stringify(k1)).not.toBe(JSON.stringify(k2))
  })
})
