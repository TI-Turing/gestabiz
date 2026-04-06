import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  /** Texto del botón de acción a la derecha */
  actionLabel?: string
  /** Callback del botón de acción */
  onAction?: () => void
  /** Icono de la derecha en lugar de texto */
  actionIcon?: keyof typeof Ionicons.glyphMap
  style?: ViewStyle
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  style,
}: SectionHeaderProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelGroup}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        )}
      </View>

      {(actionLabel || actionIcon) && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.action} hitSlop={8}>
          {actionIcon ? (
            <Ionicons name={actionIcon} size={20} color={theme.primary} />
          ) : (
            <Text style={[styles.actionText, { color: theme.primary }]}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  labelGroup: {
    flex: 1,
  },
  title: {
    fontSize: typography.base,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.sm,
    marginTop: 2,
  },
  action: {
    paddingLeft: spacing.sm,
  },
  actionText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
})
