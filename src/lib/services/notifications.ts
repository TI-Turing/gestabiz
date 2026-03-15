/**
 * Servicio de notificaciones in-app
 * Centraliza las queries directas a `in_app_notifications`
 */
import supabase from '@/lib/supabase'
import { throwIfError } from '@/lib/errors'
import { PAGINATION } from '@/lib/queryConfig'
import type { InAppNotification } from '@/types/types'

export const notificationsService = {
  /** Obtiene las notificaciones más recientes de un usuario */
  async listByUser(userId: string, limit = PAGINATION.NOTIFICATIONS): Promise<InAppNotification[]> {
    const { data, error } = await supabase
      .from('in_app_notifications')
      .select('id, type, title, message, status, priority, data, action_url, created_at, user_id, business_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    throwIfError(error, 'LIST_NOTIFICATIONS', 'No se pudieron cargar las notificaciones')
    return (data ?? []) as InAppNotification[]
  },

  /** Marca una notificación como leída */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'read' })
      .eq('id', notificationId)
    throwIfError(error, 'MARK_NOTIFICATION_READ', 'No se pudo marcar la notificación como leída')
  },

  /** Marca todas las notificaciones de un usuario como leídas */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'read' })
      .eq('user_id', userId)
      .eq('status', 'unread')
    throwIfError(error, 'MARK_ALL_NOTIFICATIONS_READ', 'No se pudieron marcar las notificaciones como leídas')
  },

  /** Elimina una notificación */
  async delete(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('in_app_notifications')
      .delete()
      .eq('id', notificationId)
    throwIfError(error, 'DELETE_NOTIFICATION', 'No se pudo eliminar la notificación')
  },
}
