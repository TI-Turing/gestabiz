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
  { label: 'Ausencias', icon: 'calendar-outline', screen: 'Ausencias', description: 'Aprueba solicitudes de ausencia', color: '#ef4444' },
  { label: 'Ventas', icon: 'bar-chart-outline', screen: 'Ventas', description: 'Historial de citas completadas', color: '#3b82f6' },
  { label: 'Configuración', icon: 'settings-outline', screen: 'Configuracion', description: 'Ajustes del negocio y tu cuenta', color: '#8b5cf6' },
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
