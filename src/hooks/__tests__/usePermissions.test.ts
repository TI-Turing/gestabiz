import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ── hoisted mocks ──────────────────────────────────────────────
const mockV2CheckPermission = vi.hoisted(() => vi.fn())
const mockCheckAnyPermission = vi.hoisted(() => vi.fn())
const mockCheckAllPermissions = vi.hoisted(() => vi.fn())

const mockV2Hook = {
  checkPermission: mockV2CheckPermission,
  checkAnyPermission: mockCheckAnyPermission,
  checkAllPermissions: mockCheckAllPermissions,
  isOwner: false,
  isAdmin: true,
  isEmployee: false,
  canOfferServices: false,
  userPermissions: ['services.create', 'services.edit'],
  businessRoles: [{ role: 'admin', businessId: 'biz1' }],
  activePermissions: ['services.create', 'services.edit'],
  isLoading: false,
}

vi.mock('../usePermissions-v2', () => ({
  usePermissions: vi.fn(() => mockV2Hook),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { usePermissions } from '../usePermissions'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions as usePermissionsV2 } from '../usePermissions-v2'

const mockUseAuth = vi.mocked(useAuth)
const mockUsePermissionsV2 = vi.mocked(usePermissionsV2)

const BASE_USER = {
  id: 'user1',
  email: 'user@test.com',
  activeRole: 'admin',
}

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePermissionsV2.mockReturnValue(mockV2Hook as never)
    mockUseAuth.mockReturnValue({
      user: BASE_USER,
      currentBusinessId: 'biz1',
      businessOwnerId: 'owner1',
    } as never)
    mockV2CheckPermission.mockReturnValue({ hasPermission: true, isOwner: false, reason: 'granted' })
  })

  describe('hasPermission (legacy API)', () => {
    it('delegates to v2 checkPermission and returns boolean', () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ businessId: 'biz1' }),
        { wrapper: Wrapper }
      )

      const canCreate = result.current.hasPermission('services.create' as never)

      expect(mockV2CheckPermission).toHaveBeenCalledWith('services.create')
      expect(canCreate).toBe(true)
    })

    it('returns false when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        currentBusinessId: null,
        businessOwnerId: null,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ businessId: 'biz1' }),
        { wrapper: Wrapper }
      )

      const canCreate = result.current.hasPermission('services.create' as never)

      expect(canCreate).toBe(false)
    })

    it('returns false when businessId is empty', () => {
      mockUseAuth.mockReturnValue({
        user: BASE_USER,
        currentBusinessId: null,  // no fallback either
        businessOwnerId: null,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions(''),
        { wrapper: Wrapper }
      )

      const result2 = result.current.hasPermission('services.create' as never)

      expect(result2).toBe(false)
    })
  })

  describe('checkPermission (v2 API)', () => {
    it('returns result from v2 when user is authenticated', () => {
      mockV2CheckPermission.mockReturnValue({
        hasPermission: true,
        isOwner: false,
        reason: 'has_permission',
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ businessId: 'biz1' }),
        { wrapper: Wrapper }
      )

      const perm = result.current.checkPermission('services.create' as never)

      expect(perm).toMatchObject({ hasPermission: true, isOwner: false })
    })

    it('returns unauthenticated result when no userId', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        currentBusinessId: null,
        businessOwnerId: null,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ businessId: 'biz1' }),
        { wrapper: Wrapper }
      )

      const perm = result.current.checkPermission('services.create' as never)

      expect(perm.hasPermission).toBe(false)
      expect(perm.reason).toBe('Usuario no autenticado')
    })
  })

  describe('flags from v2', () => {
    it('exposes isAdmin from v2 hook when v2Enabled', () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ businessId: 'biz1' }),
        { wrapper: Wrapper }
      )

      expect(result.current.isAdmin).toBe(true)
    })

    it('hides isAdmin (false) when v2 is not enabled (no user)', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        currentBusinessId: null,
        businessOwnerId: null,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ businessId: 'biz1' }),
        { wrapper: Wrapper }
      )

      expect(result.current.isAdmin).toBe(false)
    })

    it('exposes isLoading from v2', () => {
      mockUsePermissionsV2.mockReturnValue({ ...mockV2Hook, isLoading: true } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ businessId: 'biz1' }),
        { wrapper: Wrapper }
      )

      expect(result.current.isLoading).toBe(true)
    })

    it('uses currentBusinessId as fallback when businessId prop not provided', () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => usePermissions(undefined),
        { wrapper: Wrapper }
      )

      // finalBusinessId falls back to currentBusinessId = 'biz1'
      expect(result.current.businessId).toBe('biz1')
    })
  })
})
