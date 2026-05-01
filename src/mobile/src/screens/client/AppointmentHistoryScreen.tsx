import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius, shadows } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { AppointmentCard, AppointmentCardData, AppointmentStatus } from '../../components/cards/AppointmentCard'
import { QUERY_CONFIG } from '../../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryRow {
  id: string
  start_time: string
  end_time?: string
  status: AppointmentStatus
  price?: number
  serviceName: string
  serviceImageUrl?: string
  businessName: string
  employeeName?: string
  employeeAvatarUrl?: string
  locationName?: string
}

type Range = '7' | '30' | '90' | 'all'
type StatusFilter = 'all' | 'completed' | 'cancelled' | 'no_show'

const RANGES: { key: Range; label: string }[] = [
  { key: '7', label: '7 días' },
  { key: '30', label: '30 días' },
  { key: '90', label: '90 días' },
  { key: 'all', label: 'Todo' },
]

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
  { key: 'no_show', label: 'No asistí' },
]

// ─── Data ─────────────────────────────────────────────────────────────────────

async function fetchHistory(userId: string, range: Range): Promise<HistoryRow[]> {
  const since = (() => {
    if (range === 'all') return null
    const d = new Date()
    d.setDate(d.getDate() - parseInt(range))
    return d.toISOString()
  })()

  let q = supabase
    .from('appointments')
    .select('id, start_time, end_time, status, price, service_id, business_id, employee_id, location_id')
    .eq('client_id', userId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .order('start_time', { ascending: false })
    .limit(100)

  if (since) q = q.gte('start_time', since)

  const { data: apts } = await q
  if (!apts?.length) return []

  const serviceIds = [...new Set(apts.map((a: any) => a.service_id).filter(Boolean))]
  const businessIds = [...new Set(apts.map((a: any) => a.business_id).filter(Boolean))]
  const employeeIds = [...new Set(apts.map((a: any) => a.employee_id).filter(Boolean))]
  const locationIds = [...new Set(apts.map((a: any) => a.location_id).filter(Boolean))]

  const [svc, biz, emp, loc] = await Promise.all([
    serviceIds.length ? supabase.from('services').select('id, name, image_url').in('id', serviceIds) : { data: [] },
    businessIds.length ? supabase.from('businesses').select('id, name').in('id', businessIds) : { data: [] },
    employeeIds.length ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', employeeIds) : { data: [] },
    locationIds.length ? supabase.from('locations').select('id, name').in('id', locationIds) : { data: [] },
  ])

  const sm: Record<string, { name: string; image?: string }> = {}
  ;(svc.data ?? []).forEach((s: any) => { sm[s.id] = { name: s.name, image: s.image_url ?? undefined } })
  const bm: Record<string, string> = {}
  ;(biz.data ?? []).forEach((b: any) => { bm[b.id] = b.name })
  const em: Record<string, { name: string; avatar?: string }> = {}
  ;(emp.data ?? []).forEach((e: any) => { em[e.id] = { name: e.full_name, avatar: e.avatar_url ?? undefined } })
  const lm: Record<string, string> = {}
  ;(loc.data ?? []).forEach((l: any) => { lm[l.id] = l.name })

  return apts.map((a: any) => ({
    id: a.id,
    start_time: a.start_time,
    end_time: a.end_time ?? undefined,
    status: a.status,
    price: a.price ?? undefined,
    serviceName: sm[a.service_id]?.name ?? 'Servicio',
    serviceImageUrl: sm[a.service_id]?.image,
    businessName: bm[a.business_id] ?? 'Negocio',
    employeeName: a.employee_id ? em[a.employee_id]?.name : undefined,
    employeeAvatarUrl: a.employee_id ? em[a.employee_id]?.avatar : undefined,
    locationName: a.location_id ? lm[a.location_id] : undefined,
  }))
}

function toCardData(r: HistoryRow): AppointmentCardData {
  return {
    id: r.id,
    startTime: r.start_time,
    endTime: r.end_time,
    status: r.status,
    serviceName: r.serviceName,
    serviceImageUrl: r.serviceImageUrl,
    servicePrice: r.price,
    businessName: r.businessName,
    employeeName: r.employeeName,
    employeeAvatarUrl: r.employeeAvatarUrl,
    locationName: r.locationName,
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AppointmentHistoryScreen() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [range, setRange] = useState<Range>('30')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['appointment-history', user?.id, range],
    queryFn: () => fetchHistory(user!.id, range),
    enabled: !!user?.id,
    ...QUERY_CONFIG.FREQUENT,
  })

  const filtered = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  )

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.status === 'completed')
    const totalSpent = completed.reduce((s, r) => s + (r.price ?? 0), 0)
    return { totalCompleted: completed.length, totalSpent, totalAll: rows.length }
  }, [rows])

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Historial</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Tus citas pasadas en los últimos {range === 'all' ? 'meses' : `${range} días`}
        </Text>
      </View>

      {/* Stats card */}
      <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }, shadows.sm]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalCompleted}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Completadas</Text>
        </View>
        <View style={[styles.statSep, { backgroundColor: theme.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>
            ${stats.totalSpent.toLocaleString('es-CO')}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total gastado</Text>
        </View>
        <View style={[styles.statSep, { backgroundColor: theme.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalAll}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total</Text>
        </View>
      </View>

      {/* Range filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {RANGES.map((r) => {
          const active = range === r.key
          return (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.card,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setRange(r.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: active ? '#fff' : theme.textSecondary }]}>{r.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {STATUS_FILTERS.map((s) => {
          const active = statusFilter === s.key
          return (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.card,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setStatusFilter(s.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: active ? '#fff' : theme.textSecondary }]}>{s.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <EmptyState
              icon="time-outline"
              title="Sin historial"
              message={
                statusFilter === 'all'
                  ? 'Aún no tienes citas pasadas en este período'
                  : 'No hay citas con este filtro'
              }
            />
          </View>
        }
        renderItem={({ item }) => (
          <AppointmentCard appointment={toCardData(item)} variant="compact" onPress={() => {}} />
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: typography['2xl'], fontWeight: '700' },
  subtitle: { fontSize: typography.sm, marginTop: 3 },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.lg, fontWeight: '700' },
  statLabel: { fontSize: typography.xs, marginTop: 2 },
  statSep: { width: 1, marginHorizontal: spacing.xs },
  chipRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: typography.xs, fontWeight: '600' },
  list: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
