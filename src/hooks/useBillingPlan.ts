/**
 * useBillingPlan Hook
 *
 * Lee business_plans + estadísticas de uso directamente desde Supabase.
 * No pasa por el PaymentGateway abstraction; consulta la tabla directamente.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface BillingPlan {
  id: string
  business_id: string
  plan_type: string
  status: string
  start_date: string
  end_date: string
  billing_cycle: string
  auto_renew: boolean
  payment_gateway: string | null
  canceled_at: string | null
}

export interface BillingUsage {
  appointmentsThisPeriod: number
  emailsSent: number
  whatsappSent: number
  daysRemaining: number
}

interface UseBillingPlanResult {
  plan: BillingPlan | null
  usage: BillingUsage | null
  isLoading: boolean
  cancelPlan: () => Promise<void>
  refetch: () => void
}

export function useBillingPlan(businessId: string | null): UseBillingPlanResult {
  const [plan, setPlan] = useState<BillingPlan | null>(null)
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)

      try {
        // 1. Fetch plan
        const { data: planData, error: planError } = await supabase
          .from('business_plans')
          .select('id, business_id, plan_type, status, start_date, end_date, billing_cycle, auto_renew, payment_gateway, canceled_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (planError) {
          console.error('[useBillingPlan] Error fetching plan:', planError)
          if (!cancelled) {
            setPlan(null)
            setUsage(null)
          }
          return
        }

        if (!planData || cancelled) {
          if (!cancelled) {
            setPlan(null)
            setUsage(null)
          }
          return
        }

        if (!cancelled) {
          setPlan(planData as BillingPlan)
        }

        // 2. Usage stats — only if plan exists
        const startDate = planData.start_date
        const endDate = planData.end_date

        const [
          appointmentsResult,
          emailsResult,
          whatsappResult,
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .gte('created_at', startDate),
          supabase
            .from('notification_log')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('channel', 'email')
            .gte('created_at', startDate),
          supabase
            .from('notification_log')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('channel', 'whatsapp')
            .gte('created_at', startDate),
        ])

        const appointmentsThisPeriod = appointmentsResult.count ?? 0
        const emailsSent = emailsResult.count ?? 0
        const whatsappSent = whatsappResult.count ?? 0

        const now = new Date()
        const end = new Date(endDate)
        const diffMs = end.getTime() - now.getTime()
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

        if (!cancelled) {
          setUsage({
            appointmentsThisPeriod,
            emailsSent,
            whatsappSent,
            daysRemaining,
          })
        }
      } catch (err) {
        console.error('[useBillingPlan] Unexpected error:', err)
        if (!cancelled) {
          setPlan(null)
          setUsage(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [businessId, tick])

  const cancelPlan = useCallback(async () => {
    if (!businessId) throw new Error('businessId is required')

    const { error } = await supabase
      .from('business_plans')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)

    if (error) {
      throw new Error(`Error canceling plan: ${error.message}`)
    }

    refetch()
  }, [businessId, refetch])

  return { plan, usage, isLoading, cancelPlan, refetch }
}
