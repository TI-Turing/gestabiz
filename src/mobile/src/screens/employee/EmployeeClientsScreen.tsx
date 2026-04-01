import React, { useState } from 'react'
import { View, Text, FlatList, StyleSheet, TextInput, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
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
  visits: number
  lastVisit: string | null
}

async function fetchMyClients(userId: string): Promise<ClientRow[]> {
  const { data: apts } = await supabase
    .from('appointments')
    .select('client_id, status, start_time')
    .eq('employee_id', userId)
    .neq('status', 'cancelled')

  if (!apts || apts.length === 0) return []

  const clientMap: Record<string, { visits: number; lastVisit: string | null }> = {}
  for (const a of apts) {
    if (!clientMap[a.client_id]) clientMap[a.client_id] = { visits: 0, lastVisit: null }
    if (a.status === 'completed') {
      clientMap[a.client_id].visits++
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

  return (profiles ?? [])
    .map((p) => ({ id: p.id, full_name: p.full_name, email: p.email, avatar_url: p.avatar_url, visits: clientMap[p.id]?.visits ?? 0, lastVisit: clientMap[p.id]?.lastVisit ?? null }))
    .sort((a, b) => b.visits - a.visits)
}

export default function EmployeeClientsScreen() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const { data: clients = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.MY_APPOINTMENTS(user?.id ?? ''), 'clients'],
    queryFn: () => fetchMyClients(user!.id),
    enabled: !!user,
    ...QUERY_CONFIG.STABLE,
  })

  const filtered = clients.filter(
    (c) => c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Buscar cliente..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} autoCapitalize="none" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Sin clientes" message="Los clientes que hayas atendido aparecerán aquí" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar name={item.full_name} uri={item.avatar_url} size={44} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              {item.lastVisit && <Text style={styles.last}>Última visita: {new Date(item.lastVisit).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>}
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeNum}>{item.visits}</Text>
              <Text style={styles.badgeLbl}>visitas</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, margin: spacing.base, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  searchInput: { flex: 1, color: colors.text, fontSize: typography.base, paddingVertical: spacing.sm },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.base, gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm },
  info: { flex: 1 },
  name: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  email: { fontSize: typography.sm, color: colors.textSecondary },
  last: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  badge: { alignItems: 'center' },
  badgeNum: { fontSize: typography.xl, fontWeight: '700', color: colors.primary },
  badgeLbl: { fontSize: typography.xs, color: colors.textSecondary },
})
