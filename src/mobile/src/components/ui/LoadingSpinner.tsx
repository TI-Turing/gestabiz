import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  size = 'large',
  color,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { theme } = useTheme()
  const spinnerColor = color ?? theme.primary
  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
        <ActivityIndicator size={size} color={spinnerColor} />
      </View>
    )
  }

  return <ActivityIndicator size={size} color={spinnerColor} />
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
