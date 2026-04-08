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

  const normalized = (data ?? []) as HierarchyNode[]

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single()

  if (businessError) {
    throwIfError(businessError, 'FETCH_OWNER', 'No se pudo cargar el owner del negocio')
  }

  const ownerId = business?.owner_id

  // Corregir role del owner si vino del RPC como 'manager' (el trigger lo inserta así)
  if (ownerId) {
    const ownerIndex = normalized.findIndex(emp => emp.employee_id === ownerId)
    if (ownerIndex >= 0) {
      normalized[ownerIndex] = {
        ...normalized[ownerIndex],
        role: 'owner',
        employee_type: 'owner',
        level: 0,
      }
    } else {
      // Owner no está en el RPC — agregarlo manualmente
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', ownerId)
        .single()

      if (profileError) {
        throwIfError(profileError, 'FETCH_OWNER_PROFILE', 'No se pudo cargar el perfil del owner')
      }

      normalized.push({
        employee_id: ownerId,
        business_id: businessId,
        role: 'owner',
        employee_type: 'owner',
        full_name: profile?.full_name ?? profile?.email ?? 'Owner',
        email: profile?.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        reports_to: null,
        level: 0,
      })
    }
  }

  return normalized
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
