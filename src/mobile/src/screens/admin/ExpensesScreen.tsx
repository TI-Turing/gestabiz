import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useUserRoles } from '../../hooks/useUserRoles'
import { useAuth } from '../../contexts/AuthContext'
import { useTransactions } from '../../hooks/useTransactions'
import { supabase } from '../../lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import EmptyState from '../../components/ui/EmptyState'
import { QUERY_CONFIG } from '../../lib/queryClient'

interface Expense {
  id: string
  amount: number
  description?: string | null
  category?: string | null
  created_at: string
  status: string
}

const EXPENSE_CATEGORIES = [
  'supplies', 'equipment', 'utilities', 'payroll', 'marketing',
  'rent', 'insurance', 'maintenance', 'software', 'other'
]

const CAT_LABELS: Record<string, string> = {
  supplies: 'Insumos',
  equipment: 'Equipos',
  utilities: 'Servicios',
  payroll: 'Nómina',
  marketing: 'Mercadeo',
  rent: 'Arriendo',
  insurance: 'Seguros',
  maintenance: 'Mantenimiento',
  software: 'Software',
  other: 'Otro',
}

export default function ExpensesScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness

  const [filter, setFilter] = useState<'all' | 'month'>('month')

  const since = filter === 'month'
    ? (() => { const d = new Date(); d.setDate(1); return d.toISOString() })()
    : undefined

  const { transactions: expenses, totalExpense: total, isLoading, refetch, isRefetching } = useTransactions({
    businessId: businessId ?? '',
    type: 'expense',
    startDate: since,
  })

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
        <Text style={styles.title}>Gastos</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'month' && styles.filterActive]}
            onPress={() => setFilter('month')}
          >
            <Text style={[styles.filterText, filter === 'month' && styles.filterTextActive]}>
              Este mes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total gastos</Text>
        <Text style={styles.summaryAmount}>
          ${total.toLocaleString('es-CO')} COP
        </Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState icon="wallet-outline" title="Sin gastos" message="No hay gastos registrados" />
        }
        renderItem={({ item }) => {
          const date = new Date(item.created_at).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
          const catLabel = item.category ? (CAT_LABELS[item.category] ?? item.category) : 'Sin categoría'

          return (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="receipt-outline" size={20} color={colors.error} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.description} numberOfLines={1}>
                  {item.description ?? 'Sin descripción'}
                </Text>
                <Text style={styles.meta}>{catLabel} · {date}</Text>
              </View>
              <Text style={styles.amount}>-${item.amount.toLocaleString('es-CO')}</Text>
            </View>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.xs },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#fee2e2',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryLabel: { ...typography.caption, color: '#991b1b', fontWeight: '600' },
  summaryAmount: { ...typography.h2, color: '#dc2626', fontWeight: '800', marginTop: 4 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  description: { ...typography.bodyBold, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...typography.bodyBold, color: colors.error, fontWeight: '700' },
})
