import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface CheckboxProps {
  checked: boolean
  onPress: () => void
  label?: string
  description?: string
  disabled?: boolean
  style?: ViewStyle
}

export function Checkbox({ checked, onPress, label, description, disabled = false, style }: CheckboxProps) {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.primary : theme.border,
            backgroundColor: checked ? theme.primary : 'transparent',
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      {(label || description) && (
        <View style={styles.labelGroup}>
          {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
          {description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

// ─── RadioGroup ────────────────────────────────────────────────────────────────

export interface RadioOption<T = string> {
  value: T
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupProps<T = string> {
  value: T | null
  onChange: (value: T) => void
  options: RadioOption<T>[]
  style?: ViewStyle
}

export function RadioGroup<T = string>({ value, onChange, options, style }: RadioGroupProps<T>) {
  const { theme } = useTheme()

  return (
    <View style={[styles.radioGroup, style]}>
      {options.map((opt, i) => {
        const isSelected = opt.value === value
        return (
          <TouchableOpacity
            key={i}
            onPress={() => !opt.disabled && onChange(opt.value)}
            disabled={opt.disabled}
            activeOpacity={0.7}
            style={[styles.radioRow, { opacity: opt.disabled ? 0.5 : 1 }]}
          >
            <View
              style={[
                styles.radio,
                { borderColor: isSelected ? theme.primary : theme.border },
              ]}
            >
              {isSelected && (
                <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
              )}
            </View>
            <View style={styles.labelGroup}>
              <Text style={[styles.label, { color: theme.text }]}>{opt.label}</Text>
              {opt.description && (
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                  {opt.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioGroup: {
    gap: spacing.sm,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  labelGroup: {
    flex: 1,
  },
  label: {
    fontSize: typography.base,
    fontWeight: '500',
    lineHeight: typography.base * 1.3,
  },
  description: {
    fontSize: typography.sm,
    marginTop: 2,
    lineHeight: typography.sm * 1.4,
  },
})
