import React from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useFavorites, FavoriteBusiness } from '../../hooks/useFavorites'
import { spacing, typography, radius, shadows } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { BusinessCard, BusinessCardData } from '../../components/cards/BusinessCard'

function toCardData(fav: FavoriteBusiness): BusinessCardData {
  const b = fav.business
  return {
    id: fav.business_id,
    name: b?.name ?? 'Negocio',
    logoUrl: b?.logo_url ?? undefined,
    bannerUrl: b?.banner_url ?? undefined,
    averageRating: b?.average_rating ?? undefined,
    reviewCount: b?.review_count ?? undefined,
    city: b?.city ?? undefined,
  }
}

export default function FavoritesScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { theme } = useTheme()
  const { favorites, isLoading, isFetching, refetch, toggleFavorite } = useFavorites(user?.id)

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Mis Favoritos</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {favorites.length} {favorites.length === 1 ? 'negocio guardado' : 'negocios guardados'}
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, favorites.length === 0 && { flex: 1 }]}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <EmptyState
              icon="heart-outline"
              title="Aún no tienes favoritos"
              message="Explora negocios y guarda los que más te gusten para acceder rápido"
            />
            <TouchableOpacity
              style={[styles.emptyCta, { backgroundColor: theme.primary }, shadows.sm]}
              onPress={() => navigation.navigate('Buscar')}
              activeOpacity={0.85}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.emptyCtaText}>Explorar negocios</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <BusinessCard
              business={toCardData(item)}
              onPress={(id) => navigation.navigate('BusinessProfile', { businessId: id })}
            />
            {/* Heart overlay */}
            <TouchableOpacity
              style={[styles.heartOverlay, shadows.md]}
              onPress={() => toggleFavorite(item.business_id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="heart" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography['2xl'], fontWeight: '700' },
  subtitle: { fontSize: typography.sm, marginTop: 3 },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  cardWrapper: {
    position: 'relative',
  },
  heartOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.sm,
  },
})
