import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StarRating } from '../ui/StarRating'
import Avatar from '../ui/Avatar'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewCardData {
  id: string
  rating: number
  comment?: string
  createdAt: string | Date
  reviewType: 'business' | 'employee'
  authorName?: string      // kept anonymous if not set
  authorAvatarUrl?: string
  targetName?: string      // business name or employee name
  businessResponse?: string
  serviceName?: string
  isVisible?: boolean
}

interface ReviewCardProps {
  review: ReviewCardData
  /** Show admin controls (respond / toggle visibility) */
  showAdminActions?: boolean
  onRespond?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  onDelete?: (id: string) => void
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

export function ReviewCard({
  review,
  showAdminActions = false,
  onRespond,
  onToggleVisibility,
  onDelete,
}: ReviewCardProps) {
  const { theme } = useTheme()
  const {
    id,
    rating,
    comment,
    createdAt,
    authorName,
    businessResponse,
    serviceName,
    isVisible,
  } = review

  const date = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt
  const dateLabel = format(date, "d 'de' MMM yyyy", { locale: es })

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        shadows.sm,
      ]}
    >
      {/* Header */}
      <View style={styles.row}>
        <Avatar
          uri={authorName ? undefined : undefined}
          name={authorName ?? 'A'}
          size={38}
        />
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: theme.text }]}>
            {authorName ?? 'Cliente anónimo'}
          </Text>
          <View style={styles.ratingRow}>
            <StarRating value={rating} readOnly size="sm" />
            <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateLabel}</Text>
          </View>
        </View>
        {showAdminActions && (
          <View style={styles.adminBtns}>
            {onToggleVisibility && (
              <TouchableOpacity
                onPress={() => onToggleVisibility(id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name={isVisible === false ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Service tag */}
      {serviceName && (
        <View style={[styles.serviceTag, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '25' }]}>
          <Ionicons name="briefcase-outline" size={11} color={theme.primary} />
          <Text style={[styles.serviceTagText, { color: theme.primary }]}>{serviceName}</Text>
        </View>
      )}

      {/* Comment */}
      {comment && (
        <Text style={[styles.comment, { color: theme.textSecondary }]}>"{comment}"</Text>
      )}

      {/* Business response */}
      {businessResponse && (
        <View style={[styles.response, { backgroundColor: theme.inputBg, borderLeftColor: theme.primary }]}>
          <Text style={[styles.responseLabel, { color: theme.primary }]}>Respuesta del negocio</Text>
          <Text style={[styles.responseText, { color: theme.textSecondary }]}>{businessResponse}</Text>
        </View>
      )}

      {/* Respond action */}
      {showAdminActions && onRespond && !businessResponse && (
        <TouchableOpacity
          onPress={() => onRespond(id)}
          style={[styles.respondBtn, { borderColor: theme.border }]}
        >
          <Ionicons name="chatbubble-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.respondBtnText, { color: theme.textSecondary }]}>Responder</Text>
        </TouchableOpacity>
      )}
    </View>
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
    gap: 2,
  },
  authorName: {
    fontSize: typography.sm + 1,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dateText: {
    fontSize: typography.xs,
  },
  adminBtns: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  comment: {
    fontSize: typography.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  response: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  responseLabel: {
    fontSize: typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseText: {
    fontSize: typography.sm,
    lineHeight: 18,
  },
  respondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  respondBtnText: {
    fontSize: typography.sm,
    fontWeight: '500',
  },
})
