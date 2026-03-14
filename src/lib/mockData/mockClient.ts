// ============================================================
// MOCK DATA — Enhanced Supabase Mock Client
// Returns realistic data instead of empty arrays
// ============================================================
import * as data from './data'

// ─── Database store keyed by table name ─────────────────────
type MockRow = Record<string, unknown>
type MockDB = Record<string, MockRow[]>

const MOCK_DB: MockDB = {
  profiles: data.profiles,
  businesses: data.businesses,
  locations: data.locations,
  services: data.services,
  business_employees: data.business_employees,
  employee_services: data.employee_services,
  location_services: data.location_services,
  business_roles: data.business_roles,
  business_categories: data.business_categories,
  appointments: data.appointments,
  transactions: data.transactions,
  recurring_expenses: data.recurring_expenses,
  in_app_notifications: data.in_app_notifications,
  employee_absences: data.employee_absences,
  absence_approval_requests: data.absence_approval_requests,
  vacation_balance: data.vacation_balance,
  job_vacancies: data.job_vacancies,
  job_applications: data.job_applications,
  business_resources: data.business_resources,
  reviews: data.reviews,
  chat_conversations: data.chat_conversations,
  chat_participants: data.chat_participants,
  messages: data.messages,
  user_permissions: data.user_permissions,
  public_holidays: data.public_holidays,
}

// ─── Query Builder ──────────────────────────────────────────
interface Filter { col: string; op: string; val: unknown }

function applyFilters(rows: MockRow[], filters: Filter[]): MockRow[] {
  let result = [...rows]
  for (const f of filters) {
    switch (f.op) {
      case 'eq':
        result = result.filter(r => r[f.col] === f.val)
        break
      case 'neq':
        result = result.filter(r => r[f.col] !== f.val)
        break
      case 'gt':
        result = result.filter(r => (r[f.col] as string) > (f.val as string))
        break
      case 'gte':
        result = result.filter(r => (r[f.col] as string) >= (f.val as string))
        break
      case 'lt':
        result = result.filter(r => (r[f.col] as string) < (f.val as string))
        break
      case 'lte':
        result = result.filter(r => (r[f.col] as string) <= (f.val as string))
        break
      case 'in':
        result = result.filter(r => (f.val as unknown[]).includes(r[f.col]))
        break
      case 'is':
        result = result.filter(r => r[f.col] === f.val)
        break
      case 'ilike': {
        const pattern = String(f.val).replace(/%/g, '.*')
        const rx = new RegExp(pattern, 'i')
        result = result.filter(r => rx.test(String(r[f.col] ?? '')))
        break
      }
      case 'contains':
        result = result.filter(r => {
          const arr = r[f.col]
          return Array.isArray(arr) && arr.includes(f.val)
        })
        break
      case 'or': {
        // Parse PostgREST-style OR expressions: "col.op.val,col.op.val"
        const expr = f.val as string
        const conditions = expr.split(',')
        result = result.filter(row => {
          return conditions.some(cond => {
            const dotIdx = cond.indexOf('.')
            const col = cond.substring(0, dotIdx)
            const rest = cond.substring(dotIdx + 1)
            const dotIdx2 = rest.indexOf('.')
            const op = rest.substring(0, dotIdx2)
            const val = rest.substring(dotIdx2 + 1)
            switch (op) {
              case 'eq': return String(row[col]) === val
              case 'is': return val === 'null' ? (row[col] === null || row[col] === undefined) : row[col] === val
              case 'neq': return String(row[col]) !== val
              default: return true
            }
          })
        })
        break
      }
    }
  }
  return result
}

function createQueryBuilder(tableName: string) {
  const filters: Filter[] = []
  let orderCol: string | null = null
  let orderAsc = true
  let limitN: number | null = null
  let rangeFrom: number | null = null
  let rangeTo: number | null = null
  let countMode = false

  function getData(): MockRow[] {
    let rows = applyFilters(MOCK_DB[tableName] || [], filters)

    if (orderCol) {
      const col = orderCol
      rows.sort((a, b) => {
        const va = a[col] as string ?? ''
        const vb = b[col] as string ?? ''
        if (va < vb) return orderAsc ? -1 : 1
        if (va > vb) return orderAsc ? 1 : -1
        return 0
      })
    }

    if (rangeFrom !== null && rangeTo !== null) {
      rows = rows.slice(rangeFrom, rangeTo + 1)
    }

    if (limitN !== null) {
      rows = rows.slice(0, limitN)
    }

    return rows
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api: any = {
    select: (_cols?: string, opts?: { count?: string }) => {
      if (opts?.count) countMode = true
      return api
    },
    eq: (col: string, val: unknown) => { filters.push({ col, op: 'eq', val }); return api },
    neq: (col: string, val: unknown) => { filters.push({ col, op: 'neq', val }); return api },
    gt: (col: string, val: unknown) => { filters.push({ col, op: 'gt', val }); return api },
    gte: (col: string, val: unknown) => { filters.push({ col, op: 'gte', val }); return api },
    lt: (col: string, val: unknown) => { filters.push({ col, op: 'lt', val }); return api },
    lte: (col: string, val: unknown) => { filters.push({ col, op: 'lte', val }); return api },
    in: (col: string, val: unknown[]) => { filters.push({ col, op: 'in', val }); return api },
    is: (col: string, val: unknown) => { filters.push({ col, op: 'is', val }); return api },
    ilike: (col: string, val: string) => { filters.push({ col, op: 'ilike', val }); return api },
    contains: (col: string, val: unknown) => { filters.push({ col, op: 'contains', val }); return api },
    not: (_col: string, _op: string, _val: unknown) => api,
    or: (expr: string) => { filters.push({ col: '__or__', op: 'or', val: expr }); return api },
    filter: (_col: string, _op: string, _val: unknown) => api,
    textSearch: () => api,
    match: (criteria: Record<string, unknown>) => {
      for (const [col, val] of Object.entries(criteria)) {
        filters.push({ col, op: 'eq', val })
      }
      return api
    },
    order: (col: string, opts?: { ascending?: boolean }) => {
      orderCol = col
      orderAsc = opts?.ascending !== false
      return api
    },
    limit: (n: number) => {
      limitN = n
      return api
    },
    range: (from: number, to: number) => {
      rangeFrom = from
      rangeTo = to
      return api
    },
    single: () => {
      const rows = getData()
      return Promise.resolve({
        data: rows[0] ?? null,
        error: rows.length === 0 ? { code: 'PGRST116', message: 'No rows found' } : null,
      })
    },
    maybeSingle: () => {
      const rows = getData()
      return Promise.resolve({ data: rows[0] ?? null, error: null })
    },
    then: (
      resolve: (v: { data: MockRow[]; error: null; count?: number }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => {
      const rows = getData()
      const result: { data: MockRow[]; error: null; count?: number } = { data: rows, error: null }
      if (countMode) result.count = rows.length
      return Promise.resolve(result).then(resolve, reject)
    },

    // ─ Mutations ─
    insert: (payload: unknown) => {
      const row = Array.isArray(payload) ? payload[0] : payload
      const inserted = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...(row as object) }
      const subApi = {
        select: () => ({
          single: () => Promise.resolve({ data: inserted, error: null }),
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: [inserted], error: null }).then(resolve),
        }),
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: inserted, error: null }).then(resolve),
      }
      return subApi
    },
    update: (payload: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub: any = {
        eq: () => sub, neq: () => sub, in: () => sub, match: () => sub, is: () => sub,
        select: () => ({
          single: () => Promise.resolve({ data: payload, error: null }),
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: [payload], error: null }).then(resolve),
        }),
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: payload, error: null }).then(resolve),
      }
      return sub
    },
    delete: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub: any = {
        eq: () => sub, neq: () => sub, in: () => sub, match: () => sub,
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(resolve),
      }
      return sub
    },
    upsert: (payload: unknown) => api.insert(payload),
  }

  return api
}

// ─── RPC Handler ────────────────────────────────────────────
function handleRpc(fnName: string, params?: Record<string, unknown>) {
  const rpcMap: Record<string, unknown> = {
    get_business_hierarchy: data.rpcData.get_business_hierarchy,
    get_client_dashboard_data: data.rpcData.get_client_dashboard_data,
    search_businesses: data.businesses,
    search_services: data.services,
    search_professionals: data.rpcData.get_business_hierarchy,
    is_resource_available: true,
    get_resource_stats: { total_bookings: 234, revenue_total: 18700000, revenue_this_month: 3200000 },
    get_unread_messages_count: 2,
    refresh_ratings_stats: null,
    calculate_absence_days: params?.p_end_date && params?.p_start_date
      ? Math.ceil((new Date(params.p_end_date as string).getTime() - new Date(params.p_start_date as string).getTime()) / 86400000) + 1
      : 1,
  }
  const result = rpcMap[fnName] ?? null
  return Promise.resolve({ data: result, error: null })
}

// ─── Mock Auth ──────────────────────────────────────────────
const mockUser = {
  id: 'demo-user-id',
  email: 'carlos.mendoza@elitewellness.co',
  user_metadata: { full_name: 'Carlos Mendoza', avatar_url: 'https://i.pravatar.cc/150?u=carlos-owner' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
}

const mockSession = {
  user: mockUser,
  access_token: 'mock-access-token-jwt',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer' as const,
  expires_at: Date.now() + 3600000,
}

// ─── Export: Enhanced Mock Client ───────────────────────────
export function createEnhancedMockClient() {
  const client = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      onAuthStateChange: (callback: (event: string, session: typeof mockSession) => void) => {
        setTimeout(() => callback('SIGNED_IN', mockSession), 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: () => Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null }),
      signUp: () => Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: { provider: 'google', url: 'mock-url' }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
      updateUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      refreshSession: () => Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null }),
    },

    from: (table: string) => createQueryBuilder(table),
    rpc: handleRpc,

    functions: {
      invoke: (_fnName: string, _opts?: unknown) => Promise.resolve({ data: { success: true }, error: null }),
    },

    channel: (_name: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ch: any = {
        on: () => ch,
        subscribe: (callback?: (status: string) => void) => {
          if (callback) setTimeout(() => callback('SUBSCRIBED'), 50)
          return ch
        },
        unsubscribe: () => Promise.resolve('ok'),
        send: () => Promise.resolve('ok'),
      }
      return ch
    },
    removeChannel: () => Promise.resolve('ok'),
    removeAllChannels: () => Promise.resolve([]),

    storage: {
      from: (_bucket: string) => ({
        upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://picsum.photos/seed/${path}/200/200` } }),
        download: () => Promise.resolve({ data: new Blob(), error: null }),
        remove: () => Promise.resolve({ data: [], error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
      }),
    },
  } as unknown

  // Type assertion to match SupabaseClient
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as any
}
