import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  /** Solo lectura (display) */
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar número junto a estrellas */
  showNumber?: boolean
  style?: ViewStyle
}

const sizeMap = { sm: 14, md: 20, lg: 28 }

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showNumber = false,
  style,
}: StarRatingProps) {
  const { theme } = useTheme()
  const iconSize = sizeMap[size]

  return (
    <View style={[styles.container, style]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readOnly && onChange?.(star)}
          disabled={readOnly}
          hitSlop={4}
          activeOpacity={readOnly ? 1 : 0.7}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={iconSize}
            color={star <= value ? '#F59E0B' : theme.border}
          />
        </TouchableOpacity>
      ))}
      {showNumber && (
        <Text style={[styles.number, { color: theme.textSecondary, fontSize: iconSize * 0.7 }]}>
          {value.toFixed(1)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  number: {
    marginLeft: spacing[1],
    fontWeight: '600',
  },
})
