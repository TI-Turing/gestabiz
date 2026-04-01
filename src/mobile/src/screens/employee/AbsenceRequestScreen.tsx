import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { AbsenceType } from '../../types'
import { QUERY_KEYS } from '../../lib/queryClient'

const ABSENCE_TYPES: { key: AbsenceType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'vacation', label: 'Vacaciones', icon: 'sunny-outline' },
  { key: 'sick_leave', label: 'Incapacidad', icon: 'medkit-outline' },
  { key: 'emergency', label: 'Emergencia', icon: 'alert-circle-outline' },
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'other', label: 'Otro', icon: 'ellipsis-horizontal-circle-outline' },
]

export default function AbsenceRequestScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const qc = useQueryClient()

  const [type, setType] = useState<AbsenceType>('vacation')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [reason, setReason] = useState('')
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (endDate < startDate) throw new Error('La fecha de fin debe ser posterior a la de inicio')
      const { error } = await supabase.from('employee_absences').insert({
        employee_id: user!.id,
        business_id: activeBusiness!,
        type,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        reason: reason.trim() || null,
        status: 'pending',
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ABSENCES(activeBusiness ?? '') })
      Alert.alert('Solicitud enviada', 'Tu solicitud de ausencia fue enviada al administrador para aprobación.', [{ text: 'OK', onPress: () => navigation.goBack() }])
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const formatDate = (d: Date) => d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Screen scrollable>
      <Text style={styles.title}>Solicitar ausencia</Text>

      {/* Tipo */}
      <Text style={styles.label}>Tipo de ausencia</Text>
      <View style={styles.typeGrid}>
        {ABSENCE_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeChip, type === t.key && styles.typeChipActive]}
            onPress={() => setType(t.key)}
          >
            <Ionicons name={t.icon} size={18} color={type === t.key ? colors.text : colors.textSecondary} />
            <Text style={[styles.typeLabel, type === t.key && styles.typeLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fechas */}
      <Text style={styles.label}>Período de ausencia</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <View style={styles.dateBtnContent}>
          <Text style={styles.dateBtnLabel}>Fecha de inicio</Text>
          <Text style={styles.dateBtnValue}>{formatDate(startDate)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <View style={styles.dateBtnContent}>
          <Text style={styles.dateBtnLabel}>Fecha de fin</Text>
          <Text style={styles.dateBtnValue}>{formatDate(endDate)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(_, date) => { setShowStartPicker(false); if (date) setStartDate(date) }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={startDate}
          onChange={(_, date) => { setShowEndPicker(false); if (date) setEndDate(date) }}
        />
      )}

      <Input
        label="Motivo (opcional)"
        value={reason}
        onChangeText={setReason}
        placeholder="Describe el motivo de la ausencia..."
      />

      {/* Aviso */}
      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={16} color={colors.info} />
        <Text style={styles.noticeText}>La solicitud debe ser aprobada por el administrador.</Text>
      </View>

      <Button
        title="Enviar solicitud"
        onPress={() => submitMutation.mutate()}
        loading={submitMutation.isPending}
        style={styles.submitBtn}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: typography['2xl'], fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: typography.base, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeLabel: { fontSize: typography.sm, color: colors.textSecondary },
  typeLabelActive: { color: colors.text, fontWeight: '600' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm },
  dateBtnContent: { flex: 1 },
  dateBtnLabel: { fontSize: typography.xs, color: colors.textSecondary },
  dateBtnValue: { fontSize: typography.base, fontWeight: '600', color: colors.text, marginTop: 2 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, backgroundColor: '#1e3a5f', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  noticeText: { fontSize: typography.sm, color: '#93c5fd', flex: 1 },
  submitBtn: { marginTop: spacing.lg },
})
