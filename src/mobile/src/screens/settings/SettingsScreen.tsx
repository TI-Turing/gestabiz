import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'

type Tab = 'profile' | 'notifications' | 'preferences'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { activeRole, activeBusiness } = useUserRoles(user)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const qc = useQueryClient()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('id', user!.id)
        .single()
      return data
    },
    enabled: !!user?.id,
    ...QUERY_CONFIG.STABLE,
  })

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut() },
    ])
  }

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'profile', label: 'Perfil', icon: 'person-outline' },
    { id: 'notifications', label: 'Notificaciones', icon: 'notifications-outline' },
    { id: 'preferences', label: 'Preferencias', icon: 'settings-outline' },
  ]

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      {/* Role badge */}
      <View style={styles.roleRow}>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-outline" size={12} color={colors.primary} />
          <Text style={styles.roleText}>{activeRole ?? 'client'}</Text>
        </View>

      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'profile' && <ProfileTab profile={profile} userId={user?.id} />}
        {activeTab === 'notifications' && <NotificationsTab userId={user?.id} />}
        {activeTab === 'preferences' && <PreferencesTab />}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error ?? '#ef4444'} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  )
}

function ProfileTab({ profile, userId }: { profile: any; userId?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Información personal</Text>
      <InfoRow icon="person-outline" label="Nombre" value={profile?.full_name ?? '—'} />
      <InfoRow icon="mail-outline" label="Email" value={profile?.email ?? '—'} />
      <InfoRow icon="call-outline" label="Teléfono" value={profile?.phone ?? 'No configurado'} />
    </View>
  )
}

function NotificationsTab({ userId }: { userId?: string }) {
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(true)
  const [reminders, setReminders] = useState(true)

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Canales de notificación</Text>
      <ToggleRow label="Notificaciones push" value={push} onChange={setPush} />
      <ToggleRow label="Notificaciones por email" value={email} onChange={setEmail} />
      <ToggleRow label="Recordatorios de citas" value={reminders} onChange={setReminders} />
    </View>
  )
}

function PreferencesTab() {
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('es')

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <ToggleRow label="Modo oscuro" value={darkMode} onChange={setDarkMode} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Idioma</Text>
        <InfoRow icon="language-outline" label="Idioma actual" value="Español" />
      </View>
    </View>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#fff"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roleText: { ...typography.caption, color: colors.primary, textTransform: 'capitalize' },
  businessName: { ...typography.caption, color: colors.textMuted },
  tabs: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabLabel: { ...typography.caption, color: colors.textMuted },
  tabLabelActive: { color: colors.primary, fontWeight: '600' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  infoLabel: { ...typography.body, color: colors.textMuted, width: 80 },
  infoValue: { ...typography.body, color: colors.text, flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleLabel: { ...typography.body, color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: (colors.error ?? '#ef4444') + '15',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  logoutText: { ...typography.bodyBold, color: colors.error ?? '#ef4444' },
})
