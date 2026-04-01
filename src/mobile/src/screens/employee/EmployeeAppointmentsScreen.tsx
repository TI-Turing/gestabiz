import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { Appointment, AppointmentStatus } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

type Filter = 'upcoming' | 'all' | 'completed'

interface AptRow extends Appointment {
  clientName: string
  serviceName: string
}

async function fetchMyAppointments(userId: string, filter: Filter): Promise<AptRow[]> {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('employee_id', userId)
    .order('start_time', { ascending: filter === 'upcoming' })
    .limit(50)

  if (filter === 'upcoming') {
    query = query.gte('start_time', new Date().toISOString()).in('status', ['scheduled', 'confirmed'])
  } else if (filter === 'completed') {
    query = query.eq('status', 'completed')
  }

  const { data: apts } = await query
  if (!apts || apts.length === 0) return []

  const clientIds = [...new Set(apts.map((a) => a.client_id))]
  const serviceIds = [...new Set(apts.map((a) => a.service_id))]

  const [pr, sr] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', clientIds),
    supabase.from('services').select('id, name').in('id', serviceIds),
  ])

  const pm: Record<string, string> = {}
  ;(pr.data ?? []).forEach((p) => { pm[p.id] = p.full_name })
  const sm: Record<string, string> = {}
  ;(sr.data ?? []).forEach((s) => { sm[s.id] = s.name })

  return apts.map((a) => ({ ...a, status: a.status as AppointmentStatus, clientName: pm[a.client_id] ?? 'Cliente', serviceName: sm[a.service_id] ?? 'Servicio' }))
}

const FILTERS = [
  { key: 'upcoming' as const, label: 'Próximas' },
  { key: 'all' as const, label: 'Todas' },
  { key: 'completed' as const, label: 'Completadas' },
]

export default function EmployeeAppointmentsScreen() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const { data: apts = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''), filter],
    queryFn: () => fetchMyAppointments(user!.id, filter),
    enabled: !!user,
    ...QUERY_CONFIG.FREQUENT,
  })

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} style={[styles.chip, filter === f.key && styles.chipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={apts}
        keyExtractor={(a) => a.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, apts.length === 0 && { flex: 1 }]}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="Sin citas" message="No hay citas con este filtro" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.client}>{item.clientName}</Text>
              <Text style={styles.service}>{item.serviceName}</Text>
              <Text style={styles.date}>{fmt(item.start_time)}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: spacing.xs, padding: spacing.base },
  chip: { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: typography.sm },
  chipTextActive: { color: colors.text },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.base, gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  info: { flex: 1 },
  client: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  service: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: typography.sm, color: colors.primary, marginTop: 4 },
})
