/**
 * AppointmentConfirmationScreen — Confirmar cita via deep-link.
 *
 * Se abre desde el link del email "Confirmar cita". Recibe un token firmado
 * en los params de ruta y llama a la RPC confirm_appointment_by_token.
 * Funciona incluso si el usuario NO está autenticado (paridad web).
 *
 * Ref: plan feat/mobile-client-parity-2026-04, Fase 2.4.
 */
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, typography, radius } from '../../theme'

type Params = { ConfirmarCita: { token: string } }

type Status = 'loading' | 'success' | 'already' | 'error'

export default function AppointmentConfirmationScreen() {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const route = useRoute<RouteProp<Params, 'ConfirmarCita'>>()
  const { token } = route.params

  const [status, setStatus] = useState<Status>('loading')
  const [appointmentDate, setAppointmentDate] = useState<string | null>(null)

  useEffect(() => {
    async function confirm() {
      try {
        // Fetch appointment info first
        const { data: apt } = await supabase
          .from('appointments')
          .select('id, start_time, status')
          .eq('confirmation_token', token)
          .maybeSingle()

        if (!apt) {
          setStatus('error')
          return
        }

        if (apt.status === 'confirmed') {
          setStatus('already')
          setAppointmentDate(apt.start_time)
          return
        }

        setAppointmentDate(apt.start_time)

        const { error } = await supabase.rpc('confirm_appointment_by_token', {
          p_token: token,
        })

        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
        }
      } catch {
        setStatus('error')
      }
    }
    confirm()
  }, [token])

  const dateLabel = appointmentDate
    ? new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(appointmentDate))
    : null

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              Confirmando tu cita...
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>¡Cita confirmada!</Text>
            {dateLabel && (
              <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>{dateLabel}</Text>
            )}
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              Tu cita ha sido confirmada. El negocio ha sido notificado.
            </Text>
          </>
        )}

        {status === 'already' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}20` }]}>
              <Ionicons name="checkmark-done-circle" size={56} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Ya estaba confirmada</Text>
            {dateLabel && (
              <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>{dateLabel}</Text>
            )}
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              Esta cita ya había sido confirmada anteriormente.
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="alert-circle" size={56} color="#EF4444" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>No se pudo confirmar</Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              El enlace puede haber expirado o la cita ya no existe. Contacta al negocio si necesitas ayuda.
            </Text>
          </>
        )}

        {status !== 'loading' && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : (navigation as any).navigate('ClientRoot', { screen: 'Inicio', params: { screen: 'MisCitasList' } })
            }
          >
            <Text style={styles.btnText}>Ver mis citas</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.base,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: '700',
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: typography.base,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  message: {
    fontSize: typography.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: spacing.base,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: typography.base,
    fontWeight: '600',
  },
})
