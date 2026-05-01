/**
 * QueryClient singleton — extraído de App.tsx para ser importable desde
 * fuera del árbol de React (e.g., useAuthSimple.ts en el handler de signOut).
 *
 * Antes vivía inline en App.tsx, lo que impedía limpiar el cache al cerrar
 * sesión: la cache de un usuario podía filtrarse al siguiente login en la
 * misma pestaña. Ref: auditoria-completa-abril-2026.md §1.2 (estabilidad).
 *
 * El QueryClientProvider en App.tsx debe consumir este singleton.
 */

import * as Sentry from '@sentry/react'
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'

const toSentryError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return new Error(maybeMessage)
    }
    return new Error(`Non-Error object captured: ${JSON.stringify(error)}`)
  }

  return new Error(String(error))
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Solo capturar errores inesperados (no errores de autenticación esperados)
      const errMsg = error instanceof Error ? error.message : String(error)
      const isExpected =
        errMsg.includes('JWT') ||
        errMsg.includes('not authenticated') ||
        errMsg.includes('PGRST116')
      if (!isExpected) {
        Sentry.captureException(toSentryError(error), {
          tags: { source: 'react-query', type: 'query' },
          extra: { queryKey: JSON.stringify(query.queryKey), rawError: error },
        })
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      Sentry.captureException(toSentryError(error), {
        tags: { source: 'react-query', type: 'mutation' },
        extra: { mutationKey: JSON.stringify(mutation.options.mutationKey), rawError: error },
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

/**
 * Limpia totalmente la cache de React Query. Llamar al cerrar sesión para
 * evitar que datos del usuario A queden visibles al usuario B en la misma
 * pestaña.
 */
export function resetQueryClient(): void {
  queryClient.cancelQueries()
  queryClient.clear()
  queryClient.removeQueries()
}
