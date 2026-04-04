import React from 'react'
import {
  Switch as RNSwitch,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import { spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface SwitchProps {
  value: boolean
  onValueChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  style?: ViewStyle
}

export function Switch({ value, onValueChange, label, description, disabled = false, style }: SwitchProps) {
  const { theme } = useTheme()

  const handlePress = () => {
    if (!disabled) onValueChange(!value)
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      {(label || description) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          )}
          {description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      )}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary + '80' }}
        thumbColor={value ? theme.primary : theme.textMuted}
        ios_backgroundColor={theme.border}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.base,
    fontWeight: '500',
  },
  description: {
    fontSize: typography.sm,
    marginTop: 2,
    lineHeight: typography.sm * 1.4,
  },
})
