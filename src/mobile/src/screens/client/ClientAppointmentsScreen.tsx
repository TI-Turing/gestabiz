import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { Appointment, AppointmentStatus } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

type Filter = 'upcoming' | 'past' | 'cancelled'

interface AptRow extends Appointment {
  businessName: string
  serviceName: string
}

async function fetchClientApts(userId: string, filter: Filter): Promise<AptRow[]> {
  const now = new Date().toISOString()
  let query = supabase.from('appointments').select('*').eq('client_id', userId).limit(50)

  if (filter === 'upcoming') {
    query = query.gte('start_time', now).in('status', ['scheduled', 'confirmed']).order('start_time', { ascending: true })
  } else if (filter === 'past') {
    query = query.lt('start_time', now).eq('status', 'completed').order('start_time', { ascending: false })
  } else {
    query = query.eq('status', 'cancelled').order('start_time', { ascending: false })
  }

  const { data: apts } = await query
  if (!apts || apts.length === 0) return []

  const bIds = [...new Set(apts.map((a) => a.business_id))]
  const sIds = [...new Set(apts.map((a) => a.service_id))]

  const [br, sr] = await Promise.all([
    supabase.from('businesses').select('id, name').in('id', bIds),
    supabase.from('services').select('id, name').in('id', sIds),
  ])

  const bm: Record<string, string> = {}
  ;(br.data ?? []).forEach((b) => { bm[b.id] = b.name })
  const sm: Record<string, string> = {}
  ;(sr.data ?? []).forEach((s) => { sm[s.id] = s.name })

  return apts.map((a) => ({ ...a, status: a.status as AppointmentStatus, businessName: bm[a.business_id] ?? 'Negocio', serviceName: sm[a.service_id] ?? 'Servicio' }))
}

const FILTERS = [
  { key: 'upcoming' as const, label: 'Próximas' },
  { key: 'past' as const, label: 'Historial' },
  { key: 'cancelled' as const, label: 'Canceladas' },
]

export default function ClientAppointmentsScreen() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const { data: apts = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''), filter],
    queryFn: () => fetchClientApts(user!.id, filter),
    enabled: !!user,
    ...QUERY_CONFIG.FREQUENT,
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? '') }),
  })

  const confirmCancel = (apt: AptRow) => {
    Alert.alert('Cancelar cita', `¿Cancelar tu cita de ${apt.serviceName} en ${apt.businessName}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate(apt.id) },
    ])
  }

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long' }) + ' · ' + new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

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
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="Sin citas" message="No hay citas en esta categoría" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.biz}>{item.businessName}</Text>
              <Text style={styles.svc}>{item.serviceName}</Text>
              <Text style={styles.date}>{fmt(item.start_time)}</Text>
            </View>
            <View style={styles.cardRight}>
              <StatusBadge status={item.status} />
              {item.status === 'scheduled' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
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
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: colors.cardBorder },
  info: { flex: 1 },
  biz: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  svc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: typography.sm, color: colors.primary, marginTop: 4 },
  cardRight: { alignItems: 'flex-end', gap: spacing.xs },
  cancelBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: '#450a0a' },
  cancelText: { color: '#f87171', fontSize: typography.xs, fontWeight: '600' },
})
