import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'
import { Modal } from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const { theme } = useTheme()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <View style={styles.iconRow}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: variant === 'danger' ? theme.error + '20' : theme.primary + '20' },
          ]}
        >
          <Ionicons
            name={variant === 'danger' ? 'warning' : 'information-circle'}
            size={28}
            color={variant === 'danger' ? theme.error : theme.primary}
          />
        </View>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      )}

      <View style={styles.actions}>
        <Button
          title={cancelLabel}
          onPress={onClose}
          variant="secondary"
          size="md"
          style={styles.btn}
          disabled={loading}
        />
        <Button
          title={confirmLabel}
          onPress={onConfirm}
          variant={variant}
          size="md"
          style={styles.btn}
          loading={loading}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  iconRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.base,
    textAlign: 'center',
    lineHeight: typography.base * 1.5,
    marginBottom: spacing.base,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
  },
})
