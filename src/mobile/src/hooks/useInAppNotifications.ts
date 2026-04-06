import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '../lib/services/notifications'
import { QUERY_CONFIG } from '../lib/queryClient'

/**
 * In-app notifications with local filtering to minimise DB requests.
 *
 * Strategy (mirrors web):
 * - 1 base query fetches last 50 notifications.
 * - Unread count is derived locally — no extra RPC call.
 */
export function useInAppNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['in-app-notifications', userId]

  const query = useQuery({
    queryKey,
    queryFn: () => notificationsService.listByUser(userId!, 50),
    enabled: !!userId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter(n => n.status === 'unread').length

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const dismiss = useMutation({
    mutationFn: (id: string) => notificationsService.dismiss(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    ...query,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    remove,
  }
}
