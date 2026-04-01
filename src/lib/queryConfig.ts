/**
 * Configuración global de React Query para optimizar performance
 *
 * Estrategia:
 * - staleTime largo: Evitar refetches innecesarios (5 minutos)
 * - gcTime grande: Mantener datos en caché (24 horas)
 * - refetchOnWindowFocus: false en datos que no cambian frecuentemente
 * - dedupingInterval: Deduplicar requests idénticas (10 segundos)
 */

/** Límites de paginación centralizados — usar siempre estos valores para consistencia */
export const PAGINATION = {
  MESSAGES: 50,
  NOTIFICATIONS: 50,
  CONVERSATIONS: 20,
  APPOINTMENTS: 25,
  TRANSACTIONS: 50,
  ABSENCES: 30,
} as const

export const QUERY_CONFIG = {
  // Queries que cambian raramente (negocio, empleados, servicios)
  STABLE: {
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  },

  // Queries que cambian frecuentemente (citas, ausencias, notificaciones)
  FREQUENT: {
    staleTime: 1000 * 60, // 1 minuto
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Queries en tiempo real (chat, notificaciones)
  REALTIME: {
    staleTime: 0, // Siempre stale
    gcTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 30, // Refetch cada 30s
  },

  // Query Keys — fuente única de verdad para evitar typos y conflictos de caché
  KEYS: {
    // ── Negocio ──────────────────────────────────────────────────────────
    BUSINESS_EMPLOYEES: (businessId: string) =>
      ['business-employees', businessId] as const,

    // ── Empleados ────────────────────────────────────────────────────────
    EMPLOYEE_BUSINESSES: (employeeId: string) =>
      ['employee-businesses', employeeId] as const,

    // ── Citas ────────────────────────────────────────────────────────────
    COMPLETED_APPOINTMENTS: (clientId: string) =>
      ['completed-appointments', clientId] as const,
    APPOINTMENTS: (businessId: string, page = 0, limit = PAGINATION.APPOINTMENTS) =>
      ['appointments', businessId, page, limit] as const,

    // ── Ausencias ────────────────────────────────────────────────────────
    EMPLOYEE_ABSENCES: (employeeId: string, businessId: string) =>
      ['employee-absences', employeeId, businessId] as const,
    ABSENCE_APPROVALS: (businessId: string) =>
      ['absence-approvals', businessId] as const,
    VACATION_BALANCE: (employeeId: string, businessId: string, year: number) =>
      ['vacation-balance', employeeId, businessId, year] as const,
    PUBLIC_HOLIDAYS: (country: string, year: number) =>
      ['public-holidays', country, year] as const,

    // ── Notificaciones ───────────────────────────────────────────────────
    IN_APP_NOTIFICATIONS: (userId: string) =>
      ['in-app-notifications', userId] as const,

    // ── Transacciones / Contabilidad ─────────────────────────────────────
    TRANSACTIONS: (businessId: string, page = 0, limit = PAGINATION.TRANSACTIONS) =>
      ['transactions', businessId, page, limit] as const,

    // ── Chat ─────────────────────────────────────────────────────────────
    CONVERSATIONS: (userId: string, page = 0) =>
      ['conversations', userId, page] as const,
    MESSAGES: (conversationId: string, page = 0) =>
      ['messages', conversationId, page] as const,

    // ── Planes / Suscripciones ───────────────────────────────────────────
    PLAN_FEATURES: (businessId: string) =>
      ['plan-features', businessId] as const,

    // ── Dashboard ────────────────────────────────────────────────────────
    CLIENT_DASHBOARD: (
      clientId: string,
      preferredCityName?: string | null,
      preferredRegionName?: string | null,
    ) => [
      'client-dashboard',
      clientId,
      preferredCityName ?? 'all-cities',
      preferredRegionName ?? 'all-regions',
    ] as const,

    // ── Wizard (Appointment Booking Flow) ────────────────────────────────
    BUSINESS: (businessId: string) =>
      ['business', businessId] as const,
    WIZARD_DATA: (businessId: string) =>
      ['wizard-data', businessId] as const,
    WIZARD_EMPLOYEES: (businessId: string, serviceId?: string, locationId?: string) =>
      ['wizard-employees', businessId, serviceId ?? 'all', locationId ?? 'all'] as const,
    WIZARD_DATETIME_DAY: (assigneeId: string, assigneeType: 'employee' | 'resource', date: string) =>
      ['wizard-datetime-day', assigneeId, assigneeType, date] as const,
    WIZARD_DATETIME_MONTH: (assigneeId: string, assigneeType: 'employee' | 'resource', yearMonth: string) =>
      ['wizard-datetime-month', assigneeId, assigneeType, yearMonth] as const,
  },
}

export default QUERY_CONFIG
