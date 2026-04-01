import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { EmployeeAbsence, AbsenceType } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

interface AbsenceRow extends EmployeeAbsence {
  employeeName: string
  employeeAvatar?: string
}

const ABSENCE_LABELS: Record<AbsenceType, string> = {
  vacation: 'Vacaciones',
  emergency: 'Emergencia',
  sick_leave: 'Incapacidad',
  personal: 'Personal',
  other: 'Otro',
}

async function fetchAbsences(businessId: string): Promise<AbsenceRow[]> {
  const { data } = await supabase
    .from('employee_absences')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return []

  const empIds = [...new Set(data.map((a) => a.employee_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', empIds)

  const profileMap: Record<string, { full_name: string; avatar_url?: string }> = {}
  ;(profiles ?? []).forEach((p) => { profileMap[p.id] = p })

  return data.map((a) => ({
    ...a,
    type: a.type as AbsenceType,
    status: a.status as 'pending' | 'approved' | 'rejected',
    employeeName: profileMap[a.employee_id]?.full_name ?? 'Empleado',
    employeeAvatar: profileMap[a.employee_id]?.avatar_url,
  }))
}

export default function AbsencesScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  const { data: absences = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.ABSENCES(activeBusiness ?? ''), filter],
    queryFn: () => fetchAbsences(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.FREQUENT,
  })

  const updateAbsence = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('employee_absences').update({ status }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ABSENCES(activeBusiness ?? '') }),
  })

  const confirmAction = (abs: AbsenceRow, action: 'approved' | 'rejected') => {
    const label = action === 'approved' ? 'Aprobar' : 'Rechazar'
    Alert.alert(`${label} ausencia`, `¿${label} la solicitud de ${abs.employeeName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: label, onPress: () => updateAbsence.mutate({ id: abs.id, status: action }) },
    ])
  }

  const filtered = filter === 'all' ? absences : absences.filter((a) => a.status === filter)

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      {/* Filtros */}
      <View style={styles.filters}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {{ all: 'Todas', pending: 'Pendientes', approved: 'Aprobadas', rejected: 'Rechazadas' }[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Sin solicitudes" message="No hay solicitudes de ausencia" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Avatar name={item.employeeName} uri={item.employeeAvatar} size={40} />
              <View style={styles.info}>
                <Text style={styles.empName}>{item.employeeName}</Text>
                <Text style={styles.absType}>{ABSENCE_LABELS[item.type]}</Text>
              </View>
              <Badge
                label={{ pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[item.status]}
                variant={{ pending: 'warning', approved: 'success', rejected: 'error' }[item.status] as 'warning' | 'success' | 'error'}
              />
            </View>
            <View style={styles.dates}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.dateText}>{formatDate(item.start_date)} — {formatDate(item.end_date)}</Text>
            </View>
            {item.reason && <Text style={styles.reason}>{item.reason}</Text>}
            {item.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => confirmAction(item, 'approved')}>
                  <Ionicons name="checkmark" size={14} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Aprobar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => confirmAction(item, 'rejected')}>
                  <Ionicons name="close" size={14} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', padding: spacing.base, gap: spacing.xs, flexWrap: 'wrap' },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: typography.sm },
  chipTextActive: { color: colors.text },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.base, gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  info: { flex: 1 },
  empName: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  absType: { fontSize: typography.sm, color: colors.textSecondary },
  dates: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateText: { fontSize: typography.sm, color: colors.textSecondary },
  reason: { fontSize: typography.sm, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md },
  approveBtn: { backgroundColor: '#064e3b' },
  rejectBtn: { backgroundColor: '#450a0a' },
  actionText: { fontSize: typography.sm, fontWeight: '600' },
})
