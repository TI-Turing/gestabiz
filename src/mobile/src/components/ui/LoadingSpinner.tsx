import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '../../theme'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  size = 'large',
  color = colors.primary,
  fullScreen = false,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    )
  }

  return <ActivityIndicator size={size} color={color} />
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
