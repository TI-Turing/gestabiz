import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

export default function ClientProfileScreen() {
  const { user, signOut } = useAuth()
  const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)
  const qc = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PROFILE(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      return data
    },
    enabled: !!user,
    ...QUERY_CONFIG.STABLE,
  })

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() || null }).eq('id', user!.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE(user?.id ?? '') })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const otherRoles = roles.filter((r) => !(r.role === activeRole && r.business_id === activeBusiness))

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen scrollable>
      <View style={styles.avatarArea}>
        <Avatar name={fullName} uri={profile?.avatar_url} size={80} />
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      {saved && <View style={styles.successBanner}><Text style={styles.successText}>✓ Perfil actualizado</Text></View>}

      <Text style={styles.sectionTitle}>Mi información</Text>
      <Input label="Nombre completo" value={fullName} onChangeText={setFullName} placeholder="Tu nombre" autoCapitalize="words" />
      <Input label="Teléfono" value={phone} onChangeText={setPhone} placeholder="+57 300 000 0000" keyboardType="phone-pad" />

      <Button title="Guardar cambios" onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} style={styles.saveBtn} />

      {otherRoles.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Cambiar rol</Text>
          {otherRoles.map((r) => (
            <Button
              key={r.id}
              title={`Ir a ${r.role === 'admin' ? 'Admin' : r.role === 'employee' ? 'Empleado' : 'Cliente'}${r.business_name ? ` — ${r.business_name}` : ''}`}
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
  avatarArea: { alignItems: 'center', marginBottom: spacing.lg },
  emailText: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.xs },
  successBanner: { backgroundColor: '#064e3b', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  successText: { color: '#34d399', textAlign: 'center', fontWeight: '600' },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  saveBtn: { marginTop: spacing.sm },
  roleBtn: { marginBottom: spacing.sm },
})
