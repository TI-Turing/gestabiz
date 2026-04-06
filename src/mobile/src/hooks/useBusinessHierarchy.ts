import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

export interface HierarchyNode {
  employee_id: string
  business_id: string
  role: string
  employee_type?: string | null
  full_name: string
  email?: string | null
  avatar_url?: string | null
  reports_to?: string | null
  level: number
}

async function fetchHierarchy(businessId: string): Promise<HierarchyNode[]> {
  const { data, error } = await supabase.rpc('get_business_hierarchy', {
    p_business_id: businessId,
  })
  throwIfError(error, 'FETCH_HIERARCHY', 'No se pudo cargar la jerarquía del negocio')
  return (data ?? []) as HierarchyNode[]
}

export function useBusinessHierarchy(businessId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['business-hierarchy', businessId]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchHierarchy(businessId!),
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  const updateHierarchy = useMutation({
    mutationFn: async ({
      employeeId,
      reportsTo,
    }: {
      employeeId: string
      reportsTo: string | null
    }) => {
      const { error } = await supabase
        .from('business_employees')
        .update({ reports_to: reportsTo })
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
      throwIfError(error, 'UPDATE_HIERARCHY', 'No se pudo actualizar la jerarquía')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...query, hierarchy: query.data ?? [], updateHierarchy }
}
