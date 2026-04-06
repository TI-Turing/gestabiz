import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Avatar from '../ui/Avatar'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientCardData {
  id: string
  fullName: string
  email?: string
  phone?: string
  avatarUrl?: string
  totalVisits?: number
  completedVisits?: number
  lastVisit?: string | Date  // ISO string or Date
}

interface ClientCardProps {
  client: ClientCardData
  onPress?: (id: string) => void
}

// ─── ClientCard ───────────────────────────────────────────────────────────────

export function ClientCard({ client, onPress }: ClientCardProps) {
  const { theme } = useTheme()
  const {
    id,
    fullName,
    email,
    phone,
    avatarUrl,
    totalVisits,
    completedVisits,
    lastVisit,
  } = client

  const lastVisitDate = lastVisit
    ? typeof lastVisit === 'string'
      ? parseISO(lastVisit)
      : lastVisit
    : null

  const lastVisitLabel = lastVisitDate
    ? format(lastVisitDate, "d 'de' MMM yyyy", { locale: es })
    : null

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
        <Avatar uri={avatarUrl} name={fullName} size={48} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{fullName}</Text>
          {email && (
            <Text style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
              {email}
            </Text>
          )}
          {phone && !email && (
            <Text style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
              {phone}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </View>

      {/* Stats row */}
      {(totalVisits !== undefined || lastVisitLabel) && (
        <View style={[styles.statsRow, { borderTopColor: theme.cardBorder }]}>
          {totalVisits !== undefined && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{totalVisits}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>visitas</Text>
            </View>
          )}
          {completedVisits !== undefined && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{completedVisits}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>completadas</Text>
            </View>
          )}
          {lastVisitLabel && (
            <View style={[styles.statItem, styles.statLast]}>
              <View style={styles.inlineRow}>
                <Ionicons name="calendar-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{lastVisitLabel}</Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>última visita</Text>
            </View>
          )}
        </View>
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
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.base,
    fontWeight: '700',
  },
  subText: {
    fontSize: typography.sm,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    minWidth: 56,
  },
  statLast: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: typography.base,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
})
