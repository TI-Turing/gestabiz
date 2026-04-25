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
import { useTheme } from '../../contexts/ThemeContext'
import { useDebounce } from '../../hooks/useDebounce'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
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
  const { theme } = useTheme()
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
      {/* ── Barra de búsqueda ── */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <Ionicons name="search-outline" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Buscar negocios, servicios, profesionales..."
          placeholderTextColor={theme.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tabs de tipo ── */}
      <View
        style={[
          styles.tabs,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.tab,
              searchType === t.key
                ? { backgroundColor: theme.primary }
                : { backgroundColor: 'transparent' },
            ]}
            onPress={() => setSearchType(t.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: searchType === t.key ? '#fff' : theme.textSecondary },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Resultados ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
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
                <Ionicons name="search" size={48} color={theme.border} />
                <Text style={[styles.hintText, { color: theme.textMuted }]}>
                  Escribe al menos 2 caracteres para buscar
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
              onPress={() => handleResultPress(item)}
              activeOpacity={0.75}
            >
              <Avatar name={item.name} uri={item.logo_url ?? undefined} size={44} />
              <View style={styles.cardContent}>
                <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
                {item.city && (
                  <View style={styles.cardSubRow}>
                    <Ionicons name="location-outline" size={11} color={theme.textMuted} />
                    <Text style={[styles.cardSub, { color: theme.textMuted }]}>{item.city}</Text>
                  </View>
                )}
                {item.review_count != null && item.review_count > 0 && (
                  <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                    {item.review_count} {item.review_count === 1 ? 'reseña' : 'reseñas'}
                  </Text>
                )}
              </View>
              {item.average_rating != null && (
                <View
                  style={[
                    styles.ratingBadge,
                    { backgroundColor: 'rgba(245,158,11,0.15)' },
                  ]}
                >
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={[styles.ratingText, { color: theme.text }]}>
                    {item.average_rating.toFixed(1)}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
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
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    paddingVertical: 0,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[8],
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing[8],
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: typography.base,
    fontWeight: '600',
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  cardSub: {
    fontSize: typography.xs,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  ratingText: {
    fontSize: typography.xs,
    fontWeight: '700',
  },
  hint: {
    alignItems: 'center',
    paddingTop: spacing[8],
    gap: spacing.md,
  },
  hintText: {
    fontSize: typography.base,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
})

