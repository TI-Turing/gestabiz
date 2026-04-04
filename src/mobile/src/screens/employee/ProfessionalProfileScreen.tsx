import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'

type EmployeeProfile = {
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
  employee_type: string | null
  hire_date: string | null
  vacation_days_accrued: number | null
  offers_services: boolean
  services: Array<{ id: string; name: string; duration: number; price: number }>
  totalAppointments: number
  totalCompleted: number
  avgRating: number | null
}

const BASE_STATS_N = 30 // last N days for performance metrics

export default function ProfessionalProfileScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness

  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['professional-profile', user?.id, businessId],
    queryFn: async () => {
      const [profileRes, empRes, servicesRes, aptRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, email, phone, avatar_url').eq('id', user!.id).single(),
        supabase.from('business_employees').select('role, employee_type, hire_date, vacation_days_accrued, offers_services').eq('employee_id', user!.id).eq('business_id', businessId!).single(),
        supabase.from('employee_services').select('services (id, name, duration, price)').eq('employee_id', user!.id).eq('business_id', businessId!),
        supabase.from('appointments').select('id, status').eq('employee_id', user!.id).eq('business_id', businessId!).gte('start_time', new Date(Date.now() - BASE_STATS_N * 86400000).toISOString()),
        supabase.from('reviews').select('rating').eq('employee_id', user!.id),
      ])

      const p = profileRes.data!
      const e = empRes.data!
      const services = ((servicesRes.data ?? []).map((s: any) => s.services).filter(Boolean)) as Array<{ id: string; name: string; duration: number; price: number }>
      const apts = aptRes.data ?? []
      const reviews = reviewsRes.data ?? []

      const totalCompleted = apts.filter(a => a.status === 'completed').length
      const avgRating = reviews.length
        ? Math.round((reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length) * 10) / 10
        : null

      return {
        ...p,
        ...e,
        services,
        totalAppointments: apts.length,
        totalCompleted,
        avgRating,
      } as EmployeeProfile
    },
    enabled: !!user?.id && !!businessId,
    ...QUERY_CONFIG.STABLE,
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

  if (!profile) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No se encontró el perfil</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar + name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.role}>{profile.role} · {profile.employee_type ?? ''}</Text>
          {profile.avgRating !== null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.rating}>{profile.avgRating} / 5</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="calendar-outline"
            value={profile.totalAppointments}
            label={`Citas (${BASE_STATS_N}d)`}
          />
          <StatCard
            icon="checkmark-circle-outline"
            value={profile.totalCompleted}
            label="Completadas"
          />
          <StatCard
            icon="sunny-outline"
            value={profile.vacation_days_accrued ?? 0}
            label="Vac. acumuladas"
          />
        </View>

        {/* Contact info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de contacto</Text>
          <InfoRow icon="mail-outline" text={profile.email} />
          {profile.phone && <InfoRow icon="call-outline" text={profile.phone} />}
          {profile.hire_date && (
            <InfoRow
              icon="calendar-outline"
              text={`Empleado desde ${new Date(profile.hire_date).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`}
            />
          )}
        </View>

        {/* Services */}
        {profile.offers_services && profile.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios que ofrece ({profile.services.length})</Text>
            {profile.services.map(svc => (
              <View key={svc.id} style={styles.serviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  <Text style={styles.serviceDuration}>{svc.duration} min</Text>
                </View>
                <Text style={styles.servicePrice}>
                  ${svc.price.toLocaleString('es-CO')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={colors.textMuted} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
  scroll: { paddingBottom: spacing.xl },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  name: { ...typography.h2, color: colors.text },
  role: { ...typography.body, color: colors.textMuted, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  rating: { ...typography.bodyBold, color: '#f59e0b' },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { ...typography.h3, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  infoText: { ...typography.body, color: colors.text },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceName: { ...typography.body, color: colors.text },
  serviceDuration: { ...typography.caption, color: colors.textMuted },
  servicePrice: { ...typography.bodyBold, color: colors.primary },
})
