import React, { useCallback } from 'react'
import { View, Text, StyleSheet, RefreshControl, FlatList, TouchableOpacity } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
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
  businessName: string
  serviceName: string
}

async function fetchClientUpcoming(userId: string): Promise<AptRow[]> {
  const { data: apts } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', userId)
    .gte('start_time', new Date().toISOString())
    .in('status', ['scheduled', 'confirmed'])
    .order('start_time', { ascending: true })
    .limit(10)

  if (!apts || apts.length === 0) return []

  const businessIds = [...new Set(apts.map((a) => a.business_id))]
  const serviceIds = [...new Set(apts.map((a) => a.service_id))]

  const [bizRes, svcRes] = await Promise.all([
    supabase.from('businesses').select('id, name').in('id', businessIds),
    supabase.from('services').select('id, name').in('id', serviceIds),
  ])

  const bm: Record<string, string> = {}
  ;(bizRes.data ?? []).forEach((b) => { bm[b.id] = b.name })
  const sm: Record<string, string> = {}
  ;(svcRes.data ?? []).forEach((s) => { sm[s.id] = s.name })

  return apts.map((a) => ({ ...a, status: a.status as AppointmentStatus, businessName: bm[a.business_id] ?? 'Negocio', serviceName: sm[a.service_id] ?? 'Servicio' }))
}

export default function ClientDashboardScreen({ navigation }: { navigation: { navigate: (s: string) => void } }) {
  const { user } = useAuth()

  const { data: apts = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''),
    queryFn: () => fetchClientUpcoming(user!.id),
    enabled: !!user,
    ...QUERY_CONFIG.FREQUENT,
  })

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const isToday = d.toDateString() === today.toDateString()
    const isTomorrow = d.toDateString() === tomorrow.toDateString()
    const dateStr = isToday ? 'Hoy' : isTomorrow ? 'Mañana' : d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
    const timeStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} · ${timeStr}`
  }

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <Text style={styles.greeting}>Hola, {user?.user_metadata?.full_name?.split(' ')[0] ?? 'bienvenido'} 👋</Text>

      {/* Banner reservar */}
      <TouchableOpacity style={styles.bookBanner} onPress={() => navigation.navigate('Reservar')}>
        <View>
          <Text style={styles.bookTitle}>¿Necesitas una cita?</Text>
          <Text style={styles.bookSubtitle}>Reserva con tu negocio favorito</Text>
        </View>
        <View style={styles.bookBtn}>
          <Ionicons name="add" size={22} color={colors.text} />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Próximas citas ({apts.length})</Text>
      {apts.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Sin citas próximas"
          message="Reserva tu primera cita con el botón de arriba"
          action={{ label: 'Reservar cita', onPress: () => navigation.navigate('Reservar') }}
        />
      ) : (
        apts.map((apt) => (
          <View key={apt.id} style={styles.aptCard}>
            <View style={styles.aptLeft}>
              <Text style={styles.aptBusiness}>{apt.businessName}</Text>
              <Text style={styles.aptService}>{apt.serviceName}</Text>
              <Text style={styles.aptDate}>{formatDate(apt.start_time)}</Text>
            </View>
            <StatusBadge status={apt.status} />
          </View>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  greeting: { fontSize: typography['2xl'], fontWeight: '700', color: colors.text, marginBottom: spacing.base },
  bookBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bookTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.text },
  bookSubtitle: { fontSize: typography.sm, color: colors.text + 'cc', marginTop: 2 },
  bookBtn: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: typography.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  aptCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  aptLeft: { flex: 1 },
  aptBusiness: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  aptService: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  aptDate: { fontSize: typography.sm, color: colors.primary, marginTop: 4 },
})
