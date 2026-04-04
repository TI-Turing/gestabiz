import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'

type Props = {
  businessId: string
  appointmentId?: string
  employeeId?: string
  reviewType?: 'business' | 'employee'
  onSuccess?: () => void
}

export default function ReviewForm({ businessId, appointmentId, employeeId, reviewType = 'business', onSuccess }: Props) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      await supabase.from('reviews').insert({
        business_id: businessId,
        reviewer_id: user!.id,
        appointment_id: appointmentId,
        employee_id: employeeId,
        rating,
        comment: comment.trim() || null,
        review_type: reviewType,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', businessId] })
      qc.invalidateQueries({ queryKey: ['reviews', employeeId] })
      setRating(0)
      setComment('')
      onSuccess?.()
    },
  })

  const canSubmit = rating > 0 && !mutation.isPending

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dejar reseña</Text>

      {/* Star selector */}
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
            <Ionicons
              name={i < rating ? 'star' : 'star-outline'}
              size={32}
              color={i < rating ? '#f59e0b' : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.ratingLabel}>
          {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
        </Text>
      )}

      {/* Comment */}
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Cuenta tu experiencia (opcional)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
        numberOfLines={3}
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{comment.length}/500</Text>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.btn, !canSubmit && styles.btnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={!canSubmit}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.btnText}>Publicar reseña</Text>
        )}
      </TouchableOpacity>

      {mutation.isError && (
        <Text style={styles.errorText}>No se pudo publicar. Intenta de nuevo.</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  title: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  stars: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  ratingLabel: { ...typography.caption, color: '#f59e0b', marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.text,
    minHeight: 80,
    marginBottom: spacing.xs,
  },
  charCount: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end', marginBottom: spacing.md },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { ...typography.bodyBold, color: '#fff' },
  errorText: { ...typography.caption, color: colors.error ?? '#ef4444', marginTop: spacing.sm },
})
