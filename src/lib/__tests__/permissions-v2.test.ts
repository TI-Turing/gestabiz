import { describe, it, expect } from 'vitest'
import {
  isBusinessOwner,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserActivePermissions,
  hasBusinessRole,
  getUserBusinessRole,
  convertLegacyPermissions,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_DESCRIPTIONS,
  LEGACY_PERMISSION_MAP,
} from '@/lib/permissions-v2'
import type { UserPermission, BusinessRole } from '@/types/types'

// ─── helpers ────────────────────────────────────────────────────────────────
const UID = 'user-1'
const OWNER = 'owner-1'
const BIZ = 'biz-1'
const NOW_ISO = new Date().toISOString()

function makePermission(permission: string, opts: Partial<UserPermission> = {}): UserPermission {
  return {
    id: `perm-${permission}`,
    business_id: BIZ,
    user_id: UID,
    permission,
    granted_at: NOW_ISO,
    is_active: true,
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
    ...opts,
  }
}

function makeRole(role: 'admin' | 'employee', businessId = BIZ, opts: Partial<BusinessRole> = {}): BusinessRole {
  return {
    id: 'role-1',
    business_id: businessId,
    user_id: UID,
    role,
    assigned_at: NOW_ISO,
    is_active: true,
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
    ...opts,
  }
}

// ─── isBusinessOwner ─────────────────────────────────────────────────────────
describe('isBusinessOwner', () => {
  it('returns true when userId matches ownerId', () => {
    expect(isBusinessOwner('abc', 'abc')).toBe(true)
  })

  it('returns false when userId differs from ownerId', () => {
    expect(isBusinessOwner('abc', 'xyz')).toBe(false)
  })

  it('returns true when both strings are empty (equal)', () => {
    // isBusinessOwner just checks ===, so ('','')=== true
    expect(isBusinessOwner('', '')).toBe(true)
  })

  it('returns false when only userId is empty', () => {
    expect(isBusinessOwner('', 'owner-1')).toBe(false)
  })

  it('returns false when only ownerId is empty', () => {
    expect(isBusinessOwner('user-1', '')).toBe(false)
  })
})

// ─── hasPermission ───────────────────────────────────────────────────────────
describe('hasPermission', () => {
  it('returns true for owner regardless of userPermissions', () => {
    expect(hasPermission(OWNER, OWNER, [], 'services.create')).toBe(true)
  })

  it('returns true when user has the active permission', () => {
    const perms = [makePermission('services.create')]
    expect(hasPermission(UID, OWNER, perms, 'services.create')).toBe(true)
  })

  it('returns false when user does NOT have the permission', () => {
    expect(hasPermission(UID, OWNER, [], 'services.delete')).toBe(false)
  })

  it('returns false when permission is inactive', () => {
    const perms = [makePermission('services.create', { is_active: false })]
    expect(hasPermission(UID, OWNER, perms, 'services.create')).toBe(false)
  })

  it('returns false when permission is expired', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    const perms = [makePermission('services.create', { expires_at: pastDate })]
    expect(hasPermission(UID, OWNER, perms, 'services.create')).toBe(false)
  })

  it('returns true when permission expires in the future', () => {
    const futureDate = new Date(Date.now() + 9999999).toISOString()
    const perms = [makePermission('services.create', { expires_at: futureDate })]
    expect(hasPermission(UID, OWNER, perms, 'services.create')).toBe(true)
  })
})

// ─── hasAnyPermission ────────────────────────────────────────────────────────
describe('hasAnyPermission', () => {
  it('returns true for owner always', () => {
    expect(hasAnyPermission(OWNER, OWNER, [], ['services.create', 'services.delete'])).toBe(true)
  })

  it('returns true when user has at least one of the required permissions', () => {
    const perms = [makePermission('services.delete')]
    expect(hasAnyPermission(UID, OWNER, perms, ['services.create', 'services.delete'])).toBe(true)
  })

  it('returns false when user has none of the required permissions', () => {
    const perms = [makePermission('employees.view')]
    expect(hasAnyPermission(UID, OWNER, perms, ['services.create', 'services.delete'])).toBe(false)
  })

  it('returns false for empty permissions array', () => {
    expect(hasAnyPermission(UID, OWNER, [], ['services.create'])).toBe(false)
  })
})

// ─── hasAllPermissions ───────────────────────────────────────────────────────
describe('hasAllPermissions', () => {
  it('returns true for owner always', () => {
    expect(hasAllPermissions(OWNER, OWNER, [], ['services.create', 'services.delete'])).toBe(true)
  })

  it('returns true when user has ALL required permissions', () => {
    const perms = [makePermission('services.create'), makePermission('services.delete')]
    expect(hasAllPermissions(UID, OWNER, perms, ['services.create', 'services.delete'])).toBe(true)
  })

  it('returns false when user is missing at least one permission', () => {
    const perms = [makePermission('services.create')]
    expect(hasAllPermissions(UID, OWNER, perms, ['services.create', 'services.delete'])).toBe(false)
  })

  it('returns true for empty required array (vacuous truth)', () => {
    expect(hasAllPermissions(UID, OWNER, [], [])).toBe(true)
  })
})

// ─── getUserActivePermissions ────────────────────────────────────────────────
describe('getUserActivePermissions', () => {
  it('returns ALL_PERMISSIONS for owner', () => {
    const active = getUserActivePermissions(OWNER, OWNER, [])
    expect(active).toEqual(ALL_PERMISSIONS)
  })

  it('returns only active non-expired permissions', () => {
    const futureDate = new Date(Date.now() + 9999999).toISOString()
    const pastDate = new Date(Date.now() - 1000).toISOString()
    const perms = [
      makePermission('services.create'),
      makePermission('services.edit', { expires_at: futureDate }),
      makePermission('services.delete', { is_active: false }),
      makePermission('employees.view', { expires_at: pastDate }),
    ]
    const active = getUserActivePermissions(UID, OWNER, perms)
    expect(active).toContain('services.create')
    expect(active).toContain('services.edit')
    expect(active).not.toContain('services.delete')
    expect(active).not.toContain('employees.view')
  })

  it('returns empty array when user has no active permissions', () => {
    expect(getUserActivePermissions(UID, OWNER, [])).toEqual([])
  })
})

// ─── hasBusinessRole ─────────────────────────────────────────────────────────
describe('hasBusinessRole', () => {
  it('returns true for active matching role', () => {
    expect(hasBusinessRole([makeRole('admin')], BIZ, 'admin')).toBe(true)
  })

  it('returns false for inactive role', () => {
    expect(hasBusinessRole([makeRole('admin', BIZ, { is_active: false })], BIZ, 'admin')).toBe(false)
  })

  it('returns false for different businessId', () => {
    expect(hasBusinessRole([makeRole('admin', 'other-biz')], BIZ, 'admin')).toBe(false)
  })

  it('returns false for different role type', () => {
    expect(hasBusinessRole([makeRole('employee')], BIZ, 'admin')).toBe(false)
  })
})

// ─── getUserBusinessRole ─────────────────────────────────────────────────────
describe('getUserBusinessRole', () => {
  it('returns the role of active entry', () => {
    expect(getUserBusinessRole([makeRole('admin')], BIZ)).toBe('admin')
  })

  it('returns null when no matching business', () => {
    expect(getUserBusinessRole([makeRole('admin', 'other')], BIZ)).toBeNull()
  })

  it('returns null for inactive role', () => {
    expect(getUserBusinessRole([makeRole('admin', BIZ, { is_active: false })], BIZ)).toBeNull()
  })
})

// ─── convertLegacyPermissions ────────────────────────────────────────────────
describe('convertLegacyPermissions', () => {
  it('maps a known legacy key to granular permissions', () => {
    const result = convertLegacyPermissions(['read_appointments'])
    expect(result).toContain('appointments.view_all')
    expect(result).toContain('appointments.view_own')
  })

  it('maps multiple legacy keys and deduplicates', () => {
    // write_appointments includes create+edit; read_appointments overlaps nothing
    const result = convertLegacyPermissions(['write_appointments', 'read_appointments'])
    expect(result).toContain('appointments.create')
    expect(result).toContain('appointments.edit')
    expect(result).toContain('appointments.view_all')
    // Deduplication via Set — no duplicates
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
  })

  it('ignores unknown legacy keys', () => {
    const result = convertLegacyPermissions(['unknown_permission'])
    expect(result).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(convertLegacyPermissions([])).toHaveLength(0)
  })
})

// ─── Constants ───────────────────────────────────────────────────────────────
describe('ALL_PERMISSIONS constant', () => {
  it('contains at least 55 permissions', () => {
    expect(ALL_PERMISSIONS.length).toBeGreaterThanOrEqual(55)
  })

  it('has no duplicates', () => {
    const unique = new Set(ALL_PERMISSIONS)
    expect(unique.size).toBe(ALL_PERMISSIONS.length)
  })

  it('covers core business domains', () => {
    const domains = ['services', 'employees', 'appointments', 'clients', 'accounting', 'settings']
    for (const domain of domains) {
      expect(ALL_PERMISSIONS.some((p) => p.startsWith(`${domain}.`))).toBe(true)
    }
  })
})

describe('PERMISSION_CATEGORIES constant', () => {
  it('has 13 categories (incluye payments — sistema de pagos anticipados)', () => {
    expect(Object.keys(PERMISSION_CATEGORIES)).toHaveLength(13)
  })

  it('every category has a label and non-empty permissions array', () => {
    for (const [, cat] of Object.entries(PERMISSION_CATEGORIES)) {
      expect(cat.label).toBeTruthy()
      expect(cat.permissions.length).toBeGreaterThan(0)
    }
  })

  it('all categorized permissions exist in ALL_PERMISSIONS', () => {
    for (const [, cat] of Object.entries(PERMISSION_CATEGORIES)) {
      for (const perm of cat.permissions) {
        expect(ALL_PERMISSIONS).toContain(perm)
      }
    }
  })
})

describe('PERMISSION_DESCRIPTIONS constant', () => {
  it('has a description for every permission in ALL_PERMISSIONS', () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(PERMISSION_DESCRIPTIONS[perm]).toBeTruthy()
    }
  })
})

describe('LEGACY_PERMISSION_MAP constant', () => {
  it('every mapped value contains valid granular permissions', () => {
    for (const [, perms] of Object.entries(LEGACY_PERMISSION_MAP)) {
      for (const perm of perms) {
        expect(ALL_PERMISSIONS).toContain(perm)
      }
    }
  })
})
