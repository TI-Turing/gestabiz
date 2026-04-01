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
import { colors } from '../../theme'

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
  const paddingStyle = noPadding ? undefined : styles.padding

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.safeArea, style]}>
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
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={[styles.flex, paddingStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  padding: {
    padding: 16,
  },
})
