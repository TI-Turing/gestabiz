/* eslint-disable no-console */
// Hook simplificado de autenticación para debuggear
import { useState, useEffect } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
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
    accountInactive: profile ? profile.is_active === false : undefined
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
        }
      } catch (error) {
        debugLog('💥 Error hydrating user profile:', error)
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
          setState(prev => ({
            ...prev,
            user: fallbackUser,
            session,
            loading: false,
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
          const fallbackUser = buildUserFromSession(session.user)
          setState(prev => ({
            ...prev,
            user: fallbackUser,
            session,
            loading: false,
            error: null
          }))

          // Hydrate with latest profile data after optimistic update
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

  const signOut = async () => {
    debugLog('👋 Signing out...')
    await supabase.auth.signOut()
  }

  return {
    ...state,
    signOut,
    currentBusinessId,
    businessOwnerId
  }
}
