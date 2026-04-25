import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius, shadows, fonts } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import CalendarView from '../../components/client/CalendarView'
import { AppointmentCard, AppointmentCardData, AppointmentStatus } from '../../components/cards/AppointmentCard'
import { Appointment } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'
import AppHeader from '../../components/ui/AppHeader'

type ViewMode = 'list' | 'calendar'
type Filter = 'upcoming' | 'past' | 'cancelled'

interface AptRow extends Appointment {
  businessName: string
  serviceName: string
  serviceImageUrl?: string
  servicePrice?: number
  employeeName?: string
  employeeAvatarUrl?: string
  locationName?: string
  locationAddress?: string
}

async function fetchClientApts(userId: string, filter: Filter): Promise<AptRow[]> {
  const now = new Date().toISOString()
  let query = supabase.from('appointments').select('*').eq('client_id', userId).limit(50)

  if (filter === 'upcoming') {
    query = query
      .gte('start_time', now)
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true })
  } else if (filter === 'past') {
    query = query
      .lt('start_time', now)
      .in('status', ['completed', 'no_show'])
      .order('start_time', { ascending: false })
  } else {
    query = query.eq('status', 'cancelled').order('start_time', { ascending: false })
  }

  const { data: apts } = await query
  if (!apts || apts.length === 0) return []

  const businessIds = [...new Set(apts.map((a: any) => a.business_id).filter(Boolean))]
  const serviceIds = [...new Set(apts.map((a: any) => a.service_id).filter(Boolean))]
  const locationIds = [...new Set(apts.map((a: any) => a.location_id).filter(Boolean))]
  const employeeIds = [...new Set(apts.map((a: any) => a.employee_id).filter(Boolean))]

  const [bizRes, svcRes, locRes, empRes] = await Promise.all([
    businessIds.length > 0 ? supabase.from('businesses').select('id, name').in('id', businessIds) : { data: [] },
    serviceIds.length > 0 ? supabase.from('services').select('id, name, price, image_url').in('id', serviceIds) : { data: [] },
    locationIds.length > 0 ? supabase.from('locations').select('id, name, address').in('id', locationIds) : { data: [] },
    employeeIds.length > 0 ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', employeeIds) : { data: [] },
  ])

  const bm: Record<string, string> = {}
  ;(bizRes.data ?? []).forEach((b: any) => { bm[b.id] = b.name })

  const sm: Record<string, { name: string; price?: number; imageUrl?: string }> = {}
  ;(svcRes.data ?? []).forEach((s: any) => {
    sm[s.id] = { name: s.name, price: s.price ?? undefined, imageUrl: s.image_url ?? undefined }
  })

  const lm: Record<string, { name: string; address?: string }> = {}
  ;(locRes.data ?? []).forEach((l: any) => { lm[l.id] = { name: l.name, address: l.address ?? undefined } })

  const em: Record<string, { name: string; avatarUrl?: string }> = {}
  ;(empRes.data ?? []).forEach((e: any) => { em[e.id] = { name: e.full_name, avatarUrl: e.avatar_url ?? undefined } })

  return apts.map((a: any) => ({
    ...a,
    status: a.status as AppointmentStatus,
    businessName: bm[a.business_id] ?? 'Negocio',
    serviceName: sm[a.service_id]?.name ?? 'Servicio',
    serviceImageUrl: sm[a.service_id]?.imageUrl,
    servicePrice: sm[a.service_id]?.price,
    employeeName: a.employee_id ? em[a.employee_id]?.name : undefined,
    employeeAvatarUrl: a.employee_id ? em[a.employee_id]?.avatarUrl : undefined,
    locationName: a.location_id ? lm[a.location_id]?.name : undefined,
    locationAddress: a.location_id ? lm[a.location_id]?.address : undefined,
  }))
}

function toCardData(apt: AptRow): AppointmentCardData {
  return {
    id: apt.id,
    startTime: apt.start_time,
    endTime: (apt as any).end_time ?? undefined,
    status: apt.status,
    serviceName: apt.serviceName,
    serviceImageUrl: apt.serviceImageUrl,
    servicePrice: apt.servicePrice,
    businessName: apt.businessName,
    employeeName: apt.employeeName,
    employeeAvatarUrl: apt.employeeAvatarUrl,
    locationName: apt.locationName,
    locationAddress: apt.locationAddress,
  }
}

export default function ClientAppointmentsScreen({
  navigation,
}: {
  navigation?: { navigate: (s: string) => void }
}) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const qc = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const { data: apts = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''), 'upcoming'],
    queryFn: () => fetchClientApts(user!.id, 'upcoming'),
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

  if (isLoading) return <LoadingSpinner fullScreen />


  return (
    <Screen noPadding>
      <AppHeader />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Mis Citas</Text>
        <TouchableOpacity
          style={[styles.newAptBtn, { backgroundColor: theme.primary }, shadows.sm]}
          onPress={() => navigation?.navigate('Reservar')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newAptBtnText}>Nueva Cita</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.referralBanner, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '40' }]}>
          <View style={[styles.referralIconBox, { backgroundColor: theme.primary }]}>
            <Ionicons name="gift" size={22} color="#fff" />
          </View>
          <View style={styles.referralTextBox}>
            <Text style={[styles.referralTitle, { color: theme.text }]}>¿Quieres generar un dinerito extra?</Text>
            <Text style={[styles.referralSubtitle, { color: theme.textSecondary }]}>
              Refiere negocios a Gestabiz y llévate más del 70% del primer pago.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.referralClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

      <View style={[styles.viewToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && { backgroundColor: theme.primary }]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : theme.textSecondary} />
            <Text style={[styles.viewToggleText, { color: viewMode === 'list' ? '#fff' : theme.textSecondary }]}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'calendar' && { backgroundColor: theme.primary }]}
            onPress={() => setViewMode('calendar')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={16} color={viewMode === 'calendar' ? '#fff' : theme.textSecondary} />
            <Text style={[styles.viewToggleText, { color: viewMode === 'calendar' ? '#fff' : theme.textSecondary }]}>Calendario</Text>
          </TouchableOpacity>
        </View>

      {viewMode === 'calendar' ? (
        <View style={styles.calendarBox}>
          <CalendarView />
        </View>
      ) : (
        <FlatList
          data={apts}
          keyExtractor={(a) => a.id}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.primary} />}
          contentContainerStyle={[styles.list, apts.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <EmptyState
                icon="calendar-outline"
                title="No tienes citas próximas"
                message="Reserva tu próxima cita en segundos"
              />
              <TouchableOpacity
                style={[styles.emptyCta, { backgroundColor: theme.primary }, shadows.sm]}
                onPress={() => navigation?.navigate('Reservar')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.emptyCtaText}>Reservar ahora</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={toCardData(item)}
              variant="hero"
              onPress={() => {}}
              actionLabel={item.status === 'scheduled' ? 'Cancelar' : undefined}
              onAction={item.status === 'scheduled' ? () => confirmCancel(item) : undefined}
            />
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  headerTitle: { fontSize: typography['2xl'], fontWeight: '700', fontFamily: fonts.bold },
  newAptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  newAptBtnText: { color: '#fff', fontWeight: '600', fontSize: typography.sm, fontFamily: fonts.semibold },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  referralIconBox: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  referralTextBox: { flex: 1 },
  referralTitle: { fontSize: typography.base, fontWeight: '700', fontFamily: fonts.bold },
  referralSubtitle: { fontSize: typography.xs, marginTop: 2, fontFamily: fonts.regular },
  referralClose: { padding: 4 },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  viewToggleText: { fontSize: typography.sm, fontWeight: '600', fontFamily: fonts.semibold },
  calendarBox: { flex: 1, paddingHorizontal: spacing.base },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl, gap: spacing.sm },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  emptyCtaText: { color: '#fff', fontWeight: '600', fontSize: typography.sm, fontFamily: fonts.semibold },
})
