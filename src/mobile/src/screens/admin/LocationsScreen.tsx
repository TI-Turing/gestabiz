import React from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { Location } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

async function fetchLocations(businessId: string): Promise<Location[]> {
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('business_id', businessId)
    .order('name')
  return (data ?? []) as Location[]
}

export default function LocationsScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)

  const { data: locations = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.LOCATIONS(activeBusiness ?? ''),
    queryFn: () => fetchLocations(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.STABLE,
  })

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      <FlatList
        data={locations}
        keyExtractor={(l) => l.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, locations.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState icon="location-outline" title="Sin sedes" message="Agrega sedes a tu negocio desde la web" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="location-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                <Badge label={item.is_active ? 'Activa' : 'Inactiva'} variant={item.is_active ? 'success' : 'default'} />
              </View>
              <Text style={styles.address}>{item.address}</Text>
              {item.city && <Text style={styles.city}>{item.city}</Text>}
              <Text style={styles.hours}>{item.opens_at} — {item.closes_at}</Text>
              {item.phone && (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.phone}>{item.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { padding: spacing.base, gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: typography.base, fontWeight: '700', color: colors.text, flex: 1 },
  address: { fontSize: typography.sm, color: colors.textSecondary },
  city: { fontSize: typography.sm, color: colors.textMuted },
  hours: { fontSize: typography.xs, color: colors.primary, marginTop: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phone: { fontSize: typography.xs, color: colors.textSecondary },
})
