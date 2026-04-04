import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import ReviewCard from './ReviewCard'
import { QUERY_CONFIG } from '../../lib/queryClient'

type Props = {
  businessId?: string
  employeeId?: string
  reviewType?: 'business' | 'employee'
  onRespond?: (reviewId: string) => void
}

export default function ReviewList({ businessId, employeeId, reviewType = 'business', onRespond }: Props) {
  const queryKey = ['reviews', businessId ?? employeeId ?? 'all']

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from('reviews')
        .select('id, rating, comment, created_at, review_type, response, reviewer_id, profiles:reviewer_id (full_name)')
        .eq('review_type', reviewType)
        .order('created_at', { ascending: false })
        .limit(50)

      if (businessId) q = q.eq('business_id', businessId)
      if (employeeId) q = q.eq('employee_id', employeeId)

      const { data } = await q
      return data ?? []
    },
    enabled: !!(businessId || employeeId),
    ...QUERY_CONFIG.STABLE,
  })

  const reviews = data ?? []

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="star-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyText}>Sin reseñas aún</Text>
      </View>
    )
  }

  // Aggregate rating
  const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / reviews.length

  return (
    <View>
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.avgNumber}>{avgRating.toFixed(1)}</Text>
        <View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(avgRating) ? 'star' : 'star-outline'}
                size={16}
                color={i < Math.round(avgRating) ? '#f59e0b' : colors.border}
              />
            ))}
          </View>
          <Text style={styles.reviewCount}>{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <ReviewCard
            rating={item.rating}
            comment={item.comment}
            date={item.created_at}
            reviewerName={(item.profiles as any)?.full_name}
            response={item.response}
            onRespond={onRespond ? () => onRespond(item.id) : undefined}
          />
        )}
        scrollEnabled={false}
        contentContainerStyle={{ paddingTop: spacing.sm }}
        onRefresh={refetch}
        refreshing={isRefetching}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  avgNumber: { fontSize: 40, fontWeight: '800', color: colors.text },
  reviewCount: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
})
