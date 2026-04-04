import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  size?: BadgeSize
  style?: ViewStyle
}

const sizeStyles: Record<BadgeSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs - 1,
      borderRadius: radius.full,
    },
    text: { fontSize: typography.xs },
  },
  md: {
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    text: { fontSize: typography.sm },
  },
}

export default function Badge({ label, variant = 'default', size = 'md', style }: BadgeProps) {
  const { theme } = useTheme()
  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: '#10b98120', text: theme.success },
    warning: { bg: '#f59e0b20', text: theme.warning },
    error: { bg: '#ef444420', text: theme.error },
    info: { bg: '#3b82f620', text: theme.info },
    default: { bg: theme.card, text: theme.textSecondary },
    primary: { bg: '#6820F720', text: theme.primary },
  }
  const vc = variantColors[variant]
  const ss = sizeStyles[size]

  return (
    <View
      style={[
        styles.base,
        ss.container,
        { backgroundColor: vc.bg },
        style,
      ]}
    >
      <Text style={[styles.text, ss.text, { color: vc.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
})
