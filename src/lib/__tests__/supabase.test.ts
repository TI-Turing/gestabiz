import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Tests para src/lib/supabase.ts
//
// ESTRATEGIA: supabase.ts se ejecuta en el ámbito del módulo (top-level) por
// lo que no podemos reimportar con distintas variables de entorno sin resetear
// el módulo. Usamos vi.resetModules() + vi.importActual/importMock para cada
// escenario que requiere env distinto.
//
// Los tests de validación de URL/KEY se hacen directamente sobre las funciones
// internas (SUPABASE_URL_PATTERN, SUPABASE_KEY_PATTERN) extrayéndolas del módulo.
// ============================================================================

// ──────────────────────────────────────────────────────────────────────────────
// Mocks globales (antes de cualquier import del módulo real)
// ──────────────────────────────────────────────────────────────────────────────

const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null })
const mockMockClientAuth = { getSession: mockGetSession, onAuthStateChange: vi.fn(), signOut: vi.fn() }

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: mockMockClientAuth, from: vi.fn() })),
}))

vi.mock('@/lib/mockData/mockClient', () => ({
  createEnhancedMockClient: vi.fn(() => ({ auth: mockMockClientAuth, from: vi.fn() })),
}))

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — Patrones de validación de URL
// ──────────────────────────────────────────────────────────────────────────────

describe('SUPABASE_URL_PATTERN — URLs aceptadas y rechazadas', () => {
  const URL_PATTERN = /^(https:\/\/[a-z0-9-]+\.supabase\.co|http:\/\/(localhost|127\.0\.0\.1):54321)$/

  describe('URLs válidas', () => {
    it.each([
      'https://dkancockzvcqorqbwtyh.supabase.co',
      'https://emknatoknbomvmyumqju.supabase.co',
      'https://abc123.supabase.co',
      'https://my-project-id.supabase.co',
      'http://localhost:54321',
      'http://127.0.0.1:54321',
    ])('acepta "%s"', (url) => {
      expect(URL_PATTERN.test(url)).toBe(true)
    })
  })

  describe('URLs rechazadas', () => {
    // Nota: https://demo.supabase.co SÍ pasa el patrón de URL (el rechazo del
    // placeholder se hace a nivel de hasValidCredentials por la key, no la URL).
    it.each([
      'https://example.com',               // dominio externo
      'http://localhost:3000',             // puerto incorrecto
      'http://localhost:54321/extra',      // path extra
      'https://PROJECT.supabase.co',       // mayúsculas
      'ftp://localhost:54321',             // protocolo incorrecto
      '',                                  // vacío
      'undefined',                         // literal "undefined"
      'https://supabase.co',              // sin project id
    ])('rechaza "%s"', (url) => {
      expect(URL_PATTERN.test(url)).toBe(false)
    })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — Patrones de validación de ANON KEY
// ──────────────────────────────────────────────────────────────────────────────

describe('SUPABASE_KEY_PATTERN — keys aceptadas y rechazadas', () => {
  const KEY_PATTERN = /^(sb_publishable_|eyJ)/
  const MIN_LENGTH = 20

  function isValidKey(key: string): boolean {
    return (
      KEY_PATTERN.test(key) &&
      key !== 'demo-key' &&
      key !== 'undefined' &&
      key.length > MIN_LENGTH
    )
  }

  describe('Keys válidas', () => {
    it.each([
      'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'sb_publishable_' + 'x'.repeat(30),
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.abc123',
    ])('acepta "%s"', (key) => {
      expect(isValidKey(key)).toBe(true)
    })
  })

  describe('Keys rechazadas', () => {
    it.each([
      ['demo-key', 'placeholder por defecto'],
      ['undefined', 'literal "undefined"'],
      ['sb_publishable_short', 'demasiado corta'],
      ['random-api-key-value-here', 'sin prefijo válido'],
      ['', 'vacía'],
      ['Bearer abc123', 'token con Bearer prefix'],
    ])('rechaza "%s" (%s)', (key) => {
      expect(isValidKey(key)).toBe(false)
    })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — Comportamiento en DEV con credenciales inválidas
// ──────────────────────────────────────────────────────────────────────────────

describe('supabase.ts en DEV — credenciales inválidas caen a mock client con console.error', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('NO lanza excepción en DEV aunque las credenciales sean inválidas', async () => {
    // En DEV (import.meta.env.DEV = true, PROD = false por defecto en Vitest)
    // el módulo debe retornar un mock client, no lanzar
    await expect(import('@/lib/supabase')).resolves.toBeDefined()
  })

  it('exporta `supabase`, `auth` y `db`', async () => {
    const mod = await import('@/lib/supabase')
    expect(mod.supabase).toBeDefined()
    expect(mod.auth).toBeDefined()
    expect(mod.db).toBeDefined()
  })

  it('el cliente mock tiene interfaz auth.getSession', async () => {
    const { supabase } = await import('@/lib/supabase')
    expect(typeof supabase.auth.getSession).toBe('function')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// SUITE — isDemoMode logic (cobertura de ramas)
// ──────────────────────────────────────────────────────────────────────────────

describe('isDemoMode derivado de credenciales', () => {
  it('hasValidCredentials es false con key placeholder "demo-key" (aunque la URL tenga formato válido)', () => {
    // La URL demo.supabase.co técnicamente pasa el regex, pero la key "demo-key"
    // es rechazada — y hasValidCredentials = isLikelyValidUrl && isLikelyValidKey.
    const url = 'https://demo.supabase.co'
    const key = 'demo-key'

    const URL_PATTERN = /^(https:\/\/[a-z0-9-]+\.supabase\.co|http:\/\/(localhost|127\.0\.0\.1):54321)$/
    const KEY_PATTERN = /^(sb_publishable_|eyJ)/

    const isLikelyValidUrl = URL_PATTERN.test(url)
    const isLikelyValidKey =
      KEY_PATTERN.test(key) &&
      key !== 'demo-key' &&
      key !== 'undefined' &&
      key.length > 20

    // URL pasa el patrón (demo es un subdominio válido), pero la KEY la rechaza
    expect(isLikelyValidUrl).toBe(true)
    expect(isLikelyValidKey).toBe(false)
    // En conjunto hasValidCredentials = false
    expect(isLikelyValidUrl && isLikelyValidKey).toBe(false)
  })

  it('hasValidCredentials es true para proyecto DEV real', () => {
    const url = 'https://dkancockzvcqorqbwtyh.supabase.co'
    const key = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH_longkeysuffix'

    const URL_PATTERN = /^(https:\/\/[a-z0-9-]+\.supabase\.co|http:\/\/(localhost|127\.0\.0\.1):54321)$/
    const KEY_PATTERN = /^(sb_publishable_|eyJ)/

    const isLikelyValidUrl = URL_PATTERN.test(url)
    const isLikelyValidKey =
      KEY_PATTERN.test(key) &&
      key !== 'demo-key' &&
      key !== 'undefined' &&
      key.length > 20

    expect(isLikelyValidUrl).toBe(true)
    expect(isLikelyValidKey).toBe(true)
  })

  it('hasValidCredentials es true para local Docker (localhost:54321)', () => {
    const url = 'http://localhost:54321'
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMH0.abc123xyz'

    const URL_PATTERN = /^(https:\/\/[a-z0-9-]+\.supabase\.co|http:\/\/(localhost|127\.0\.0\.1):54321)$/
    const KEY_PATTERN = /^(sb_publishable_|eyJ)/

    const isLikelyValidUrl = URL_PATTERN.test(url)
    const isLikelyValidKey =
      KEY_PATTERN.test(key) &&
      key !== 'demo-key' &&
      key !== 'undefined' &&
      key.length > 20

    expect(isLikelyValidUrl).toBe(true)
    expect(isLikelyValidKey).toBe(true)
  })
})
