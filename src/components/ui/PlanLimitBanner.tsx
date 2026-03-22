/**
 * PlanLimitBanner — Banner que informa al admin cuántos registros no se muestran por límite de plan.
 *
 * Se usa en módulos con límite numérico: Clientes, Servicios, Sedes, Empleados, Citas.
 * Los datos SE ALMACENAN todos en BD — solo se MUESTRAN hasta el límite del plan.
 *
 * Ejemplo: 120 clientes en BD, plan Free muestra solo 50.
 * Banner: "70 clientes no se muestran — Actualiza tu plan para verlos todos"
 */

import React from 'react'
import { Lock, ArrowRight, TrendingUp } from 'lucide-react'

export interface PlanLimitBannerProps {
  /** Cuántos registros NO se están mostrando */
  notShownCount: number
  /** Nombre del recurso en plural (ej: 'clientes', 'servicios', 'sedes') */
  resourceLabel: string
  /** Plan al que se debe hacer upgrade para ver todos */
  upgradePlanName?: string
  /** Callback al hacer clic en "Actualizar plan" */
  onUpgradeClick?: () => void
  className?: string
}

export function PlanLimitBanner({
  notShownCount,
  resourceLabel,
  upgradePlanName,
  onUpgradeClick,
  className = '',
}: PlanLimitBannerProps) {
  if (notShownCount <= 0) return null

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      const url = new URL(window.location.href)
      url.pathname = url.pathname.replace(/\/app\/admin\/.*$/, '/app/admin/billing')
      window.history.pushState({}, '', url.toString())
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <div
      className={`
        flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800
        bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm
        ${className}
      `}
    >
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-amber-900 dark:text-amber-200 leading-snug">
          <span className="font-bold">{notShownCount.toLocaleString('es-CO')} {resourceLabel}</span>
          {' '}no se {notShownCount === 1 ? 'muestra' : 'muestran'} por límite del plan actual.
        </p>
        {upgradePlanName && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Actualiza al Plan {upgradePlanName} para ver todos los registros.
          </p>
        )}
      </div>

      <button
        onClick={handleUpgrade}
        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800/60 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
      >
        <TrendingUp className="h-3.5 w-3.5" />
        Actualizar plan
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}
