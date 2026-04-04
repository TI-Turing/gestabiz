import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

function SkeletonItem({ width = '100%', height = 16, borderRadius = radius.md, style }: SkeletonProps) {
  const { theme } = useTheme()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.border,
          opacity,
        },
        style,
      ]}
    />
  )
}

// ─── Preset Skeletons ─────────────────────────────────────────────────────────

function CardSkeleton() {
  const { theme } = useTheme()
  return (
    <View style={[presetStyles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={presetStyles.row}>
        <SkeletonItem width={48} height={48} borderRadius={radius.full} />
        <View style={presetStyles.colFlex}>
          <SkeletonItem height={14} width="60%" />
          <SkeletonItem height={12} width="80%" style={{ marginTop: spacing[2] }} />
        </View>
      </View>
      <SkeletonItem height={12} style={{ marginTop: spacing[3] }} />
      <SkeletonItem height={12} width="70%" style={{ marginTop: spacing[2] }} />
    </View>
  )
}

function ListItemSkeleton() {
  return (
    <View style={presetStyles.listItem}>
      <SkeletonItem width={40} height={40} borderRadius={radius.full} />
      <View style={presetStyles.colFlex}>
        <SkeletonItem height={14} width="50%" />
        <SkeletonItem height={11} width="75%" style={{ marginTop: spacing[1] }} />
      </View>
    </View>
  )
}

function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={{ gap: spacing[2] }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonItem key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  )
}

const presetStyles = StyleSheet.create({
  card: {
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  colFlex: {
    flex: 1,
    gap: spacing[2],
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
})

export const Skeleton = Object.assign(SkeletonItem, {
  Card: CardSkeleton,
  ListItem: ListItemSkeleton,
  Text: TextSkeleton,
})
