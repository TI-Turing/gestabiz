/**
 * AppointmentCancellationScreen — Cancelar cita via deep-link.
 *
 * Se abre desde el link del email "Cancelar cita". Recibe un token firmado
 * y llama a la RPC cancel_appointment_by_token.
 * Funciona sin autenticación (paridad web).
 *
 * Ref: plan feat/mobile-client-parity-2026-04, Fase 2.4.
 */
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, typography, radius } from '../../theme'

type Params = { CancelarCita: { token: string } }

interface AppointmentInfo {
  id: string
  start_time: string
  status: string
}

export default function AppointmentCancellationScreen() {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const route = useRoute<RouteProp<Params, 'CancelarCita'>>()
  const { token } = route.params

  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('appointments')
      .select('id, start_time, status')
      .eq('confirmation_token', token)
      .maybeSingle()
      .then(({ data }) => {
        setAppointment(data)
        setLoadingInfo(false)
      })
  }, [token])

  const handleCancel = async () => {
    setCancelling(true)
    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('cancel_appointment_by_token', {
        p_token: token,
        p_reason: reason.trim() || 'Cancelado por el cliente',
      })
      if (rpcError) throw rpcError
      setCancelled(true)
    } catch {
      setError('No se pudo cancelar la cita. Intenta de nuevo o contacta al negocio.')
    } finally {
      setCancelling(false)
    }
  }

  const dateLabel = appointment?.start_time
    ? new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(appointment.start_time))
    : null

  if (loadingInfo) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!appointment) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={56} color="#EF4444" />
          <Text style={[styles.title, { color: theme.text }]}>Cita no encontrada</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            El enlace puede haber expirado o la cita ya no existe.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : (navigation as any).navigate('MisCitasList'))}
          >
            <Text style={styles.btnText}>Ver mis citas</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (appointment.status === 'cancelled' || cancelled) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="close-circle" size={56} color="#EF4444" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Cita cancelada</Text>
          {dateLabel && (
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>{dateLabel}</Text>
          )}
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Tu cita ha sido cancelada. El negocio ha sido notificado.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : (navigation as any).navigate('MisCitasList'))}
          >
            <Text style={styles.btnText}>Ver mis citas</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.iconCircle, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="calendar-clear" size={56} color="#EF4444" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Cancelar cita</Text>
          {dateLabel && (
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>{dateLabel}</Text>
          )}
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
          </Text>

          <TextInput
            style={[
              styles.reasonInput,
              {
                color: theme.text,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            placeholder="Motivo de cancelación (opcional)"
            placeholderTextColor={theme.textMuted}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            maxLength={300}
            textAlignVertical="top"
          />

          {error && (
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: '#EF4444' }, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Confirmar cancelación</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.border }]}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : (navigation as any).navigate('MisCitasList'))}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
              No cancelar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.base,
  },
  scrollContent: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.base,
    flexGrow: 1,
    justifyContent: 'center',
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
  reasonInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 80,
    fontSize: typography.base,
  },
  errorText: {
    fontSize: typography.sm,
    textAlign: 'center',
  },
  btn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: typography.base,
    fontWeight: '600',
  },
  secondaryBtnText: {
    fontSize: typography.base,
    fontWeight: '500',
  },
})
