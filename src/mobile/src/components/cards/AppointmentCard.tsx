import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
  | 'pending'

export interface AppointmentCardData {
  id: string
  startTime: string | Date
  endTime?: string | Date
  status: AppointmentStatus
  serviceName: string
  /** URL de imagen del servicio para la variante hero */
  serviceImageUrl?: string
  servicePrice?: number
  businessName?: string
  clientName?: string
  clientAvatarUrl?: string
  employeeName?: string
  employeeAvatarUrl?: string
  /** Rol o título del empleado, ej: "Profesional", "Manager" */
  employeeTitle?: string
  locationName?: string
  locationAddress?: string
  notes?: string
  /** Logo del negocio para mostrar en la esquina superior izquierda del hero */
  businessLogoUrl?: string
}

interface AppointmentCardProps {
  appointment: AppointmentCardData
  /** Full-width row (default), compact chip, o hero con imagen de fondo */
  variant?: 'default' | 'compact' | 'hero'
  /** Called when user taps the card */
  onPress?: (id: string) => void
  /** Called when user taps the action slot (e.g. cancel button) */
  onAction?: (id: string) => void
  /** Label for the action button, e.g. "Cancelar" */
  actionLabel?: string
  /** Called when user taps "Dejar reseña" (only shown when status === 'completed') */
  onReview?: (id: string) => void
}

// ─── AppointmentCard ──────────────────────────────────────────────────────────

export function AppointmentCard({
  appointment,
  variant = 'default',
  onPress,
  onAction,
  actionLabel,
  onReview,
}: AppointmentCardProps) {
  const { theme } = useTheme()
  const {
    id,
    startTime,
    endTime,
    status,
    serviceName,
    serviceImageUrl,
    servicePrice,
    businessName,
    clientName,
    clientAvatarUrl,
    employeeName,
    employeeAvatarUrl,
    employeeTitle,
    locationName,
    locationAddress,
    notes,
    businessLogoUrl,
  } = appointment

  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const end = endTime ? (typeof endTime === 'string' ? new Date(endTime) : endTime) : null

  const fullDateLabel = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(start)
  const formatTime = (d: Date) => new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }).format(d)
  const timeLabel = formatTime(start) + (end ? ` – ${formatTime(end)}` : '')
  const shortDateLabel = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(start)
  const dateTimeShort = `${shortDateLabel} · ${timeLabel}`

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
        <View style={[styles.compactAccent, { backgroundColor: theme.primary }]} />
        <View style={styles.compactBody}>
          <Text style={[styles.compactService, { color: theme.text }]} numberOfLines={1}>
            {serviceName}
          </Text>
          <Text style={[styles.compactTime, { color: theme.textSecondary }]}>
            {new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }).format(start)} · {shortDateLabel}
          </Text>
        </View>
        <StatusBadge status={status} />
      </TouchableOpacity>
    )
  }

  // ─── Hero variant ─────────────────────────────────────────────────────────

  if (variant === 'hero') {
    const hasImage = !!serviceImageUrl
    return (
      <TouchableOpacity
        onPress={() => onPress?.(id)}
        activeOpacity={0.9}
        style={[styles.heroCard, shadows.md]}
      >
        <ImageBackground
          source={hasImage ? { uri: serviceImageUrl } : undefined}
          style={styles.heroImageBg}
          imageStyle={styles.heroImageStyle}
        >
          {/* Fallback background when no image */}
          {!hasImage && (
            <View style={[styles.heroFallbackBg, { backgroundColor: theme.primary }]} />
          )}

          {/* Dark overlay top (light) */}
          <View style={styles.heroOverlayTop} />
          {/* Dark overlay bottom (strong) */}
          <View style={styles.heroOverlayBottom} />

          {/* Content */}
          <View style={styles.heroContent}>
            {/* Top row: business logo (left) + status badge (right) */}
            <View style={styles.heroBadgeRow}>
              {businessLogoUrl ? (
                <Avatar uri={businessLogoUrl} name={businessName} size={28} style={styles.heroBusinessLogo} />
              ) : (
                <View style={{ width: 28 }} />
              )}
              <StatusBadge status={status} size="sm" />
            </View>

            {/* Bottom info block */}
            <View style={styles.heroBottom}>
              <Text style={styles.heroServiceName} numberOfLines={2}>
                {serviceName}
              </Text>

              {(businessName || locationName) && (
                <Text style={styles.heroBusinessLine} numberOfLines={1}>
                  {[businessName, locationName].filter(Boolean).join(' · ')}
                </Text>
              )}

              {employeeName && (
                <View style={styles.heroEmployeeRow}>
                  <Avatar uri={employeeAvatarUrl} name={employeeName} size={32} />
                  <View style={styles.heroEmployeeInfo}>
                    <Text style={styles.heroEmployeeName} numberOfLines={1}>
                      {employeeName}
                    </Text>
                    {employeeTitle && (
                      <Text style={styles.heroEmployeeTitle} numberOfLines={1}>
                        {employeeTitle}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.heroMetaRow}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={styles.heroMetaText} numberOfLines={1}>{dateTimeShort}</Text>
              </View>

              {(locationAddress || servicePrice !== undefined) && (
                <View style={styles.heroBottomRow}>
                  {locationAddress ? (
                    <View style={[styles.heroMetaRow, { flex: 1 }]}>
                      <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
                      <Text style={[styles.heroMetaText, { flex: 1 }]} numberOfLines={1}>
                        {locationAddress}
                      </Text>
                    </View>
                  ) : <View style={{ flex: 1 }} />}
                  {servicePrice !== undefined && (
                    <Text style={styles.heroPrice}>
                      ${servicePrice.toLocaleString('es-CO')}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Optional action button (e.g. cancel) */}
          {onAction && actionLabel && (
            <TouchableOpacity
              onPress={() => onAction(id)}
              style={[styles.heroActionBtn, { backgroundColor: theme.primary }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.heroActionText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </ImageBackground>
      </TouchableOpacity>
    )
  }

  // ─── Default variant ──────────────────────────────────────────────────────

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
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{fullDateLabel}</Text>
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
      {(servicePrice !== undefined || onAction || (status === 'completed' && onReview)) && (
        <View style={styles.footer}>
          {servicePrice !== undefined && (
            <CurrencyText amount={servicePrice} highlight size="sm" />
          )}
          <View style={styles.footerActions}>
            {status === 'completed' && onReview && (
              <TouchableOpacity
                onPress={() => onReview(id)}
                style={[styles.reviewBtn, { backgroundColor: theme.primary }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="star-outline" size={12} color="#FFFFFF" />
                <Text style={styles.reviewBtnText}>Reseñar</Text>
              </TouchableOpacity>
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
  // ─── Default ──────────────────────────────────────────────────────────────
  card: {
    borderWidth: 1,
    borderRadius: radius.md,  // paridad web rounded-md
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
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  reviewBtnText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: '#FFFFFF',
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
  // ─── Compact ──────────────────────────────────────────────────────────────
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
  // ─── Hero ─────────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.base,
  },
  heroImageBg: {
    minHeight: 210,
    justifyContent: 'space-between',
  },
  heroImageStyle: {
    borderRadius: radius['2xl'],
  },
  heroFallbackBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  heroOverlayTop: {
    ...StyleSheet.absoluteFillObject,
    height: '55%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '35%',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  heroContent: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'space-between',
    minHeight: 210,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  heroBusinessLogo: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  heroBottom: {
    gap: 5,
    marginTop: spacing.xl,
  },
  heroServiceName: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroBusinessLine: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 3,
  },
  heroEmployeeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: 2,
  },
  heroEmployeeInfo: {
    flex: 1,
  },
  heroEmployeeName: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  heroEmployeeTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
    marginTop: 1,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroMetaText: {
    fontSize: typography.xs,
    color: 'rgba(255,255,255,0.75)',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  heroPrice: {
    fontSize: typography.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroActionBtn: {
    position: 'absolute',
    bottom: spacing.base,
    right: spacing.base,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  heroActionText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
