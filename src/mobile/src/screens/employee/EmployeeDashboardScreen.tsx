import React, { useCallback } from 'react'
import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { Appointment, AppointmentStatus } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

interface AptRow extends Appointment {
  clientName: string
  serviceName: string
}

async function fetchEmployeeToday(userId: string): Promise<AptRow[]> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: apts } = await supabase
    .from('appointments')
    .select('*')
    .eq('employee_id', userId)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .order('start_time', { ascending: true })

  if (!apts || apts.length === 0) return []

  const clientIds = [...new Set(apts.map((a) => a.client_id))]
  const serviceIds = [...new Set(apts.map((a) => a.service_id))]

  const [profilesRes, servicesRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', clientIds),
    supabase.from('services').select('id, name').in('id', serviceIds),
  ])

  const pm: Record<string, string> = {}
  ;(profilesRes.data ?? []).forEach((p) => { pm[p.id] = p.full_name })
  const sm: Record<string, string> = {}
  ;(servicesRes.data ?? []).forEach((s) => { sm[s.id] = s.name })

  return apts.map((a) => ({
    ...a,
    status: a.status as AppointmentStatus,
    clientName: pm[a.client_id] ?? 'Cliente',
    serviceName: sm[a.service_id] ?? 'Servicio',
  }))
}

async function fetchEmployeeStats(userId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [todayRes, upcomingRes, completedRes] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('employee_id', userId).gte('start_time', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()).lt('start_time', new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('employee_id', userId).gte('start_time', now.toISOString()).in('status', ['scheduled', 'confirmed']),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('employee_id', userId).eq('status', 'completed').gte('start_time', monthStart),
  ])

  return {
    today: todayRes.count ?? 0,
    upcoming: upcomingRes.count ?? 0,
    completed: completedRes.count ?? 0,
  }
}

export default function EmployeeDashboardScreen() {
  const { user } = useAuth()

  const todayQuery = useQuery({
    queryKey: [...QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''), 'today'],
    queryFn: () => fetchEmployeeToday(user!.id),
    enabled: !!user,
    ...QUERY_CONFIG.FREQUENT,
  })

  const statsQuery = useQuery({
    queryKey: [...QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''), 'stats'],
    queryFn: () => fetchEmployeeStats(user!.id),
    enabled: !!user,
    ...QUERY_CONFIG.FREQUENT,
  })

  const onRefresh = useCallback(() => {
    todayQuery.refetch()
    statsQuery.refetch()
  }, [todayQuery, statsQuery])

  const stats = statsQuery.data
  const apts = todayQuery.data ?? []

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  if (todayQuery.isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={todayQuery.isFetching} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.greeting}>Hola, {user?.user_metadata?.full_name?.split(' ')[0] ?? 'empleado'} 👋</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Hoy', value: stats?.today ?? 0, color: colors.primary },
          { label: 'Próximas', value: stats?.upcoming ?? 0, color: colors.info },
          { label: 'Este mes', value: stats?.completed ?? 0, color: colors.success },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Citas de hoy</Text>
      {apts.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Sin citas hoy" message="No tienes citas programadas para hoy" />
      ) : (
        apts.map((apt) => (
          <View key={apt.id} style={styles.aptCard}>
            <View style={styles.aptTimeCol}>
              <Text style={styles.aptTime}>{formatTime(apt.start_time)}</Text>
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
  greeting: { fontSize: typography['2xl'], fontWeight: '700', color: colors.text },
  date: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  statNum: { fontSize: typography['2xl'], fontWeight: '700' },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: typography.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  aptCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm },
  aptTimeCol: { width: 52, alignItems: 'center' },
  aptTime: { fontSize: typography.base, fontWeight: '700', color: colors.primary },
  aptInfo: { flex: 1 },
  aptClient: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  aptService: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
})
