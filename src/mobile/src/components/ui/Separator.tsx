import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  style?: ViewStyle
}

export function Separator({ orientation = 'horizontal', style }: SeparatorProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        { backgroundColor: theme.border },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
  vertical: {
    height: '100%',
    width: StyleSheet.hairlineWidth,
  },
})
