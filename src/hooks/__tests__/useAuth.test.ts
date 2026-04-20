import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ============================================================================
// MOCKS
// ============================================================================

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignOut = vi.fn()
const mockFromSelect = vi.fn()

// Track the auth listener callback so we can trigger it in tests
let authListenerCallback: ((event: string, session: unknown) => void) | null = null

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authListenerCallback = cb
        return mockOnAuthStateChange(cb)
      },
      signOut: () => mockSignOut(),
    },
    from: (table: string) => {
      const chain: Record<string, unknown> = {}
      const methods = ['select', 'eq', 'order', 'limit', 'single', 'maybeSingle']
      for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain)
      }
      chain.then = (resolve: (v: unknown) => void) => {
        // Delegate to mockFromSelect which resolves differently per table
        const result = mockFromSelect(table)
        return resolve(result)
      }
      return chain
    },
  },
}))

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import { useAuth, AuthProvider } from '@/contexts/AuthContext'
import { useAuthSimple } from '../useAuthSimple'

// ============================================================================
// HELPERS
// ============================================================================

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      ...((overrides.user as Record<string, unknown>) || {}),
    },
    ...overrides,
  }
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    full_name: 'Test User',
    email: 'test@example.com',
    phone: '+573001234567',
    avatar_url: 'https://example.com/avatar.jpg',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    deactivated_at: null,
    has_used_free_trial: false,
    free_trial_used_at: null,
    free_trial_business_id: null,
    ...overrides,
  }
}

// ============================================================================
// useAuth (Context consumer)
// ============================================================================

describe('useAuth', () => {
  it('returns default auth state when no AuthProvider is present', () => {
    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuth(), { wrapper: getWrapper() })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('returns default signOut that is a no-op', async () => {
    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuth(), { wrapper: getWrapper() })

    // Should not throw
    await expect(result.current.signOut()).resolves.toBeUndefined()
  })
})

// ============================================================================
// useAuthSimple
// ============================================================================

describe('useAuthSimple', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authListenerCallback = null

    // Default: no session
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    // Default: auth listener returns subscription
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    })

    // Default: profile and business queries return nothing
    mockFromSelect.mockReturnValue({ data: null, error: null })
  })

  it('starts with loading true', () => {
    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    // Initial state before any async resolves
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('sets loading false when no session exists', async () => {
    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('hydrates user from session and profile', async () => {
    const session = makeSession()
    const profile = makeProfile()

    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    // profiles query returns profile data
    mockFromSelect.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { data: profile, error: null }
      }
      return { data: null, error: null }
    })

    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.id).toBe('user-1')
    expect(result.current.user?.email).toBe('test@example.com')
    expect(result.current.session).toBeTruthy()
  })

  it('sets user with fallback when profile fetch fails', async () => {
    const session = makeSession()

    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    // Profile fetch fails
    mockFromSelect.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { data: null, error: { message: 'Profile not found' } }
      }
      return { data: null, error: null }
    })

    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // User should still exist from session metadata (fallback)
    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.id).toBe('user-1')
  })

  it('handles getSession error gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session expired' },
    })

    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('signOut calls supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('clears user on SIGNED_OUT auth event', async () => {
    const session = makeSession()
    const profile = makeProfile()

    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    mockFromSelect.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { data: profile, error: null }
      }
      return { data: null, error: null }
    })

    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.user).not.toBeNull())

    // Simulate sign out event
    act(() => {
      if (authListenerCallback) {
        authListenerCallback('SIGNED_OUT', null)
      }
    })

    await waitFor(() => expect(result.current.user).toBeNull())
    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets up auth state change listener on mount', () => {
    const getWrapper = () => createWrapper().Wrapper
    renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    expect(mockOnAuthStateChange).toHaveBeenCalledOnce()
  })

  it('unsubscribes from auth listener on unmount', () => {
    const unsubscribe = vi.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe },
      },
    })

    const getWrapper = () => createWrapper().Wrapper
    const { unmount } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('fetches business context for authenticated user', async () => {
    const session = makeSession()
    const profile = makeProfile()

    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    // Simulate: profile found, then business found for owner
    let callCount = 0
    mockFromSelect.mockImplementation((table: string) => {
      callCount++
      if (table === 'profiles') {
        return { data: profile, error: null }
      }
      if (table === 'businesses') {
        // First businesses call: owned businesses lookup
        // Second businesses call: owner_id lookup
        return { data: { id: 'biz-1', owner_id: 'user-1' }, error: null }
      }
      return { data: null, error: null }
    })

    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))
    await waitFor(() => expect(result.current.currentBusinessId).toBe('biz-1'))
    expect(result.current.businessOwnerId).toBe('user-1')
  })

  it('returns undefined businessId when user has no businesses', async () => {
    const session = makeSession()
    const profile = makeProfile()

    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    mockFromSelect.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { data: profile, error: null }
      }
      // No businesses found
      return { data: null, error: null }
    })

    const getWrapper = () => createWrapper().Wrapper
    const { result } = renderHook(() => useAuthSimple(), { wrapper: getWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.currentBusinessId).toBeUndefined()
    expect(result.current.businessOwnerId).toBeUndefined()
  })
})
