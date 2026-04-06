import React from 'react'
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Ancho del contenido: 'sm' (~320), 'md' (~400), 'lg' (~520), 'full' (100%) */
  size?: 'sm' | 'md' | 'lg' | 'full'
  /** Ocultar botón X de cierre */
  hideCloseButton?: boolean
  /** Impedir cierre al tocar el overlay */
  preventBackdropClose?: boolean
  contentStyle?: ViewStyle
}

const sizeMap = { sm: 320, md: 400, lg: 520, full: '100%' as const }

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hideCloseButton = false,
  preventBackdropClose = false,
  contentStyle,
}: ModalProps) {
  const { theme } = useTheme()
  const maxWidth = sizeMap[size]

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={preventBackdropClose ? undefined : onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.content,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  maxWidth,
                  ...shadows.lg,
                },
                contentStyle,
              ]}
            >
              {(title != null || !hideCloseButton) && (
                <View style={styles.header}>
                  {title != null && (
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                      {title}
                    </Text>
                  )}
                  {!hideCloseButton && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
                      <Ionicons name="close" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.body}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  content: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({ android: { elevation: 8 } }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.lg,
    fontWeight: '700',
    lineHeight: typography.lg * 1.3,
  },
  closeButton: {
    marginTop: 2,
  },
  body: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
})
