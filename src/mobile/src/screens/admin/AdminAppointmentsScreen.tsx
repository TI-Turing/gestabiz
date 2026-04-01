import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { Appointment, AppointmentStatus } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

type Filter = 'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'

interface AppointmentRow extends Appointment {
  clientName: string
  serviceName: string
}

async function fetchAppointments(businessId: string, filter: Filter): Promise<AppointmentRow[]> {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .order('start_time', { ascending: false })
    .limit(50)

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data: apts, error } = await query
  if (error || !apts || apts.length === 0) return []

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

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'scheduled', label: 'Programadas' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
]

export default function AdminAppointmentsScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: appointments = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.APPOINTMENTS(activeBusiness ?? ''), filter],
    queryFn: () => fetchAppointments(activeBusiness!, filter),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.FREQUENT,
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS(activeBusiness ?? '') })
    },
  })

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS(activeBusiness ?? '') })
    },
  })

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) +
      ' · ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  const formatPrice = (price?: number) =>
    price != null
      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price)
      : ''

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      {/* Filtros */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingVertical: spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Lista */}
      <FlatList
        data={appointments}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={[
          styles.list,
          appointments.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Sin citas" message="No hay citas con este filtro" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.clientName}>{item.clientName}</Text>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text style={styles.dateText}>{formatDateTime(item.start_time)}</Text>
              </View>
              <View style={styles.cardRight}>
                <StatusBadge status={item.status} />
                {item.price != null && (
                  <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
                )}
              </View>
            </View>
            {(item.status === 'scheduled') && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.confirmBtn]}
                  onPress={() => confirmMutation.mutate(item.id)}
                >
                  <Ionicons name="checkmark" size={14} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => cancelMutation.mutate(item.id)}
                >
                  <Ionicons name="close" size={14} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  filterList: { flexGrow: 0 },
  filterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '500' },
  filterTextActive: { color: colors.text },
  list: { padding: spacing.base, gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  clientName: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  serviceName: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: typography.sm, color: colors.primary, marginTop: 4 },
  priceText: { fontSize: typography.sm, fontWeight: '600', color: colors.success },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md },
  confirmBtn: { backgroundColor: '#064e3b' },
  cancelBtn: { backgroundColor: '#450a0a' },
  actionText: { fontSize: typography.sm, fontWeight: '600' },
})
