import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'

type EmployeePermissions = {
  userId: string
  name: string
  email: string
  role: string
  permissions: string[]
}

const PERMISSION_LABELS: Record<string, string> = {
  'services.create': 'Crear servicios',
  'services.edit': 'Editar servicios',
  'services.delete': 'Eliminar servicios',
  'employees.create': 'Agregar empleados',
  'employees.edit': 'Editar empleados',
  'employees.delete': 'Eliminar empleados',
  'appointments.create': 'Crear citas',
  'appointments.cancel': 'Cancelar citas',
  'accounting.view_reports': 'Ver reportes',
  'accounting.create': 'Crear transacciones',
  'expenses.create': 'Crear gastos',
  'recruitment.create_vacancy': 'Crear vacantes',
  'recruitment.manage_applications': 'Gestionar aplicaciones',
  'settings.edit_business': 'Editar negocio',
  'sales.create': 'Ventas rápidas',
  'absences.approve': 'Aprobar ausencias',
}

export default function PermissionsScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness
  const qc = useQueryClient()
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ['permissions-screen', businessId],
    queryFn: async () => {
      const { data: empData, error: empErr } = await supabase
        .from('business_employees')
        .select('employee_id, role')
        .eq('business_id', businessId)
        .eq('is_active', true)
      if (empErr) throw empErr

      const userIds = empData.map(e => e.employee_id)
      if (!userIds.length) return []

      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      if (profErr) throw profErr

      const { data: perms, error: permErr } = await supabase
        .from('user_permissions')
        .select('user_id, permission')
        .eq('business_id', businessId)
        .eq('is_active', true)
      if (permErr) throw permErr

      return empData.map(emp => {
        const profile = profiles.find(p => p.id === emp.employee_id)
        const userPerms = perms.filter(p => p.user_id === emp.employee_id).map(p => p.permission)
        return {
          userId: emp.employee_id,
          name: profile?.full_name ?? 'Empleado',
          email: profile?.email ?? '',
          role: emp.role,
          permissions: userPerms,
        } as EmployeePermissions
      })
    },
    enabled: !!businessId,
  })

  const togglePerm = useMutation({
    mutationFn: async ({
      userId,
      permission,
      grant,
    }: {
      userId: string
      permission: string
      grant: boolean
    }) => {
      if (grant) {
        const { error } = await supabase.from('user_permissions').upsert(
          {
            business_id: businessId,
            user_id: userId,
            permission,
            granted_by: user?.id,
            is_active: true,
          },
          { onConflict: 'business_id,user_id,permission' },
        )
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_permissions')
          .update({ is_active: false })
          .eq('business_id', businessId)
          .eq('user_id', userId)
          .eq('permission', permission)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permissions-screen', businessId] }),
    onError: () => Alert.alert('Error', 'No se pudo actualizar el permiso.'),
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

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Permisos</Text>
        <Text style={styles.subtitle}>Controla accesos por empleado</Text>
      </View>

      <FlatList
        data={employees ?? []}
        keyExtractor={e => e.userId}
        contentContainerStyle={styles.list}
        refreshControl={undefined}
        ListEmptyComponent={
          <EmptyState
            icon="shield-outline"
            title="Sin empleados"
            message="No hay empleados registrados"
          />
        }
        renderItem={({ item }) => {
          const expanded = expandedUserId === item.userId
          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedUserId(expanded ? null : item.userId)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.email}</Text>
                </View>
                <View style={styles.roleTag}>
                  <Text style={styles.roleText}>{item.role}</Text>
                </View>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {expanded && (
                <View style={styles.permList}>
                  {Object.entries(PERMISSION_LABELS).map(([perm, label]) => {
                    const hasIt = item.permissions.includes(perm)
                    return (
                      <View key={perm} style={styles.permRow}>
                        <Text style={styles.permLabel}>{label}</Text>
                        <Switch
                          value={hasIt}
                          onValueChange={val =>
                            togglePerm.mutate({
                              userId: item.userId,
                              permission: perm,
                              grant: val,
                            })
                          }
                          trackColor={{ true: colors.primary }}
                          thumbColor="#fff"
                        />
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyBold, color: colors.primary },
  name: { ...typography.bodyBold, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  roleTag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  permList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  permLabel: { ...typography.body, color: colors.text, flex: 1 },
})
