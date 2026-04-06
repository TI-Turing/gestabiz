import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'

type NotifCategory = {
  id: string
  label: string
  description: string
  key: string
}

const NOTIFICATION_CATEGORIES: NotifCategory[] = [
  { id: 'appointment_created', key: 'appointment_created', label: 'Nueva cita', description: 'Cuando se agenda una cita nueva' },
  { id: 'appointment_cancelled', key: 'appointment_cancelled', label: 'Cita cancelada', description: 'Cuando un cliente cancela' },
  { id: 'appointment_reminder', key: 'appointment_reminder', label: 'Recordatorio de cita', description: 'Recordatorio antes de una cita' },
  { id: 'employee_request', key: 'employee_request', label: 'Solicitud de empleado', description: 'Un usuario solicita unirse al negocio' },
  { id: 'absence_request', key: 'absence_request', label: 'Solicitud de ausencia', description: 'Un empleado solicita ausencia o vacaciones' },
  { id: 'new_review', key: 'new_review', label: 'Nueva reseña', description: 'Un cliente dejó una calificación' },
  { id: 'new_application', key: 'new_application', label: 'Nueva postulación', description: 'Alguien aplicó a una vacante' },
  { id: 'payment_received', key: 'payment_received', label: 'Pago recibido', description: 'Confirmación de pago' },
]

export default function NotificationSettingsScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness
  const qc = useQueryClient()
  const queryKey = ['notification-settings', businessId]

  const { data: settings, isLoading, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('business_notification_settings')
        .select('*')
        .eq('business_id', businessId!)
        .maybeSingle()
      return data ?? { enabled_types: [] as string[] }
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  const mutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const current: string[] = settings?.enabled_types ?? []
      const updated = enabled
        ? [...new Set([...current, key])]
        : current.filter(k => k !== key)
      await supabase
        .from('business_notification_settings')
        .upsert({ business_id: businessId, enabled_types: updated }, { onConflict: 'business_id' })
    },
    onMutate: async ({ key, enabled }) => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData(queryKey) as any
      qc.setQueryData(queryKey, (old: any) => {
        const current: string[] = old?.enabled_types ?? []
        const updated = enabled ? [...new Set([...current, key])] : current.filter((k: string) => k !== key)
        return { ...old, enabled_types: updated }
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKey, ctx?.prev) },
    onSettled: () => { qc.invalidateQueries({ queryKey }) },
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

  const enabledTypes: string[] = (settings as any)?.enabled_types ?? []

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.description}>
          Activa o desactiva qué tipos de notificaciones recibe el negocio.
        </Text>

        {NOTIFICATION_CATEGORIES.map(cat => (
          <View key={cat.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{cat.label}</Text>
              <Text style={styles.hint}>{cat.description}</Text>
            </View>
            <Switch
              value={enabledTypes.includes(cat.key)}
              onValueChange={enabled => mutation.mutate({ key: cat.key, enabled })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  description: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  label: { ...typography.bodyBold, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
})
