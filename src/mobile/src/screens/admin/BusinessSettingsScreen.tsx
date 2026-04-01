import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, ScrollView, Switch } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Business } from '../../types'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

interface BusinessForm {
  name: string
  description: string
  phone: string
  email: string
  website: string
  address: string
}

async function fetchBusiness(businessId: string): Promise<Business | null> {
  const { data } = await supabase.from('businesses').select('*').eq('id', businessId).single()
  return (data as Business | null)
}

export default function BusinessSettingsScreen() {
  const { user, signOut } = useAuth()
  const { activeBusiness, roles, activeRole, switchRole } = useUserRoles(user)
  const qc = useQueryClient()

  const [form, setForm] = useState<BusinessForm>({ name: '', description: '', phone: '', email: '', website: '', address: '' })
  const [saved, setSaved] = useState(false)

  const { data: business, isLoading } = useQuery({
    queryKey: QUERY_KEYS.BUSINESS(activeBusiness ?? ''),
    queryFn: () => fetchBusiness(activeBusiness!),
    enabled: !!activeBusiness,
    ...QUERY_CONFIG.STABLE,
  })

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name ?? '',
        description: business.description ?? '',
        phone: business.phone ?? '',
        email: business.email ?? '',
        website: business.website ?? '',
        address: business.address ?? '',
      })
    }
  }, [business])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('El nombre del negocio es requerido')
      await supabase.from('businesses').update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        address: form.address.trim() || null,
      }).eq('id', activeBusiness!)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS(activeBusiness ?? '') })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const otherRoles = roles.filter((r) => !(r.role === activeRole && r.business_id === activeBusiness))

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen scrollable>
      <Text style={styles.sectionTitle}>Información del negocio</Text>

      {saved && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ Cambios guardados</Text>
        </View>
      )}

      <Input label="Nombre del negocio *" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Mi Negocio" />
      <Input label="Descripción" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Describe tu negocio..." />
      <Input label="Teléfono" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+57 300 000 0000" keyboardType="phone-pad" />
      <Input label="Email de contacto" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="negocio@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
      <Input label="Sitio web" value={form.website} onChangeText={(v) => setForm((f) => ({ ...f, website: v }))} placeholder="https://mi-negocio.com" autoCapitalize="none" />
      <Input label="Dirección" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Calle 123 #45-67" />

      <Button title="Guardar cambios" onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} style={styles.saveBtn} />

      {/* Cambiar rol */}
      {otherRoles.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Cambiar rol</Text>
          {otherRoles.map((r) => (
            <Button
              key={r.id}
              title={`Cambiar a ${r.role === 'admin' ? 'Admin' : r.role === 'employee' ? 'Empleado' : 'Cliente'}${r.business_name ? ` — ${r.business_name}` : ''}`}
              onPress={() => switchRole(r.role, r.business_id)}
              variant="secondary"
              style={styles.roleBtn}
            />
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Cuenta</Text>
      <Button
        title="Cerrar sesión"
        onPress={() => Alert.alert('Cerrar sesión', '¿Estás seguro?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
        ])}
        variant="danger"
        icon="log-out-outline"
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  successBanner: { backgroundColor: '#064e3b', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  successText: { color: '#34d399', fontSize: typography.sm, fontWeight: '600', textAlign: 'center' },
  saveBtn: { marginTop: spacing.lg, marginBottom: spacing.sm },
  roleBtn: { marginBottom: spacing.sm },
})
