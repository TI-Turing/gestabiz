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
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

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

// Paridad con web buttonVariants:
//   - default (md): h-9 (36px) px-4, text-sm font-medium, rounded-md (4px)
//   - sm:           h-8 (32px) px-3, text-sm font-medium, rounded-md
//   - lg:           h-10 (40px) px-6, text-sm font-medium, rounded-md
const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
  sm: {
    container: {
      paddingVertical: 6,        // ≈ h-8 (32px) total con texto
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
    },
    text: { fontSize: typography.sm },
    iconSize: 14,
  },
  md: {
    container: {
      paddingVertical: 8,        // ≈ h-9 (36px) total
      paddingHorizontal: spacing.base,
      borderRadius: radius.md,
    },
    text: { fontSize: typography.sm },  // web: text-sm
    iconSize: 16,
  },
  lg: {
    container: {
      paddingVertical: 10,       // ≈ h-10 (40px) total
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
    },
    text: { fontSize: typography.base },
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
  const { theme } = useTheme()
  const variantStyles = React.useMemo<Record<Variant, { container: ViewStyle; text: TextStyle }>>(
    () => ({
      primary: {
        container: { backgroundColor: theme.primary },
        text: { color: theme.primaryForeground },
      },
      secondary: {
        container: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
        text: { color: theme.text },
      },
      ghost: {
        container: { backgroundColor: 'transparent' },
        text: { color: theme.primary },
      },
      danger: {
        container: { backgroundColor: theme.error },
        text: { color: '#FFFFFF' },
      },
    }),
    [theme]
  )
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
  const iconColor =
    variant === 'ghost' ? theme.primary
    : variant === 'secondary' ? theme.text
    : theme.primaryForeground

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
          color={iconColor}
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
    // Web usa font-medium (500) en buttons.
    fontWeight: '500',
    textAlign: 'center',
  },
  icon: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.5,
  },
})
