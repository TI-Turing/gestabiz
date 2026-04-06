import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useFavorites } from '../../hooks/useFavorites'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

// ─── Component ────────────────────────────────────────────────────────────────

export default function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>()
  const { user } = useAuth()
  const { favorites, isLoading, isFavorite, toggleFavorite } = useFavorites(user?.id)

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Favoritos</Text>
        <Text style={styles.subtitle}>
          {favorites.length} {favorites.length === 1 ? 'negocio guardado' : 'negocios guardados'}
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Sin favoritos aún"
            message="Explora negocios y guarda tus preferidos para acceder rápido"
            action={{ label: 'Explorar negocios', onPress: () => navigation.navigate('Buscar' as never) }}
          />
        }
        renderItem={({ item }) => {
          const biz = item.business
          const name = biz?.name ?? 'Negocio'
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                (navigation as any).navigate('BusinessProfile', { businessId: item.business_id })
              }
            >
              <Avatar
                name={name}
                uri={biz?.logo_url ?? undefined}
                size={52}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{name}</Text>
                <Text style={styles.cardSub}>Toca para ver el perfil</Text>
              </View>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => toggleFavorite(item.business_id)}
              >
                <Ionicons
                  name={isFavorite(item.business_id) ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite(item.business_id) ? colors.error : colors.textMuted}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        }}
      />
    </Screen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
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
})
