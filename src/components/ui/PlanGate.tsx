/**
 * PlanGate — Control de acceso basado en el plan de suscripción del negocio.
 *
 * Paralelo a PermissionGate pero para restricciones de plan.
 * Los planes son POR NEGOCIO — cada negocio tiene su propio plan independiente.
 *
 * Modos:
 * - 'upgrade' (default): Muestra pantalla de upgrade con CTA
 * - 'hide':              No renderiza nada si el plan no incluye el módulo
 * - 'disable':           Renderiza bloqueado con overlay
 *
 * NOTA: A diferencia de PermissionGate, los owners NO tienen bypass automático.
 * Un owner en plan Free no puede acceder a módulos de Básico/Pro hasta pagar.
 */

import React from 'react'
import { Lock, ArrowRight, Sparkles } from 'lucide-react'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'
import { getPlanName, type PlanId } from '@/lib/pricingPlans'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PlanGateProps {
  /** ID del módulo que se intenta acceder (ej: 'recruitment', 'expenses') */
  feature: string
  /** ID del negocio activo */
  businessId: string
  /** Modo de operación */
  mode?: 'upgrade' | 'hide' | 'disable'
  /** Contenido a proteger */
  children: React.ReactNode
  /** Fallback custom (solo en modo 'upgrade'). Por defecto: pantalla de upgrade */
  fallback?: React.ReactNode
  /** Callback al hacer clic en "Ver planes" — si no se provee, navega a billing */
  onUpgradeClick?: () => void
}

// ---------------------------------------------------------------------------
// Pantalla de upgrade por defecto
// ---------------------------------------------------------------------------

interface UpgradeScreenProps {
  requiredPlan: PlanId
  onUpgradeClick?: () => void
}

function UpgradeScreen({ requiredPlan, onUpgradeClick }: UpgradeScreenProps) {
  const planName = getPlanName(requiredPlan)

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      // Navegación por hash a la sección de billing del admin dashboard
      const url = new URL(window.location.href)
      url.pathname = url.pathname.replace(/\/app\/admin\/.*$/, '/app/admin/billing')
      window.history.pushState({}, '', url.toString())
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center">
      {/* Ícono */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-9 w-9 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Texto */}
      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-semibold text-foreground">
          Módulo disponible en Plan {planName}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Actualiza tu plan para desbloquear esta funcionalidad y llevar tu
          negocio al siguiente nivel.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Ver planes y precios
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PlanGate({
  feature,
  businessId,
  mode = 'upgrade',
  children,
  fallback,
  onUpgradeClick,
}: PlanGateProps) {
  const { hasModule, upgradePlan, isLoading, planId } = usePlanFeatures(businessId)

  // Durante la carga: comportamiento seguro según el modo
  if (isLoading) {
    if (mode === 'disable') {
      return (
        <div className="relative pointer-events-none opacity-50">
          {children}
        </div>
      )
    }
    return null
  }

  // Si el módulo está incluido en el plan: renderizar normalmente
  if (hasModule(feature)) {
    return <>{children}</>
  }

  // El módulo NO está en el plan — aplicar modo

  if (mode === 'hide') {
    return null
  }

  if (mode === 'disable') {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-40 select-none">
          {children}
        </div>
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[2px]">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-1.5 bg-background/90 rounded-md border shadow-sm">
            <Lock className="h-3.5 w-3.5" />
            Requiere Plan {upgradePlan ? getPlanName(upgradePlan.id as PlanId) : 'superior'}
          </span>
        </div>
      </div>
    )
  }

  // Modo 'upgrade' (default)
  return (
    <>
      {fallback ?? (
        <UpgradeScreen
          requiredPlan={upgradePlan?.id as PlanId ?? 'basico'}
          onUpgradeClick={onUpgradeClick}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// PlanLockBadge — Indicador de candado para el sidebar
// Uso: envuelve el label/content de un ítem de sidebar bloqueado
// ---------------------------------------------------------------------------

export interface PlanLockBadgeProps {
  /** Nombre del plan requerido */
  requiredPlanName: string
  children: React.ReactNode
}

export function PlanLockBadge({ requiredPlanName, children }: PlanLockBadgeProps) {
  return (
    <span className="flex items-center gap-2 w-full">
      <span className="flex-1 flex items-center gap-2 opacity-60">
        {children}
      </span>
      <span
        title={`Requiere Plan ${requiredPlanName}`}
        className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5"
      >
        <Lock className="h-2.5 w-2.5" />
        {requiredPlanName}
      </span>
    </span>
  )
}
