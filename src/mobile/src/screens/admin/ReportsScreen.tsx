import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { useFinancialReports } from '../../hooks/useFinancialReports'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'

interface KPICardProps {
  label: string
  value: number
  icon: string
  tint: string
}

function KPICard({ label, value, icon, tint }: KPICardProps) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: tint }]}>
      <View style={[styles.kpiIcon, { backgroundColor: tint + '20' }]}>
        <Ionicons name={icon as 'add'} size={20} color={tint} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tint }]}>
        ${value.toLocaleString('es-CO')}
      </Text>
    </View>
  )
}

interface BarProps {
  label: string
  income: number
  expense: number
  maxVal: number
}

function MiniBar({ label, income, expense, maxVal }: BarProps) {
  const iW = maxVal > 0 ? (income / maxVal) * 100 : 0
  const eW = maxVal > 0 ? (expense / maxVal) * 100 : 0
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${iW}%`, backgroundColor: colors.success }]} />
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${eW}%`, backgroundColor: colors.error }]} />
      </View>
    </View>
  )
}

export default function ReportsScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness

  const threeMonthsAgo = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString()
  })()

  const { report, isLoading } = useFinancialReports(
    businessId ?? '',
    threeMonthsAgo
  )

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    )
  }

  const maxPeriodVal = Math.max(
    ...(report?.byPeriod ?? []).flatMap(p => [p.income, p.expense])
  ) || 1

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Reportes</Text>

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <KPICard
            label="Ingresos"
            value={report?.totalIncome ?? 0}
            icon="trending-up-outline"
            tint={colors.success}
          />
          <KPICard
            label="Gastos"
            value={report?.totalExpense ?? 0}
            icon="trending-down-outline"
            tint={colors.error}
          />
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.kpiLabel}>Balance neto</Text>
          <Text
            style={[
              styles.kpiValueLg,
              { color: (report?.netBalance ?? 0) >= 0 ? colors.success : colors.error },
            ]}
          >
            {(report?.netBalance ?? 0) >= 0 ? '+' : ''}$
            {(report?.netBalance ?? 0).toLocaleString('es-CO')}
          </Text>
        </View>

        {/* Period bars */}
        {(report?.byPeriod?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingresos vs Gastos por período</Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={styles.legendLabel}>Ingresos</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                <Text style={styles.legendLabel}>Gastos</Text>
              </View>
            </View>
            {(report!.byPeriod ?? []).slice(-6).map(p => (
              <MiniBar
                key={p.period}
                label={p.period}
                income={p.income}
                expense={p.expense}
                maxVal={maxPeriodVal}
              />
            ))}
          </View>
        )}

        {/* Top categories */}
        {(report?.topCategories?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top categorías de ingreso</Text>
            {(report!.topCategories ?? []).slice(0, 5).map(cat => (
              <View key={cat.category} style={styles.catRow}>
                <Text style={styles.catName}>{cat.category}</Text>
                <Text style={styles.catAmount}>${cat.total.toLocaleString('es-CO')}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  kpiGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  kpiLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  kpiValue: { ...typography.h3, fontWeight: '800' },
  kpiValueLg: { ...typography.h2, fontWeight: '800', marginTop: 4 },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  legend: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { ...typography.caption, color: colors.textMuted },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  barLabel: { ...typography.caption, color: colors.textMuted, width: 50 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catName: { ...typography.body, color: colors.text, textTransform: 'capitalize' },
  catAmount: { ...typography.bodyBold, color: colors.primary },
})
