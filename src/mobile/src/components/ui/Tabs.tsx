import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native'
import { radius, spacing, typography } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'

export interface TabItem {
  key: string
  label: string
  badge?: number
}

interface TabsProps {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
  /** Variante: 'line' = subrayado, 'pill' = fondo redondeado */
  variant?: 'line' | 'pill'
  /** Si las tabs se pueden desplazar horizontalmente */
  scrollable?: boolean
  style?: ViewStyle
}

export function Tabs({
  items,
  activeKey,
  onChange,
  variant = 'line',
  scrollable = false,
  style,
}: TabsProps) {
  const { theme } = useTheme()

  const renderTab = (item: TabItem) => {
    const isActive = item.key === activeKey

    if (variant === 'pill') {
      return (
        <TouchableOpacity
          key={item.key}
          onPress={() => onChange(item.key)}
          style={[
            styles.pillTab,
            isActive && { backgroundColor: theme.primary },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pillLabel,
              { color: isActive ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            {item.label}
          </Text>
          {item.badge != null && item.badge > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : theme.error },
              ]}
            >
              <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => onChange(item.key)}
        style={[
          styles.lineTab,
          isActive && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.lineLabel,
            { color: isActive ? theme.primary : theme.textSecondary },
            isActive && { fontWeight: '700' },
          ]}
        >
          {item.label}
        </Text>
        {item.badge != null && item.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.error }]}>
            <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const containerStyle =
    variant === 'line'
      ? [styles.lineContainer, { borderBottomColor: theme.border }]
      : [styles.pillContainer, { backgroundColor: theme.card }]

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[...containerStyle, style]}
      >
        {items.map(renderTab)}
      </ScrollView>
    )
  }

  return (
    <View style={[...containerStyle, style]}>
      {items.map(renderTab)}
    </View>
  )
}

const styles = StyleSheet.create({
  lineContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lineTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: spacing.xs,
  },
  lineLabel: {
    fontSize: typography.sm,
  },
  pillContainer: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  pillTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  pillLabel: {
    fontSize: typography.sm,
    fontWeight: '500',
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
})
