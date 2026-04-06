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
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'

type BusinessResource = {
  id: string
  name: string
  resource_type: string
  description: string | null
  capacity: number | null
  hourly_rate: number | null
  is_active: boolean
  location_id: string | null
}

const TYPE_LABELS: Record<string, string> = {
  room: 'Sala',
  table: 'Mesa',
  court: 'Cancha',
  desk: 'Escritorio',
  equipment: 'Equipo',
  vehicle: 'Vehículo',
  space: 'Espacio',
  lane: 'Carril',
  field: 'Campo',
  station: 'Estación',
  parking_spot: 'Parqueadero',
  bed: 'Cama',
  studio: 'Estudio',
  meeting_room: 'Sala de reuniones',
  other: 'Otro',
}

export default function ResourcesScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness
  const qc = useQueryClient()
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  const { data: resources, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['business-resources', businessId, filterActive],
    queryFn: async () => {
      let q = supabase
        .from('business_resources')
        .select('id, name, resource_type, description, capacity, hourly_rate, is_active, location_id')
        .eq('business_id', businessId)
        .order('name')

      if (filterActive !== null) {
        q = q.eq('is_active', filterActive)
      }

      const { data, error } = await q
      if (error) throw error
      return data as BusinessResource[]
    },
    enabled: !!businessId,
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('business_resources')
        .update({ is_active: !is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-resources', businessId] }),
    onError: () => Alert.alert('Error', 'No se pudo actualizar el recurso.'),
  })

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_resources')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-resources', businessId] }),
    onError: () => Alert.alert('Error', 'No se pudo eliminar el recurso.'),
  })

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar recurso',
      `¿Desactivar "${name}"? Las citas existentes no se verán afectadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desactivar', style: 'destructive', onPress: () => deleteResource.mutate(id) },
      ],
    )
  }

  const filters: Array<{ label: string; value: boolean | null }> = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false },
  ]

  const active = resources?.filter(r => r.is_active).length ?? 0
  const total = resources?.length ?? 0

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Recursos</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{active}/{total} activos</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map(f => (
          <TouchableOpacity
            key={String(f.value)}
            style={[styles.filterChip, filterActive === f.value && styles.filterChipActive]}
            onPress={() => setFilterActive(f.value)}
          >
            <Text style={[styles.filterText, filterActive === f.value && styles.filterTextActive]}>
              {f.label}
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
          data={resources ?? []}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="Sin recursos"
              message="No hay recursos físicos registrados"
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, !item.is_active && styles.cardInactive]}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name="cube-outline" size={20} color={item.is_active ? colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resourceName, !item.is_active && styles.textMuted]}>
                    {item.name}
                  </Text>
                  <Text style={styles.resourceType}>
                    {TYPE_LABELS[item.resource_type] ?? item.resource_type}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleBtn, item.is_active && styles.toggleBtnActive]}
                  onPress={() => toggleActive.mutate({ id: item.id, is_active: item.is_active })}
                >
                  <Ionicons
                    name={item.is_active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={item.is_active ? colors.success : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                {item.capacity !== null && (
                  <View style={styles.badge}>
                    <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.badgeText}>{item.capacity} cap.</Text>
                  </View>
                )}
                {item.hourly_rate !== null && (
                  <View style={styles.badge}>
                    <Ionicons name="cash-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.badgeText}>
                      ${item.hourly_rate.toLocaleString('es-CO')}/hr
                    </Text>
                  </View>
                )}
              </View>

              {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(item.id, item.name)}
              >
                <Ionicons name="trash-outline" size={14} color={colors.error} />
                <Text style={styles.deleteText}>Desactivar</Text>
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text },
  summary: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  summaryText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  filters: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.caption, color: colors.textMuted },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardInactive: { opacity: 0.6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceName: { ...typography.bodyBold, color: colors.text },
  resourceType: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  toggleBtn: { padding: spacing.xs },
  toggleBtnActive: {},
  metaRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: { ...typography.caption, color: colors.textMuted },
  description: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  deleteText: { ...typography.caption, color: colors.error },
  textMuted: { color: colors.textMuted },
})
