import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabase'

export interface ReferralCode {
  id: string
  code: string
  creator_user_id: string
  used_by_business_id: string | null
  status: 'active' | 'redeemed' | 'expired' | 'disabled'
  redeemed_at: string | null
  created_at: string
  expires_at: string
  discount_amount: number
  payout_amount: number
}

const QUERY_KEY = (userId: string) => ['referral-codes', userId]

export function useReferralCodes(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY(userId ?? ''),
    queryFn: async (): Promise<ReferralCode[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('creator_user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const generateMutation = useMutation({
    mutationFn: async (): Promise<{ code: string; expires_at: string; already_existed: boolean }> => {
      if (!userId) throw new Error('User ID required')
      const { data, error } = await supabase.rpc('create_referral_code', {
        p_user_id: userId,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(userId ?? '') })
    },
  })

  const activeCode = query.data?.find((c) => c.status === 'active') ?? null
  const redeemedCodes = query.data?.filter((c) => c.status === 'redeemed') ?? []

  const getDaysRemaining = (expiresAt: string): number => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return {
    codes: query.data ?? [],
    activeCode,
    redeemedCodes,
    isLoading: query.isLoading,
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,
    getDaysRemaining,
  }
}
