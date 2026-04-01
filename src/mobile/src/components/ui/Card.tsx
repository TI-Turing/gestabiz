import React, { ReactNode } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { colors, radius, shadows, spacing } from '../../theme'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
  onPress?: () => void
  /** Si es false, no añade padding interno (default: true) */
  padding?: boolean
}

export default function Card({ children, style, onPress, padding = true }: CardProps) {
  const inner = (
    <View style={[styles.card, padding && styles.padding, style]}>{children}</View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, padding && styles.padding, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return inner
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  padding: {
    padding: spacing.base,
  },
})
