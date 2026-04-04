import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import StatusBadge from '../ui/StatusBadge'
import { CurrencyText } from '../ui/CurrencyText'
import Avatar from '../ui/Avatar'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface AppointmentCardData {
  id: string
  startTime: string | Date
  endTime?: string | Date
  status: AppointmentStatus
  serviceName: string
  servicePrice?: number
  clientName?: string
  clientAvatarUrl?: string
  employeeName?: string
  locationName?: string
  notes?: string
}

interface AppointmentCardProps {
  appointment: AppointmentCardData
  /** Full-width row (default) or compact chip */
  variant?: 'default' | 'compact'
  /** Called when user taps the card */
  onPress?: (id: string) => void
  /** Called when user taps the action slot (e.g. cancel button) */
  onAction?: (id: string) => void
  /** Label for the action button, e.g. "Cancelar" */
  actionLabel?: string
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<AppointmentStatus, string> = {
  scheduled: 'time-outline',
  confirmed: 'checkmark-circle-outline',
  completed: 'checkmark-done-circle-outline',
  cancelled: 'close-circle-outline',
  no_show: 'alert-circle-outline',
}

// ─── AppointmentCard ──────────────────────────────────────────────────────────

export function AppointmentCard({
  appointment,
  variant = 'default',
  onPress,
  onAction,
  actionLabel,
}: AppointmentCardProps) {
  const { theme } = useTheme()
  const {
    id,
    startTime,
    endTime,
    status,
    serviceName,
    servicePrice,
    clientName,
    clientAvatarUrl,
    employeeName,
    locationName,
    notes,
  } = appointment

  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const end = endTime ? (typeof endTime === 'string' ? new Date(endTime) : endTime) : null

  const dateLabel = format(start, "EEEE d 'de' MMMM", { locale: es })
  const timeLabel = format(start, 'HH:mm') + (end ? ` – ${format(end, 'HH:mm')}` : '')

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={() => onPress?.(id)}
        style={[
          styles.compact,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
        activeOpacity={0.75}
      >
        <View
          style={[styles.compactAccent, { backgroundColor: theme.primary }]}
        />
        <View style={styles.compactBody}>
          <Text style={[styles.compactService, { color: theme.text }]} numberOfLines={1}>
            {serviceName}
          </Text>
          <Text style={[styles.compactTime, { color: theme.textSecondary }]}>
            {format(start, 'HH:mm')} · {format(start, 'd MMM', { locale: es })}
          </Text>
        </View>
        <StatusBadge status={status} />
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={() => onPress?.(id)}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        shadows.sm,
      ]}
    >
      {/* Header row */}
      <View style={styles.row}>
        <Avatar
          uri={clientAvatarUrl}
          name={clientName}
          size={42}
        />
        <View style={styles.headerText}>
          {clientName && (
            <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={1}>
              {clientName}
            </Text>
          )}
          <Text style={[styles.serviceName, { color: theme.textSecondary }]} numberOfLines={1}>
            {serviceName}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{dateLabel}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={theme.textMuted} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{timeLabel}</Text>
        </View>
        {employeeName && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
              {employeeName}
            </Text>
          </View>
        )}
        {locationName && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
              {locationName}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      {(servicePrice !== undefined || onAction) && (
        <View style={styles.footer}>
          {servicePrice !== undefined && (
            <CurrencyText amount={servicePrice} highlight size="sm" />
          )}
          {onAction && actionLabel && (
            <TouchableOpacity
              onPress={() => onAction(id)}
              style={[styles.actionBtn, { borderColor: theme.border }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                {actionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {notes && (
        <Text style={[styles.notes, { color: theme.textMuted }]} numberOfLines={2}>
          {notes}
        </Text>
      )}
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.base,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: typography.sm,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing[1],
  },
  details: {
    gap: spacing[1] + 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
  },
  detailText: {
    fontSize: typography.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  notes: {
    fontSize: typography.xs,
    fontStyle: 'italic',
    marginTop: spacing[1],
  },
  // compact variant
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  compactAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  compactBody: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  compactService: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  compactTime: {
    fontSize: typography.xs,
    marginTop: 2,
  },
})
