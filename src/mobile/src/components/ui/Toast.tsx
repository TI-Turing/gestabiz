/**
 * Toast — Sistema de notificaciones efímeras tipo snackbar.
 *
 * Uso:
 *   import { toast } from '@/components/ui/Toast'
 *   toast.success('¡Guardado!')
 *   toast.error('Error al guardar')
 *   toast.info('Sincronizando...')
 *   toast.warning('Sin conexión')
 *
 * Agregar <ToastContainer /> UNA VEZ en App.tsx (dentro del ThemeProvider).
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

// ─── Singleton store ──────────────────────────────────────────────────────────

type Listener = (items: ToastItem[]) => void
let items: ToastItem[] = []
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => l([...items]))
}

function addToast(type: ToastType, message: string, duration = 3000) {
  const id = Math.random().toString(36).slice(2)
  items = [...items, { id, type, message, duration }]
  notify()
}

function removeToast(id: string) {
  items = items.filter((t) => t.id !== id)
  notify()
}

export const toast = {
  success: (message: string, duration?: number) => addToast('success', message, duration),
  error: (message: string, duration?: number) => addToast('error', message, duration),
  info: (message: string, duration?: number) => addToast('info', message, duration),
  warning: (message: string, duration?: number) => addToast('warning', message, duration),
}

// ─── Single Toast Item ─────────────────────────────────────────────────────────

const iconMap: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
  warning: 'warning',
}

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { theme } = useTheme()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-16)).current

  const colorMap: Record<ToastType, string> = {
    success: theme.success,
    error: theme.error,
    info: theme.info,
    warning: theme.warning,
  }

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(onDismiss)
    }, item.duration)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        onPress={onDismiss}
        activeOpacity={0.9}
        style={[
          styles.item,
          {
            backgroundColor: theme.card,
            borderColor: colorMap[item.type] + '40',
            borderLeftColor: colorMap[item.type],
          },
        ]}
      >
        <Ionicons name={iconMap[item.type]} size={20} color={colorMap[item.type]} />
        <Text style={[styles.message, { color: theme.text }]} numberOfLines={3}>
          {item.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Container (mount once in App.tsx) ───────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const insets = useSafeAreaInsets()

  useEffect(() => {
    listeners.add(setToasts)
    return () => { listeners.delete(setToasts) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <View
      style={[
        styles.container,
        { top: insets.top + spacing.sm },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <ToastItemView key={t.id} item={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 9999,
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    ...Platform.select({ android: { elevation: 8 } }),
  },
  message: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: '500',
    lineHeight: typography.sm * 1.45,
  },
})
