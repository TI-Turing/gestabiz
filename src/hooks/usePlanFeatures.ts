/**
 * usePlanFeatures — Hook para obtener las características del plan activo de un negocio.
 *
 * - Lee la tabla `business_plans` en Supabase (campo plan_type)
 * - Cachea con React Query (staleTime: 5 min — plan cambia raramente)
 * - Por defecto el negocio está en plan 'free' si no tiene registro
 * - Los planes son POR NEGOCIO (no por usuario)
 *
 * Uso:
 *   const { planId, hasModule, quotaInfo, limits } = usePlanFeatures(businessId)
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import {
  type PlanId,
  type PlanLimits,
  type Plan,
  getPlanById,
  getAccessibleModules,
  getUpgradePlan,
  PRICING_PLANS,
} from '@/lib/pricingPlans'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface QuotaInfo {
  /** Límite configurado en el plan. null = ilimitado */
  limit: number | null
  /** Cuántos hay actualmente (pasado por el componente que llama) */
  current: number
  /** Cuántos quedan disponibles. null si es ilimitado */
  remaining: number | null
  /** true si current >= limit (y limit no es null) */
  isAtLimit: boolean
  /** Cuántos NO se muestran (current - limit). 0 si dentro del límite o ilimitado */
  notShownCount: number
}

export interface PlanFeaturesResult {
  /** Plan ID activo del negocio */
  planId: PlanId
  /** Objeto Plan completo (precios, features, limits) */
  plan: Plan
  /** Límites numéricos del plan activo */
  limits: PlanLimits
  /** true si el módulo está incluido en el plan activo */
  hasModule: (moduleId: string) => boolean
  /**
   * Calcula la información de cuota para un recurso dado el count actual.
   * Usar esto en los componentes para decidir cuántos elementos mostrar.
   */
  quotaInfo: (resource: keyof PlanLimits, current: number) => QuotaInfo
  /** Plan al que debería hacer upgrade (undefined si ya está en Pro) */
  upgradePlan: Plan | undefined
  isLoading: boolean
  error: Error | null
}

// ---------------------------------------------------------------------------
// Helper interno: normaliza plan_type de BD al nuevo PlanId
// ---------------------------------------------------------------------------

const PLAN_TYPE_MAP: Record<string, PlanId> = {
  // Nuevos nombres (Fase 1)
  free:   'free',
  basico: 'basico',
  pro:    'pro',
  // Nombres legacy (por si ya hay suscripciones activas con el esquema anterior)
  gratuito:     'free',
  inicio:       'basico',
  profesional:  'pro',
  empresarial:  'pro',
  // Otros legacy
  basic:        'basico',
  professional: 'pro',
  enterprise:   'pro',
  corporativo:  'pro',
}

function normalizePlanType(rawPlanType: string | null | undefined): PlanId {
  if (!rawPlanType) return 'free'
  return PLAN_TYPE_MAP[rawPlanType.toLowerCase()] ?? 'free'
}

// ---------------------------------------------------------------------------
// Función de fetch: lee business_plans en Supabase
// ---------------------------------------------------------------------------

async function fetchBusinessPlan(businessId: string): Promise<PlanId> {
  const { data, error } = await supabase
    .from('business_plans')
    .select('plan_type, status')
    .eq('business_id', businessId)
    .in('status', ['active', 'trialing'])  // solo planes activos/en prueba
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    // Si hay error de permisos u otro, asumir free (seguro por defecto)
    return 'free'
  }

  return normalizePlanType(data?.plan_type)
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

export function usePlanFeatures(businessId: string | null | undefined): PlanFeaturesResult {
  const {
    data: planId = 'free',
    isLoading,
    error,
  } = useQuery<PlanId, Error>({
    queryKey: QUERY_CONFIG.KEYS.PLAN_FEATURES(businessId ?? ''),
    queryFn: () => fetchBusinessPlan(businessId!),
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  const plan = getPlanById(planId) ?? PRICING_PLANS[0]!
  const limits = plan.limits
  const accessibleModules = getAccessibleModules(planId)

  const hasModule = (moduleId: string): boolean =>
    accessibleModules.includes(moduleId)

  const quotaInfo = (resource: keyof PlanLimits, current: number): QuotaInfo => {
    const limit = limits[resource]

    if (limit === null) {
      // Ilimitado
      return { limit: null, current, remaining: null, isAtLimit: false, notShownCount: 0 }
    }

    const isAtLimit    = current >= limit
    const notShownCount = Math.max(0, current - limit)
    const remaining    = Math.max(0, limit - current)

    return { limit, current, remaining, isAtLimit, notShownCount }
  }

  return {
    planId,
    plan,
    limits,
    hasModule,
    quotaInfo,
    upgradePlan: getUpgradePlan(planId),
    isLoading,
    error: error ?? null,
  }
}
