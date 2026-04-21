import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => {
  const supabaseMock = { rpc: (...args: unknown[]) => mocks.mockRpc(...args) }
  return { supabase: supabaseMock, default: supabaseMock }
})

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

beforeEach(() => {
  mocks.mockRpc.mockReset()
})

describe('PermissionRPCService.revokePermission', () => {
  it('llama RPC revoke_user_permission con args y notes opcional', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({
      data: { success: true, rows_affected: 1 },
      error: null,
    })

    const result = await PermissionRPCService.revokePermission('b1', 'u1', 'services.create', 'no longer needed')

    expect(mocks.mockRpc).toHaveBeenCalledWith('revoke_user_permission', {
      p_business_id: 'b1',
      p_user_id: 'u1',
      p_permission: 'services.create',
      p_notes: 'no longer needed',
    })
    expect(result.success).toBe(true)
  })

  it('pasa null cuando notes no se proporciona', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({ data: { success: true }, error: null })

    await PermissionRPCService.revokePermission('b1', 'u1', 'services.create')
    const args = mocks.mockRpc.mock.calls[0][1]
    expect(args.p_notes).toBeNull()
  })

  it('retorna success=false cuando hay error de RPC', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })

    const result = await PermissionRPCService.revokePermission('b1', 'u1', 'services.create')

    expect(result.success).toBe(false)
    expect(result.error).toBe('RLS denied')
    expect(result.message).toBe('Failed to revoke permission')
  })

  it('captura excepción y retorna success=false', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockRejectedValue(new Error('network down'))

    const result = await PermissionRPCService.revokePermission('b1', 'u1', 'services.create')

    expect(result.success).toBe(false)
    expect(result.error).toBe('network down')
    expect(result.message).toMatch(/Exception/)
  })
})

describe('PermissionRPCService.assignPermission', () => {
  it('llama RPC assign_user_permission', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({
      data: { success: true, operation: 'assigned' },
      error: null,
    })

    const result = await PermissionRPCService.assignPermission('b1', 'u1', 'appointments.create', 'role change')

    expect(mocks.mockRpc).toHaveBeenCalledWith('assign_user_permission', {
      p_business_id: 'b1',
      p_user_id: 'u1',
      p_permission: 'appointments.create',
      p_notes: 'role change',
    })
    expect(result.success).toBe(true)
    expect(result.operation).toBe('assigned')
  })

  it('retorna success=false con error de RPC', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

    const result = await PermissionRPCService.assignPermission('b1', 'u1', 'x.y')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to assign permission')
  })

  it('captura excepción inesperada', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockRejectedValue('not an Error instance')

    const result = await PermissionRPCService.assignPermission('b1', 'u1', 'x.y')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unknown error')
  })
})

describe('PermissionRPCService.applyTemplate', () => {
  it('llama RPC bulk_assign_permissions_from_template', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({
      data: { success: true, template_name: 'Vendedor', permissions_applied: 5 },
      error: null,
    })

    const result = await PermissionRPCService.applyTemplate('b1', 'u1', 'tpl-1', 'new hire')

    expect(mocks.mockRpc).toHaveBeenCalledWith('bulk_assign_permissions_from_template', {
      p_business_id: 'b1',
      p_user_id: 'u1',
      p_template_id: 'tpl-1',
      p_notes: 'new hire',
    })
    expect(result.permissions_applied).toBe(5)
  })

  it('retorna success=false con error', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({ data: null, error: { message: 'tpl not found' } })

    const result = await PermissionRPCService.applyTemplate('b1', 'u1', 'tpl-1')
    expect(result.success).toBe(false)
  })
})

describe('PermissionRPCService.bulkRevokePermissions', () => {
  it('itera y revoca cada permiso, retornando array de resultados', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({ data: { success: true, rows_affected: 1 }, error: null })

    const result = await PermissionRPCService.bulkRevokePermissions(
      'b1',
      'u1',
      ['services.create', 'services.edit', 'services.delete']
    )

    expect(result).toHaveLength(3)
    expect(mocks.mockRpc).toHaveBeenCalledTimes(3)
    expect(result.every(r => r.success)).toBe(true)
  })

  it('continúa aunque alguno falle', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc
      .mockResolvedValueOnce({ data: { success: true }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'fail' } })
      .mockResolvedValueOnce({ data: { success: true }, error: null })

    const result = await PermissionRPCService.bulkRevokePermissions('b1', 'u1', ['a', 'b', 'c'])

    expect(result).toHaveLength(3)
    expect(result[0].success).toBe(true)
    expect(result[1].success).toBe(false)
    expect(result[2].success).toBe(true)
  })
})

describe('PermissionRPCService.bulkAssignPermissions', () => {
  it('itera y asigna cada permiso', async () => {
    const { PermissionRPCService } = await import('@/lib/services/permissionRPC')
    mocks.mockRpc.mockResolvedValue({ data: { success: true, operation: 'assigned' }, error: null })

    const result = await PermissionRPCService.bulkAssignPermissions(
      'b1',
      'u1',
      ['appointments.view', 'services.view']
    )

    expect(result).toHaveLength(2)
    expect(mocks.mockRpc).toHaveBeenCalledTimes(2)
  })
})
