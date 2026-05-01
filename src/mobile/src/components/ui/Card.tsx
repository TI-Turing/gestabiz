import React, { ReactNode } from 'react'
import {
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import { radius, shadows, spacing } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
  onPress?: () => void
  /** Si es false, no añade padding interno (default: true) */
  padding?: boolean
}

export default function Card({ children, style, onPress, padding = true }: CardProps) {
  const { theme } = useTheme()
  // Paridad con web: cards usan rounded-md (4px) + sombra purple sutil.
  const cardBase: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...shadows.card,
  }
  const paddingStyle: ViewStyle | undefined = padding ? { padding: spacing.base } : undefined

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardBase, paddingStyle, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={[cardBase, paddingStyle, style]}>{children}</View>
}
