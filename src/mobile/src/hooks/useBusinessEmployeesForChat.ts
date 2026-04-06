import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployeeForChat {
  employee_id: string
  full_name: string
  email: string | null
  avatar_url: string | null
  role: string
  allow_client_messages: boolean
  location_id: string | null
  location_name: string | null
}

// ─── Hook: useBusinessEmployeesForChat ────────────────────────────────────────

export function useBusinessEmployeesForChat(businessId: string | undefined) {
  const queryKey = ['employees-for-chat', businessId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<EmployeeForChat[]> => {
      const { data: employees, error } = await supabase
        .from('business_employees')
        .select(
          'employee_id, role, allow_client_messages, location_id, profiles:employee_id(full_name, email, avatar_url)'
        )
        .eq('business_id', businessId!)
        .eq('allow_client_messages', true)
        .eq('is_active', true)

      throwIfError(error, 'FETCH_EMPLOYEES_FOR_CHAT', 'No se pudieron cargar los empleados')

      const results: EmployeeForChat[] = []

      for (const emp of employees ?? []) {
        const profile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles

        // Fetch location name only for non-manager roles
        let locationName: string | null = null
        if (emp.location_id && emp.role !== 'manager') {
          const { data: loc } = await supabase
            .from('locations')
            .select('name')
            .eq('id', emp.location_id)
            .maybeSingle()
          locationName = loc?.name ?? null
        }

        results.push({
          employee_id: emp.employee_id as string,
          full_name: (profile as { full_name?: string | null })?.full_name ?? '',
          email: (profile as { email?: string | null })?.email ?? null,
          avatar_url: (profile as { avatar_url?: string | null })?.avatar_url ?? null,
          role: emp.role as string,
          allow_client_messages: emp.allow_client_messages as boolean,
          location_id: emp.location_id as string | null,
          location_name: locationName,
        })
      }

      return results
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  return { ...query, employees: query.data ?? [] }
}
