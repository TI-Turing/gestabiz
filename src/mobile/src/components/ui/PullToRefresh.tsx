import React from 'react'
import {
  View,
  ScrollView,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'

// ─── PullToRefresh ────────────────────────────────────────────────────────────
// Thin wrapper around ScrollView + RefreshControl that applies theme colors.
// Usage:
//   <PullToRefresh refreshing={loading} onRefresh={refetch}>
//     <View>{...content}</View>
//   </PullToRefresh>

interface PullToRefreshProps {
  refreshing: boolean
  onRefresh: () => void
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function PullToRefresh({
  refreshing,
  onRefresh,
  children,
  style,
  contentContainerStyle,
}: PullToRefreshProps) {
  const { theme } = useTheme()

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
          progressBackgroundColor={theme.card}
        />
      }
    >
      {children}
    </ScrollView>
  )
}

// ─── usePullToRefresh ─────────────────────────────────────────────────────────
// Convenience hook when you want to drive PullToRefresh from an async fetch.
// Usage:
//   const { refreshing, onRefresh } = usePullToRefresh(fetchData)
//   <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>...</PullToRefresh>

export function usePullToRefresh(refetchFn: () => Promise<unknown> | void) {
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchFn()
    } finally {
      setRefreshing(false)
    }
  }, [refetchFn])

  return { refreshing, onRefresh }
}

// ─── RefreshControlProps helper ───────────────────────────────────────────────
// Use this when the parent already provides a ScrollView / FlatList.
// Returns a ready-to-go <RefreshControl> element.

export function useThemedRefreshControl(refreshing: boolean, onRefresh: () => void) {
  const { theme } = useTheme()
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
      progressBackgroundColor={theme.card}
    />
  )
}
