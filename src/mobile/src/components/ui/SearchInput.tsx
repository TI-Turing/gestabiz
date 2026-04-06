import React, { useCallback, useRef } from 'react'
import {
  TextInput,
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  /** Debounce en ms. 0 = sin debounce */
  debounce?: number
  onClear?: () => void
  autoFocus?: boolean
  style?: ViewStyle
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  debounce = 300,
  onClear,
  autoFocus = false,
  style,
}: SearchInputProps) {
  const { theme } = useTheme()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (text: string) => {
      if (debounce === 0) {
        onChangeText(text)
        return
      }
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onChangeText(text), debounce)
    },
    [onChangeText, debounce]
  )

  const handleClear = () => {
    onChangeText('')
    onClear?.()
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
        style,
      ]}
    >
      <Ionicons name="search" size={18} color={theme.textMuted} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={(t) => { handleChange(t) }}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { color: theme.text }]}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    height: 44,
    gap: spacing.xs,
  },
  icon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    paddingVertical: 0,
  },
})
