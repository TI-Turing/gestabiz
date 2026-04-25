/**
 * PendingReviewsScreen — Lista de citas completadas sin reseña.
 *
 * Muestra al cliente sus citas pasadas que aún puede reseñar. Tap → WriteReviewScreen.
 *
 * Ref: plan feat/mobile-client-parity-2026-04, Fase 2.1.
 */
import React from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../../components/ui/AppHeader'
import Avatar from '../../components/ui/Avatar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, typography, radius } from '../../theme'

interface PendingReview {
  id: string                     // appointment id
  business_id: string
  service_name: string | null
  business_name: string | null
  business_logo_url: string | null
  employee_name: string | null
  start_time: string
}

async function fetchPendingReviews(clientId: string): Promise<PendingReview[]> {
  // Citas completadas del cliente
  const { data: completed, error } = await supabase
    .from('appointments')
    .select('id, business_id, employee_id, service_id, start_time')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .order('start_time', { ascending: false })
    .limit(50)
  if (error || !completed || completed.length === 0) return []

  // Reviews que el cliente ya hizo (excluir esos appointments)
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('appointment_id')
    .eq('client_id', clientId)
  const reviewedIds = new Set((existingReviews ?? []).map(r => r.appointment_id).filter(Boolean))

  const pending = completed.filter(a => !reviewedIds.has(a.id))
  if (pending.length === 0) return []

  // Two-step: hidratar nombre de servicio, negocio, empleado
  const serviceIds = [...new Set(pending.map(a => a.service_id))]
  const businessIds = [...new Set(pending.map(a => a.business_id))]
  const employeeIds = [...new Set(pending.map(a => a.employee_id).filter((id): id is string => !!id))]

  const [services, businesses, employees] = await Promise.all([
    supabase.from('services').select('id, name').in('id', serviceIds),
    supabase.from('businesses').select('id, name, logo_url').in('id', businessIds),
    employeeIds.length > 0
      ? supabase.from('profiles').select('id, full_name').in('id', employeeIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const serviceMap = new Map((services.data ?? []).map(s => [s.id, s.name]))
  const businessMap = new Map((businesses.data ?? []).map(b => [b.id, b]))
  const employeeMap = new Map((employees.data ?? []).map(e => [e.id, e.full_name]))

  return pending.map(a => ({
    id: a.id,
    business_id: a.business_id,
    service_name: serviceMap.get(a.service_id) ?? null,
    business_name: businessMap.get(a.business_id)?.name ?? null,
    business_logo_url: businessMap.get(a.business_id)?.logo_url ?? null,
    employee_name: a.employee_id ? employeeMap.get(a.employee_id) ?? null : null,
    start_time: a.start_time,
  }))
}

export default function PendingReviewsScreen() {
  const navigation = useNavigation<NavigationProp<{ WriteReview: { appointmentId: string } }>>()
  const { user } = useAuth()
  const { theme } = useTheme()

  const { data: pending = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['pending-reviews', user?.id],
    queryFn: () => fetchPendingReviews(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  })

  const renderItem = ({ item }: { item: PendingReview }) => {
    const date = new Date(item.start_time)
    const dateLabel = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('WriteReview', { appointmentId: item.id })}
        activeOpacity={0.75}
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      >
        <Avatar
          uri={item.business_logo_url ?? undefined}
          name={item.business_name ?? undefined}
          size={44}
        />
        <View style={styles.rowBody}>
          <Text style={[styles.service, { color: theme.text }]} numberOfLines={1}>
            {item.service_name ?? 'Servicio'}
          </Text>
          <Text style={[styles.business, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.business_name ?? 'Negocio'} · {dateLabel}
          </Text>
          {item.employee_name && (
            <Text style={[styles.employee, { color: theme.textMuted }]} numberOfLines={1}>
              Atendido por {item.employee_name}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader title="Reseñas pendientes" onBack={() => navigation.goBack()} />

      {!isLoading && pending.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No tienes reseñas pendientes
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Cuando completes una cita aparecerá aquí para que puedas reseñarla.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.base },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowBody: { flex: 1 },
  service: { fontSize: typography.base, fontWeight: '600' },
  business: { fontSize: typography.sm, marginTop: 2 },
  employee: { fontSize: typography.xs, marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: typography.lg, fontWeight: '600' },
  emptyText: { fontSize: typography.sm, textAlign: 'center', lineHeight: 20 },
})
