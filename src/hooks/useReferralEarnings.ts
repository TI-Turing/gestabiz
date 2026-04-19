import { useQuery } from '@tanstack/react-query'
import supabase from '@/lib/supabase'

export interface ReferralPayout {
  id: string
  referral_code_id: string
  amount: number
  status: 'pending' | 'processing' | 'transferred' | 'failed' | 'manual_review'
  mp_transfer_id: string | null
  paid_at: string | null
  attempt_count: number
  last_error: string | null
  created_at: string
}

export interface ReferralEarnings {
  payouts: ReferralPayout[]
  totalEarned: number
  totalPending: number
  totalFailed: number
}

const QUERY_KEY = (userId: string) => ['referral-earnings', userId]

export function useReferralEarnings(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY(userId ?? ''),
    queryFn: async (): Promise<ReferralEarnings> => {
      if (!userId) return { payouts: [], totalEarned: 0, totalPending: 0, totalFailed: 0 }

      const { data, error } = await supabase
        .from('referral_payouts')
        .select('*')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const payouts = (data ?? []) as ReferralPayout[]

      const totalEarned = payouts
        .filter((p) => p.status === 'transferred')
        .reduce((sum, p) => sum + p.amount, 0)

      const totalPending = payouts
        .filter((p) => ['pending', 'processing'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0)

      const totalFailed = payouts
        .filter((p) => ['failed', 'manual_review'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0)

      return { payouts, totalEarned, totalPending, totalFailed }
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
