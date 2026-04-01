import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Linking } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Business, Service, Location, Review } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

type Tab = 'servicios' | 'info' | 'resenas'

async function fetchBusinessProfile(businessId: string) {
  const [bizRes, servRes, locRes, revRes] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('services').select('*').eq('business_id', businessId).eq('is_active', true).order('name'),
    supabase.from('locations').select('*').eq('business_id', businessId).eq('is_active', true),
    supabase.from('reviews').select('*, reviewer:profiles(full_name)').eq('business_id', businessId).eq('is_visible', true).order('created_at', { ascending: false }).limit(10),
  ])
  return {
    business: bizRes.data as Business | null,
    services: (servRes.data ?? []) as Service[],
    locations: (locRes.data ?? []) as Location[],
    reviews: (revRes.data ?? []) as (Review & { reviewer: { full_name: string } | null })[],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BusinessProfileScreen({ route, navigation }: { route: any; navigation: any }) {
  const { businessId } = route.params
  const [tab, setTab] = useState<Tab>('servicios')

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.BUSINESS(businessId),
    queryFn: () => fetchBusinessProfile(businessId),
    ...QUERY_CONFIG.STABLE,
  })

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const avgRating = data?.reviews?.length
    ? data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length
    : null

  if (isLoading) return <LoadingSpinner fullScreen />
  if (!data?.business) return null

  const { business, services, locations, reviews } = data

  return (
    <Screen scrollable>
      {/* Banner */}
      {business.banner_url ? (
        <Image source={{ uri: business.banner_url }} style={styles.banner} resizeMode="cover" />
      ) : (
        <View style={[styles.banner, { backgroundColor: colors.primary }]}>
          <Ionicons name="business-outline" size={48} color={colors.text + '66'} />
        </View>
      )}

      {/* Header info */}
      <View style={styles.headerInfo}>
        {business.logo_url && (
          <Image source={{ uri: business.logo_url }} style={styles.logo} />
        )}
        <Text style={styles.bizName}>{business.name}</Text>
        {avgRating != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.ratingText}>{avgRating.toFixed(1)} ({reviews.length} reseñas)</Text>
          </View>
        )}
        {business.description && <Text style={styles.desc}>{business.description}</Text>}
      </View>

      {/* CTA reservar */}
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => navigation.navigate('Reservar')}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.text} />
        <Text style={styles.bookBtnText}>Reservar cita</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['servicios', 'info', 'resenas'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {{ servicios: 'Servicios', info: 'Info', resenas: 'Reseñas' }[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {tab === 'servicios' && services.map((s) => (
        <View key={s.id} style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{s.name}</Text>
            <Text style={styles.serviceMeta}>{s.duration} min</Text>
          </View>
          <Text style={styles.servicePrice}>{formatCOP(s.price)}</Text>
        </View>
      ))}

      {tab === 'info' && (
        <View style={styles.infoSection}>
          {locations.map((loc) => (
            <View key={loc.id} style={styles.locationCard}>
              <Text style={styles.locName}>{loc.name}</Text>
              <Text style={styles.locAddress}>{loc.address}</Text>
              <Text style={styles.locHours}>{loc.opens_at} — {loc.closes_at}</Text>
              {loc.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${loc.phone}`)}>
                  <Text style={styles.locPhone}>{loc.phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {business.phone && (
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${business.phone}`)}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={styles.contactText}>{business.phone}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {tab === 'resenas' && (
        reviews.length === 0
          ? <Text style={styles.noReviews}>Sin reseñas aún</Text>
          : reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{r.reviewer?.full_name ?? 'Usuario'}</Text>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < r.rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
                  ))}
                </View>
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
            </View>
          ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  banner: { height: 180, width: '100%', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { padding: spacing.base },
  logo: { width: 60, height: 60, borderRadius: radius.lg, marginBottom: spacing.sm },
  bizName: { fontSize: typography['2xl'], fontWeight: '800', color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: typography.sm, color: colors.textSecondary },
  desc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, margin: spacing.base, borderRadius: radius.lg, padding: spacing.base, gap: spacing.xs },
  bookBtnText: { fontSize: typography.lg, fontWeight: '700', color: colors.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: spacing.base },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  serviceInfo: {},
  serviceName: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  serviceMeta: { fontSize: typography.sm, color: colors.textSecondary },
  servicePrice: { fontSize: typography.base, fontWeight: '700', color: colors.success },
  infoSection: { padding: spacing.base },
  locationCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  locName: { fontSize: typography.base, fontWeight: '700', color: colors.text },
  locAddress: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  locHours: { fontSize: typography.sm, color: colors.primary, marginTop: 4 },
  locPhone: { fontSize: typography.sm, color: colors.info, marginTop: 2 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  contactText: { color: colors.primary, fontSize: typography.base },
  reviewCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, marginHorizontal: spacing.base, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  reviewerName: { fontSize: typography.sm, fontWeight: '700', color: colors.text },
  stars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },
  noReviews: { color: colors.textSecondary, padding: spacing.base, textAlign: 'center' },
})
