import React, { useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import { Appointment, AppointmentStatus } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

interface Stats {
  today: number
  upcoming: number
  completed: number
  cancelled: number
  monthlyRevenue: number
}

interface AppointmentWithProfile extends Appointment {
  clientName: string
  serviceName: string
}

async function fetchAdminStats(businessId: string): Promise<Stats> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [todayRes, upcomingRes, completedRes, cancelledRes, revenueRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('start_time', todayStart)
      .lt('start_time', todayEnd),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('start_time', now.toISOString())
      .in('status', ['scheduled', 'confirmed']),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('start_time', monthStart),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'cancelled')
      .gte('start_time', monthStart),
    supabase
      .from('appointments')
      .select('price')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('start_time', monthStart),
  ])

  const revenue = (revenueRes.data ?? []).reduce((sum, a) => sum + (a.price ?? 0), 0)

  return {
    today: todayRes.count ?? 0,
    upcoming: upcomingRes.count ?? 0,
    completed: completedRes.count ?? 0,
    cancelled: cancelledRes.count ?? 0,
    monthlyRevenue: revenue,
  }
}

async function fetchUpcomingAppointments(businessId: string): Promise<AppointmentWithProfile[]> {
  const { data: apts } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .in('status', ['scheduled', 'confirmed'])
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(8)

  if (!apts || apts.length === 0) return []

  const clientIds = [...new Set(apts.map((a) => a.client_id))]
  const serviceIds = [...new Set(apts.map((a) => a.service_id))]

  const [profilesRes, servicesRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', clientIds),
    supabase.from('services').select('id, name').in('id', serviceIds),
  ])

  const profileMap: Record<string, string> = {}
  ;(profilesRes.data ?? []).forEach((p) => { profileMap[p.id] = p.full_name })

  const serviceMap: Record<string, string> = {}
  ;(servicesRes.data ?? []).forEach((s) => { serviceMap[s.id] = s.name })

  return apts.map((a) => ({
    ...a,
    status: a.status as AppointmentStatus,
    clientName: profileMap[a.client_id] ?? 'Cliente',
    serviceName: serviceMap[a.service_id] ?? 'Servicio',
  }))
}

interface StatCardProps {
  label: string
  value: string | number
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
}

function StatCard({ label, value, icon, iconColor }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function AdminDashboardScreen({ navigation }: { navigation: unknown }) {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)

  const statsQuery = useQuery({
    queryKey: [...QUERY_KEYS.APPOINTMENTS(activeBusiness ?? ''), 'stats'],
    queryFn: () => fetchAdminStats(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.FREQUENT,
  })

  const appointmentsQuery = useQuery({
    queryKey: [...QUERY_KEYS.APPOINTMENTS(activeBusiness ?? ''), 'upcoming'],
    queryFn: () => fetchUpcomingAppointments(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.FREQUENT,
  })

  const isRefreshing = statsQuery.isFetching || appointmentsQuery.isFetching

  const onRefresh = useCallback(() => {
    statsQuery.refetch()
    appointmentsQuery.refetch()
  }, [statsQuery, appointmentsQuery])

  const stats = statsQuery.data
  const appointments = appointmentsQuery.data ?? []

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (d.toDateString() === today.toDateString()) return 'Hoy'
    if (d.toDateString() === tomorrow.toDateString()) return 'Mañana'
    return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (statsQuery.isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de administración</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Hoy" value={stats?.today ?? 0} icon="today-outline" iconColor={colors.primary} />
        <StatCard label="Próximas" value={stats?.upcoming ?? 0} icon="time-outline" iconColor={colors.info} />
        <StatCard label="Completadas" value={stats?.completed ?? 0} icon="checkmark-circle-outline" iconColor={colors.success} />
        <StatCard label="Canceladas" value={stats?.cancelled ?? 0} icon="close-circle-outline" iconColor={colors.error} />
      </View>

      {/* Revenue */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueLeft}>
          <Text style={styles.revenueLabel}>Ingresos del mes</Text>
          <Text style={styles.revenueValue}>{formatCOP(stats?.monthlyRevenue ?? 0)}</Text>
        </View>
        <Ionicons name="trending-up" size={32} color={colors.success} />
      </View>

      {/* Acciones rápidas */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.quickActions}>
        {[
          { label: 'Citas', icon: 'calendar-outline' as const, screen: 'Citas' },
          { label: 'Clientes', icon: 'people-outline' as const, screen: 'Clientes' },
          { label: 'Servicios', icon: 'briefcase-outline' as const, screen: 'Servicios' },
          { label: 'Empleados', icon: 'person-add-outline' as const, screen: 'Empleados' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickAction}
            onPress={() => (navigation as { navigate: (s: string) => void }).navigate(item.screen)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Próximas citas */}
      <Text style={styles.sectionTitle}>Próximas citas</Text>
      {appointments.length === 0 ? (
        <View style={styles.emptyApts}>
          <Text style={styles.emptyText}>No hay citas programadas</Text>
        </View>
      ) : (
        appointments.map((apt) => (
          <View key={apt.id} style={styles.aptCard}>
            <View style={styles.aptTime}>
              <Text style={styles.aptDate}>{formatDate(apt.start_time)}</Text>
              <Text style={styles.aptHour}>{formatTime(apt.start_time)}</Text>
            </View>
            <View style={styles.aptInfo}>
              <Text style={styles.aptClient}>{apt.clientName}</Text>
              <Text style={styles.aptService}>{apt.serviceName}</Text>
            </View>
            <StatusBadge status={apt.status} />
          </View>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: typography.xl, fontWeight: '700', color: colors.text },
  date: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: typography['2xl'], fontWeight: '700', color: colors.text },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  revenueCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  revenueLeft: {},
  revenueLabel: { fontSize: typography.sm, color: colors.textSecondary },
  revenueValue: { fontSize: typography['2xl'], fontWeight: '700', color: colors.success, marginTop: 2 },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: { fontSize: typography.xs, color: colors.textSecondary },
  emptyApts: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: { color: colors.textSecondary, fontSize: typography.base },
  aptCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  aptTime: { marginRight: spacing.md, minWidth: 56, alignItems: 'center' },
  aptDate: { fontSize: typography.xs, color: colors.primary, fontWeight: '600' },
  aptHour: { fontSize: typography.lg, fontWeight: '700', color: colors.text },
  aptInfo: { flex: 1 },
  aptClient: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  aptService: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
})
