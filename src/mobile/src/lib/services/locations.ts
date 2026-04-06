import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Location {
  id: string
  business_id: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  email?: string | null
  opens_at?: string | null   // HH:mm
  closes_at?: string | null  // HH:mm
  is_active?: boolean
  created_at: string
  updated_at?: string
}

export interface LocationQuery {
  businessId?: string
  businessIds?: string[]
  activeOnly?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const locationsService = {
  async list(q: LocationQuery = {}): Promise<Location[]> {
    let query = supabase.from('locations').select('*')
    if (q.activeOnly !== false) query = query.eq('is_active', true)
    if (q.businessIds?.length) query = query.in('business_id', q.businessIds)
    else if (q.businessId) query = query.eq('business_id', q.businessId)
    const { data, error } = await query.order('name')
    throwIfError(error, 'LIST_LOCATIONS', 'No se pudieron cargar las sedes')
    return (data ?? []) as Location[]
  },

  async get(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()
    throwIfError(error, 'GET_LOCATION', 'No se pudo cargar la sede')
    return data as Location | null
  },

  async create(payload: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert(payload)
      .select()
      .single()
    throwIfError(error, 'CREATE_LOCATION', 'No se pudo crear la sede')
    return data as Location
  },

  async update(id: string, updates: Partial<Location>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_LOCATION', 'No se pudo actualizar la sede')
    return data as Location
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id)
    throwIfError(error, 'DELETE_LOCATION', 'No se pudo eliminar la sede')
  },
}
