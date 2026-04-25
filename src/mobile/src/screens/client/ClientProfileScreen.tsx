import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { QUERY_CONFIG, QUERY_KEYS } from '../../lib/queryClient'

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'PP', label: 'Pasaporte (PP)' },
  { value: 'NIT', label: 'NIT' },
  { value: 'RC', label: 'Registro Civil (RC)' },
]

const NAV_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap; screen: string }[] = [
  { label: 'Mis favoritos', icon: 'heart-outline', screen: 'Favoritos' },
  { label: 'Mensajes', icon: 'chatbubble-outline', screen: 'ConversacionList' },
  { label: 'Notificaciones', icon: 'notifications-outline', screen: 'Notificaciones' },
  { label: 'Ajustes de cuenta', icon: 'settings-outline', screen: 'Ajustes' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientProfileScreen({
  navigation,
}: {
  navigation: { navigate: (s: string) => void }
}) {
  const { user, signOut } = useAuth()
  const { theme } = useTheme()
  const qc = useQueryClient()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PROFILE(user?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()
      return data
    },
    enabled: !!user,
    ...QUERY_CONFIG.STABLE,
  })

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setDocumentType(profile.document_type ?? '')
      setDocumentNumber(profile.document_number ?? '')
    }
  }, [profile])

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar tu foto.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setUploadingAvatar(true)
    try {
      const ext = asset.uri.split('.').pop() ?? 'jpg'
      const fileName = `${user!.id}/avatar.${ext}`
      const response = await fetch(asset.uri)
      const blob = await response.blob()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = urlData.publicUrl + `?v=${Date.now()}`

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id)
      setAvatarUri(publicUrl)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE(user?.id ?? '') })
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo subir la imagen')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const showDocTypePicker = () => {
    Alert.alert(
      'Tipo de documento',
      'Selecciona tu tipo de documento',
      [
        ...DOC_TYPES.map(d => ({ text: d.label, onPress: () => setDocumentType(d.value) })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    )
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          document_type: documentType || null,
          document_number: documentNumber.trim() || null,
        })
        .eq('id', user!.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE(user?.id ?? '') })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  if (isLoading) return <LoadingSpinner fullScreen />

  const displayAvatarUri = avatarUri ?? profile?.avatar_url
  const firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'

  return (
    <Screen scrollable>
      {/* ── Cover / hero header ── */}
      <View style={[styles.coverHeader, { backgroundColor: theme.primary }]}>
        <View style={styles.coverOverlay} />
        <TouchableOpacity
          onPress={handlePickAvatar}
          disabled={uploadingAvatar}
          style={styles.avatarWrapper}
          activeOpacity={0.8}
        >
          <Avatar name={fullName} uri={displayAvatarUri} size={88} />
          <View style={[styles.avatarBadge, { borderColor: theme.primary }]}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={14} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.coverName}>{firstName}</Text>
        <Text style={styles.coverEmail}>{user?.email}</Text>
      </View>

      {/* ── Toast éxito ── */}
      {saved && (
        <View style={[styles.successBanner, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
          <Ionicons name="checkmark-circle" size={16} color="#34d399" />
          <Text style={[styles.successText, { color: '#34d399' }]}>Perfil actualizado</Text>
        </View>
      )}

      {/* ── Información personal ── */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Mi información</Text>
      <Input
        label="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Tu nombre"
        autoCapitalize="words"
      />
      <Input
        label="Teléfono"
        value={phone}
        onChangeText={setPhone}
        placeholder="+57 300 000 0000"
        keyboardType="phone-pad"
      />

      {/* ── Documento ── */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Documento de identidad</Text>
      <TouchableOpacity
        style={[
          styles.docTypeBtn,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        onPress={showDocTypePicker}
        activeOpacity={0.7}
      >
        <View style={styles.docTypeBtnInner}>
          <Text style={[styles.docTypeLabel, { color: theme.textSecondary }]}>
            Tipo de documento
          </Text>
          <Text
            style={[
              styles.docTypeValue,
              { color: documentType ? theme.text : theme.textMuted },
            ]}
          >
            {documentType
              ? DOC_TYPES.find(d => d.value === documentType)?.label ?? documentType
              : 'Seleccionar...'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
      <Input
        label="Número de documento"
        value={documentNumber}
        onChangeText={setDocumentNumber}
        placeholder="Ej: 1000123456"
        keyboardType="numeric"
      />

      <Button
        title="Guardar cambios"
        onPress={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        style={styles.saveBtn}
      />

      {/* ── Accesos rápidos ── */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Accesos rápidos</Text>
      <View style={[styles.navCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {NAV_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={item.screen}
            style={[
              styles.navRow,
              idx < NAV_ITEMS.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              },
            ]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.navIconWrap, { backgroundColor: `${theme.primary}1A` }]}>
              <Ionicons name={item.icon} size={18} color={theme.primary} />
            </View>
            <Text style={[styles.navLabel, { color: theme.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Cuenta ── */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Cuenta</Text>
      <TouchableOpacity
        style={[styles.signOutBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]}
        onPress={() =>
          Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
          ])
        }
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={[styles.signOutText, { color: '#ef4444' }]}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={styles.bottomPad} />
    </Screen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  coverHeader: {
    alignItems: 'center',
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  coverName: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  coverEmail: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.base,
  },
  successText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: '700',
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveBtn: {
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
  },
  docTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.base,
  },
  docTypeBtnInner: { flex: 1 },
  docTypeLabel: {
    fontSize: typography.xs,
    marginBottom: 2,
  },
  docTypeValue: {
    fontSize: typography.base,
    fontWeight: '500',
  },
  navCard: {
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: typography.base,
    fontWeight: '600',
  },
  bottomPad: {
    height: spacing[8],
  },
})

