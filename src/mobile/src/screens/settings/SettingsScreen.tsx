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
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'
import { BugReportModal } from '../../components/bug-report/BugReportModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifPrefs {
  email_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  do_not_disturb_enabled: boolean
  daily_digest_enabled: boolean
  weekly_summary_enabled: boolean
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()
  const qc = useQueryClient()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const [bugModalOpen, setBugModalOpen] = useState(false)

  // ── Profile ──────────────────────────────────────────────────────────────
  const { data: profile, isLoading: loadingProfile } = useQuery({
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

  // ── Notification prefs ───────────────────────────────────────────────────
  const { data: notifPrefs, isLoading: loadingNotifs } = useQuery<NotifPrefs>({
    queryKey: ['notif-prefs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('email_enabled, sms_enabled, whatsapp_enabled, do_not_disturb_enabled, daily_digest_enabled, weekly_summary_enabled')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return (data as NotifPrefs | null) ?? {
        email_enabled: true,
        sms_enabled: false,
        whatsapp_enabled: false,
        do_not_disturb_enabled: false,
        daily_digest_enabled: false,
        weekly_summary_enabled: false,
      }
    },
    enabled: !!user?.id,
    ...QUERY_CONFIG.STABLE,
  })

  const notifMutation = useMutation({
    mutationFn: async (patch: Partial<NotifPrefs>) => {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert(
          { user_id: user!.id, ...(notifPrefs ?? {}), ...patch },
          { onConflict: 'user_id' }
        )
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-prefs', user?.id] })
    },
  })

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut() },
    ])
  }

  if (loadingProfile) {
    return (
      <Screen>
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </Screen>
    )
  }

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scroll, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cuenta ────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>CUENTA</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.accountRow}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.avatarInitials, { color: theme.primary }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>
                {profile?.full_name ?? '—'}
              </Text>
              <Text style={[styles.accountEmail, { color: theme.mutedForeground }]} numberOfLines={1}>
                {profile?.email ?? '—'}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('ClientProfile')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={theme.primary} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Editar perfil</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── Notificaciones — Canales ──────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>NOTIFICACIONES</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ToggleRow
            icon="mail-outline"
            label="Email"
            description="Confirmaciones y recordatorios por correo"
            value={notifPrefs?.email_enabled ?? true}
            loading={loadingNotifs}
            onChange={v => notifMutation.mutate({ email_enabled: v })}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ToggleRow
            icon="logo-whatsapp"
            label="WhatsApp"
            description="Recordatorios via WhatsApp"
            value={notifPrefs?.whatsapp_enabled ?? false}
            loading={loadingNotifs}
            onChange={v => notifMutation.mutate({ whatsapp_enabled: v })}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ToggleRow
            icon="chatbubble-outline"
            label="SMS"
            description="Mensajes de texto"
            value={notifPrefs?.sms_enabled ?? false}
            loading={loadingNotifs}
            onChange={v => notifMutation.mutate({ sms_enabled: v })}
            theme={theme}
          />
        </View>

        {/* ── Notificaciones — Resúmenes ────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>RESÚMENES</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ToggleRow
            icon="today-outline"
            label="Resumen diario"
            description="Un resumen de tus citas cada mañana"
            value={notifPrefs?.daily_digest_enabled ?? false}
            loading={loadingNotifs}
            onChange={v => notifMutation.mutate({ daily_digest_enabled: v })}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ToggleRow
            icon="calendar-outline"
            label="Resumen semanal"
            description="Actividad de la semana cada lunes"
            value={notifPrefs?.weekly_summary_enabled ?? false}
            loading={loadingNotifs}
            onChange={v => notifMutation.mutate({ weekly_summary_enabled: v })}
            theme={theme}
          />
        </View>

        {/* ── Notificaciones — Privacidad ───────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>PRIVACIDAD</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ToggleRow
            icon="moon-outline"
            label="No molestar"
            description="Silenciar notificaciones entre 10pm y 8am"
            value={notifPrefs?.do_not_disturb_enabled ?? false}
            loading={loadingNotifs}
            onChange={v => notifMutation.mutate({ do_not_disturb_enabled: v })}
            theme={theme}
          />
        </View>

        {/* ── Apariencia ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>APARIENCIA</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ToggleRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            label="Modo oscuro"
            value={isDark}
            onChange={toggleTheme}
            theme={theme}
          />
        </View>

        {/* ── Aplicación ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>APLICACIÓN</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setBugModalOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="bug-outline" size={20} color={theme.warning} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Reportar un problema</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.menuRow}>
            <Ionicons name="information-circle-outline" size={20} color={theme.mutedForeground} />
            <Text style={[styles.menuLabel, { color: theme.mutedForeground }]}>Versión 1.0.3</Text>
          </View>
        </View>

        {/* ── Cerrar sesión ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: theme.destructive + '18',
              borderColor: theme.destructive + '35',
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.destructive} />
          <Text style={[styles.logoutText, { color: theme.destructive }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <BugReportModal
        isOpen={bugModalOpen}
        onClose={() => setBugModalOpen(false)}
        affectedPage="Ajustes"
      />
    </Screen>
  )
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: string
  label: string
  description?: string
  value: boolean
  loading?: boolean
  onChange: (v: boolean) => void
  theme: ReturnType<typeof useTheme>['theme']
}

function ToggleRow({ icon, label, description, value, loading, onChange, theme }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <Ionicons name={icon as any} size={20} color={theme.mutedForeground} />
      <View style={styles.toggleContent}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.toggleDesc, { color: theme.mutedForeground }]}>{description}</Text>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: theme.primary, false: theme.border }}
          thumbColor="#fff"
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.md, paddingBottom: 48 },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  divider: { height: 1, marginHorizontal: spacing.md },
  // Account
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...typography.bodyBold, fontSize: 18 },
  accountInfo: { flex: 1 },
  accountName: { ...typography.bodyBold },
  accountEmail: { ...typography.caption, marginTop: 2 },
  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  menuLabel: { ...typography.body, flex: 1 },
  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  toggleContent: { flex: 1 },
  toggleLabel: { ...typography.body },
  toggleDesc: { ...typography.caption, marginTop: 2 },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoutText: { ...typography.bodyBold },
})
