import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AppointmentStatus } from '../../types'
import { radius, spacing, typography } from '../../theme'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string }> = {
  scheduled: { label: 'Programada', bg: '#1e1b4b', text: '#8B4FFF' },
  confirmed: { label: 'Confirmada', bg: '#064e3b', text: '#34d399' },
  cancelled: { label: 'Cancelada', bg: '#450a0a', text: '#f87171' },
  completed: { label: 'Completada', bg: '#1f2937', text: '#9ca3af' },
  no_show: { label: 'No asistió', bg: '#431407', text: '#fb923c' },
  pending: { label: 'Pendiente', bg: '#422006', text: '#fbbf24' },
}

interface StatusBadgeProps {
  status: AppointmentStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const isSmall = size === 'sm'

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text
        style={[
          styles.label,
          { color: config.text, fontSize: isSmall ? typography.xs : typography.sm },
        ]}
      >
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
})
