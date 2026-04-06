/**
 * Mobile services layer — thin wrapper over supabase client.
 * No Sentry/normalizers — keeps mobile bundle lean.
 */

// ─── Error helper ─────────────────────────────────────────────────────────────

export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public original?: unknown,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export function throwIfError(
  error: { message: string } | null,
  code: string,
  fallback: string,
): void {
  if (error) throw new ServiceError(code, error.message || fallback, error)
}
