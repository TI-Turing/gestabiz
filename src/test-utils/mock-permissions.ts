/**
 * Helpers para mockear el hook `usePermissions` y el componente `PermissionGate`
 * en tests unitarios del rol Administrador.
 *
 * USO TÍPICO (en un test):
 *
 *   import { vi } from 'vitest'
 *   import { mockUsePermissions, mockPermissionsAsOwner } from '@/test-utils/mock-permissions'
 *
 *   vi.mock('@/hooks/usePermissions', () => ({
 *     usePermissions: vi.fn(() => mockUsePermissions(['services.create', 'services.edit'])),
 *   }))
 *
 *   // o si el usuario es owner (bypass total)
 *   vi.mock('@/hooks/usePermissions', () => ({
 *     usePermissions: vi.fn(() => mockPermissionsAsOwner()),
 *   }))
 */
import { vi } from 'vitest'
import type { Permission } from '@/types/types'

interface PermissionCheckResult {
  hasPermission: boolean
  reason?: string
}

interface MockedPermissionsHook {
  // API legacy
  hasPermission: (permission: Permission | string) => boolean
  // API v2
  checkPermission: (permission: Permission | string) => PermissionCheckResult
  checkAnyPermission: (permissions: (Permission | string)[]) => boolean
  checkAllPermissions: (permissions: (Permission | string)[]) => boolean
  // Flags de rol
  isOwner: boolean
  isAdmin: boolean
  isEmployee: boolean
  canOfferServices: boolean
  // Estado
  isLoading: boolean
  // Datos
  userPermissions: string[]
  businessRoles: string[]
  activePermissions: string[]
}

/**
 * Construye un mock del hook `usePermissions` con un set específico de permisos concedidos.
 *
 * @param granted Lista de permisos que el usuario debe tener (ej. `['services.create']`)
 * @param overrides Overrides para flags de rol o estado (ej. `{ isAdmin: true }`)
 *
 * @example
 *   mockUsePermissions(['services.create', 'services.delete'])
 *   mockUsePermissions([], { isLoading: true })
 */
export function mockUsePermissions(
  granted: string[] = [],
  overrides: Partial<MockedPermissionsHook> = {}
): MockedPermissionsHook {
  const grantedSet = new Set(granted)

  return {
    hasPermission: vi.fn((permission: Permission | string) => grantedSet.has(permission)),
    checkPermission: vi.fn((permission: Permission | string) => ({
      hasPermission: grantedSet.has(permission),
      reason: grantedSet.has(permission) ? undefined : 'Permission not granted',
    })),
    checkAnyPermission: vi.fn((permissions) => permissions.some((p) => grantedSet.has(p))),
    checkAllPermissions: vi.fn((permissions) => permissions.every((p) => grantedSet.has(p))),
    isOwner: false,
    isAdmin: true,
    isEmployee: false,
    canOfferServices: false,
    isLoading: false,
    userPermissions: granted,
    businessRoles: ['admin'],
    activePermissions: granted,
    ...overrides,
  } as MockedPermissionsHook
}

/**
 * Mock de `usePermissions` cuando el usuario es OWNER (bypass total).
 * Toda llamada a `hasPermission`/`checkPermission` retorna true sin importar el permiso.
 */
export function mockPermissionsAsOwner(
  overrides: Partial<MockedPermissionsHook> = {}
): MockedPermissionsHook {
  return {
    hasPermission: vi.fn(() => true),
    checkPermission: vi.fn(() => ({ hasPermission: true })),
    checkAnyPermission: vi.fn(() => true),
    checkAllPermissions: vi.fn(() => true),
    isOwner: true,
    isAdmin: true,
    isEmployee: false,
    canOfferServices: true,
    isLoading: false,
    userPermissions: [],
    businessRoles: ['owner'],
    activePermissions: [],
    ...overrides,
  } as MockedPermissionsHook
}

/**
 * Mock de `usePermissions` cuando el usuario es CLIENT (sin permisos administrativos).
 */
export function mockPermissionsAsClient(
  overrides: Partial<MockedPermissionsHook> = {}
): MockedPermissionsHook {
  return mockUsePermissions([], {
    isAdmin: false,
    isEmployee: false,
    isOwner: false,
    businessRoles: [],
    ...overrides,
  })
}

/**
 * Mock de `usePermissions` mientras los permisos están cargando.
 */
export function mockPermissionsLoading(): MockedPermissionsHook {
  return mockUsePermissions([], { isLoading: true, isAdmin: false })
}
