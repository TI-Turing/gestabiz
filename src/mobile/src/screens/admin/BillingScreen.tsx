import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { useSubscription } from '../../hooks/useSubscription'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  inicio: '#3b82f6',
  profesional: '#8b5cf6',
  empresarial: '#f59e0b',
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['1 sede', '1 empleado', '3 citas/mes', 'Soporte básico'],
  inicio: ['3 sedes', '10 empleados', 'Citas ilimitadas', 'Soporte prioritario', 'Reportes básicos'],
  profesional: ['Sedes ilimitadas', 'Empleados ilimitados', 'Analytics avanzados', 'API access', 'Soporte 24/7'],
}

export default function BillingScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness

  const { subscription, isLoading, isActive, isPro, daysRemaining } = useSubscription(businessId ?? '')

  const planColor = PLAN_COLORS[subscription?.plan_id ?? 'free'] ?? PLAN_COLORS.free
  const planName = subscription?.plan_name ?? 'Gratuito'
  const planFeatures = PLAN_FEATURES[subscription?.plan_id ?? 'free'] ?? PLAN_FEATURES.free

  const handleManageBilling = () => {
    Linking.openURL('https://gestabiz.com/app/admin/billing')
  }

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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Facturación</Text>

        {/* Current plan card */}
        <View style={[styles.planCard, { borderColor: planColor }]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planLabel}>Plan actual</Text>
              <Text style={[styles.planName, { color: planColor }]}>{planName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[styles.statusText, { color: isActive ? '#166534' : '#991b1b' }]}>
                {isActive ? 'Activo' : (subscription?.status ?? 'Inactivo')}
              </Text>
            </View>
          </View>

          {/* Billing period */}
          {subscription && (
            <View style={styles.periodRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.periodText}>
                {subscription.cancel_at_period_end
                  ? `Cancela el ${new Date(subscription.current_period_end).toLocaleDateString('es-CO')}`
                  : `Renueva el ${new Date(subscription.current_period_end).toLocaleDateString('es-CO')}`}
              </Text>
              {daysRemaining !== null && (
                <Text style={styles.daysText}>({daysRemaining}d restantes)</Text>
              )}
            </View>
          )}

          {/* Amount */}
          {subscription?.amount != null && subscription.amount > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amount}>
                ${subscription.amount.toLocaleString('es-CO')} {subscription.currency ?? 'COP'}/mes
              </Text>
            </View>
          )}
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Incluye en tu plan</Text>
          {planFeatures.map(feature => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={planColor} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade CTA */}
        {!isPro && (
          <View style={styles.upgradeCard}>
            <Ionicons name="rocket-outline" size={24} color={colors.primary} />
            <Text style={styles.upgradeTitle}>Mejora tu plan</Text>
            <Text style={styles.upgradeText}>
              Desbloquea funciones avanzadas con el plan Profesional o Empresarial.
            </Text>
          </View>
        )}

        {/* Manage button */}
        <TouchableOpacity style={styles.manageBtn} onPress={handleManageBilling}>
          <Ionicons name="open-outline" size={16} color={colors.primary} />
          <Text style={styles.manageBtnText}>Gestionar facturación en la web</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planLabel: { ...typography.caption, color: colors.textMuted },
  planName: { ...typography.h2, fontWeight: '800', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: { ...typography.caption, fontWeight: '700' },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  periodText: { ...typography.caption, color: colors.textMuted },
  daysText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  amountRow: { marginTop: spacing.sm },
  amount: { ...typography.h3, color: colors.text, fontWeight: '700' },
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  featuresTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  featureText: { ...typography.body, color: colors.text },
  upgradeCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  upgradeTitle: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  upgradeText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  manageBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
})
