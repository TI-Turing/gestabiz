import React from 'react'
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
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

interface EmployeeRow {
  id: string
  employee_id: string
  role: string
  status: 'pending' | 'approved' | 'rejected'
  is_active: boolean
  full_name: string
  email: string
  avatar_url?: string
}

async function fetchEmployees(businessId: string): Promise<EmployeeRow[]> {
  const { data } = await supabase
    .from('business_employees')
    .select('id, employee_id, role, status, is_active')
    .eq('business_id', businessId)
    .order('status')

  if (!data || data.length === 0) return []

  const empIds = data.map((e) => e.employee_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', empIds)

  const profileMap: Record<string, { full_name: string; email: string; avatar_url?: string }> = {}
  ;(profiles ?? []).forEach((p) => { profileMap[p.id] = p })

  return data.map((e) => ({
    ...e,
    status: e.status as 'pending' | 'approved' | 'rejected',
    full_name: profileMap[e.employee_id]?.full_name ?? 'Empleado',
    email: profileMap[e.employee_id]?.email ?? '',
    avatar_url: profileMap[e.employee_id]?.avatar_url,
  }))
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Gerente',
  professional: 'Profesional',
  receptionist: 'Recepcionista',
  accountant: 'Contador',
  support_staff: 'Staff',
}

export default function EmployeesScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const qc = useQueryClient()

  const { data: employees = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.EMPLOYEES(activeBusiness ?? ''),
    queryFn: () => fetchEmployees(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.STABLE,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('business_employees').update({ status, is_active: status === 'approved' }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES(activeBusiness ?? '') }),
  })

  const confirmAction = (emp: EmployeeRow, action: 'approve' | 'reject' | 'deactivate') => {
    const messages = {
      approve: { title: 'Aprobar empleado', msg: `¿Aprobar a ${emp.full_name}?`, status: 'approved' },
      reject: { title: 'Rechazar empleado', msg: `¿Rechazar a ${emp.full_name}?`, status: 'rejected' },
      deactivate: { title: 'Desactivar empleado', msg: `¿Desactivar a ${emp.full_name}?`, status: 'rejected' },
    }
    const cfg = messages[action]
    Alert.alert(cfg.title, cfg.msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: action === 'approve' ? 'default' : 'destructive', onPress: () => updateStatus.mutate({ id: emp.id, status: cfg.status }) },
    ])
  }

  if (isLoading) return <LoadingSpinner fullScreen />

  const pending = employees.filter((e) => e.status === 'pending')
  const active = employees.filter((e) => e.status === 'approved')
  const inactive = employees.filter((e) => e.status === 'rejected')

  const renderEmployee = (emp: EmployeeRow) => (
    <View key={emp.id} style={styles.card}>
      <Avatar name={emp.full_name} uri={emp.avatar_url} size={44} />
      <View style={styles.info}>
        <Text style={styles.name}>{emp.full_name}</Text>
        <Text style={styles.email}>{emp.email}</Text>
        <Text style={styles.role}>{ROLE_LABELS[emp.role] ?? emp.role}</Text>
      </View>
      <View style={styles.actions}>
        {emp.status === 'pending' && (
          <>
            <TouchableOpacity style={styles.approveBtn} onPress={() => confirmAction(emp, 'approve')}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => confirmAction(emp, 'reject')}>
              <Ionicons name="close" size={16} color={colors.error} />
            </TouchableOpacity>
          </>
        )}
        {emp.status === 'approved' && (
          <Badge label="Activo" variant="success" />
        )}
        {emp.status === 'rejected' && (
          <Badge label="Inactivo" variant="default" />
        )}
      </View>
    </View>
  )

  return (
    <Screen scrollable refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}>
      {pending.length > 0 && (
        <>
          <Text style={styles.section}>Solicitudes pendientes ({pending.length})</Text>
          {pending.map(renderEmployee)}
        </>
      )}
      {active.length > 0 && (
        <>
          <Text style={styles.section}>Empleados activos ({active.length})</Text>
          {active.map(renderEmployee)}
        </>
      )}
      {inactive.length > 0 && (
        <>
          <Text style={styles.section}>Inactivos ({inactive.length})</Text>
          {inactive.map(renderEmployee)}
        </>
      )}
      {employees.length === 0 && (
        <EmptyState icon="people-outline" title="Sin empleados" message="Aún no tienes empleados en este negocio" />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: typography.base, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm },
  info: { flex: 1 },
  name: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  email: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  role: { fontSize: typography.xs, color: colors.primary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  approveBtn: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: '#064e3b', alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: '#450a0a', alignItems: 'center', justifyContent: 'center' },
})
