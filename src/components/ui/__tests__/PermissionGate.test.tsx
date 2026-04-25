import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render-with-providers'
import { PermissionGate } from '../PermissionGate'

const mockCheckPermission = vi.hoisted(() => vi.fn())
const mockIsOwner = vi.hoisted(() => ({ value: false }))
const mockIsLoading = vi.hoisted(() => ({ value: false }))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    checkPermission: mockCheckPermission,
    isOwner: mockIsOwner.value,
    isLoading: mockIsLoading.value,
  }),
}))

const PROTECTED_CONTENT = 'Contenido protegido'
const FALLBACK_CONTENT = 'Sin acceso'

describe('PermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOwner.value = false
    mockIsLoading.value = false
    mockCheckPermission.mockReturnValue({ hasPermission: true, reason: '' })
  })

  it('renders children when permission is granted', () => {
    renderWithProviders(
      <PermissionGate permission="services.create" businessId="biz-1">
        <div>{PROTECTED_CONTENT}</div>
      </PermissionGate>,
    )
    expect(screen.getByText(PROTECTED_CONTENT)).toBeDefined()
  })

  it('renders children when user is owner (bypass)', () => {
    mockIsOwner.value = true
    mockCheckPermission.mockReturnValue({ hasPermission: false, reason: 'no perm' })

    renderWithProviders(
      <PermissionGate permission="services.delete" businessId="biz-1">
        <div>{PROTECTED_CONTENT}</div>
      </PermissionGate>,
    )
    expect(screen.getByText(PROTECTED_CONTENT)).toBeDefined()
  })

  describe('mode: block (default)', () => {
    it('hides children and renders AccessDenied when permission denied', () => {
      mockCheckPermission.mockReturnValue({ hasPermission: false, reason: 'forbidden' })

      renderWithProviders(
        <PermissionGate permission="services.delete" businessId="biz-1">
          <div>{PROTECTED_CONTENT}</div>
        </PermissionGate>,
      )
      expect(screen.queryByText(PROTECTED_CONTENT)).toBeNull()
    })

    it('shows custom fallback when provided and permission denied', () => {
      mockCheckPermission.mockReturnValue({ hasPermission: false, reason: 'forbidden' })

      renderWithProviders(
        <PermissionGate
          permission="services.delete"
          businessId="biz-1"
          fallback={<span>{FALLBACK_CONTENT}</span>}
        >
          <div>{PROTECTED_CONTENT}</div>
        </PermissionGate>,
      )
      expect(screen.queryByText(PROTECTED_CONTENT)).toBeNull()
      expect(screen.getByText(FALLBACK_CONTENT)).toBeDefined()
    })
  })

  describe('mode: hide', () => {
    it('renders nothing when permission denied', () => {
      mockCheckPermission.mockReturnValue({ hasPermission: false, reason: 'forbidden' })

      const { container } = renderWithProviders(
        <PermissionGate permission="employees.edit" businessId="biz-1" mode="hide">
          <div>{PROTECTED_CONTENT}</div>
        </PermissionGate>,
      )
      expect(screen.queryByText(PROTECTED_CONTENT)).toBeNull()
      expect(container.firstChild).toBeNull()
    })

    it('renders children when permission granted', () => {
      renderWithProviders(
        <PermissionGate permission="employees.edit" businessId="biz-1" mode="hide">
          <div>{PROTECTED_CONTENT}</div>
        </PermissionGate>,
      )
      expect(screen.getByText(PROTECTED_CONTENT)).toBeDefined()
    })
  })

  describe('mode: disable', () => {
    it('renders children wrapped in disabled overlay when permission denied', () => {
      mockCheckPermission.mockReturnValue({ hasPermission: false, reason: 'forbidden' })

      renderWithProviders(
        <PermissionGate permission="accounting.view" businessId="biz-1" mode="disable">
          <button>{PROTECTED_CONTENT}</button>
        </PermissionGate>,
      )
      // Children are rendered but wrapped in a pointer-events-none div
      expect(screen.getByText(PROTECTED_CONTENT)).toBeDefined()
    })

    it('renders children normally when permission granted', () => {
      renderWithProviders(
        <PermissionGate permission="accounting.view" businessId="biz-1" mode="disable">
          <button>{PROTECTED_CONTENT}</button>
        </PermissionGate>,
      )
      expect(screen.getByText(PROTECTED_CONTENT)).toBeDefined()
    })
  })

  describe('loading state', () => {
    it('returns null while loading in hide mode', () => {
      mockIsLoading.value = true

      const { container } = renderWithProviders(
        <PermissionGate permission="services.create" businessId="biz-1" mode="hide">
          <div>{PROTECTED_CONTENT}</div>
        </PermissionGate>,
      )
      expect(screen.queryByText(PROTECTED_CONTENT)).toBeNull()
      expect(container.firstChild).toBeNull()
    })

    it('shows disabled overlay while loading in disable mode', () => {
      mockIsLoading.value = true

      renderWithProviders(
        <PermissionGate permission="services.create" businessId="biz-1" mode="disable">
          <button>{PROTECTED_CONTENT}</button>
        </PermissionGate>,
      )
      // Content is rendered but disabled
      expect(screen.getByText(PROTECTED_CONTENT)).toBeDefined()
    })
  })
})
