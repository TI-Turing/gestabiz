import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { StarRating } from '../ui/StarRating'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployeeCardData {
  id: string
  fullName: string
  avatarUrl?: string
  role?: string
  employeeType?: string
  specializations?: string[]
  averageRating?: number
  totalServices?: number
  isAvailable?: boolean
}

interface EmployeeCardProps {
  employee: EmployeeCardData
  variant?: 'default' | 'compact'
  isSelected?: boolean
  onPress?: (id: string) => void
  onEdit?: (id: string) => void
}

// ─── Role label map ───────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  manager: 'Gerente',
  professional: 'Profesional',
  receptionist: 'Recepcionista',
  accountant: 'Contador',
  support_staff: 'Staff',
}

// ─── EmployeeCard ─────────────────────────────────────────────────────────────

export function EmployeeCard({
  employee,
  variant = 'default',
  isSelected = false,
  onPress,
  onEdit,
}: EmployeeCardProps) {
  const { theme } = useTheme()
  const {
    id,
    fullName,
    avatarUrl,
    role,
    employeeType,
    specializations,
    averageRating,
    totalServices,
    isAvailable,
  } = employee

  const roleLabel = role ? ROLE_LABELS[role] ?? role : undefined

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
        <Avatar uri={avatarUrl} name={fullName} size={44} />
        <View style={styles.compactBody}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{fullName}</Text>
          {roleLabel && (
            <Text style={[styles.role, { color: theme.textSecondary }]}>{roleLabel}</Text>
          )}
        </View>
        {isAvailable !== undefined && (
          <View style={[styles.availDot, { backgroundColor: isAvailable ? '#10b981' : '#94a3b8' }]} />
        )}
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
        <Avatar uri={avatarUrl} name={fullName} size={52} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{fullName}</Text>
          {roleLabel && (
            <Text style={[styles.role, { color: theme.textSecondary }]}>{roleLabel}</Text>
          )}
          {averageRating !== undefined && (
            <StarRating value={averageRating} readOnly size="sm" showNumber />
          )}
        </View>
        <View style={styles.badges}>
          {isAvailable !== undefined && (
            <Badge
              label={isAvailable ? 'Disponible' : 'No disponible'}
              variant={isAvailable ? 'success' : 'default'}
              size="sm"
            />
          )}
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Specializations */}
      {specializations && specializations.length > 0 && (
        <View style={styles.chips}>
          {specializations.slice(0, 3).map((s) => (
            <View key={s} style={[styles.chip, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
              <Text style={[styles.chipText, { color: theme.primary }]}>{s}</Text>
            </View>
          ))}
          {specializations.length > 3 && (
            <Text style={[styles.chipText, { color: theme.textMuted }]}>+{specializations.length - 3} más</Text>
          )}
        </View>
      )}

      {/* Footer */}
      {totalServices !== undefined && (
        <View style={styles.metaRow}>
          <Ionicons name="briefcase-outline" size={13} color={theme.textMuted} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {totalServices} servicios disponibles
          </Text>
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
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  badges: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.base,
    fontWeight: '700',
  },
  role: {
    fontSize: typography.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.xs,
  },
  availDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  compactBody: {
    flex: 1,
    gap: 2,
  },
})
