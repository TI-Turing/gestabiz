import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'
import { QUERY_CONFIG } from '../../lib/queryClient'

type Vacancy = {
  id: string
  title: string
  description: string | null
  location_name: string | null
  salary_min: number | null
  salary_max: number | null
  commission_based: boolean
  category_name: string | null
  business_name: string
  already_applied: boolean
}

const FILTER_OPTIONS = [
  { label: 'Todas', value: 'all' },
  { label: 'Sin aplicar', value: 'new' },
  { label: 'Aplicadas', value: 'applied' },
]

export default function VacanciesMarketplaceScreen() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'new' | 'applied'>('all')

  const { data: vacancies, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vacancies-marketplace', user?.id],
    queryFn: async () => {
      const { data: myApps, error: appErr } = await supabase
        .from('job_applications')
        .select('vacancy_id')
        .eq('applicant_id', user?.id)
      if (appErr) throw appErr
      const appliedIds = new Set(myApps?.map(a => a.vacancy_id) ?? [])

      const { data: vacs, error: vacErr } = await supabase
        .from('job_vacancies')
        .select(`
          id, title, description,
          salary_min, salary_max, commission_based,
          businesses:business_id ( name ),
          locations:location_id ( name )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)
      if (vacErr) throw vacErr

      return (vacs ?? []).map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        salary_min: v.salary_min,
        salary_max: v.salary_max,
        commission_based: v.commission_based ?? false,
        business_name: v.businesses?.name ?? 'Negocio',
        location_name: v.locations?.name ?? null,
        already_applied: appliedIds.has(v.id),
      })) as Vacancy[]
    },
    enabled: !!user?.id,
    ...QUERY_CONFIG.FREQUENT,
  })

  const applyMutation = useMutation({
    mutationFn: async (vacancyId: string) => {
      const { error } = await supabase.from('job_applications').insert({
        vacancy_id: vacancyId,
        applicant_id: user?.id,
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vacancies-marketplace', user?.id] })
      Alert.alert('Éxito', 'Tu aplicación fue enviada correctamente.')
    },
    onError: () => Alert.alert('Error', 'No se pudo enviar tu aplicación.'),
  })

  const confirmApply = (id: string, title: string) => {
    Alert.alert(
      'Aplicar a vacante',
      `¿Deseas aplicar a "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aplicar', onPress: () => applyMutation.mutate(id) },
      ],
    )
  }

  const filtered = vacancies?.filter(v => {
    if (filter === 'new') return !v.already_applied
    if (filter === 'applied') return v.already_applied
    return true
  })

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Vacantes disponibles</Text>
        <Text style={styles.count}>{filtered?.length ?? 0} resultados</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, filter === opt.value && styles.chipActive]}
            onPress={() => setFilter(opt.value as any)}
          >
            <Text style={[styles.chipText, filter === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered ?? []}
          keyExtractor={v => v.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sin vacantes"
              message="No hay vacantes disponibles en este momento"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vacancyTitle}>{item.title}</Text>
                  <Text style={styles.businessName}>{item.business_name}</Text>
                </View>
                {item.already_applied && (
                  <View style={styles.appliedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.appliedText}>Aplicada</Text>
                  </View>
                )}
              </View>

              {item.location_name && (
                <Text style={styles.meta}>
                  <Ionicons name="location-outline" size={12} /> {item.location_name}
                </Text>
              )}

              {(item.salary_min != null || item.salary_max != null) && (
                <Text style={styles.salary}>
                  {item.commission_based
                    ? 'Basado en comisión'
                    : `$${(item.salary_min ?? 0).toLocaleString('es-CO')} — $${(item.salary_max ?? 0).toLocaleString('es-CO')}`}
                </Text>
              )}

              {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {!item.already_applied && (
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => confirmApply(item.id, item.title)}
                  disabled={applyMutation.isPending}
                >
                  <Text style={styles.applyText}>Aplicar ahora</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.h2, color: colors.text },
  count: { ...typography.caption, color: colors.textMuted },
  filters: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  vacancyTitle: { ...typography.bodyBold, color: colors.text },
  businessName: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  appliedText: { ...typography.caption, color: colors.success, fontWeight: '700' },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  salary: { ...typography.caption, color: colors.success, fontWeight: '600', marginTop: 4 },
  description: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 18 },
  applyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  applyText: { ...typography.bodyBold, color: '#fff' },
})
