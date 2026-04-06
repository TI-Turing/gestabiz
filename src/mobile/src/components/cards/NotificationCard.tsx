import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'appointment'
  | 'review'
  | 'vacancy'
  | 'absence'
  | 'chat'

export interface NotificationCardData {
  id: string
  title: string
  message?: string
  type: NotificationType
  createdAt: string | Date
  isRead?: boolean
  actionUrl?: string
}

interface NotificationCardProps {
  notification: NotificationCardData
  onPress?: (id: string) => void
  onDismiss?: (id: string) => void
}

// ─── Icon / colour map ────────────────────────────────────────────────────────

interface NotifMeta {
  icon: React.ComponentProps<typeof Ionicons>['name']
  bg: string
  color: string
}

function useNotifMeta(type: NotificationType, theme: ReturnType<typeof import('../../contexts/ThemeContext').useTheme>['theme']): NotifMeta {
  switch (type) {
    case 'success':
      return { icon: 'checkmark-circle', bg: theme.success + '18', color: theme.success }
    case 'warning':
      return { icon: 'warning', bg: theme.warning + '18', color: theme.warning }
    case 'error':
      return { icon: 'close-circle', bg: theme.error + '18', color: theme.error }
    case 'appointment':
      return { icon: 'calendar', bg: theme.primary + '18', color: theme.primary }
    case 'review':
      return { icon: 'star', bg: '#F59E0B18', color: '#F59E0B' }
    case 'vacancy':
      return { icon: 'briefcase', bg: '#8B5CF618', color: '#8B5CF6' }
    case 'absence':
      return { icon: 'calendar-clear', bg: '#EC489918', color: '#EC4899' }
    case 'chat':
      return { icon: 'chatbubbles', bg: '#0EA5E918', color: '#0EA5E9' }
    case 'info':
    default:
      return { icon: 'information-circle', bg: theme.textMuted + '18', color: theme.textMuted }
  }
}

// ─── NotificationCard ─────────────────────────────────────────────────────────

export function NotificationCard({ notification, onPress, onDismiss }: NotificationCardProps) {
  const { theme } = useTheme()
  const { id, title, message, type, createdAt, isRead } = notification
  const meta = useNotifMeta(type, theme)

  const date = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt
  const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: es })

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.72 : 1}
      onPress={onPress ? () => onPress(id) : undefined}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isRead ? theme.card : theme.primary + '06',
            borderColor: isRead ? theme.cardBorder : theme.primary + '25',
          },
          shadows.sm,
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.text,
                  fontWeight: isRead ? '500' : '700',
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {onDismiss && (
              <TouchableOpacity
                onPress={() => onDismiss(id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {message && (
            <Text style={[styles.message, { color: theme.textSecondary }]} numberOfLines={3}>
              {message}
            </Text>
          )}
          <Text style={[styles.timeAgo, { color: theme.textMuted }]}>{timeAgo}</Text>
        </View>

        {/* Unread dot */}
        {!isRead && (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: typography.sm + 1,
    lineHeight: 19,
  },
  message: {
    fontSize: typography.sm,
    lineHeight: 18,
  },
  timeAgo: {
    fontSize: typography.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs + 2,
    flexShrink: 0,
  },
})
