import React, { type ReactElement } from 'react'
import { render, type RenderOptions, renderHook, type RenderHookOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import type { User, UserRole } from '@/types/types'
import { createMockUser } from './mock-factories'

/**
 * Creates a fresh QueryClient configured for testing:
 * - No retries (fail fast)
 * - No garbage collection delay
 * - No refetch on window focus
 * - Silenced error logging
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: React.ReactNode
}

interface WrapperOptions {
  /** Skip wrapping with BrowserRouter (useful when test provides its own router) */
  withoutRouter?: boolean
  /** Skip wrapping with LanguageProvider (rare; only if test mocks useLanguage) */
  withoutLanguage?: boolean
  /** Skip wrapping with ThemeProvider (rare; only if test mocks useTheme) */
  withoutTheme?: boolean
}

/**
 * Creates a wrapper component with all necessary providers for testing.
 * Each call creates a fresh QueryClient to isolate tests.
 *
 * Provider stack (outer → inner):
 *   QueryClientProvider → BrowserRouter → LanguageProvider → children
 */
export function createWrapper(options: WrapperOptions = {}) {
  const queryClient = createTestQueryClient()
  const { withoutRouter = false, withoutLanguage = false, withoutTheme = false } = options

  function Wrapper({ children }: WrapperProps) {
    let tree: React.ReactNode = children
    if (!withoutLanguage) {
      tree = <LanguageProvider>{tree}</LanguageProvider>
    }
    if (!withoutTheme) {
      tree = <ThemeProvider>{tree}</ThemeProvider>
    }
    if (!withoutRouter) {
      tree = <BrowserRouter>{tree}</BrowserRouter>
    }
    return <QueryClientProvider client={queryClient}>{tree}</QueryClientProvider>
  }

  return { Wrapper, queryClient }
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'>, WrapperOptions {}

/**
 * Custom render that wraps the component with all providers.
 * Returns the render result plus the queryClient for manual cache manipulation.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { withoutRouter, withoutLanguage, withoutTheme, ...renderOptions } = options
  const { Wrapper, queryClient } = createWrapper({ withoutRouter, withoutLanguage, withoutTheme })
  const result = render(ui, { wrapper: Wrapper, ...renderOptions })
  return { ...result, queryClient }
}

interface RenderHookWithProvidersOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'>, WrapperOptions {}

/**
 * Custom renderHook that wraps with all providers.
 * Returns the hook result plus the queryClient.
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: RenderHookWithProvidersOptions<TProps> = {}
) {
  const { withoutRouter, withoutLanguage, withoutTheme, ...renderOptions } = options
  const { Wrapper, queryClient } = createWrapper({ withoutRouter, withoutLanguage, withoutTheme })
  const result = renderHook(hook, { wrapper: Wrapper, ...renderOptions })
  return { ...result, queryClient }
}

// ─── Auth helper ───────────────────────────────────────────

interface RenderWithAuthOptions extends RenderWithProvidersOptions {
  /** Mocked user. If null, simulates unauthenticated state. */
  user?: User | null
  /** Active role override. Defaults to user.activeRole or 'admin'. */
  role?: UserRole
  /** Active business id (used by hooks that read currentBusinessId). */
  businessId?: string
}

/**
 * Render a component with all providers AND a mocked AuthContext.
 *
 * Internally calls `vi.doMock('@/contexts/AuthContext', ...)` to override `useAuth`
 * for the duration of the test. The mock returns a stable object with the mocked
 * user/session/businessId and stub mutators.
 *
 * NOTE: Because `vi.doMock` is hoisted at module-eval time, in tests that need a
 * different auth state per test it is preferable to mock `@/contexts/AuthContext`
 * at the top of the file with `vi.mock(...)` and then update the return value via
 * `vi.mocked(useAuth).mockReturnValue(...)`. This helper is a convenience for the
 * common case where ONE auth state is needed for the whole component test.
 */
export function renderWithAuth(
  ui: ReactElement,
  options: RenderWithAuthOptions = {}
) {
  const { user: userOverride, role, businessId, ...rest } = options
  const user =
    userOverride === null
      ? null
      : (userOverride ?? createMockUser({ activeRole: role ?? 'admin', role: role ?? 'admin' }))

  const authValue = {
    user,
    session: user ? { user: { id: user.id }, access_token: 'test-token' } : null,
    loading: false,
    error: null,
    currentBusinessId: businessId,
    businessOwnerId: undefined,
    signOut: vi.fn().mockResolvedValue(undefined),
    loginWithPassword: vi.fn().mockResolvedValue(undefined),
    signUpWithPassword: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signInWithGitHub: vi.fn().mockResolvedValue(undefined),
    loginWithOAuth: vi.fn().mockResolvedValue(undefined),
    getProfile: vi.fn().mockResolvedValue(user),
    switchBusiness: vi.fn(),
    validateToken: vi.fn().mockResolvedValue(true),
    sendMagicLink: vi.fn().mockResolvedValue(undefined),
    loginWithMagicLink: vi.fn().mockResolvedValue(undefined),
    validateMagicToken: vi.fn().mockResolvedValue(undefined),
  }

  vi.doMock('@/contexts/AuthContext', () => ({
    useAuth: () => authValue,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }))

  return { ...renderWithProviders(ui, rest), authValue }
}
