import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Switch, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

interface ProfileForm {
  full_name: string
  phone: string
}

export default function EmployeeSettingsScreen() {
  const { user, signOut } = useAuth()
  const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)
  const qc = useQueryClient()
  const [form, setForm] = useState<ProfileForm>({ full_name: '', phone: '' })
  const [allowMessages, setAllowMessages] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: QUERY_KEYS.PROFILE(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      return data
    },
    enabled: !!user,
    ...QUERY_CONFIG.STABLE,
  })

  const { data: empRecord, isLoading: empLoading } = useQuery({
    queryKey: [...QUERY_KEYS.EMPLOYEES(activeBusiness ?? ''), user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_employees')
        .select('allow_client_messages')
        .eq('employee_id', user!.id)
        .eq('business_id', activeBusiness!)
        .single()
      return data
    },
    enabled: !!user && !!activeBusiness,
    ...QUERY_CONFIG.STABLE,
  })

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' })
  }, [profile])

  useEffect(() => {
    if (empRecord) setAllowMessages(empRecord.allow_client_messages ?? false)
  }, [empRecord])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        supabase.from('profiles').update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null }).eq('id', user!.id),
        activeBusiness && supabase.from('business_employees').update({ allow_client_messages: allowMessages }).eq('employee_id', user!.id).eq('business_id', activeBusiness),
      ])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE(user?.id ?? '') })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const otherRoles = roles.filter((r) => !(r.role === activeRole && r.business_id === activeBusiness))

  if (profileLoading || empLoading) return <LoadingSpinner fullScreen />

  return (
    <Screen scrollable>
      {/* Avatar */}
      <View style={styles.avatarArea}>
        <Avatar name={form.full_name} uri={profile?.avatar_url} size={72} />
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {saved && <View style={styles.banner}><Text style={styles.bannerText}>✓ Cambios guardados</Text></View>}

      <Text style={styles.sectionTitle}>Mi perfil</Text>
      <Input label="Nombre completo" value={form.full_name} onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))} placeholder="Tu nombre" autoCapitalize="words" />
      <Input label="Teléfono" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+57 300 000 0000" keyboardType="phone-pad" />

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Recibir mensajes de clientes</Text>
          <Text style={styles.switchDesc}>Los clientes pueden chatear contigo</Text>
        </View>
        <Switch value={allowMessages} onValueChange={setAllowMessages} trackColor={{ true: colors.primary }} />
      </View>

      <Button title="Guardar cambios" onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} style={styles.saveBtn} />

      {otherRoles.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Cambiar rol</Text>
          {otherRoles.map((r) => (
            <Button key={r.id} title={`Ir a ${r.role === 'admin' ? 'Admin' : r.role === 'employee' ? 'Empleado' : 'Cliente'}${r.business_name ? ` — ${r.business_name}` : ''}`} onPress={() => switchRole(r.role, r.business_id)} variant="secondary" style={styles.roleBtn} />
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Cuenta</Text>
      <Button title="Cerrar sesión" onPress={() => Alert.alert('Cerrar sesión', '¿Estás seguro?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: signOut }])} variant="danger" icon="log-out-outline" />
    </Screen>
  )
}

const styles = StyleSheet.create({
  avatarArea: { alignItems: 'center', marginBottom: spacing.lg },
  email: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.xs },
  banner: { backgroundColor: '#064e3b', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  bannerText: { color: '#34d399', fontSize: typography.sm, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.base, marginVertical: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  switchInfo: { flex: 1, marginRight: spacing.sm },
  switchLabel: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  switchDesc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  saveBtn: { marginTop: spacing.sm },
  roleBtn: { marginBottom: spacing.sm },
})
