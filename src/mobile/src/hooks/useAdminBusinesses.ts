import { useQuery } from '@tanstack/react-query'
import { businessesService } from '../lib/services/businesses'
import { QUERY_CONFIG } from '../lib/queryClient'

/**
 * Returns all businesses where the given user is the owner.
 */
export function useAdminBusinesses(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-businesses', userId],
    queryFn: () => businessesService.list({ ownerId: userId }),
    enabled: !!userId,
    ...QUERY_CONFIG.STABLE,
  })
}
