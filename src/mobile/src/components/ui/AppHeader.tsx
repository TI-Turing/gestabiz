import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/ThemeContext'
import { typography, spacing, fonts } from '../../theme'

interface AppHeaderProps {
  onSearch?: () => void
  onNotifications?: () => void
  onMenu?: () => void
}

export default function AppHeader({ onSearch, onNotifications, onMenu }: AppHeaderProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, borderBottomColor: theme.border },
      ]}
    >
      {/* Izquierda: logo app + nombre de marca */}
      <View style={styles.left}>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <Text style={styles.logoLetter}>G</Text>
        </View>
        <Text style={[styles.brandName, { color: theme.text }]}>Gestabiz</Text>
      </View>

      {/* Derecha: íconos de acción */}
      <View style={styles.right}>
        <TouchableOpacity
          onPress={onSearch}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={22} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNotifications}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMenu}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
  },
  brandName: {
    fontSize: typography.lg,
    fontWeight: '700',
    fontFamily: fonts.bold,
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.xs,
  },
})
