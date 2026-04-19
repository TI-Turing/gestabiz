import { useQuery } from '@tanstack/react-query'
import supabase from '@/lib/supabase'

export function useFeatureFlag(flagName: string): boolean {
  const { data } = useQuery({
    queryKey: ['feature-flag', flagName],
    queryFn: async () => {
      if (flagName === 'referral_program_enabled') {
        const { data, error } = await supabase.rpc('get_referral_feature_enabled')
        if (error) return false
        return data as boolean
      }
      return false
    },
    staleTime: 5 * 60 * 1000, // 5 min — flags no cambian frecuentemente
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return data ?? false
}
