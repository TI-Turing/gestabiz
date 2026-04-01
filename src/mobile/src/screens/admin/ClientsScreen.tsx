import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Avatar from '../../components/ui/Avatar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

interface ClientRow {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  totalVisits: number
  completedVisits: number
  lastVisit: string | null
}

async function fetchClients(businessId: string): Promise<ClientRow[]> {
  const { data: apts } = await supabase
    .from('appointments')
    .select('client_id, status, start_time')
    .eq('business_id', businessId)
    .neq('status', 'cancelled')

  if (!apts || apts.length === 0) return []

  // Agregar por cliente
  const clientMap: Record<string, { total: number; completed: number; lastVisit: string | null }> = {}
  for (const a of apts) {
    if (!clientMap[a.client_id]) {
      clientMap[a.client_id] = { total: 0, completed: 0, lastVisit: null }
    }
    clientMap[a.client_id].total++
    if (a.status === 'completed') {
      clientMap[a.client_id].completed++
      if (!clientMap[a.client_id].lastVisit || a.start_time > clientMap[a.client_id].lastVisit!) {
        clientMap[a.client_id].lastVisit = a.start_time
      }
    }
  }

  const clientIds = Object.keys(clientMap)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', clientIds)

  return (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    avatar_url: p.avatar_url,
    totalVisits: clientMap[p.id]?.total ?? 0,
    completedVisits: clientMap[p.id]?.completed ?? 0,
    lastVisit: clientMap[p.id]?.lastVisit ?? null,
  })).sort((a, b) => b.completedVisits - a.completedVisits)
}

export default function ClientsScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const [search, setSearch] = useState('')

  const { data: clients = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS(activeBusiness ?? ''),
    queryFn: () => fetchClients(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.STABLE,
  })

  const filtered = clients.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Sin visitas'
    return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Sin clientes"
            message="Los clientes aparecerán aquí una vez que tengan citas en tu negocio"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar name={item.full_name} uri={item.avatar_url} size={48} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.lastVisit}>Última visita: {formatDate(item.lastVisit)}</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.statNum}>{item.completedVisits}</Text>
              <Text style={styles.statLbl}>visitas</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    margin: spacing.base,
    marginBottom: 0,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: spacing.xs },
  searchInput: { flex: 1, color: colors.text, fontSize: typography.base, paddingVertical: spacing.sm },
  list: { padding: spacing.base, gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  info: { flex: 1 },
  name: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  email: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  lastVisit: { fontSize: typography.xs, color: colors.textMuted, marginTop: 4 },
  stats: { alignItems: 'center' },
  statNum: { fontSize: typography.xl, fontWeight: '700', color: colors.primary },
  statLbl: { fontSize: typography.xs, color: colors.textSecondary },
})
