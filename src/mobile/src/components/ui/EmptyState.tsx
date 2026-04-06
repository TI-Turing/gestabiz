import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { spacing, typography, radius } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'
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
  const { theme } = useTheme()
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: theme.card }]}>
        <Ionicons name={icon} size={40} color={theme.textMuted} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
})
