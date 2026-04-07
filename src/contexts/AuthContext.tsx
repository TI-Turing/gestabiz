import React, { useMemo } from 'react'
import { useAuthSimple } from '@/hooks/useAuthSimple'

// Create Auth Context
const AuthContext = React.createContext<ReturnType<typeof useAuthSimple> | null>(null)

// Default safe auth state when context is not available
const defaultAuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  currentBusinessId: undefined,
  businessOwnerId: undefined,
  signOut: async () => {},
  loginWithPassword: async () => {},
  signUpWithPassword: async () => {},
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  loginWithOAuth: async () => {},
  getProfile: async () => null,
  switchBusiness: () => {},
  validateToken: async () => false,
  sendMagicLink: async () => {},
  loginWithMagicLink: async () => {},
  validateMagicToken: async () => {},
}

// Auth Context Provider Component
export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const authState = useAuthSimple()
  // useMemo evita que todos los consumidores re-rendericen cuando el provider renderiza
  // pero el estado no ha cambiado (referencia estable)
  const memoValue = useMemo(() => authState, [authState])
  return <AuthContext.Provider value={memoValue}>{children}</AuthContext.Provider>
}

// Hook to use Auth Context - with safe fallback
export function useAuth() {
  const context = React.useContext(AuthContext)

  // Return default auth state if context is not available (instead of throwing)
  // This can happen during initial render before AuthProvider is ready
  if (!context) {
    if (import.meta.env.DEV) {    }
    return defaultAuthState as ReturnType<typeof useAuthSimple>
  }

  return context
}
