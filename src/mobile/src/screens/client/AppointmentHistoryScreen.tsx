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
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { QUERY_CONFIG } from '../../lib/queryClient'
import type { AppointmentStatus } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppointmentHistoryItem {
  id: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  price?: number | null
  serviceName: string
  businessName: string
  employeeName?: string | null
  hasReview: boolean
}

type FilterRange = '7' | '30' | '90' | 'all'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusLabel(s: AppointmentStatus): string {
  const map: Record<string, string> = {
    completed: 'Completada',
    cancelled: 'Cancelada',
    scheduled: 'Agendada',
    confirmed: 'Confirmada',
    no_show: 'No asistió',
  }
  return map[s] ?? s
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentHistoryScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const [range, setRange] = useState<FilterRange>('30')

  const since = (() => {
    if (range === 'all') return null
    const d = new Date()
    d.setDate(d.getDate() - parseInt(range))
    return d.toISOString()
  })()

  const queryKey = ['appointment-history', user?.id, range]

  const { data: appointments = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async (): Promise<AppointmentHistoryItem[]> => {
      // 1. Fetch appointments
      let q = supabase
        .from('appointments')
        .select('id, start_time, end_time, status, price, service_id, business_id, employee_id')
        .eq('client_id', user!.id)
        .in('status', ['completed', 'cancelled', 'no_show'])
        .order('start_time', { ascending: false })
        .limit(100)

      if (since) q = q.gte('start_time', since)

      const { data: apts, error: aptErr } = await q
      if (aptErr || !apts?.length) return []

      // 2. Batch fetch services, businesses, employees, reviews
      const serviceIds = [...new Set(apts.map(a => a.service_id as string).filter(Boolean))]
      const businessIds = [...new Set(apts.map(a => a.business_id as string).filter(Boolean))]
      const employeeIds = [...new Set(apts.map(a => a.employee_id as string).filter(Boolean))]
      const aptIds = apts.map(a => a.id as string)

      const [svcRes, bizRes, empRes, reviewRes] = await Promise.all([
        supabase.from('services').select('id, name').in('id', serviceIds),
        supabase.from('businesses').select('id, name').in('id', businessIds),
        supabase.from('profiles').select('id, full_name').in('id', employeeIds),
        supabase
          .from('reviews')
          .select('id, appointment_id')
          .in('appointment_id', aptIds),
      ])

      const svcMap = Object.fromEntries(
        (svcRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name])
      )
      const bizMap = Object.fromEntries(
        (bizRes.data ?? []).map((b: Record<string, unknown>) => [b.id, b.name])
      )
      const empMap = Object.fromEntries(
        (empRes.data ?? []).map((p: Record<string, unknown>) => [p.id, p.full_name])
      )
      const reviewedAptIds = new Set(
        (reviewRes.data ?? []).map((r: Record<string, unknown>) => r.appointment_id as string)
      )

      return apts.map(a => ({
        id: a.id as string,
        start_time: a.start_time as string,
        end_time: a.end_time as string,
        status: a.status as AppointmentStatus,
        price: a.price as number | null,
        serviceName: (svcMap[a.service_id as string] as string) ?? 'Servicio',
        businessName: (bizMap[a.business_id as string] as string) ?? 'Negocio',
        employeeName: empMap[a.employee_id as string] as string | null ?? null,
        hasReview: reviewedAptIds.has(a.id as string),
      }))
    },
    enabled: !!user?.id,
    ...QUERY_CONFIG.FREQUENT,
  })

  const RANGES: { key: FilterRange; label: string }[] = [
    { key: '7', label: '7d' },
    { key: '30', label: '30d' },
    { key: '90', label: '90d' },
    { key: 'all', label: 'Todo' },
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Citas</Text>
        {/* Range filter */}
        <View style={styles.filters}>
          {RANGES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.filterBtn, range === r.key && styles.filterBtnActive]}
              onPress={() => setRange(r.key)}
            >
              <Text style={[styles.filterText, range === r.key && styles.filterTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Sin historial"
            message="Aún no tienes citas en este período"
          />
        }
        renderItem={({ item }) => {
          const date = new Date(item.start_time)
          const dateStr = date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          const timeStr = date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <View style={styles.card}>
              {/* Date column */}
              <View style={styles.dateCol}>
                <Text style={styles.dateDay}>{date.getDate()}</Text>
                <Text style={styles.dateMon}>
                  {date.toLocaleDateString('es-CO', { month: 'short' })}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text style={styles.businessName}>{item.businessName}</Text>
                {item.employeeName && (
                  <Text style={styles.employeeName}>
                    <Ionicons name="person-outline" size={11} /> {item.employeeName}
                  </Text>
                )}
                <Text style={styles.timeText}>{timeStr}</Text>
              </View>

              {/* Right */}
              <View style={styles.cardRight}>
                <StatusBadge status={item.status} />
                {item.price != null && (
                  <Text style={styles.price}>
                    ${item.price.toLocaleString('es-CO')}
                  </Text>
                )}
                {item.status === 'completed' && !item.hasReview && (
                  <TouchableOpacity style={styles.reviewBtn}>
                    <Ionicons name="star-outline" size={13} color={colors.primary} />
                    <Text style={styles.reviewBtnText}>Calificar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
      />
    </Screen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },
  filters: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  dateCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  dateDay: { ...typography.h3, color: colors.primary },
  dateMon: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase' },
  cardContent: { flex: 1 },
  serviceName: { ...typography.bodyBold, color: colors.text },
  businessName: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  employeeName: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  timeText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: spacing.xs },
  price: { ...typography.caption, color: colors.success, fontWeight: '700' },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  reviewBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
})
