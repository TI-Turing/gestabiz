/* eslint-disable no-console */
// Hook simplificado de autenticación para debuggear
import { useState, useEffect, useCallback, useMemo } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import * as Sentry from '@sentry/react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import type { Database } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

// Helper para logs de debug (solo en dev)
const isDev = import.meta.env.DEV
const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args)
}

type ProfileRow = Database['public']['Tables']['profiles']['Row']

const defaultPreferences: User['notification_preferences'] = {
  email: true,
  push: true,
  browser: true,
  whatsapp: false,
  reminder_24h: true,
  reminder_1h: true,
  reminder_15m: false,
  daily_digest: false,
  weekly_report: false
}

const buildUserFromSession = (sessionUser: SupabaseUser, profile?: ProfileRow | null): User => {
  const baseEmail = sessionUser.email ?? ''
  const baseName = sessionUser.user_metadata?.full_name || profile?.full_name || (baseEmail ? baseEmail.split('@')[0] : 'Usuario')
  const username = sessionUser.user_metadata?.username || baseEmail.split('@')[0] || baseName
  const isActive = profile?.is_active ?? true
  const metadata = sessionUser.user_metadata || {}
  const metadataAvatar = (metadata as Record<string, unknown>)?.['avatar_url']
  const metadataPicture = (metadata as Record<string, unknown>)?.['picture']
  const resolvedAvatar =
    (typeof metadataAvatar === 'string' ? metadataAvatar : undefined)
    || profile?.avatar_url
    || (typeof metadataPicture === 'string' ? metadataPicture : undefined)

  return {
    id: sessionUser.id,
    email: baseEmail,
    name: baseName,
    username,
    avatar_url: resolvedAvatar || undefined,
    timezone: 'America/Bogota',
    roles: [{
      id: profile ? `simple-role-${profile.id}` : 'simple-role-default',
      user_id: sessionUser.id,
      role: 'client',
      business_id: null,
      is_active: isActive,
      created_at: profile?.created_at || new Date().toISOString()
    }],
    activeRole: 'client',
    activeBusiness: undefined,
    role: 'client',
    business_id: undefined,
    location_id: undefined,
    phone: profile?.phone || sessionUser.user_metadata?.phone || '',
    language: 'es',
    notification_preferences: defaultPreferences,
    permissions: [],
    created_at: profile?.created_at || new Date().toISOString(),
    updated_at: profile?.updated_at || new Date().toISOString(),
    is_active: isActive,
    deactivated_at: profile?.deactivated_at || undefined,
    last_login: undefined,
    accountInactive: profile ? profile.is_active === false : undefined,
    has_used_free_trial: profile?.has_used_free_trial ?? false,
    free_trial_used_at: profile?.free_trial_used_at ?? undefined,
    free_trial_business_id: profile?.free_trial_business_id ?? undefined,
  }
}

export function useAuthSimple() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  // Business context for permissions
  const [currentBusinessId, setCurrentBusinessId] = useState<string | undefined>()
  const [businessOwnerId, setBusinessOwnerId] = useState<string | undefined>()

  debugLog('🔄 useAuthSimple state:', state)

  useEffect(() => {
    debugLog('🚀 useAuthSimple - Getting initial session...')
    let mounted = true

    const hydrateUserProfile = async (sessionObj: Session) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionObj.user.id)
          .single()

        if (profileError) {
          debugLog('⚠️ Profile fetch error:', profileError)
          // Asegurar que loading baje aunque no haya datos de perfil
          if (mounted) setState(prev => ({ ...prev, loading: false }))
          return
        }

        if (profileData && mounted) {
          const hydratedUser = buildUserFromSession(sessionObj.user, profileData)
          debugLog('✅ Hydrated user with profile data. accountInactive:', hydratedUser.accountInactive)
          setState(prev => ({
            ...prev,
            user: hydratedUser,
            session: sessionObj,
            loading: false,
            error: null
          }))
        } else if (mounted) {
          // Sin datos de perfil: bajar loading con el usuario que ya existe
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        debugLog('💥 Error hydrating user profile:', error)
        if (mounted) setState(prev => ({ ...prev, loading: false }))
      }
    }

    async function getInitialSession() {
      try {
        debugLog('📡 Calling supabase.auth.getSession()...')
        const { data: { session }, error } = await supabase.auth.getSession()
        debugLog('📊 Session result:', { session, error })

        if (error) {
          debugLog('❌ Session error:', error.message)
          if (mounted) {
            setState(prev => ({ ...prev, loading: false, error: null, session: null, user: null }))
          }
          return
        }

        if (session?.user && mounted) {
          const fallbackUser = buildUserFromSession(session.user)
          // Establecer contexto de usuario en Sentry
          Sentry.setUser({
            id: session.user.id,
            email: session.user.email,
          })
          // NO bajamos loading aquí: esperamos a que hydrateUserProfile complete
          // para evitar que EmployeeDashboard vea phone vacío momentáneamente.
          setState(prev => ({
            ...prev,
            user: fallbackUser,
            session,
            // loading permanece true hasta que hydrateUserProfile termine
            error: null
          }))
          void hydrateUserProfile(session)
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        debugLog('💥 Error in getInitialSession:', error)
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }))
        }
      }
    }

    void getInitialSession()

    debugLog('👂 Setting up auth state listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        debugLog('🔔 Auth state changed:', event, session?.user?.email)

        if (!mounted) {
          return
        }

        if (!session) {
          debugLog('👋 User signed out in listener')
          // Limpiar contexto de usuario en Sentry al hacer logout
          Sentry.setUser(null)
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            loading: false,
            error: null
          }))
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Establecer contexto de usuario en Sentry para trazabilidad
          Sentry.setUser({
            id: session.user.id,
            email: session.user.email,
          })
          setState(prev => {
            // TOKEN_REFRESHED: conservar el usuario hidratado para evitar regresión
            // de campos como `phone` y `avatar_url` mientras re-hidrata.
            // SIGNED_IN: no bajar loading aún — hydrateUserProfile lo bajará con el
            // avatar y todos los campos del perfil ya cargados.
            if (event === 'TOKEN_REFRESHED' && prev.user) {
              return { ...prev, session, loading: false, error: null }
            }
            // SIGNED_IN: establecer fallback sin bajar loading
            return {
              ...prev,
              user: buildUserFromSession(session.user),
              session,
              // loading permanece true hasta que hydrateUserProfile complete
              error: null
            }
          })

          // Hydrate con datos reales del perfil (avatar, phone, etc.)
          void hydrateUserProfile(session)
        } else {
          setState(prev => ({
            ...prev,
            session,
            loading: false
          }))
        }
      }
    )

    return () => {
      mounted = false
      debugLog('🧹 Cleaning up auth listener...')
      subscription.unsubscribe()
    }
  }, [])

  // Fetch business context when user changes
  useEffect(() => {
    const fetchBusinessContext = async () => {
      if (!state.user?.id) {
        setCurrentBusinessId(undefined)
        setBusinessOwnerId(undefined)
        return
      }

      try {
        // Read active business from localStorage (set by useUserRoles)
        const ACTIVE_ROLE_KEY = 'user-active-role'
        const storageKey = `${ACTIVE_ROLE_KEY}:${state.user.id}`
        const storedContext = localStorage.getItem(storageKey)
        
        let businessId: string | undefined

        if (storedContext) {
          const parsed = JSON.parse(storedContext)
          businessId = parsed.businessId
        }
        
        // Si no hay businessId (no hay contexto o está vacío), buscar si el usuario es owner de algún negocio
        if (!businessId) {
          debugLog('⚠️ No businessId in context, checking if user owns any business...')
          const { data: ownedBusinesses, error: ownedError } = await supabase
            .from('businesses')
            .select('id, owner_id')
            .eq('owner_id', state.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!ownedError && ownedBusinesses) {
            businessId = ownedBusinesses.id
            debugLog('✅ Found owned business:', businessId)
            // Inmediatamente establecer el ownerId ya que lo tenemos
            setBusinessOwnerId(ownedBusinesses.owner_id)
          }
        }
        
        if (businessId) {
          setCurrentBusinessId(businessId)
          
          // Query owner_id from businesses table
          const { data: business, error } = await supabase
            .from('businesses')
            .select('owner_id')
            .eq('id', businessId)
            .single()

          if (!error && business) {
            setBusinessOwnerId(business.owner_id)
            debugLog('✅ Business context loaded:', { businessId, ownerId: business.owner_id })
          } else {
            debugLog('⚠️ Failed to fetch business owner:', error)
            setBusinessOwnerId(undefined)
          }
        } else {
          debugLog('⚠️ No business found for user')
          setCurrentBusinessId(undefined)
          setBusinessOwnerId(undefined)
        }
      } catch (error) {
        debugLog('💥 Error fetching business context:', error)
        setCurrentBusinessId(undefined)
        setBusinessOwnerId(undefined)
      }
    }

    void fetchBusinessContext()
  }, [state.user?.id])

  const signOut = useCallback(async () => {
    debugLog('👋 Signing out...')
    await supabase.auth.signOut()
  }, [])

  // ✅ Estabilizar el objeto de retorno: solo cambia cuando cambian los valores reales.
  // Sin esto, AuthContext.Provider genera un valor nuevo en cada render del hook,
  // causando que TODOS los consumidores de useAuth() re-rendericen innecesariamente.
  return useMemo(
    () => ({
      ...state,
      signOut,
      currentBusinessId,
      businessOwnerId,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // avatar_url y phone se incluyen explícitamente porque hydrateUserProfile los actualiza
    // con el mismo user.id — sin ellos el memo no recomputa y los consumidores ven datos stale.
    [state.user?.id, state.user?.avatar_url, state.user?.phone, state.session?.access_token, state.loading, state.error, signOut, currentBusinessId, businessOwnerId],
  )
}
