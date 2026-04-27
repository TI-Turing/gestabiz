import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CurrencyText } from '../ui/CurrencyText'
import Badge from '../ui/Badge'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceCardData {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes?: number
  imageUrl?: string
  categoryName?: string
  isActive?: boolean
}

interface ServiceCardProps {
  service: ServiceCardData
  variant?: 'default' | 'compact'
  isSelected?: boolean
  onPress?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

export function ServiceCard({
  service,
  variant = 'default',
  isSelected = false,
  onPress,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const { theme } = useTheme()
  const { id, name, description, price, durationMinutes, imageUrl, categoryName, isActive } = service

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
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.compactImage} resizeMode="cover" />
        ) : (
          <View style={[styles.compactImagePlaceholder, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="briefcase-outline" size={20} color={theme.primary} />
          </View>
        )}
        <View style={styles.compactBody}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
          {durationMinutes && (
            <Text style={[styles.duration, { color: theme.textMuted }]}>{durationMinutes} min</Text>
          )}
        </View>
        <CurrencyText amount={price} highlight size="sm" />
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
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
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          {!imageUrl && (
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="briefcase-outline" size={20} color={theme.primary} />
            </View>
          )}
          <View style={styles.titleBlock}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
            {categoryName && (
              <Text style={[styles.category, { color: theme.textMuted }]}>{categoryName}</Text>
            )}
          </View>
          {isActive === false && (
            <Badge label="Inactivo" variant="default" size="sm" />
          )}
        </View>

        {description && (
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        )}

        <View style={styles.footer}>
          <CurrencyText amount={price} highlight />
          {durationMinutes && (
            <View style={styles.durationChip}>
              <Ionicons name="time-outline" size={13} color={theme.textMuted} />
              <Text style={[styles.durationText, { color: theme.textSecondary }]}>
                {durationMinutes} min
              </Text>
            </View>
          )}
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="create-outline" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,  // paridad web rounded-md
    overflow: 'hidden',
  },
  image: {
    height: 100,
    width: '100%',
  },
  body: {
    padding: spacing.sm + 4,
    gap: spacing.xs + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: typography.base,
    fontWeight: '700',
  },
  category: {
    fontSize: typography.xs,
    marginTop: 1,
  },
  description: {
    fontSize: typography.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: typography.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 'auto',
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
  compactImage: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
  },
  compactImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody: {
    flex: 1,
  },
  duration: {
    fontSize: typography.xs,
    marginTop: 2,
  },
})
