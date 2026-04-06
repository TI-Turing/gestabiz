import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius, shadows, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

export interface SelectOption<T = string> {
  label: string
  value: T
  description?: string
  disabled?: boolean
}

interface SelectProps<T = string> {
  value: T | null
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  style?: ViewStyle
}

export function Select<T = string>({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  label,
  error,
  disabled = false,
  style,
}: SelectProps<T>) {
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)

  const selectedLabel = options.find((o) => o.value === value)?.label

  const borderColor = error ? theme.error : open ? theme.primary : theme.inputBorder

  return (
    <View style={style}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.inputBg,
            borderColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selectedLabel ? theme.text : theme.textMuted },
          ]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.dropdown,
              { backgroundColor: theme.card, borderColor: theme.cardBorder, ...shadows.lg },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => {
                const isSelected = item.value === value
                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      isSelected && { backgroundColor: theme.primary + '18' },
                      item.disabled && { opacity: 0.4 },
                    ]}
                    onPress={() => {
                      if (!item.disabled) {
                        onValueChange(item.value)
                        setOpen(false)
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: isSelected ? theme.primary : theme.text },
                          isSelected && { fontWeight: '600' },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sm,
    fontWeight: '500',
    marginBottom: spacing[1] + 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    minHeight: 46,
  },
  triggerText: {
    flex: 1,
    fontSize: typography.base,
  },
  error: {
    fontSize: typography.xs,
    marginTop: spacing[1],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  dropdown: {
    borderRadius: radius.xl,
    borderWidth: 1,
    maxHeight: 320,
    overflow: 'hidden',
    ...Platform.select({ android: { elevation: 8 } }),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.base,
  },
  optionDesc: {
    fontSize: typography.xs,
    marginTop: 2,
  },
})
