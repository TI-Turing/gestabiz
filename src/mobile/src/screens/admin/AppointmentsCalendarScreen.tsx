import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { QUERY_CONFIG } from '../../lib/queryClient'
import { AppointmentStatus } from '../../types'

interface AppointmentRow {
  id: string
  start_time: string
  end_time: string
  status: string
  price?: number | null
  serviceName: string
  businessName: string
  employeeName?: string | null
  locationName?: string | null
}

type Tab = 'upcoming' | 'past' | 'cancelled'

const TAB_LABELS: Record<Tab, string> = {
  upcoming: 'Próximas',
  past: 'Pasadas',
  cancelled: 'Canceladas',
}

const STATUS_MAP: Record<Tab, string[]> = {
  upcoming: ['scheduled', 'confirmed'],
  past: ['completed', 'no_show'],
  cancelled: ['cancelled'],
}

export default function AppointmentsCalendarScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { activeRole, activeBusiness } = useUserRoles(user)
  const [tab, setTab] = useState<Tab>('upcoming')

  const businessId = activeBusiness

  const { data: appointments = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-appointments', businessId, tab],
    queryFn: async (): Promise<AppointmentRow[]> => {
      const statuses = STATUS_MAP[tab]

      let q = supabase
        .from('appointments')
        .select('id, start_time, end_time, status, price, service_id, business_id, employee_id, location_id')
        .eq('business_id', businessId!)
        .in('status', statuses)
        .order('start_time', { ascending: tab === 'upcoming' })
        .limit(50)

      if (tab === 'upcoming') q = q.gte('start_time', new Date().toISOString())
      else q = q.lt('start_time', new Date().toISOString())

      const { data: apts, error } = await q
      if (error || !apts?.length) return []

      const serviceIds = [...new Set(apts.map(a => a.service_id as string).filter(Boolean))]
      const employeeIds = [...new Set(apts.map(a => a.employee_id as string).filter(Boolean))]
      const locationIds = [...new Set(apts.map(a => a.location_id as string).filter(Boolean))]

      const [svcRes, empRes, locRes] = await Promise.all([
        supabase.from('services').select('id, name').in('id', serviceIds),
        supabase.from('profiles').select('id, full_name').in('id', employeeIds),
        supabase.from('locations').select('id, name').in('id', locationIds),
      ])

      const svcMap = Object.fromEntries(
        (svcRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name])
      )
      const empMap = Object.fromEntries(
        (empRes.data ?? []).map((p: Record<string, unknown>) => [p.id, p.full_name])
      )
      const locMap = Object.fromEntries(
        (locRes.data ?? []).map((l: Record<string, unknown>) => [l.id, l.name])
      )

      return apts.map(a => ({
        id: a.id as string,
        start_time: a.start_time as string,
        end_time: a.end_time as string,
        status: a.status as string,
        price: a.price as number | null,
        serviceName: (svcMap[a.service_id as string] as string) ?? 'Servicio',
        businessName: '',
        employeeName: empMap[a.employee_id as string] as string | null ?? null,
        locationName: locMap[a.location_id as string] as string | null ?? null,
      }))
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

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
      <View style={styles.header}>
        <Text style={styles.title}>Citas</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {TAB_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Sin citas"
            message={`No hay citas ${TAB_LABELS[tab].toLowerCase()}`}
          />
        }
        renderItem={({ item }) => {
          const start = new Date(item.start_time)
          const end = new Date(item.end_time)
          const dateStr = start.toLocaleDateString('es-CO', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          })
          const timeRange = `${start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.service}>{item.serviceName}</Text>
                <StatusBadge status={item.status as AppointmentStatus} />
              </View>
              <Text style={styles.meta}>
                <Ionicons name="time-outline" size={12} /> {dateStr} · {timeRange}
              </Text>
              {item.employeeName && (
                <Text style={styles.meta}>
                  <Ionicons name="person-outline" size={12} /> {item.employeeName}
                </Text>
              )}
              {item.locationName && (
                <Text style={styles.meta}>
                  <Ionicons name="location-outline" size={12} /> {item.locationName}
                </Text>
              )}
              {item.price != null && (
                <Text style={styles.price}>${item.price.toLocaleString('es-CO')}</Text>
              )}
            </View>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.body, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  service: { ...typography.bodyBold, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  price: { ...typography.caption, color: colors.success, fontWeight: '700', marginTop: spacing.xs },
})
