import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { colors, radius, spacing, typography } from '../../theme'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  size?: BadgeSize
  style?: ViewStyle
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#10b98120', text: colors.success },
  warning: { bg: '#f59e0b20', text: colors.warning },
  error: { bg: '#ef444420', text: colors.error },
  info: { bg: '#3b82f620', text: colors.info },
  default: { bg: colors.card, text: colors.textSecondary },
  primary: { bg: '#6366f120', text: colors.primary },
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
