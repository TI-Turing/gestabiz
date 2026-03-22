/**
 * Definición centralizada de planes de suscripción
 * Fase 1 (Abril 2026): Free / Básico / Pro
 * Usado por PricingPage.tsx, PlanGate, usePlanFeatures, BillingDashboard
 */

import React from 'react'
import { Sparkles, Building2, Rocket } from 'lucide-react'

export type PlanId = 'free' | 'basico' | 'pro'

export interface PlanFeature {
  name: string
  included: boolean
  limit?: string
  highlight?: boolean
}

/** Módulos del sidebar de AdminDashboard accesibles por plan */
export interface PlanModuleAccess {
  /** Siempre accesibles en todos los planes */
  always: string[]
  /** Solo en plan Básico o superior */
  basico: string[]
  /** Solo en plan Pro */
  pro: string[]
}

export interface PlanLimits {
  /** null = ilimitado */
  locations: number | null
  employees: number | null
  /** Citas por mes. null = ilimitado */
  appointments: number | null
  /** Clientes que se muestran en CRM. null = ilimitado (todos se almacenan) */
  clients: number | null
  services: number | null
}

export interface Plan {
  id: PlanId
  name: string
  subtitle?: string
  description: string
  /** Precio mensual en COP */
  price: number
  /** Precio anual en COP (equivale a 10 meses — 2 meses gratis) */
  priceAnnual: number
  popular?: boolean
  icon?: React.ReactNode
  cta?: string
  limits: PlanLimits
  features: PlanFeature[]
}

// ---------------------------------------------------------------------------
// Módulos del sidebar de AdminDashboard organizados por acceso de plan
// ---------------------------------------------------------------------------

/** Módulos SIEMPRE disponibles independientemente del plan */
export const MODULES_ALWAYS: string[] = [
  'overview',
  'appointments',
  'services',
  'clients',
  'billing',
  'locations', // acceso siempre, pero límite varía por plan (Free: 1, Básico: 3, Pro: 10)
]

/** Módulos disponibles desde el plan Básico en adelante */
export const MODULES_BASICO: string[] = [
  ...MODULES_ALWAYS,
  'employees',
  'absences',
  'sales',
  'quick-sales',
  'reports',
  'permissions',
]

/** Módulos disponibles solo en plan Pro */
export const MODULES_PRO: string[] = [
  ...MODULES_BASICO,
  'expenses',
  'recruitment',
  'resources',
]

/**
 * Dado un planId, retorna el array de IDs de módulos accesibles.
 */
export function getAccessibleModules(planId: PlanId): string[] {
  switch (planId) {
    case 'free':   return MODULES_ALWAYS
    case 'basico': return MODULES_BASICO
    case 'pro':    return MODULES_PRO
    default:       return MODULES_ALWAYS
  }
}

/**
 * Retorna el planId mínimo requerido para acceder a un módulo.
 */
export function getRequiredPlan(moduleId: string): PlanId | null {
  if (MODULES_ALWAYS.includes(moduleId))     return null       // siempre libre
  if (MODULES_BASICO.includes(moduleId))     return 'basico'
  if (MODULES_PRO.includes(moduleId))        return 'pro'
  return null
}

/**
 * Compara dos planes y retorna true si planId >= requiredPlan.
 */
export function planIncludes(planId: PlanId, requiredPlan: PlanId): boolean {
  const order: PlanId[] = ['free', 'basico', 'pro']
  return order.indexOf(planId) >= order.indexOf(requiredPlan)
}

// ---------------------------------------------------------------------------
// Definición de planes
// ---------------------------------------------------------------------------

const planIcons = {
  free:   React.createElement(Sparkles,  { className: 'h-6 w-6' }),
  basico: React.createElement(Building2, { className: 'h-6 w-6' }),
  pro:    React.createElement(Rocket,    { className: 'h-6 w-6' }),
}

export const PRICING_PLANS: Plan[] = [
  // -------------------------------------------------------------------------
  // PLAN FREE
  // -------------------------------------------------------------------------
  {
    id: 'free',
    name: 'Gratis',
    subtitle: 'Para emprendedores',
    description: 'Perfecto para independientes y emprendimientos unipersonales',
    price: 0,
    priceAnnual: 0,
    popular: false,
    icon: planIcons.free,
    cta: 'Comenzar gratis',
    limits: {
      locations:    1,
      employees:    1,
      appointments: 50,
      clients:      50,
      services:     15,
    },
    features: [
      { name: 'Hasta 50 citas por mes',           included: true },
      { name: 'Recordatorios automáticos por email', included: true },
      { name: '1 sede',                            included: true },
      { name: 'Hasta 15 servicios',                included: true },
      { name: 'Catálogo de clientes (50 visibles)', included: true },
      { name: 'Perfil público del negocio',        included: true },
      { name: 'Dashboard con estadísticas básicas', included: true },
      { name: 'Soporte por email',                 included: true },
      { name: 'Multi-sede (hasta 3)',              included: false },
      { name: 'Gestión de empleados',              included: false },
      { name: 'Historial de ventas',               included: false },
      { name: 'Chat con clientes',                 included: false },
      { name: 'Sistema contable',                  included: false },
      { name: 'Reportes y exportaciones',          included: false },
    ],
  },

  // -------------------------------------------------------------------------
  // PLAN BÁSICO
  // -------------------------------------------------------------------------
  {
    id: 'basico',
    name: 'Básico',
    subtitle: 'Para operar',
    description: 'Todo lo necesario para operar con equipo',
    price: 89900,
    priceAnnual: 899000,      // ~10 meses (2 meses gratis)
    popular: true,
    icon: planIcons.basico,
    cta: 'Activar plan',
    limits: {
      locations:    3,
      employees:    6,
      appointments: null,     // ilimitadas
      clients:      null,
      services:     null,
    },
    features: [
      { name: 'Todo del Plan Gratis, más:',         included: true, highlight: true },
      { name: 'Citas ilimitadas',                  included: true },
      { name: 'Hasta 3 sedes',                     included: true },
      { name: 'Hasta 6 empleados',                 included: true },
      { name: 'CRM de clientes completo',          included: true },
      { name: 'Historial de ventas',               included: true },
      { name: 'Ventas rápidas',                    included: true },
      { name: 'Gestión de ausencias básica',       included: true },
      { name: 'Chat con clientes',                 included: true },
      { name: 'Recordatorios WhatsApp',            included: true },
      { name: 'Google Calendar sync',              included: true },
      { name: 'Reportes (vista)',                  included: true },
      { name: 'Permisos por plantillas',           included: true },
      { name: 'Soporte prioritario (Chat + Email)', included: true },
      { name: 'Sistema contable completo',         included: false },
      { name: 'Gestión de egresos',                included: false },
      { name: 'Portal de reclutamiento',           included: false },
      { name: 'Jerarquía de empleados',            included: false },
      { name: 'Exportación de reportes',           included: false },
    ],
  },

  // -------------------------------------------------------------------------
  // PLAN PRO
  // -------------------------------------------------------------------------
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Para crecer',
    description: 'Herramientas para crecer, profesionalizarse y controlar',
    price: 159900,
    priceAnnual: 1599000,     // ~10 meses (2 meses gratis)
    popular: false,
    icon: planIcons.pro,
    cta: 'Activar plan',
    limits: {
      locations:    10,
      employees:    15,
      appointments: null,
      clients:      null,
      services:     null,
    },
    features: [
      { name: 'Todo del Plan Básico, más:',         included: true, highlight: true },
      { name: 'Hasta 10 sedes',                     included: true },
      { name: 'Hasta 15 empleados',                 included: true },
      { name: 'Sistema contable completo (P&L, IVA, ICA)', included: true },
      { name: 'Gestión de egresos y gastos recurrentes', included: true },
      { name: 'Portal de reclutamiento / vacantes', included: true },
      { name: 'Jerarquía de empleados',             included: true },
      { name: 'Permisos granulares (79 tipos)',     included: true },
      { name: 'Exportación de reportes (CSV, Excel, PDF)', included: true },
      { name: 'Analytics con gráficas avanzadas',  included: true },
      { name: 'Balance vacacional completo',        included: true },
      { name: 'Métricas de rendimiento por empleado', included: true },
      { name: 'Recursos físicos (salas, canchas, etc.)', included: true },
      { name: 'Soporte Premium (WhatsApp + Email)', included: true },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPlanById(id: string): Plan | undefined {
  return PRICING_PLANS.find(plan => plan.id === id)
}

export function getPlansByExcluding(excludeId: string): Plan[] {
  return PRICING_PLANS.filter(plan => plan.id !== excludeId)
}

/** Retorna el nombre legible de un plan */
export function getPlanName(planId: PlanId): string {
  const plan = getPlanById(planId)
  return plan?.name ?? 'Gratis'
}

/** Retorna el plan superior al dado (para mensajes de upgrade) */
export function getUpgradePlan(planId: PlanId): Plan | undefined {
  const order: PlanId[] = ['free', 'basico', 'pro']
  const idx = order.indexOf(planId)
  if (idx === -1 || idx >= order.length - 1) return undefined
  return getPlanById(order[idx + 1])
}
