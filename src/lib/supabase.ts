import { createClient } from '@supabase/supabase-js'
import { createEnhancedMockClient } from './mockData/mockClient'

// ✨ FIX: Validación más robusta de variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 'demo-key'

// Mock data mode for marketing screenshots
const isMockDataMode = import.meta.env.VITE_MOCK_DATA === 'true'

// Permite activar demo mode también vía process.env (útil en tests)
type GlobalWithProcess = typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
const gwp = globalThis as GlobalWithProcess
const demoFlag = typeof gwp !== 'undefined' && gwp.process?.env?.VITE_DEMO_MODE === 'true'

// ✨ FIX: Detectar si las variables están vacías o son placeholders.
// URL aceptada: https://*.supabase.co (PROD/DEV) o http://localhost:54321 (Supabase local).
const SUPABASE_URL_PATTERN = /^(https:\/\/[a-z0-9-]+\.supabase\.co|http:\/\/(localhost|127\.0\.0\.1):54321)$/
// Anon key aceptada: formato nuevo `sb_publishable_*` (CLAUDE.md regla 13 — JWT legacy `eyJ*`
// está deshabilitado desde abr 2026). En supabase local también empieza con `eyJ` por compatibilidad,
// así que aceptamos ambos prefijos pero rechazamos placeholders.
const SUPABASE_KEY_PATTERN = /^(sb_publishable_|eyJ)/

const isLikelyValidUrl = SUPABASE_URL_PATTERN.test(supabaseUrl)
const isLikelyValidKey =
  SUPABASE_KEY_PATTERN.test(supabaseAnonKey) &&
  supabaseAnonKey !== 'demo-key' &&
  supabaseAnonKey !== 'undefined' &&
  supabaseAnonKey.length > 20

const hasValidCredentials = isLikelyValidUrl && isLikelyValidKey

const isDemoMode =
  demoFlag ||
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  !hasValidCredentials

// ✨ FAIL-LOUD en producción: si las credenciales no son válidas, NO caer al mock
// silenciosamente — un build de PROD con env vacío resultaría en una app que parece
// funcionar pero no hace nada real. Ref: auditoria-completa-abril-2026.md §1.2.
if (import.meta.env.PROD && !hasValidCredentials && !isMockDataMode) {
  const reason = !isLikelyValidUrl
    ? `VITE_SUPABASE_URL inválida o ausente: "${supabaseUrl}"`
    : `VITE_SUPABASE_ANON_KEY inválida o ausente (debe empezar con sb_publishable_)`
  throw new Error(
    `[supabase] Configuración faltante o inválida en build de producción. ${reason}. ` +
      `Verifica las variables de entorno en Vercel/CI. La app NO se inicializará con mock en PROD.`,
  )
}

// En DEV, si activamos mock por env inválido, queremos un grito ruidoso (no silencioso).
if (import.meta.env.DEV && isDemoMode && !demoFlag && import.meta.env.VITE_DEMO_MODE !== 'true' && !isMockDataMode) {
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] ⚠️ Cayendo a MOCK CLIENT porque las credenciales no son válidas. ' +
      'Si esto NO es intencional, revisa .env.local. ' +
      `URL=${supabaseUrl} | KEY=${supabaseAnonKey.slice(0, 12)}…`,
  )
}

// For development purposes, we'll create a mock client if real credentials aren't available
export const supabase = isMockDataMode
  ? createEnhancedMockClient()
  : isDemoMode
    ? createMockClient()
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      })

// Mock client for development when Supabase isn't configured
type SupabaseLike = ReturnType<typeof createClient>
function createMockClient() {
  const mockUser = {
    id: 'demo-user-id',
    email: 'demo@example.com',
    user_metadata: { full_name: 'Demo User' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated'
  }

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    token_type: 'bearer' as const,
    expires_at: Date.now() + 3600000
  }

  // helper stubs to keep nesting shallow and lint clean
  function stubSingleOk() {
    return Promise.resolve({ data: null, error: null as unknown as { code: string; message: string } })
  }
  function stubSingleNotFound() { return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }) }
  function stubSelect() { return { single: stubSingleOk } }
  function stubEqUpdate() { return { select: stubSelect } }
  function makeQuery() {
    const api = {
      select: (_columns?: string) => api,
      eq: (_c?: string, _v?: unknown) => api,
      neq: (_c?: string, _v?: unknown) => api,
      in: (_c?: string, _v?: unknown[]) => api,
      gt: (_c?: string, _v?: unknown) => api,
      gte: (_c?: string, _v?: unknown) => api,
      lt: (_c?: string, _v?: unknown) => api,
      lte: (_c?: string, _v?: unknown) => api,
      order: (_c?: string, _o?: unknown) => api,
      limit: (_n?: number) => api,
      range: (_from?: number, _to?: number) => api,
      single: stubSingleNotFound,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (onfulfilled: (v: { data: unknown[]; error: null }) => unknown) => Promise.resolve(onfulfilled({ data: [], error: null }))
    }
    return api
  }

  const client = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      onAuthStateChange: (callback: (event: string, session: typeof mockSession) => void) => {
        // Simulate logged in state for demo
        setTimeout(() => { callback('SIGNED_IN', mockSession) }, 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: () => Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null }),
      signUp: () => Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: { provider: 'google', url: 'mock-url' }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null })
    },
    from: (_table: string) => {
      const q = makeQuery()
      return {
        select: q.select,
        eq: q.eq,
        neq: q.neq,
        in: q.in,
        gt: q.gt,
        gte: q.gte,
        lt: q.lt,
        lte: q.lte,
        order: q.order,
        limit: q.limit,
        range: q.range,
        single: q.single,
        maybeSingle: q.maybeSingle,
        then: q.then,
        insert: (_payload: unknown) => ({ select: () => ({ single: stubSingleOk }) }),
        update: (_payload: unknown) => ({ eq: (_c?: string, _v?: unknown) => stubEqUpdate() }),
        delete: () => ({ eq: (_c?: string, _v?: unknown) => Promise.resolve({ error: null }) }),
        upsert: (_payload: unknown) => ({ select: () => ({ single: stubSingleOk }) })
      }
    },
    channel: (_name: string) => {
      const ch = { on: () => ch, subscribe: () => ch }
      return ch
    },
    removeChannel: (_: unknown) => {}
  } as unknown

  return client as SupabaseLike
}

// Auth helpers
export const auth = supabase.auth

// Database helpers
export const db = supabase

export default supabase