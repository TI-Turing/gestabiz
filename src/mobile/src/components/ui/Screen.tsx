import React, { ReactNode } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../contexts/ThemeContext'

interface ScreenProps {
  children: ReactNode
  scrollable?: boolean
  style?: ViewStyle
  contentStyle?: ViewStyle
  /** Deshabilita el padding horizontal automático */
  noPadding?: boolean
  /** RefreshControl para pull-to-refresh */
  refreshControl?: React.ReactElement<RefreshControlProps>
}

export default function Screen({
  children,
  scrollable = false,
  style,
  contentStyle,
  noPadding = false,
  refreshControl,
}: ScreenProps) {
  const { theme } = useTheme()
  const paddingStyle = noPadding ? undefined : styles.padding
  const safeAreaStyle = [{ flex: 1, backgroundColor: theme.background }, style]

  if (scrollable) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[paddingStyle, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={safeAreaStyle}>
      <View style={[styles.flex, paddingStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  padding: {
    padding: 16,
  },
})
