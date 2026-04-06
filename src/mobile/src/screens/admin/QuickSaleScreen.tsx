import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import { QUERY_CONFIG } from '../../lib/queryClient'

interface TodaySale {
  total: number
  count: number
}

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Efectivo', icon: 'cash-outline' },
  { key: 'card', label: 'Tarjeta', icon: 'card-outline' },
  { key: 'transfer', label: 'Transferencia', icon: 'swap-horizontal-outline' },
]

export default function QuickSaleScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Today's stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todayStats = { total: 0, count: 0 }, refetch: refetchStats } = useQuery({
    queryKey: ['quick-sales-today', businessId],
    queryFn: async (): Promise<TodaySale> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('business_id', businessId!)
        .eq('type', 'income')
        .eq('category', 'service_sale')
        .gte('created_at', today.toISOString())

      if (error || !data) return { total: 0, count: 0 }
      return {
        total: (data as { amount: number }[]).reduce((acc, t) => acc + (t.amount ?? 0), 0),
        count: data.length,
      }
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const { mutate: createSale, isPending } = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'))
      if (isNaN(numAmount) || numAmount <= 0) throw new Error('Monto inválido')

      const { error } = await supabase.from('transactions').insert({
        business_id: businessId,
        type: 'income',
        category: 'service_sale',
        amount: numAmount,
        description: notes || `Venta rápida - ${clientName || 'Cliente nuevo'}`,
        status: 'completed',
        payment_method: paymentMethod,
        metadata: { client_name: clientName, client_phone: clientPhone },
      })
      if (error) throw error
    },
    onSuccess: () => {
      setClientName('')
      setClientPhone('')
      setAmount('')
      setNotes('')
      setPaymentMethod('cash')
      refetchStats()
    },
  })

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Venta Rápida</Text>

          {/* Today stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ventas hoy</Text>
              <Text style={styles.statValue}>{todayStats.count}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total hoy</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                ${todayStats.total.toLocaleString('es-CO')}
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Datos del cliente</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del cliente"
                placeholderTextColor={colors.textMuted}
                value={clientName}
                onChangeText={setClientName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="Teléfono (opcional)"
                placeholderTextColor={colors.textMuted}
                value={clientPhone}
                onChangeText={setClientPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Venta</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto (COP)</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Método de pago</Text>
            <View style={styles.paymentRow}>
              {PAYMENT_METHODS.map(pm => (
                <TouchableOpacity
                  key={pm.key}
                  style={[styles.pmBtn, paymentMethod === pm.key && styles.pmBtnActive]}
                  onPress={() => setPaymentMethod(pm.key)}
                >
                  <Ionicons
                    name={pm.icon as 'add'}
                    size={18}
                    color={paymentMethod === pm.key ? '#fff' : colors.textMuted}
                  />
                  <Text style={[styles.pmLabel, paymentMethod === pm.key && styles.pmLabelActive]}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Servicio, descripción..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, isPending && styles.registerBtnDisabled]}
            onPress={() => createSale()}
            disabled={isPending || !amount}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.registerBtnText}>Registrar venta</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.h2, color: colors.text, fontWeight: '800', marginTop: 4 },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  amountInput: { ...typography.h3, fontWeight: '700', color: colors.primary },
  notesInput: { height: 60, textAlignVertical: 'top' },
  paymentRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  pmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pmBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pmLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  pmLabelActive: { color: '#fff' },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  registerBtnDisabled: { opacity: 0.5 },
  registerBtnText: { ...typography.bodyBold, color: '#fff', fontWeight: '700' },
})
