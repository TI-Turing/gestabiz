import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Badge from '../ui/Badge'
import { CurrencyText } from '../ui/CurrencyText'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'

export interface VacancyCardData {
  id: string
  title: string
  description?: string
  salaryMin?: number
  salaryMax?: number
  commissionBased?: boolean
  requirements?: string[]
  employmentType?: EmploymentType
  isActive?: boolean
  createdAt?: string | Date
  applicationsCount?: number
  locationName?: string
}

interface VacancyCardProps {
  vacancy: VacancyCardData
  /** Show edit/delete icons (admin view) */
  showAdminActions?: boolean
  onPress?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: 'Tiempo completo',
  part_time: 'Medio tiempo',
  contract: 'Por contrato',
  internship: 'Pasantía',
  freelance: 'Freelance',
}

// ─── VacancyCard ──────────────────────────────────────────────────────────────

export function VacancyCard({
  vacancy,
  showAdminActions = false,
  onPress,
  onEdit,
  onDelete,
}: VacancyCardProps) {
  const { theme } = useTheme()
  const {
    id,
    title,
    description,
    salaryMin,
    salaryMax,
    commissionBased,
    requirements = [],
    employmentType,
    isActive,
    createdAt,
    applicationsCount,
    locationName,
  } = vacancy

  const date = createdAt
    ? typeof createdAt === 'string'
      ? parseISO(createdAt)
      : createdAt
    : null
  const dateLabel = date ? format(date, "d MMM yyyy", { locale: es }) : null

  const hasSalary = salaryMin !== undefined || salaryMax !== undefined

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress ? () => onPress(id) : undefined}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
          shadows.sm,
          isActive === false && styles.inactiveCard,
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="briefcase" size={18} color={theme.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text
              style={[styles.title, { color: isActive === false ? theme.textMuted : theme.text }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {locationName && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.metaText, { color: theme.textMuted }]}>{locationName}</Text>
              </View>
            )}
          </View>
          {showAdminActions && (
            <View style={styles.actionBtns}>
              {onEdit && (
                <TouchableOpacity onPress={() => onEdit(id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="pencil-outline" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={() => onDelete(id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="trash-outline" size={18} color={theme.error} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        {description && (
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Salary row */}
        {(hasSalary || commissionBased) && (
          <View style={styles.salaryRow}>
            <Ionicons name="cash-outline" size={14} color={theme.success} />
            {commissionBased ? (
              <Text style={[styles.salaryText, { color: theme.success }]}>Por comisión</Text>
            ) : (
              <Text style={[styles.salaryText, { color: theme.success }]}>
                {salaryMin && <CurrencyText amount={salaryMin} style={{ ...styles.salaryText, color: theme.success }} />}
                {salaryMin && salaryMax && <Text style={{ color: theme.textMuted }}> – </Text>}
                {salaryMax && <CurrencyText amount={salaryMax} style={{ ...styles.salaryText, color: theme.success }} />}
              </Text>
            )}
          </View>
        )}

        {/* Chips row */}
        <View style={styles.chipsRow}>
          {isActive !== undefined && (
            <Badge
              label={isActive ? 'Activa' : 'Inactiva'}
              variant={isActive ? 'success' : 'default'}
            />
          )}
          {employmentType && (
            <Badge label={EMPLOYMENT_LABELS[employmentType]} variant="primary" />
          )}
        </View>

        {/* Requirements */}
        {requirements.length > 0 && (
          <View style={styles.requirementsRow}>
            {requirements.slice(0, 4).map((req, i) => (
              <View
                key={i}
                style={[styles.reqChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              >
                <Text style={[styles.reqChipText, { color: theme.textSecondary }]}>{req}</Text>
              </View>
            ))}
            {requirements.length > 4 && (
              <View style={[styles.reqChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Text style={[styles.reqChipText, { color: theme.textMuted }]}>+{requirements.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          {dateLabel && (
            <Text style={[styles.footerText, { color: theme.textMuted }]}>{dateLabel}</Text>
          )}
          {applicationsCount !== undefined && (
            <View style={styles.applRow}>
              <Ionicons name="people-outline" size={13} color={theme.textMuted} />
              <Text style={[styles.footerText, { color: theme.textMuted }]}>
                {applicationsCount} aplicaciones
              </Text>
            </View>
          )}
        </View>
      </View>
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
  inactiveCard: {
    opacity: 0.65,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: typography.sm + 1,
    fontWeight: '700',
    lineHeight: 19,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: typography.xs,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  description: {
    fontSize: typography.sm,
    lineHeight: 18,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  salaryText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  requirementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  reqChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
  },
  reqChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  footerText: {
    fontSize: typography.xs,
  },
  applRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
})
