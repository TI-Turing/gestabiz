import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { Appointment, AppointmentStatus } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

type Range = 7 | 30 | 90 | 365

interface SaleRow extends Appointment {
  clientName: string
  serviceName: string
}

async function fetchSales(businessId: string, days: Range): Promise<SaleRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: apts } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'completed')
    .gte('start_time', since.toISOString())
    .order('start_time', { ascending: false })
    .limit(100)

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

const RANGES: { label: string; value: Range }[] = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1 año', value: 365 },
]

export default function SalesScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const [range, setRange] = useState<Range>(30)

  const { data: sales = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.TRANSACTIONS(activeBusiness ?? ''), 'sales', range],
    queryFn: () => fetchSales(activeBusiness!, range),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.FREQUENT,
  })

  const totalRevenue = sales.reduce((sum, s) => sum + (s.price ?? 0), 0)
  const avgRevenue = sales.length > 0 ? totalRevenue / sales.length : 0

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      {/* Rango */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.rangeChip, range === r.value && styles.rangeChipActive]}
            onPress={() => setRange(r.value)}
          >
            <Text style={[styles.rangeText, range === r.value && styles.rangeTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total ventas</Text>
          <Text style={styles.summaryNum}>{sales.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryNum, { color: colors.success }]}>{formatCOP(totalRevenue)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Promedio</Text>
          <Text style={styles.summaryNum}>{formatCOP(avgRevenue)}</Text>
        </View>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, sales.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState icon="bar-chart-outline" title="Sin ventas" message="No hay citas completadas en este período" />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowClient}>{item.clientName}</Text>
              <Text style={styles.rowService}>{item.serviceName}</Text>
              <Text style={styles.rowDate}>{formatDate(item.start_time)}</Text>
            </View>
            {item.price != null && (
              <Text style={styles.rowPrice}>{formatCOP(item.price)}</Text>
            )}
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', gap: spacing.xs, padding: spacing.base },
  rangeChip: { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  rangeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeText: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '500' },
  rangeTextActive: { color: colors.text },
  summary: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: spacing.base, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: typography.xs, color: colors.textSecondary },
  summaryNum: { fontSize: typography.lg, fontWeight: '700', color: colors.text, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.base, gap: spacing.sm },
  row: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  rowLeft: {},
  rowClient: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  rowService: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  rowDate: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  rowPrice: { fontSize: typography.base, fontWeight: '700', color: colors.success },
})
