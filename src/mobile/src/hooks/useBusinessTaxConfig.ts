import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessTaxConfig {
  id: string
  business_id: string
  tax_type: string | null
  tax_rate: number | null
  iva_rate: number | null
  ica_rate: number | null
  retention_rate: number | null
  fiscal_period: string | null
  currency: string | null
  updated_at: string
}

// ─── Hook: useBusinessTaxConfig ───────────────────────────────────────────────

export function useBusinessTaxConfig(businessId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['tax-config', businessId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<BusinessTaxConfig | null> => {
      const { data, error } = await supabase
        .from('business_tax_config')
        .select('*')
        .eq('business_id', businessId!)
        .maybeSingle()
      throwIfError(error, 'FETCH_TAX_CONFIG', 'No se pudo cargar la configuración fiscal')
      return data as BusinessTaxConfig | null
    },
    enabled: !!businessId,
    staleTime: 60 * 60 * 1000, // 1 hour — tax config changes rarely
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const updateTaxConfig = useMutation({
    mutationFn: async (updates: Partial<BusinessTaxConfig>) => {
      const { data, error } = await supabase
        .from('business_tax_config')
        .upsert({ ...updates, business_id: businessId! })
        .select()
        .single()
      throwIfError(error, 'UPDATE_TAX_CONFIG', 'No se pudo actualizar la configuración fiscal')
      return data as BusinessTaxConfig
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...query, taxConfig: query.data ?? null, updateTaxConfig }
}
