import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'

interface MenuItem {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  screen: string
  description: string
  color: string
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Servicios', icon: 'briefcase-outline', screen: 'Servicios', description: 'Gestiona los servicios de tu negocio', color: '#6366f1' },
  { label: 'Empleados', icon: 'people-outline', screen: 'Empleados', description: 'Administra tu equipo de trabajo', color: '#10b981' },
  { label: 'Sedes', icon: 'location-outline', screen: 'Sedes', description: 'Configura tus ubicaciones', color: '#f59e0b' },
  { label: 'Recursos', icon: 'cube-outline', screen: 'Recursos', description: 'Gestiona recursos y espacios físicos', color: '#14b8a6' },
  { label: 'Ausencias', icon: 'calendar-outline', screen: 'Ausencias', description: 'Aprueba solicitudes de ausencia', color: '#ef4444' },
  { label: 'Reclutamiento', icon: 'person-add-outline', screen: 'Reclutamiento', description: 'Vacantes y candidatos', color: '#ec4899' },
  { label: 'Ventas', icon: 'bar-chart-outline', screen: 'Ventas', description: 'Historial de citas completadas', color: '#3b82f6' },
  { label: 'Ventas Rápidas', icon: 'cart-outline', screen: 'VentasRapidas', description: 'Registra ventas walk-in', color: '#84cc16' },
  { label: 'Gastos', icon: 'wallet-outline', screen: 'Gastos', description: 'Gestiona los gastos del negocio', color: '#f97316' },
  { label: 'Reportes', icon: 'stats-chart-outline', screen: 'Reportes', description: 'Análisis y estadísticas financieras', color: '#0ea5e9' },
  { label: 'Facturación', icon: 'card-outline', screen: 'Facturacion', description: 'Suscripción y métodos de pago', color: '#a855f7' },
  { label: 'Código QR', icon: 'qr-code-outline', screen: 'QR', description: 'QR de tu negocio para clientes', color: '#64748b' },
  { label: 'Mensajes', icon: 'chatbubble-outline', screen: 'ConversacionList', description: 'Chat con clientes y empleados', color: '#22c55e' },
  { label: 'Notificaciones', icon: 'notifications-outline', screen: 'Notificaciones', description: 'Historial de alertas y avisos', color: '#eab308' },
  { label: 'Permisos', icon: 'shield-outline', screen: 'Permisos', description: 'Control de acceso por rol', color: '#dc2626' },
  { label: 'Config. del negocio', icon: 'business-outline', screen: 'Configuracion', description: 'Ajustes y datos del negocio', color: '#8b5cf6' },
  { label: 'Ajustes de cuenta', icon: 'settings-outline', screen: 'Ajustes', description: 'Tu perfil y preferencias', color: '#94a3b8' },
]

export default function MoreScreen({ navigation }: { navigation: { navigate: (s: string) => void } }) {
  return (
    <Screen scrollable>
      <Text style={styles.title}>Más opciones</Text>
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: typography['2xl'], fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  iconWrap: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  itemDesc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
})
