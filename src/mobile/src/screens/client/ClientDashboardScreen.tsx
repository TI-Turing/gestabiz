import React from 'react'
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius, shadows } from '../../theme'
import { useTheme } from '../../contexts/ThemeContext'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { AppointmentCard, AppointmentCardData, AppointmentStatus } from '../../components/cards/AppointmentCard'
import { Appointment } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchClientUpcoming(userId: string): Promise<AptRow[]> {
  const { data: apts } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', userId)
    .gte('start_time', new Date().toISOString())
    .in('status', ['scheduled', 'confirmed', 'pending'])
    .order('start_time', { ascending: true })
    .limit(5)

  if (!apts || apts.length === 0) return []

  const businessIds = [...new Set(apts.map((a: any) => a.business_id).filter(Boolean))]
  const serviceIds = [...new Set(apts.map((a: any) => a.service_id).filter(Boolean))]
  const locationIds = [...new Set(apts.map((a: any) => a.location_id).filter(Boolean))]
  const employeeIds = [...new Set(apts.map((a: any) => a.employee_id).filter(Boolean))]

  const [bizRes, svcRes, locRes, empRes] = await Promise.all([
    businessIds.length > 0
      ? supabase.from('businesses').select('id, name').in('id', businessIds)
      : { data: [] },
    serviceIds.length > 0
      ? supabase.from('services').select('id, name, price, image_url').in('id', serviceIds)
      : { data: [] },
    locationIds.length > 0
      ? supabase.from('locations').select('id, name, address').in('id', locationIds)
      : { data: [] },
    employeeIds.length > 0
      ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', employeeIds)
      : { data: [] },
  ])

  const bm: Record<string, string> = {}
  ;(bizRes.data ?? []).forEach((b: any) => { bm[b.id] = b.name })

  const sm: Record<string, { name: string; price?: number; imageUrl?: string }> = {}
  ;(svcRes.data ?? []).forEach((s: any) => {
    sm[s.id] = { name: s.name, price: s.price ?? undefined, imageUrl: s.image_url ?? undefined }
  })

  const lm: Record<string, { name: string; address?: string }> = {}
  ;(locRes.data ?? []).forEach((l: any) => {
    lm[l.id] = { name: l.name, address: l.address ?? undefined }
  })

  const em: Record<string, { name: string; avatarUrl?: string }> = {}
  ;(empRes.data ?? []).forEach((e: any) => {
    em[e.id] = { name: e.full_name, avatarUrl: e.avatar_url ?? undefined }
  })

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientDashboardScreen({
  navigation,
}: {
  navigation: { navigate: (s: string) => void }
}) {
  const { user } = useAuth()
  const { theme } = useTheme()

  const { data: apts = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''),
    queryFn: () => fetchClientUpcoming(user!.id),
    enabled: !!user,
    ...QUERY_CONFIG.FREQUENT,
  })

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'bienvenido'

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          tintColor={theme.primary}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>Bienvenido</Text>
          <Text style={[styles.greetingName, { color: theme.text }]}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.newAptBtn, { backgroundColor: theme.primary }, shadows.sm]}
          onPress={() => navigation.navigate('Reservar')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newAptBtnText}>Nueva Cita</Text>
        </TouchableOpacity>
      </View>

      {/* ── Booking banner ── */}
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: theme.primary }, shadows.md]}
        onPress={() => navigation.navigate('Buscar')}
        activeOpacity={0.85}
      >
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerTitle}>Encuentra tu próxima cita</Text>
          <Text style={styles.bannerSubtitle}>Explora negocios cerca de ti</Text>
        </View>
        <View style={styles.bannerIconWrap}>
          <Ionicons name="search" size={28} color="rgba(255,255,255,0.9)" />
        </View>
      </TouchableOpacity>

      {/* ── Section header ── */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Próximas citas
          {apts.length > 0 && (
            <Text style={{ color: theme.primary }}> ({apts.length})</Text>
          )}
        </Text>
        {apts.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('MisCitas')}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>Ver todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Appointment cards ── */}
      {apts.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Sin citas próximas"
          message="Reserva tu primera cita con el botón de arriba"
          action={{ label: 'Reservar cita', onPress: () => navigation.navigate('Reservar') }}
        />
      ) : (
        apts.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={toCardData(apt)}
            variant="hero"
          />
        ))
      )}
    </Screen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greetingLabel: {
    fontSize: typography.sm,
    fontWeight: '400',
  },
  greetingName: {
    fontSize: typography['2xl'],
    fontWeight: '700',
  },
  newAptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  newAptBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.sm,
  },
  banner: {
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  bannerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: typography.sm,
    fontWeight: '500',
  },
})
