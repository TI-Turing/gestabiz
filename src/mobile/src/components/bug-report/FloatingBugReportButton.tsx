import React, { useState } from 'react'
import { StyleSheet, View, TouchableOpacity, Animated, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../contexts/ThemeContext'
import { radius, shadows } from '../../theme'
import { BugReportModal } from './BugReportModal'

interface FloatingBugReportButtonProps {
  /** Pantalla actual (para incluir en el reporte). */
  affectedPage?: string
  /** Offset desde el borde inferior (sobre la tab bar). Default: 80. */
  bottomOffset?: number
}

/**
 * Botón flotante discreto para reportar bugs desde cualquier pantalla.
 * Se monta una sola vez en el árbol de la app cuando hay usuario logueado.
 */
export function FloatingBugReportButton({
  affectedPage,
  bottomOffset = 80,
}: FloatingBugReportButtonProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const scale = React.useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setOpen(true)
  }

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.wrapper, { bottom: bottomOffset + insets.bottom, right: 16 }]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            accessibilityLabel="Reportar un problema"
            style={[
              styles.button,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                ...shadows.md,
              },
            ]}
          >
            <Ionicons name="bug-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <BugReportModal isOpen={open} onClose={() => setOpen(false)} affectedPage={affectedPage} />
    </>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 999,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
