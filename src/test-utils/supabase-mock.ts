import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mock de Supabase Client para testing
 * Simula las operaciones básicas de Supabase sin hacer llamadas reales
 */
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    csv: vi.fn().mockResolvedValue({ data: '', error: null }),
    geojson: vi.fn().mockResolvedValue({ data: null, error: null }),
    explain: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  }))

  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  }

  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    })),
  }

  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })

  const mockClient = {
    from: mockFrom,
    auth: mockAuth,
    storage: mockStorage,
    rpc: mockRpc,
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    }),
  } as unknown as SupabaseClient

  return mockClient
}

/**
 * Mock de respuesta exitosa de Supabase
 */
export const mockSupabaseSuccess = <T>(data: T) => ({
  data,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
})

/**
 * Mock de respuesta con error de Supabase
 */
export const mockSupabaseError = (message: string, code = 'ERROR') => ({
  data: null,
  error: {
    message,
    details: '',
    hint: '',
    code,
  },
  count: null,
  status: 400,
  statusText: 'Bad Request',
})

/**
 * Mock de usuario autenticado
 */
export const mockAuthUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'authenticated',
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Mock de sesión autenticada
 */
export const mockAuthSession = (overrides = {}) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockAuthUser(),
  ...overrides,
})

// ─── Enhanced chain-based mocking ──────────────────────────

/**
 * Creates a chainable mock that resolves with the given data at terminal calls.
 * Usage:
 *   const chain = mockSupabaseChain({ data: [...], error: null })
 *   vi.mocked(supabase.from).mockReturnValue(chain as any)
 */
export function mockSupabaseChain<T>(resolved: { data: T; error: null } | { data: null; error: { message: string } }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  // All chainable methods return self
  const chainableMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'or', 'not',
    'contains', 'containedBy', 'overlaps',
    'filter', 'match', 'order', 'limit', 'range',
    'textSearch', 'abortSignal',
  ]

  for (const method of chainableMethods) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }

  // Terminal methods resolve the promise
  chain.single = vi.fn().mockResolvedValue(resolved)
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved)
  chain.then = vi.fn((resolve) => resolve(resolved))
  // Make the chain itself thenable (for await supabase.from(...).select(...))
  Object.defineProperty(chain, 'then', {
    value: vi.fn((resolve: (v: typeof resolved) => void) => Promise.resolve(resolved).then(resolve)),
    writable: true,
    configurable: true,
  })

  return chain
}

/**
 * Mocks a specific supabase.rpc() call to return data.
 */
export function mockSupabaseRpc(mockClient: { rpc: ReturnType<typeof vi.fn> }, fnName: string, data: unknown) {
  mockClient.rpc.mockImplementation((name: string) => {
    if (name === fnName) {
      return Promise.resolve({ data, error: null })
    }
    return Promise.resolve({ data: null, error: { message: `Unknown RPC: ${name}` } })
  })
}

/**
 * Creates a mock Realtime channel with configurable callback triggers.
 */
export function mockRealtimeChannel() {
  const callbacks: Array<{ event: string; schema: string; table: string; callback: (payload: unknown) => void }> = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel: any = {
    on: vi.fn((_type: string, opts: { event: string; schema: string; table: string }, callback: (payload: unknown) => void) => {
      callbacks.push({ event: opts.event, schema: opts.schema, table: opts.table, callback })
      return channel
    }),
    subscribe: vi.fn().mockReturnValue(undefined),
    unsubscribe: vi.fn(),
  }
  channel.subscribe.mockReturnValue(channel)

  /** Simulate an incoming realtime event */
  function emit(event: string, table: string, payload: unknown) {
    for (const cb of callbacks) {
      if ((cb.event === event || cb.event === '*') && cb.table === table) {
        cb.callback(payload)
      }
    }
  }

  return { channel, emit }
}

/**
 * Configures supabase.from() to return different chains per table.
 * Usage:
 *   mockSupabaseFrom(mockClient, {
 *     appointments: { data: [...], error: null },
 *     services:     { data: [...], error: null },
 *   })
 */
export function mockSupabaseFrom(
  mockClient: { from: ReturnType<typeof vi.fn> },
  tableResponses: Record<string, { data: unknown; error: null } | { data: null; error: { message: string } }>
) {
  mockClient.from.mockImplementation((table: string) => {
    const response = tableResponses[table]
    if (response) {
      return mockSupabaseChain(response as { data: unknown; error: null })
    }
    return mockSupabaseChain({ data: null, error: { message: `No mock for table: ${table}` } })
  })
}

/**
 * Convenience: get the vi.mocked supabase from the auto-mock and configure
 * supabase.from(tableName) to resolve with given data or error.
 *
 * Requires: vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), rpc: vi.fn(), ... } }))
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase'
 *   setupFromMock(supabase as any, 'appointments', mockData)
 *   setupFromMock(supabase as any, 'appointments', null, { message: 'error' })
 */
export function setupFromMock(
  client: { from: ReturnType<typeof vi.fn> },
  _table: string,
  data: unknown,
  error?: { message: string; code?: string },
) {
  if (error) {
    client.from.mockReturnValue(
      mockSupabaseChain({ data: null, error: { message: error.message } }),
    )
  } else {
    client.from.mockReturnValue(
      mockSupabaseChain({ data, error: null } as { data: unknown; error: null }),
    )
  }
}

/**
 * Convenience: configure supabase.rpc() to resolve for a specific function name.
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase'
 *   setupRpcMock(supabase as any, 'get_client_dashboard_data', mockDashboard)
 */
export function setupRpcMock(
  client: { rpc: ReturnType<typeof vi.fn> },
  _fnName: string,
  data: unknown,
  error?: { message: string },
) {
  if (error) {
    client.rpc.mockResolvedValue({ data: null, error })
  } else {
    client.rpc.mockResolvedValue({ data, error: null })
  }
}
