import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useDebounce } from '../../hooks/useDebounce'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string
  name: string
  logo_url?: string | null
  category?: string | null
  city?: string | null
  average_rating?: number | null
  review_count?: number | null
}

type SearchType = 'businesses' | 'services' | 'professionals'

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>()
  const [searchText, setSearchText] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('businesses')

  const debouncedSearch = useDebounce(searchText, 350)

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', searchType, debouncedSearch],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!debouncedSearch.trim()) return []

      if (searchType === 'businesses') {
        const { data, error } = await supabase.rpc('search_businesses', {
          search_query: debouncedSearch,
          limit_count: 20,
        })
        if (error || !data) {
          // Fallback: basic ilike search
          const { data: fallback } = await supabase
            .from('businesses')
            .select('id, name, logo_url')
            .ilike('name', `%${debouncedSearch}%`)
            .limit(20)
          return (fallback ?? []) as SearchResult[]
        }
        return (data as SearchResult[]) ?? []
      }

      if (searchType === 'services') {
        const { data, error } = await supabase.rpc('search_services', {
          search_query: debouncedSearch,
          limit_count: 20,
        })
        if (error || !data) {
          const { data: fallback } = await supabase
            .from('services')
            .select('id, name')
            .ilike('name', `%${debouncedSearch}%`)
            .limit(20)
          return (fallback ?? []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
          }))
        }
        return (data as SearchResult[]) ?? []
      }

      // professionals
      const { data, error } = await supabase.rpc('search_professionals', {
        search_query: debouncedSearch,
        limit_count: 20,
      })
      if (error || !data) {
        const { data: fallback } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .ilike('full_name', `%${debouncedSearch}%`)
          .limit(20)
        return (fallback ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.full_name as string,
          logo_url: p.avatar_url as string | null,
        }))
      }
      return (data as SearchResult[]) ?? []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const TYPES: { key: SearchType; label: string }[] = [
    { key: 'businesses', label: 'Negocios' },
    { key: 'services', label: 'Servicios' },
    { key: 'professionals', label: 'Profesionales' },
  ]

  const handleResultPress = (item: SearchResult) => {
    if (searchType === 'businesses') {
      (navigation as any).navigate('BusinessProfile', { businessId: item.id })
    }
  }

  return (
    <Screen>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Buscar negocios, servicios, profesionales..."
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type tabs */}
      <View style={styles.tabs}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, searchType === t.key && styles.tabActive]}
            onPress={() => setSearchType(t.key)}
          >
            <Text style={[styles.tabText, searchType === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            debouncedSearch.length >= 2 ? (
              <EmptyState
                icon="search-outline"
                title="Sin resultados"
                message={`No se encontraron ${TYPES.find(t => t.key === searchType)?.label.toLowerCase()} para "${debouncedSearch}"`}
              />
            ) : (
              <View style={styles.hint}>
                <Ionicons name="search" size={48} color={colors.border} />
                <Text style={styles.hintText}>Escribe al menos 2 caracteres para buscar</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleResultPress(item)}>
              <Avatar name={item.name} uri={item.logo_url ?? undefined} size={44} />
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.city && (
                  <Text style={styles.cardSub}>
                    <Ionicons name="location-outline" size={11} color={colors.textMuted} />{' '}
                    {item.city}
                  </Text>
                )}
              </View>
              {item.average_rating != null && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{item.average_rating.toFixed(1)}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  hint: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    gap: spacing.md,
  },
  hintText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
