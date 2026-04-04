import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '../lib/supabase'
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
} from '../lib/push-notifications'

const PUSH_TOKEN_KEY = '@gestabiz:push_token'

// Necesario para expo-auth-session con OAuth
WebBrowser.maybeCompleteAuthSession()

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  pushToken: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [pushToken, setPushToken] = useState<string | null>(null)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setLoading(false)
    })

    // Suscribirse a cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)

      // Registrar push token al autenticarse
      if (newSession?.user && _event === 'SIGNED_IN') {
        registerForPushNotifications().then(async (token) => {
          if (token) {
            setPushToken(token)
            await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token)
            await savePushToken(newSession.user.id, token)
          }
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY)
      if (savedToken) {
        await removePushToken(savedToken)
        await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY)
        setPushToken(null)
      }
    } catch {
      // No bloquear el logout si falla la limpieza del token
    }
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'gestabiz://auth/callback',
      },
    })
    return { error: error as Error | null }
  }

  const value: AuthContextValue = {
    user,
    session,
    loading,
    pushToken,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
