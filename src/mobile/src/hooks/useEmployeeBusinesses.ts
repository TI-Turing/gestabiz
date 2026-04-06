import { useQuery } from '@tanstack/react-query'
import { businessesService } from '../lib/services/businesses'
import { QUERY_CONFIG } from '../lib/queryClient'

/**
 * Returns all businesses where the given user is an approved employee.
 */
export function useEmployeeBusinesses(userId: string | undefined) {
  return useQuery({
    queryKey: ['employee-businesses', userId],
    queryFn: () => businessesService.listByEmployee(userId!),
    enabled: !!userId,
    ...QUERY_CONFIG.STABLE,
  })
}
