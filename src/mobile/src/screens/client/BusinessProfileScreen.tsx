import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Business, Service, Location, Review } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

type Tab = 'servicios' | 'sedes' | 'resenas' | 'acerca'

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
  const { theme } = useTheme()
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
  const TABS: { key: Tab; label: string }[] = [
    { key: 'servicios', label: 'Servicios' },
    { key: 'sedes', label: 'Sedes' },
    { key: 'resenas', label: 'Reseñas' },
    { key: 'acerca', label: 'Acerca' },
  ]

  return (
    <Screen scrollable>
      {/* Banner */}
      {business.banner_url ? (
        <Image source={{ uri: business.banner_url }} style={styles.banner} resizeMode="cover" />
      ) : (
        <View style={[styles.banner, { backgroundColor: theme.primary }]}>
          <Ionicons name="business-outline" size={48} color="rgba(255,255,255,0.5)" />
        </View>
      )}

      {/* Header info */}
      <View style={styles.headerInfo}>
        {business.logo_url && (
          <Image source={{ uri: business.logo_url }} style={styles.logo} />
        )}
        <Text style={[styles.bizName, { color: theme.text }]}>{business.name}</Text>
        {avgRating != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={[styles.ratingText, { color: theme.textSecondary }]}>{avgRating.toFixed(1)} ({reviews.length} reseñas)</Text>
          </View>
        )}
        {business.description && <Text style={[styles.desc, { color: theme.textSecondary }]}>{business.description}</Text>}
      </View>

      {/* CTA reservar */}
      <TouchableOpacity
        style={[styles.bookBtn, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Reservar')}
      >
        <Ionicons name="calendar-outline" size={20} color="#fff" />
        <Text style={styles.bookBtnText}>Reservar cita</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && { borderBottomWidth: 2, borderBottomColor: theme.primary }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[
                styles.tabText,
                { color: active ? theme.primary : theme.textSecondary },
                active && { fontWeight: '700' },
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Tab content */}
      {tab === 'servicios' && services.map((s) => (
        <View key={s.id} style={[styles.serviceRow, { borderBottomColor: theme.border }]}>
          <View style={styles.serviceInfo}>
            <Text style={[styles.serviceName, { color: theme.text }]}>{s.name}</Text>
            <Text style={[styles.serviceMeta, { color: theme.textSecondary }]}>{s.duration} min</Text>
          </View>
          <Text style={styles.servicePrice}>{formatCOP(s.price)}</Text>
        </View>
      ))}

      {tab === 'sedes' && (
        <View style={styles.infoSection}>
          {locations.length === 0 ? (
            <Text style={[styles.noReviews, { color: theme.textSecondary }]}>Este negocio aún no tiene sedes registradas.</Text>
          ) : (
            locations.map((loc) => (
              <View key={loc.id} style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.locHeader}>
                  <Ionicons name="location-outline" size={18} color={theme.primary} />
                  <Text style={[styles.locName, { color: theme.text }]}>{loc.name}</Text>
                </View>
                <Text style={[styles.locAddress, { color: theme.textSecondary }]}>{loc.address}</Text>
                <View style={styles.locMetaRow}>
                  <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.locHours, { color: theme.textSecondary }]}>{loc.opens_at} — {loc.closes_at}</Text>
                </View>
                {loc.phone && (
                  <TouchableOpacity
                    style={styles.locMetaRow}
                    onPress={() => Linking.openURL(`tel:${loc.phone}`)}
                  >
                    <Ionicons name="call-outline" size={14} color={theme.primary} />
                    <Text style={[styles.locPhone, { color: theme.primary }]}>{loc.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'acerca' && (
        <View style={styles.infoSection}>
          {business.description ? (
            <Text style={[styles.aboutText, { color: theme.text }]}>{business.description}</Text>
          ) : (
            <Text style={[styles.noReviews, { color: theme.textSecondary }]}>Sin descripción adicional.</Text>
          )}
          {business.phone && (
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${business.phone}`)}>
              <Ionicons name="call-outline" size={18} color={theme.primary} />
              <Text style={[styles.contactText, { color: theme.primary }]}>{business.phone}</Text>
            </TouchableOpacity>
          )}
          {business.email && (
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`mailto:${business.email}`)}>
              <Ionicons name="mail-outline" size={18} color={theme.primary} />
              <Text style={[styles.contactText, { color: theme.primary }]}>{business.email}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {tab === 'resenas' && (
        reviews.length === 0
          ? <Text style={[styles.noReviews, { color: theme.textSecondary }]}>Sin reseñas aún</Text>
          : reviews.map((r) => (
            <View key={r.id} style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewerName, { color: theme.text }]}>{r.reviewer?.full_name ?? 'Usuario'}</Text>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < r.rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
                  ))}
                </View>
              </View>
              {r.comment && <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>{r.comment}</Text>}
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
  bizName: { fontSize: typography['2xl'], fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: typography.sm },
  desc: { fontSize: typography.sm, marginTop: spacing.sm, lineHeight: 20 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: spacing.base, borderRadius: radius.lg, padding: spacing.base, gap: spacing.xs },
  bookBtnText: { fontSize: typography.lg, fontWeight: '700', color: '#fff' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: spacing.base },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabText: { fontWeight: '500' },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  serviceInfo: {},
  serviceName: { fontSize: typography.base, fontWeight: '600' },
  serviceMeta: { fontSize: typography.sm },
  servicePrice: { fontSize: typography.base, fontWeight: '700', color: '#22c55e' },
  infoSection: { padding: spacing.base },
  locationCard: { borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1 },
  locHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  locMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locName: { fontSize: typography.base, fontWeight: '700' },
  locAddress: { fontSize: typography.sm, marginTop: 2 },
  locHours: { fontSize: typography.sm },
  locPhone: { fontSize: typography.sm },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  contactText: { fontSize: typography.base },
  aboutText: { fontSize: typography.base, lineHeight: 22 },
  reviewCard: { borderRadius: radius.lg, padding: spacing.base, marginHorizontal: spacing.base, marginBottom: spacing.sm, borderWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  reviewerName: { fontSize: typography.sm, fontWeight: '700' },
  stars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: typography.sm, lineHeight: 20 },
  noReviews: { padding: spacing.base, textAlign: 'center' },
})
