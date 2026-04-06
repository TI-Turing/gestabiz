import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useEmployeeBusinesses } from '../../hooks/useEmployeeBusinesses'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  professional: 'Profesional',
  receptionist: 'Recepcionista',
  accountant: 'Contador',
  support_staff: 'Staff de soporte',
}

export default function MyEmploymentsScreen() {
  const { user } = useAuth()
  const {
    data: businesses,
    isLoading,
    refetch,
    isRefetching,
  } = useEmployeeBusinesses(user?.id)

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Mis empleos</Text>
        <Text style={styles.subtitle}>
          Negocios donde estás registrado como empleado
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={businesses ?? []}
          keyExtractor={b => b.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="Sin empleos"
              message="Aún no estás vinculado a ningún negocio"
            />
          }
          renderItem={({ item: rawItem }) => {
            const item = rawItem as any
            const statusColor = item.employee_status === 'approved' ? colors.success : '#f59e0b'
            const statusLabel = item.employee_status === 'approved' ? 'Activo' : 'Pendiente'

            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.logoWrap}>
                    {item.logo_url ? (
                      <View style={styles.logoWrap}>
                        <Text style={styles.logoText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.logoText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.businessName}>{item.name}</Text>
                    {item.category_name && (
                      <Text style={styles.category}>{item.category_name}</Text>
                    )}
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
                    <Text style={styles.metaText}>
                      {ROLE_LABELS[item.employee_role ?? ''] ?? item.employee_role ?? 'Empleado'}
                    </Text>
                  </View>

                  {item.location_name && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{item.location_name}</Text>
                    </View>
                  )}

                  {item.hire_date && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>
                        Desde {new Date(item.hire_date).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  )}
                </View>

                {item.offers_services && (
                  <View style={styles.servicesBadge}>
                    <Ionicons name="star-outline" size={12} color={colors.primary} />
                    <Text style={styles.servicesText}>Ofrece servicios</Text>
                  </View>
                )}
              </View>
            )
          }}
        />
      )}
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
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { ...typography.h3, color: colors.primary },
  businessName: { ...typography.bodyBold, color: colors.text },
  category: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: { ...typography.caption, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.textMuted },
  servicesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  servicesText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
})
