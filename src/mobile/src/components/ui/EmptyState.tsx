import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, radius } from '../../theme'
import Button from './Button'

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  message?: string
  action?: {
    label: string
    onPress: () => void
  }
}

export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={40} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
})
