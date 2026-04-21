import { vi } from 'vitest';

/**
 * Enhanced Supabase Mock Builder
 * 
 * Proporciona una interfaz robusta para mockear el cliente Supabase
 * en tests, soportando: .from(), .select(), .eq(), .in(), .order(), .rpc()
 * 
 * Uso:
 *   const { supabase, mockQuery, mockRPC } = createSupabaseMock();
 *   mockQuery('appointments')
 *     .select('*')
 *     .eq('employee_id', 'emp-123')
 *     .returns([{ id: 'apt-1', ... }]);
 */

export interface MockSupabaseChain {
  select: (...args: any[]) => MockSupabaseChain;
  eq: (...args: any[]) => MockSupabaseChain;
  in: (...args: any[]) => MockSupabaseChain;
  insert: (...args: any[]) => MockSupabaseChain;
  update: (...args: any[]) => MockSupabaseChain;
  delete: (...args: any[]) => MockSupabaseChain;
  order: (...args: any[]) => MockSupabaseChain;
  single: () => MockSupabaseChain;
  is: (...args: any[]) => MockSupabaseChain;
  filter: (...args: any[]) => MockSupabaseChain;
  match: (...args: any[]) => MockSupabaseChain;
  contains: (...args: any[]) => MockSupabaseChain;
}

interface MockedQuery {
  table: string;
  method: string;
  filters: Record<string, any>;
  data: any;
  error: Error | null;
}

export function createSupabaseMock() {
  const mockedQueries: MockedQuery[] = [];
  let defaultResponse: { data?: any; error?: Error | null } = { data: null, error: null };

  /**
   * Crea un mock de cadena Supabase que registra operaciones
   */
  function createChain(table: string, method: string = 'select'): MockSupabaseChain {
    const filters: Record<string, any> = {};
    let isSingle = false;

    const chain: any = {
      select: (...args: any[]) => {
        return createChain(table, 'select');
      },
      eq: (column: string, value: any) => {
        filters[column] = { op: 'eq', value };
        return chain;
      },
      in: (column: string, values: any[]) => {
        filters[column] = { op: 'in', values };
        return chain;
      },
      insert: (data: any) => {
        filters._insert = data;
        return chain;
      },
      update: (data: any) => {
        filters._update = data;
        return chain;
      },
      delete: () => {
        filters._delete = true;
        return chain;
      },
      order: (column: string, options?: any) => {
        filters._order = { column, ...options };
        return chain;
      },
      single: () => {
        isSingle = true;
        return chain;
      },
      is: (column: string, value: any) => {
        filters[column] = { op: 'is', value };
        return chain;
      },
      filter: (column: string, operator: string, value: any) => {
        filters[column] = { op: operator, value };
        return chain;
      },
      match: (column: string, value: any) => {
        filters[column] = { op: 'match', value };
        return chain;
      },
      contains: (column: string, value: any) => {
        filters[column] = { op: 'contains', value };
        return chain;
      },
    };

    // Agregar método then() para Promise
    chain.then = (onResolve: any, onReject: any) => {
      const matchedQuery = mockedQueries.find(q => 
        q.table === table && 
        JSON.stringify(q.filters) === JSON.stringify(filters)
      );

      if (matchedQuery) {
        if (matchedQuery.error) {
          onReject?.(matchedQuery.error);
        } else {
          onResolve?.({ data: matchedQuery.data, error: matchedQuery.error });
        }
      } else {
        // Return default response
        if (defaultResponse.error) {
          onReject?.(defaultResponse.error);
        } else {
          onResolve?.({ data: defaultResponse.data, error: defaultResponse.error });
        }
      }
      return Promise.resolve();
    };

    return chain;
  }

  const supabase = {
    from: (table: string) => {
      return createChain(table);
    },
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn().mockReturnThis(),
    })),
  };

  function mockQuery(table: string) {
    return {
      select: (columns: string = '*') => ({
        returns: (data: any) => {
          mockedQueries.push({ table, method: 'select', filters: { _select: columns }, data, error: null });
          return { eq, in: inFilter };
        },
      }),
      eq: (column: string, value: any) => ({
        returns: (data: any) => {
          mockedQueries.push({ table, method: 'select', filters: { [column]: { op: 'eq', value } }, data, error: null });
          return { in: inFilter };
        },
      }),
      in: (column: string, values: any[]) => ({
        returns: (data: any) => {
          mockedQueries.push({ table, method: 'select', filters: { [column]: { op: 'in', values } }, data, error: null });
        },
      }),
      insert: (data: any) => ({
        returns: (resultData: any) => {
          mockedQueries.push({ table, method: 'insert', filters: { _insert: data }, data: resultData, error: null });
        },
      }),
      update: (data: any) => ({
        returns: (resultData: any) => {
          mockedQueries.push({ table, method: 'update', filters: { _update: data }, data: resultData, error: null });
        },
      }),
      delete: () => ({
        returns: (resultData: any) => {
          mockedQueries.push({ table, method: 'delete', filters: { _delete: true }, data: resultData, error: null });
        },
      }),
      error: (error: Error) => {
        mockedQueries.push({ table, method: 'select', filters: {}, data: null, error });
      },
    };
  }

  function mockRPC(functionName: string, params: any = {}) {
    return {
      returns: (data: any) => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data, error: null });
      },
      error: (error: Error) => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error });
      },
    };
  }

  function setDefaultResponse(data: any, error: Error | null = null) {
    defaultResponse = { data, error };
  }

  function clearMocks() {
    mockedQueries.length = 0;
    defaultResponse = { data: null, error: null };
    vi.clearAllMocks();
  }

  function eq(column: string, value: any) {
    return { returns: () => {} };
  }

  function inFilter(column: string, values: any[]) {
    return { returns: () => {} };
  }

  return {
    supabase,
    mockQuery,
    mockRPC,
    setDefaultResponse,
    clearMocks,
    mockedQueries,
  };
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;
