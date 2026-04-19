import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabase'
import type { PayoutDetailsFormValues } from '@/lib/referrals/schemas'

export interface UserPayoutDetails {
  id: string
  user_id: string
  full_name: string
  document_type: string
  document_number: string
  mp_email: string
  bank_name: string | null
  bank_account: string | null
  account_type: string | null
  country: string
}

const QUERY_KEY = (userId: string) => ['payout-details', userId]

export function usePayoutDetails(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY(userId ?? ''),
    queryFn: async (): Promise<UserPayoutDetails | null> => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('user_payout_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const upsertMutation = useMutation({
    mutationFn: async (values: PayoutDetailsFormValues) => {
      if (!userId) throw new Error('User ID required')
      const { data, error } = await supabase
        .from('user_payout_details')
        .upsert(
          { user_id: userId, ...values },
          { onConflict: 'user_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(userId ?? '') })
    },
  })

  return {
    details: query.data,
    isLoading: query.isLoading,
    hasDetails: !!query.data,
    upsert: upsertMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
    saveError: upsertMutation.error,
  }
}
