import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useInAppNotifications } from '../../hooks/useInAppNotifications'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'

const TYPE_ICONS: Record<string, string> = {
  appointment_created: 'calendar-outline',
  appointment_cancelled: 'calendar-clear-outline',
  appointment_reminder: 'alarm-outline',
  employee_request: 'person-add-outline',
  absence_request: 'bed-outline',
  new_review: 'star-outline',
  new_application: 'briefcase-outline',
  payment_received: 'card-outline',
  system: 'information-circle-outline',
}

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {}
  for (const item of items) {
    const day = new Date(item.created_at).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!groups[day]) groups[day] = []
    groups[day].push(item)
  }
  return Object.entries(groups)
}

export default function NotificationsScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const qc = useQueryClient()
  const { notifications, isLoading, refetch, isRefetching } = useInAppNotifications(user?.id)

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('in_app_notifications').update({ status: 'read' }).eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['in_app_notifications', user?.id] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('in_app_notifications')
        .update({ status: 'read' })
        .eq('user_id', user!.id)
        .eq('status', 'unread')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['in_app_notifications', user?.id] })
    },
  })

  const handlePress = (notif: any) => {
    if (notif.status !== 'read') markReadMutation.mutate(notif.id)
    // Navigate contextually — extend as needed
  }

  const groups = groupByDate(notifications)

  return (
    <Screen>
      {/* Header action */}
      {notifications.some(n => n.status === 'unread') && (
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAllMutation.mutate()}>
          <Text style={styles.markAllText}>Marcar todo como leído</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Sin notificaciones</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={([day]) => day}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item: [day, items] }) => (
            <View>
              <Text style={styles.dayLabel}>{day}</Text>
              {items.map((notif: any) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.row, notif.status === 'unread' && styles.rowUnread]}
                  onPress={() => handlePress(notif)}
                >
                  <View style={[styles.iconWrap, notif.status === 'unread' && styles.iconWrapUnread]}>
                    <Ionicons
                      name={(TYPE_ICONS[notif.type] ?? 'notifications-outline') as any}
                      size={20}
                      color={notif.status === 'read' ? colors.textMuted : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifTitle, notif.status === 'unread' && styles.notifTitleUnread]} numberOfLines={2}>
                      {notif.title ?? notif.type}
                    </Text>
                    {notif.body && (
                      <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                    )}
                    <Text style={styles.time}>
                      {new Date(notif.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {notif.status === 'unread' && <View style={styles.dot} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted },
  markAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  markAllText: { ...typography.caption, color: colors.primary },
  dayLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'capitalize',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  rowUnread: { backgroundColor: colors.primary + '08' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: colors.primary + '20' },
  notifTitle: { ...typography.body, color: colors.text },
  notifTitleUnread: { fontWeight: '700' },
  notifBody: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  time: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
})
