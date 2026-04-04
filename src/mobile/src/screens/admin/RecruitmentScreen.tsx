import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { useJobVacancies } from '../../hooks/useJobVacancies'
import { useJobApplications } from '../../hooks/useJobApplications'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'

type SubView = 'vacancies' | 'applications'

export default function RecruitmentScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness ?? undefined
  const [subView, setSubView] = useState<SubView>('vacancies')
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null)

  const {
    vacancies,
    isLoading: loadingVacancies,
    refetch: refetchVacancies,
    isRefetching: isRefetchingVacancies,
  } = useJobVacancies(businessId)

  const {
    applications,
    isLoading: loadingApplications,
    refetch: refetchApplications,
  } = useJobApplications(selectedVacancyId ?? undefined)

  const isLoading = subView === 'vacancies' ? loadingVacancies : loadingApplications

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reclutamiento</Text>
      </View>

      {/* Sub tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, subView === 'vacancies' && styles.tabActive]}
          onPress={() => setSubView('vacancies')}
        >
          <Text style={[styles.tabText, subView === 'vacancies' && styles.tabTextActive]}>
            Vacantes ({vacancies?.length ?? 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, subView === 'applications' && styles.tabActive]}
          onPress={() => setSubView('applications')}
        >
          <Text style={[styles.tabText, subView === 'applications' && styles.tabTextActive]}>
            Aplicaciones
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : subView === 'vacancies' ? (
        <FlatList
          data={vacancies ?? []}
          keyExtractor={v => v.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingVacancies}
              onRefresh={refetchVacancies}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="Sin vacantes"
              message="No hay vacantes publicadas"
            />
          }
          renderItem={({ item }) => {
            const statusColor = item.is_active ? colors.success : colors.textMuted
            const statusLabel = item.is_active ? 'Activa' : 'Cerrada'

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedVacancyId(item.id)
                  setSubView('applications')
                }}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.vacancyTitle}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                {(item.salary_min || item.salary_max) && (
                  <Text style={styles.salary}>
                    {item.commission_based
                      ? 'Comisión'
                      : `$${(item.salary_min ?? 0).toLocaleString('es-CO')} - $${(item.salary_max ?? 0).toLocaleString('es-CO')}`}
                  </Text>
                )}

                <View style={styles.applicationCount}>
                  <Ionicons name="people-outline" size={13} color={colors.primary} />
                  <Text style={styles.applicationCountText}>
                    Ver aplicaciones
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            )
          }}
        />
      ) : (
        <>
          {selectedVacancyId && (
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => { setSubView('vacancies'); setSelectedVacancyId(null) }}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.backText}>Volver a vacantes</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={applications ?? []}
            keyExtractor={a => a.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={refetchApplications} />
            }
            ListEmptyComponent={
              selectedVacancyId
                ? <EmptyState icon="person-outline" title="Sin aplicaciones" message="Nadie ha aplicado a esta vacante" />
                : <EmptyState icon="list-outline" title="Selecciona una vacante" message="Elige una vacante para ver sus aplicaciones" />
            }
            renderItem={({ item }) => {
              const statusColor = {
                pending: '#f59e0b',
                accepted: colors.success,
                rejected: colors.error,
                reviewing: colors.primary,
                withdrawn: colors.textMuted,
              }[item.status] ?? colors.textMuted

              const statusLabel = {
                pending: 'Pendiente',
                accepted: 'Aceptado',
                rejected: 'Rechazado',
                reviewing: 'En revisión',
                withdrawn: 'Retirado',
              }[item.status] ?? item.status

              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.applicantAvatar}>
                      <Text style={styles.avatarInitial}>A</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vacancyTitle}>Aplicante</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                  {item.availability_notes && (
                    <Text style={styles.notes} numberOfLines={2}>{item.availability_notes}</Text>
                  )}
                </View>
              )
            }}
          />
        </>
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.body, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  vacancyTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: { ...typography.caption, fontWeight: '700' },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  salary: { ...typography.caption, color: colors.success, fontWeight: '600', marginTop: 4 },
  applicationCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  applicationCountText: { ...typography.caption, color: colors.primary, fontWeight: '600', flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  backText: { ...typography.body, color: colors.primary },
  applicantAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { ...typography.bodyBold, color: colors.primary },
  notes: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
})
