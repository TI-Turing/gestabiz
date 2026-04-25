import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AppointmentStatus } from '../../types'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * StatusBadge — Badge de estado de cita.
 * Paridad con web: colores semánticos con fondo translúcido sobre el color del estado.
 *
 * Refactor (sprint mobile-client-parity-2026-04): antes los colores eran hardcoded
 * con bg dark + text light, lo que se veía MAL en light theme. Ahora usa tokens
 * del theme y opacidad para adaptarse al modo activo.
 */

interface StatusConfig {
  label: string
  /** Color base del estado (texto en light, fondo opaco en dark) */
  color: string
}

const getConfig = (status: AppointmentStatus): StatusConfig => {
  switch (status) {
    case 'scheduled':
      return { label: 'Programada', color: '#6820F7' }
    case 'confirmed':
      return { label: 'Confirmada', color: '#10B981' }
    case 'cancelled':
      return { label: 'Cancelada', color: '#D63B3B' }
    case 'completed':
      return { label: 'Completada', color: '#888888' }
    case 'no_show':
      return { label: 'No asistió', color: '#F97316' }
    case 'pending':
    default:
      return { label: 'Pendiente', color: '#F59E0B' }
  }
}

interface StatusBadgeProps {
  status: AppointmentStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { theme } = useTheme()
  const config = getConfig(status)
  const isSmall = size === 'sm'

  // Fondo: color base con 15% opacidad → se adapta a light y dark.
  const bg = `${config.color}26` // hex 26 ≈ 15% opacity
  // Texto: el color base puro en ambos temas tiene buen contraste sobre el bg translúcido.
  const textColor = config.color

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: `${config.color}40` }]}>
      <Text
        style={[
          styles.label,
          { color: textColor, fontSize: isSmall ? typography.xs : typography.sm },
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
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
})
