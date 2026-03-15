/**
 * Error boundary ligero para secciones de la UI.
 * Captura errores de render en una sección sin crashear toda la app.
 * Envía el error a Sentry automáticamente mediante el onError callback.
 */
import React from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import * as Sentry from '@sentry/react'
import { Warning } from '@phosphor-icons/react'

interface SectionErrorBoundaryProps {
  children: React.ReactNode
  /** Mensaje de error personalizado para el usuario */
  errorMessage?: string
  /** Clave para forzar re-mount del boundary (reset) */
  resetKey?: string | number
}

function SectionFallback({ error, resetErrorBoundary, errorMessage }: FallbackProps & { errorMessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center rounded-lg border border-destructive/30 bg-destructive/5">
      <Warning className="h-8 w-8 text-destructive" weight="fill" />
      <p className="text-sm font-medium text-destructive">
        {errorMessage ?? 'Ocurrió un error al cargar esta sección'}
      </p>
      {import.meta.env.DEV && error instanceof Error && (
        <p className="text-xs text-muted-foreground font-mono max-w-sm truncate">{error.message}</p>
      )}
      <button
        onClick={resetErrorBoundary}
        className="text-xs underline text-muted-foreground hover:text-foreground transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}

export function SectionErrorBoundary({ children, errorMessage, resetKey }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      resetKeys={resetKey !== undefined ? [resetKey] : undefined}
      onError={(error, info) => {
        Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
      }}
      FallbackComponent={(props) => <SectionFallback {...props} errorMessage={errorMessage} />}
    >
      {children}
    </ErrorBoundary>
  )
}
