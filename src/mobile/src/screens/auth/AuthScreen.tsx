import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { colors, spacing, typography, radius } from '../../theme'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

type Mode = 'signin' | 'signup' | 'reset'

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async () => {
    clearMessages()
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Por favor ingresa tu nombre')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(email.trim(), password, name.trim())
        if (err) {
          setError(translateError(err.message))
        } else {
          setSuccess('¡Cuenta creada! Revisa tu email para verificar tu cuenta.')
        }
      } else {
        const { error: err } = await signIn(email.trim(), password)
        if (err) setError(translateError(err.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    clearMessages()
    setGoogleLoading(true)
    try {
      const { error: err } = await signInWithGoogle()
      if (err) setError(translateError(err.message))
    } finally {
      setGoogleLoading(false)
    }
  }

  const translateError = (msg: string): string => {
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos'
    if (msg.includes('Email not confirmed')) return 'Debes verificar tu email primero'
    if (msg.includes('User already registered')) return 'Este correo ya está registrado'
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
    return msg
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="calendar" size={36} color={colors.text} />
            </View>
            <Text style={styles.appName}>Gestabiz</Text>
            <Text style={styles.tagline}>Gestión de citas inteligente</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Recuperar contraseña'}
            </Text>

            {/* Mensajes */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {/* Campos */}
            {mode === 'signup' && (
              <Input
                label="Nombre completo"
                value={name}
                onChangeText={setName}
                placeholder="Juan Pérez"
                autoCapitalize="words"
                leftIcon="person-outline"
              />
            )}
            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            {mode !== 'reset' && (
              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                leftIcon="lock-closed-outline"
              />
            )}

            {/* Botón principal */}
            <Button
              title={
                mode === 'signin'
                  ? 'Iniciar sesión'
                  : mode === 'signup'
                  ? 'Crear cuenta'
                  : 'Enviar enlace'
              }
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={styles.mainButton}
            />

            {/* Separador */}
            {mode !== 'reset' && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google */}
                <Button
                  title="Continuar con Google"
                  onPress={handleGoogle}
                  loading={googleLoading}
                  variant="secondary"
                  icon="logo-google"
                  size="lg"
                />
              </>
            )}

            {/* Links secundarios */}
            <View style={styles.links}>
              {mode === 'signin' && (
                <>
                  <TouchableOpacity
                    onPress={() => { clearMessages(); setMode('reset') }}
                  >
                    <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { clearMessages(); setMode('signup') }}
                  >
                    <Text style={styles.link}>¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text></Text>
                  </TouchableOpacity>
                </>
              )}
              {mode === 'signup' && (
                <TouchableOpacity onPress={() => { clearMessages(); setMode('signin') }}>
                  <Text style={styles.link}>¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text></Text>
                </TouchableOpacity>
              )}
              {mode === 'reset' && (
                <TouchableOpacity onPress={() => { clearMessages(); setMode('signin') }}>
                  <Text style={styles.link}>← Volver al inicio de sesión</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.base, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: spacing['2xl'] },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: { fontSize: typography['3xl'], fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: typography.base, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: { fontSize: typography.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450a0a',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 8,
  },
  errorText: { color: '#f87171', fontSize: typography.sm, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 8,
  },
  successText: { color: '#34d399', fontSize: typography.sm, flex: 1 },
  mainButton: { marginTop: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.base },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, marginHorizontal: spacing.sm, fontSize: typography.sm },
  links: { marginTop: spacing.lg, gap: spacing.sm },
  link: { color: colors.textSecondary, fontSize: typography.sm, textAlign: 'center' },
  linkBold: { color: colors.primary, fontWeight: '600' },
})
