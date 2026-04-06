import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResourceType =
  | 'room'
  | 'table'
  | 'court'
  | 'studio'
  | 'meeting_room'
  | 'desk'
  | 'equipment'
  | 'vehicle'
  | 'space'
  | 'lane'
  | 'field'
  | 'station'
  | 'parking_spot'
  | 'bed'
  | 'other'

export interface Resource {
  id: string
  business_id: string
  location_id?: string | null
  name: string
  description?: string | null
  resource_type: ResourceType
  capacity?: number | null
  hourly_rate?: number | null
  amenities?: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

export type ResourceCreate = Omit<Resource, 'id' | 'created_at'>
export type ResourceUpdate = Partial<Omit<Resource, 'id' | 'business_id' | 'created_at'>>

export interface ResourceQuery {
  businessId?: string
  locationId?: string
  resourceType?: ResourceType
  activeOnly?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const resourcesService = {
  async list(query: ResourceQuery = {}): Promise<Resource[]> {
    const { businessId, locationId, resourceType, activeOnly = true } = query

    let q = supabase
      .from('business_resources')
      .select('id, business_id, location_id, name, description, resource_type, capacity, hourly_rate, amenities, is_active, created_at')
      .order('name', { ascending: true })

    if (businessId) q = q.eq('business_id', businessId)
    if (locationId) q = q.eq('location_id', locationId)
    if (resourceType) q = q.eq('resource_type', resourceType)
    if (activeOnly) q = q.eq('is_active', true)

    const { data, error } = await q
    throwIfError(error, 'LIST_RESOURCES', 'No se pudieron cargar los recursos')
    return (data ?? []) as Resource[]
  },

  async get(id: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('business_resources')
      .select('id, business_id, location_id, name, description, resource_type, capacity, hourly_rate, amenities, is_active, created_at')
      .eq('id', id)
      .maybeSingle()
    throwIfError(error, 'GET_RESOURCE', 'No se pudo obtener el recurso')
    return data as Resource | null
  },

  async create(payload: ResourceCreate): Promise<Resource> {
    const { data, error } = await supabase
      .from('business_resources')
      .insert(payload)
      .select()
      .single()
    throwIfError(error, 'CREATE_RESOURCE', 'No se pudo crear el recurso')
    return data as Resource
  },

  async update(id: string, updates: ResourceUpdate): Promise<Resource> {
    const { data, error } = await supabase
      .from('business_resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_RESOURCE', 'No se pudo actualizar el recurso')
    return data as Resource
  },

  async remove(id: string): Promise<void> {
    // Soft delete — set is_active = false
    const { error } = await supabase
      .from('business_resources')
      .update({ is_active: false })
      .eq('id', id)
    throwIfError(error, 'DELETE_RESOURCE', 'No se pudo eliminar el recurso')
  },
}
