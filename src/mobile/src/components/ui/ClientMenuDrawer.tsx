import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { spacing, typography, radius, fonts } from '../../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82

interface ClientMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  onReportBug: () => void
}

export function ClientMenuDrawer({ isOpen, onClose, onReportBug }: ClientMenuDrawerProps) {
  const { theme } = useTheme()
  const { user, signOut } = useAuth()
  const insets = useSafeAreaInsets()

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current
  const overlayAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isOpen, slideAnim, overlayAnim])

  // Build user avatar initials
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const userEmail = user?.email || ''
  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            { opacity: overlayAnim },
          ]}
        />
      </Pressable>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.card,
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.base,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.drawerTitle, { color: theme.text }]}>Menú</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* PERFIL section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PERFIL</Text>
          <View style={[styles.profileCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            {/* Avatar con iniciales */}
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>{initials || 'U'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                {userEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.border }]}
            onPress={() => {
              onClose()
              onReportBug()
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="bug-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.text }]}>Reportar problema</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={async () => {
              onClose()
              await signOut()
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.destructive + '18' }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.destructive} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.destructive }]}>Cerrar Sesión</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Version footer */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>
            Gestabiz v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  drawerTitle: {
    fontSize: typography.xl,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  section: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: '700',
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: typography.base,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  profileEmail: {
    fontSize: typography.sm,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.base,
    marginVertical: spacing.lg,
  },
  actions: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: '500',
    fontFamily: fonts.medium,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    fontSize: typography.xs,
    fontFamily: fonts.regular,
  },
})
