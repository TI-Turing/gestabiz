import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Badge from '../ui/Badge'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationCardData {
  id: string
  name: string
  address?: string
  city?: string
  opensAt?: string   // 'HH:mm'
  closesAt?: string  // 'HH:mm'
  phone?: string
  isActive?: boolean
  servicesCount?: number
}

interface LocationCardProps {
  location: LocationCardData
  variant?: 'default' | 'compact'
  isSelected?: boolean
  onPress?: (id: string) => void
  onEdit?: (id: string) => void
}

// ─── LocationCard ─────────────────────────────────────────────────────────────

export function LocationCard({
  location,
  variant = 'default',
  isSelected = false,
  onPress,
  onEdit,
}: LocationCardProps) {
  const { theme } = useTheme()
  const { id, name, address, city, opensAt, closesAt, phone, isActive, servicesCount } = location

  const schedule =
    opensAt && closesAt ? `${opensAt} – ${closesAt}` : opensAt ?? closesAt ?? null

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={() => onPress?.(id)}
        style={[
          styles.compact,
          {
            backgroundColor: isSelected ? theme.primary + '15' : theme.card,
            borderColor: isSelected ? theme.primary : theme.cardBorder,
          },
          shadows.sm,
        ]}
        activeOpacity={0.75}
      >
        <View style={[styles.compactIcon, { backgroundColor: theme.primary + '18' }]}>
          <Ionicons name="location" size={20} color={theme.primary} />
        </View>
        <View style={styles.compactBody}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
          {city && (
            <Text style={[styles.address, { color: theme.textSecondary }]} numberOfLines={1}>{city}</Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
        )}
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={() => onPress?.(id)}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? theme.primary + '10' : theme.card,
          borderColor: isSelected ? theme.primary : theme.cardBorder,
        },
        shadows.sm,
      ]}
    >
      {/* Header */}
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '18' }]}>
          <Ionicons name="location" size={22} color={theme.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
          {isActive !== undefined && (
            <Badge
              label={isActive ? 'Activa' : 'Inactiva'}
              variant={isActive ? 'success' : 'default'}
              size="sm"
            />
          )}
        </View>
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        {address && (
          <View style={styles.detailRow}>
            <Ionicons name="map-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={2}>
              {[address, city].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
        {schedule && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{schedule}</Text>
          </View>
        )}
        {phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{phone}</Text>
          </View>
        )}
        {servicesCount !== undefined && (
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {servicesCount} servicios disponibles
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,  // paridad web rounded-md
    padding: spacing.sm + 4,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: typography.base,
    fontWeight: '700',
  },
  details: {
    gap: spacing[1] + 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailText: {
    fontSize: typography.sm,
    flex: 1,
    lineHeight: 18,
  },
  // compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,  // paridad web rounded-md
    padding: spacing.sm,
    gap: spacing.sm,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody: {
    flex: 1,
    gap: 2,
  },
  address: {
    fontSize: typography.xs,
  },
})
