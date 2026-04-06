import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, radius } from '../../theme'

type Props = {
  reviewerName?: string
  rating: number
  comment: string | null
  date: string
  response?: string | null
  onRespond?: () => void
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < rating ? 'star' : 'star-outline'}
          size={14}
          color={i < rating ? '#f59e0b' : colors.border}
        />
      ))}
    </View>
  )
}

export default function ReviewCard({ reviewerName, rating, comment, date, response, onRespond }: Props) {
  const formattedDate = new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {reviewerName ? reviewerName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewer}>{reviewerName ?? 'Cliente anónimo'}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <StarRow rating={rating} />
      </View>

      {comment ? (
        <Text style={styles.comment}>{comment}</Text>
      ) : null}

      {response && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Respuesta del negocio</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      )}

      {!response && onRespond && (
        <TouchableOpacity style={styles.respondBtn} onPress={onRespond}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
          <Text style={styles.respondText}>Responder</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyBold, color: colors.primary },
  reviewer: { ...typography.bodyBold, color: colors.text },
  date: { ...typography.caption, color: colors.textMuted },
  comment: { ...typography.body, color: colors.text, marginTop: spacing.xs },
  responseBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  responseLabel: { ...typography.caption, color: colors.primary, marginBottom: 2 },
  responseText: { ...typography.body, color: colors.text },
  respondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  respondText: { ...typography.caption, color: colors.primary },
})
