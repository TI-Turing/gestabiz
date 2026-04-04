import { useQuery } from '@tanstack/react-query'
import { permissionsService } from '../lib/services/permissions'
import { QUERY_CONFIG } from '../lib/queryClient'

/**
 * Returns the list of permission strings for a user in a business.
 * Also exposes `hasPermission(perm)` for quick lookups.
 */
export function usePermissions(userId: string | undefined, businessId: string | undefined) {
  const query = useQuery({
    queryKey: ['permissions', userId, businessId],
    queryFn: () => permissionsService.getUserPermissions(userId!, businessId!),
    enabled: !!userId && !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  const permissions = query.data ?? []

  function hasPermission(permission: string): boolean {
    return permissions.includes(permission)
  }

  return { ...query, permissions, hasPermission }
}
