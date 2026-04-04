import Constants from 'expo-constants'

/**
 * Configuración centralizada de variables de entorno para Mobile.
 *
 * La app puede obtener las variables desde:
 * 1. `app.json > extra` (vía Constants.expoConfig.extra) — recomendado para builds
 * 2. `process.env.EXPO_PUBLIC_*` — para desarrollo local con .env
 * 3. Fallback a `process.env.VITE_*` para sincronizar con la web app
 */

function getEnvVar(key: string, fallback?: string): string {
  const value = (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[key]
    ?? (process.env as Record<string, string | undefined>)[key]

  if (!value && !fallback) {
    console.warn(`[EnvConfig] Variable '${key}' no configurada`)
  }

  return value ?? fallback ?? ''
}

export const SUPABASE_URL = getEnvVar(
  'supabaseUrl',
  (process.env as Record<string, string | undefined>).EXPO_PUBLIC_SUPABASE_URL
    ?? (process.env as Record<string, string | undefined>).VITE_SUPABASE_URL
)

export const SUPABASE_ANON_KEY = getEnvVar(
  'supabaseAnonKey',
  (process.env as Record<string, string | undefined>).EXPO_PUBLIC_SUPABASE_ANON_KEY
    ?? (process.env as Record<string, string | undefined>).VITE_SUPABASE_ANON_KEY
)

export const WEB_APP_URL = getEnvVar('webAppUrl', 'https://gestabiz.com')

export const WEB_APP_URL_DEV = getEnvVar('webAppUrlDev', 'http://localhost:5173')

export const IS_DEV = __DEV__

export const EFFECTIVE_WEB_URL = IS_DEV ? WEB_APP_URL_DEV : WEB_APP_URL

// Validar al importar
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[EnvConfig] ❌ Variables de Supabase no configuradas')
  console.info('[EnvConfig] Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY')
} else if (__DEV__) {
  console.info('[EnvConfig] ✅ Supabase URL:', SUPABASE_URL)
  console.info('[EnvConfig] 🌐 Web URL:', EFFECTIVE_WEB_URL)
}

export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  WEB_APP_URL,
  WEB_APP_URL_DEV,
  IS_DEV,
  EFFECTIVE_WEB_URL,
}
