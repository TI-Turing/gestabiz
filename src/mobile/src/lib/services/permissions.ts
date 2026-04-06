import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserPermission {
  id: string
  business_id: string
  user_id: string
  permission: string
  granted_by?: string | null
  is_active: boolean
  created_at: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const permissionsService = {
  /**
   * Get all active permissions for a user in a specific business.
   */
  async getUserPermissions(userId: string, businessId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('is_active', true)
    throwIfError(error, 'GET_USER_PERMISSIONS', 'No se pudieron cargar los permisos del usuario')
    return (data ?? []).map((r: { permission: string }) => r.permission)
  },

  /**
   * Check if a user has a specific permission in a business.
   */
  async hasPermission(userId: string, businessId: string, permission: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('user_permissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('permission', permission)
      .eq('is_active', true)
    throwIfError(error, 'CHECK_PERMISSION', 'No se pudo verificar el permiso')
    return (count ?? 0) > 0
  },

  /**
   * Check if a user is the owner of a business (owner bypass — no DB permission record needed).
   */
  async isOwner(userId: string, businessId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('owner_id', userId)
      .maybeSingle()
    throwIfError(error, 'CHECK_OWNER', 'No se pudo verificar la propiedad del negocio')
    return data !== null
  },

  /**
   * Grant a permission to a user for a business.
   */
  async grant(userId: string, businessId: string, permission: string, grantedBy: string): Promise<void> {
    const { error } = await supabase
      .from('user_permissions')
      .upsert(
        { user_id: userId, business_id: businessId, permission, granted_by: grantedBy, is_active: true },
        { onConflict: 'business_id,user_id,permission' },
      )
    throwIfError(error, 'GRANT_PERMISSION', 'No se pudo otorgar el permiso')
  },

  /**
   * Revoke a permission from a user for a business (soft delete via is_active = false).
   */
  async revoke(userId: string, businessId: string, permission: string): Promise<void> {
    const { error } = await supabase
      .from('user_permissions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('permission', permission)
    throwIfError(error, 'REVOKE_PERMISSION', 'No se pudo revocar el permiso')
  },
}
