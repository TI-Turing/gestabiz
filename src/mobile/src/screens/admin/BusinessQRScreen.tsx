import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-native-qrcode-svg'
import { useAuth } from '../../contexts/AuthContext'
import { useUserRoles } from '../../hooks/useUserRoles'
import { supabase } from '../../lib/supabase'
import { colors, spacing, typography, radius } from '../../theme'
import Screen from '../../components/ui/Screen'

const APP_URL = 'https://gestabiz.com'

export default function BusinessQRScreen() {
  const { user } = useAuth()
  const { activeBusiness } = useUserRoles(user)
  const businessId = activeBusiness
  const svgRef = useRef<any>(null)
  const handleQRRef = (ref: any) => { svgRef.current = ref }

  const { data: business, isLoading } = useQuery({
    queryKey: ['business-qr', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('name, slug')
        .eq('id', businessId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!businessId,
  })

  const profileUrl = business?.slug
    ? `${APP_URL}/negocio/${business.slug}`
    : `${APP_URL}/negocio/${businessId}`

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Reserva una cita con nosotros: ${profileUrl}`,
        url: profileUrl,
        title: business?.name ?? 'Mi negocio',
      })
    } catch {
      // User cancelled
    }
  }

  if (isLoading || !business) {
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
      <View style={styles.container}>
        <Text style={styles.title}>Código QR del negocio</Text>
        <Text style={styles.subtitle}>
          Comparte este código para que tus clientes reserven citas
        </Text>

        <View style={styles.qrCard}>
          <Text style={styles.businessName}>{business.name}</Text>
          <View style={styles.qrWrap}>
            <QRCode
              value={profileUrl}
              size={220}
              color={colors.text}
              backgroundColor="transparent"
              getRef={handleQRRef}
            />
          </View>
          <Text style={styles.urlText} numberOfLines={1}>
            {profileUrl}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Compartir enlace</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Los clientes que escaneen el código llegarán directamente a tu perfil público
            donde podrán ver servicios, horarios y reservar citas.
          </Text>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  title: { ...typography.h2, color: colors.text, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  qrCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  businessName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  qrWrap: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
  },
  urlText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    maxWidth: 260,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { ...typography.bodyBold, color: '#fff' },
  infoBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  infoText: { ...typography.caption, color: colors.primary, textAlign: 'center', lineHeight: 18 },
})
