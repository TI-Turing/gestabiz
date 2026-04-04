import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string
  business_id: string
  plan_id: string
  plan_name: string
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  gateway: 'stripe' | 'payu' | 'mercadopago' | null
  gateway_subscription_id: string | null
  amount: number | null
  currency: string | null
  created_at: string
}

// ─── Hook: useSubscription ────────────────────────────────────────────────────

export function useSubscription(businessId: string | undefined) {
  const queryKey = ['subscription', businessId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Subscription | null> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('business_id', businessId!)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .maybeSingle()
      throwIfError(error, 'FETCH_SUBSCRIPTION', 'No se pudo cargar la suscripción')
      return data as Subscription | null
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  const sub = query.data ?? null

  const isActive = sub?.status === 'active' || sub?.status === 'trialing'
  const isPro = isActive && sub?.plan_id !== 'free'
  const daysRemaining = sub?.current_period_end
    ? Math.max(
        0,
        Math.ceil(
          (new Date(sub.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  return { ...query, subscription: sub, isActive, isPro, daysRemaining }
}
