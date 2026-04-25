/**
 * WriteReviewScreen — Formulario de reseña post-cita.
 *
 * Recibe un appointmentId via route params, carga la cita + servicio + empleado
 * + negocio, y permite al cliente dejar una reseña con 5 estrellas + comentario
 * opcional. Paridad funcional con web (ReviewForm modal post-cita).
 *
 * Ref: plan feat/mobile-client-parity-2026-04, Fase 2.1.
 */
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import ReviewForm from '../../components/reviews/ReviewForm'
import AppHeader from '../../components/ui/AppHeader'
import Avatar from '../../components/ui/Avatar'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, typography, radius } from '../../theme'

type WriteReviewParams = {
  WriteReview: { appointmentId: string }
}

interface AppointmentDetails {
  id: string
  business_id: string
  employee_id: string | null
  service_name: string | null
  business_name: string | null
  business_logo_url: string | null
  employee_name: string | null
  employee_avatar_url: string | null
  start_time: string
}

async function fetchAppointmentDetails(appointmentId: string): Promise<AppointmentDetails | null> {
  // appointments (id, business_id, employee_id, service_id, start_time)
  const { data: apt, error: aptErr } = await supabase
    .from('appointments')
    .select('id, business_id, employee_id, service_id, start_time')
    .eq('id', appointmentId)
    .maybeSingle()
  if (aptErr || !apt) return null

  // Two-step: services + businesses + profiles (employee)
  const [serviceRes, businessRes, employeeRes] = await Promise.all([
    supabase.from('services').select('name').eq('id', apt.service_id).maybeSingle(),
    supabase.from('businesses').select('name, logo_url').eq('id', apt.business_id).maybeSingle(),
    apt.employee_id
      ? supabase.from('profiles').select('full_name, avatar_url').eq('id', apt.employee_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  return {
    id: apt.id,
    business_id: apt.business_id,
    employee_id: apt.employee_id,
    service_name: serviceRes.data?.name ?? null,
    business_name: businessRes.data?.name ?? null,
    business_logo_url: businessRes.data?.logo_url ?? null,
    employee_name: employeeRes.data?.full_name ?? null,
    employee_avatar_url: employeeRes.data?.avatar_url ?? null,
    start_time: apt.start_time,
  }
}

export default function WriteReviewScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<WriteReviewParams, 'WriteReview'>>()
  const { theme } = useTheme()
  const { appointmentId } = route.params

  const [reviewType, setReviewType] = useState<'business' | 'employee'>('business')

  const { data: appointment, isLoading, isError } = useQuery({
    queryKey: ['appointment-for-review', appointmentId],
    queryFn: () => fetchAppointmentDetails(appointmentId),
    staleTime: 1000 * 60 * 5,
  })

  // Si no hay employee, forzar tipo business
  useEffect(() => {
    if (appointment && !appointment.employee_id) {
      setReviewType('business')
    }
  }, [appointment])

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  if (isError || !appointment) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader title="Dejar reseña" onBack={() => navigation.goBack()} />
        <View style={[styles.center, { padding: spacing.lg }]}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            No se pudo cargar la cita
          </Text>
        </View>
      </View>
    )
  }

  const date = new Date(appointment.start_time)
  const dateLabel = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader title="Dejar reseña" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Resumen de la cita */}
        <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Avatar
            uri={appointment.business_logo_url ?? undefined}
            name={appointment.business_name ?? undefined}
            size={48}
          />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryService, { color: theme.text }]} numberOfLines={1}>
              {appointment.service_name ?? 'Servicio'}
            </Text>
            <Text style={[styles.summaryBusiness, { color: theme.textSecondary }]} numberOfLines={1}>
              {appointment.business_name ?? 'Negocio'} · {dateLabel}
            </Text>
            {appointment.employee_name && (
              <Text style={[styles.summaryEmployee, { color: theme.textMuted }]} numberOfLines={1}>
                Atendido por {appointment.employee_name}
              </Text>
            )}
          </View>
        </View>

        {/* Selector de tipo (solo si hay employee) */}
        {appointment.employee_id && (
          <View style={[styles.tabs, { backgroundColor: theme.muted }]}>
            <ReviewTab
              label="Al negocio"
              active={reviewType === 'business'}
              onPress={() => setReviewType('business')}
              theme={theme}
            />
            <ReviewTab
              label={`A ${appointment.employee_name?.split(' ')[0] ?? 'profesional'}`}
              active={reviewType === 'employee'}
              onPress={() => setReviewType('employee')}
              theme={theme}
            />
          </View>
        )}

        {/* Form */}
        <View style={{ marginTop: spacing.base }}>
          <ReviewForm
            businessId={appointment.business_id}
            appointmentId={appointment.id}
            employeeId={reviewType === 'employee' ? appointment.employee_id ?? undefined : undefined}
            reviewType={reviewType}
            onSuccess={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </View>
  )
}

interface ReviewTabProps {
  label: string
  active: boolean
  onPress: () => void
  theme: ReturnType<typeof useTheme>['theme']
}

function ReviewTab({ label, active, onPress, theme }: ReviewTabProps) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.tab,
        {
          backgroundColor: active ? theme.card : 'transparent',
          color: active ? theme.text : theme.textSecondary,
          borderColor: active ? theme.cardBorder : 'transparent',
        },
      ]}
    >
      {label}
    </Text>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.base },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  summaryText: { flex: 1 },
  summaryService: { fontSize: typography.base, fontWeight: '600' },
  summaryBusiness: { fontSize: typography.sm, marginTop: 2 },
  summaryEmployee: { fontSize: typography.xs, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    fontSize: typography.sm,
    fontWeight: '500',
    textAlign: 'center',
    overflow: 'hidden',
  },
  errorText: {
    fontSize: typography.base,
    fontWeight: '500',
    marginTop: spacing.sm,
  },
})
