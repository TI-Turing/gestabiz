/**
 * useFreeTrial Hook
 *
 * Gestiona el estado y la activación del mes gratuito del Plan Básico.
 * El trial es por usuario (owner), no por negocio.
 *
 * Uso:
 *   const trial = useFreeTrial(businessId, businessOwnerId, refetchPlan)
 */

import { useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import { toast } from 'sonner'
import type { BillingPlan } from './useBillingPlan'

export interface FreeTrialState {
  /** El usuario es owner Y no ha usado el trial Y el negocio no tiene plan activo */
  isEligible: boolean
  /** El plan actual está en estado trialing (trial activo) */
  isTrialing: boolean
  /** Fecha ISO de vencimiento del trial (null si no aplica) */
  trialEndsAt: string | null
  /** Días restantes del trial (null si no está en trialing) */
  daysRemaining: number | null
  /** El usuario ya consumió su trial en algún momento */
  hasUsedTrial: boolean
  /** Está procesando la activación */
  isActivating: boolean
  /** Error de la última activación */
  error: string | null
  /** Activa el mes gratuito — llama a la Edge Function y refresca el plan */
  activateFreeTrial: () => Promise<void>
}

type ActivationError =
  | 'trial_already_used'
  | 'business_already_has_plan'
  | 'trial_active_in_another_business'
  | 'unknown'

const ERROR_MESSAGES: Record<ActivationError, string> = {
  trial_already_used: 'Ya utilizaste tu mes gratuito anteriormente.',
  business_already_has_plan: 'Este negocio ya tiene un plan activo.',
  trial_active_in_another_business: 'Ya tienes un mes gratuito activo en otro negocio.',
  unknown: 'Ocurrió un error al activar el mes gratuito. Intenta de nuevo.',
}

export function useFreeTrial(
  businessId: string | null,
  businessOwnerId: string | null,
  /** Callback para refrescar el plan tras una activación exitosa */
  refetchPlan: () => void,
  /** El plan actual del negocio (de useBillingPlan) */
  currentPlan: BillingPlan | null,
): FreeTrialState {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOwner = useMemo(
    () => Boolean(user?.id && businessOwnerId && user.id === businessOwnerId),
    [user?.id, businessOwnerId],
  )

  const hasUsedTrial = user?.has_used_free_trial ?? false

  const hasActivePlan = currentPlan != null &&
    (currentPlan.status === 'active' || currentPlan.status === 'trialing')

  const isTrialing = currentPlan?.status === 'trialing'

  const trialEndsAt = isTrialing ? (currentPlan?.end_date ?? null) : null

  const daysRemaining = useMemo(() => {
    if (!trialEndsAt) return null
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [trialEndsAt])

  const isEligible = isOwner && !hasUsedTrial && !hasActivePlan

  const activateFreeTrial = useCallback(async () => {
    if (!businessId) return
    setIsActivating(true)
    setError(null)

    try {
      console.log('[FreeTrial] Invoking activate-free-trial EF…', { businessId })
      const { data, error: fnError } = await supabase.functions.invoke(
        'activate-free-trial',
        { body: { businessId } },
      )
      console.log('[FreeTrial] EF response:', { data, fnError })

      if (fnError) {
        console.error('[FreeTrial] Function invoke error:', fnError)
        const errCode = (fnError as unknown as { context?: { error?: string } })?.context?.error
        const msg = ERROR_MESSAGES[(errCode as ActivationError) ?? 'unknown'] ?? ERROR_MESSAGES.unknown
        setError(msg)
        toast.error(msg)
        return
      }

      if (data?.error) {
        console.error('[FreeTrial] Business logic error:', data.error)
        const msg = ERROR_MESSAGES[(data.error as ActivationError)] ?? ERROR_MESSAGES.unknown
        setError(msg)
        toast.error(msg)
        return
      }

      // Éxito — refrescar el plan
      console.log('[FreeTrial] Success! Refetching plan…')
      toast.success('¡Mes gratis activado! Tu Plan Básico está listo.')
      refetchPlan()

      // Invalida el caché de plan features para que los componentes vean el nuevo plan inmediatamente
      queryClient.invalidateQueries({
        queryKey: QUERY_CONFIG.KEYS.PLAN_FEATURES(businessId),
      })
    } catch (err) {
      console.error('[FreeTrial] Unexpected error:', err)
      setError(ERROR_MESSAGES.unknown)
      toast.error(ERROR_MESSAGES.unknown)
    } finally {
      setIsActivating(false)
    }
  }, [businessId, refetchPlan, queryClient])

  return {
    isEligible,
    isTrialing,
    trialEndsAt,
    daysRemaining,
    hasUsedTrial,
    isActivating,
    error,
    activateFreeTrial,
  }
}
