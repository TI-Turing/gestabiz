import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InAppNotification {
  id: string
  user_id: string
  business_id?: string | null
  type: string
  title: string
  message?: string | null
  status: 'unread' | 'read' | 'dismissed'
  priority?: string | null
  data?: Record<string, unknown> | null
  action_url?: string | null
  created_at: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const notificationsService = {
  async listByUser(userId: string, limit = 50): Promise<InAppNotification[]> {
    const { data, error } = await supabase
      .from('in_app_notifications')
      .select('id, type, title, message, status, priority, data, action_url, created_at, user_id, business_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    throwIfError(error, 'LIST_NOTIFICATIONS', 'No se pudieron cargar las notificaciones')
    return (data ?? []) as InAppNotification[]
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'read' })
      .eq('id', notificationId)
    throwIfError(error, 'MARK_NOTIFICATION_READ', 'No se pudo marcar la notificación como leída')
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'read' })
      .eq('user_id', userId)
      .eq('status', 'unread')
    throwIfError(error, 'MARK_ALL_NOTIFICATIONS_READ', 'No se pudieron marcar las notificaciones como leídas')
  },

  async dismiss(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ status: 'dismissed' })
      .eq('id', notificationId)
    throwIfError(error, 'DISMISS_NOTIFICATION', 'No se pudo descartar la notificación')
  },

  async delete(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('in_app_notifications')
      .delete()
      .eq('id', notificationId)
    throwIfError(error, 'DELETE_NOTIFICATION', 'No se pudo eliminar la notificación')
  },
}
