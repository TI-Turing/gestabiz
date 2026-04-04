import React from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { radius, shadows } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface FABProps {
  onPress: () => void
  icon?: keyof typeof Ionicons.glyphMap
  /** Color de fondo. Por defecto theme.primary */
  color?: string
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
}

const sizeMap = {
  sm: { container: 44, icon: 20 },
  md: { container: 56, icon: 26 },
  lg: { container: 68, icon: 30 },
}

export function FAB({ onPress, icon = 'add', color, size = 'md', style }: FABProps) {
  const { theme } = useTheme()
  const scale = React.useRef(new Animated.Value(1)).current
  const { container: containerSize, icon: iconSize } = sizeMap[size]
  const bgColor = color ?? theme.primary

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.button,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: bgColor,
            ...shadows.lg,
          },
        ]}
      >
        <Ionicons name={icon} size={iconSize} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ android: { elevation: 6 } }),
  },
})
