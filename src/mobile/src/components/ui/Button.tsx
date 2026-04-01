import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '../../theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  size?: Size
  style?: ViewStyle
  textStyle?: TextStyle
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.text },
  },
  secondary: {
    container: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.error },
    text: { color: colors.text },
  },
}

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
  sm: {
    container: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
    },
    text: { fontSize: typography.sm },
    iconSize: 14,
  },
  md: {
    container: {
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.base,
      borderRadius: radius.md,
    },
    text: { fontSize: typography.base },
    iconSize: 16,
  },
  lg: {
    container: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.lg,
    },
    text: { fontSize: typography.lg },
    iconSize: 18,
  },
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  size = 'md',
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading

  const handlePress = async () => {
    if (isDisabled) return
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
      // Haptics puede no estar disponible en todos los dispositivos
    }
    onPress()
  }

  const vs = variantStyles[variant]
  const ss = sizeStyles[size]
  const iconColor = variant === 'ghost' ? colors.primary : colors.text

  return (
    <TouchableOpacity
      style={[
        styles.base,
        ss.container,
        vs.container,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? colors.primary : colors.text}
        />
      ) : (
        <View style={styles.inner}>
          {icon && (
            <Ionicons
              name={icon}
              size={ss.iconSize}
              color={iconColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, ss.text, vs.text, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.5,
  },
})
