import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StarRating } from '../ui/StarRating'
import Badge from '../ui/Badge'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessCardData {
  id: string
  name: string
  logoUrl?: string
  bannerUrl?: string
  categoryName?: string
  averageRating?: number
  reviewCount?: number
  totalServices?: number
  city?: string
  distance?: number /** km */
  isOpen?: boolean
}

interface BusinessCardProps {
  business: BusinessCardData
  variant?: 'default' | 'horizontal'
  onPress?: (id: string) => void
  /** Show a "Seleccionar" action (for booking wizard) */
  onSelect?: (id: string) => void
}

// ─── BusinessCard ─────────────────────────────────────────────────────────────

export function BusinessCard({ business, variant = 'default', onPress, onSelect }: BusinessCardProps) {
  const { theme } = useTheme()
  const {
    id,
    name,
    logoUrl,
    bannerUrl,
    categoryName,
    averageRating,
    reviewCount,
    totalServices,
    city,
    distance,
    isOpen,
  } = business

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={() => onPress?.(id)}
        style={[styles.hCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.sm]}
        activeOpacity={0.75}
      >
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.hLogo} resizeMode="cover" />
        ) : (
          <View style={[styles.hLogoPlaceholder, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="business-outline" size={24} color={theme.primary} />
          </View>
        )}
        <View style={styles.hBody}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
          {categoryName && (
            <Text style={[styles.category, { color: theme.textSecondary }]} numberOfLines={1}>
              {categoryName}
            </Text>
          )}
          {averageRating !== undefined && (
            <StarRating value={averageRating} readOnly size="sm" showNumber />
          )}
        </View>
        {onSelect && (
          <TouchableOpacity onPress={() => onSelect(id)} style={[styles.selectBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.selectBtnText}>Ir</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={() => onPress?.(id)}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.sm]}
    >
      {/* Banner */}
      <View style={styles.bannerContainer}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={[styles.banner, { backgroundColor: theme.primary + '18' }]} />
        )}
        {isOpen !== undefined && (
          <View style={[styles.openBadge, { backgroundColor: isOpen ? '#10b981' : '#ef4444' }]}>
            <Text style={styles.openText}>{isOpen ? 'Abierto' : 'Cerrado'}</Text>
          </View>
        )}
      </View>

      {/* Logo */}
      {logoUrl && (
        <View style={[styles.logoWrapper, { borderColor: theme.card }]}>
          <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
        </View>
      )}

      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>

        {categoryName && (
          <Text style={[styles.category, { color: theme.textSecondary }]}>{categoryName}</Text>
        )}

        <View style={styles.metaRow}>
          {averageRating !== undefined && (
            <StarRating value={averageRating} readOnly size="sm" showNumber />
          )}
          {reviewCount !== undefined && (
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              ({reviewCount} reseñas)
            </Text>
          )}
        </View>

        <View style={styles.metaRow}>
          {city && (
            <View style={styles.infoChip}>
              <Ionicons name="location-outline" size={12} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{city}</Text>
            </View>
          )}
          {distance !== undefined && (
            <View style={styles.infoChip}>
              <Ionicons name="navigate-outline" size={12} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
              </Text>
            </View>
          )}
          {totalServices !== undefined && (
            <View style={styles.infoChip}>
              <Ionicons name="briefcase-outline" size={12} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {totalServices} servicios
              </Text>
            </View>
          )}
        </View>

        {onSelect && (
          <TouchableOpacity
            onPress={() => onSelect(id)}
            style={[styles.fullSelectBtn, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '40', borderWidth: 1 }]}
          >
            <Text style={[styles.fullSelectText, { color: theme.primary }]}>Seleccionar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bannerContainer: {
    height: 90,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  openBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  openText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  logoWrapper: {
    position: 'absolute',
    top: 62,
    left: spacing.sm + 4,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: spacing.sm + 4,
    paddingTop: spacing.lg + 4,
    gap: spacing[1] + 2,
  },
  name: {
    fontSize: typography.base + 1,
    fontWeight: '700',
  },
  category: {
    fontSize: typography.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: typography.xs,
  },
  fullSelectBtn: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
  },
  fullSelectText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  // horizontal variant
  hCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  hLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
  },
  hLogoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hBody: {
    flex: 1,
    gap: 3,
  },
  selectBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectBtnText: {
    color: '#fff',
    fontSize: typography.sm,
    fontWeight: '600',
  },
})
