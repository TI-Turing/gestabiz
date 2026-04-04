import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  name: string
  slug: string
  legal_name?: string | null
  description?: string | null
  logo_url?: string | null
  banner_url?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  owner_id: string
  category_id?: string | null
  resource_model?: 'professional' | 'physical_resource' | 'hybrid' | 'group_class'
  is_active?: boolean
  country_id?: string | null
  region_id?: string | null
  city_id?: string | null
  settings?: Record<string, unknown> | null
  created_at: string
  updated_at?: string
}

export interface BusinessQuery {
  ownerId?: string
  ids?: string[]
  activeOnly?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const businessesService = {
  async list(q: BusinessQuery = {}): Promise<Business[]> {
    let query = supabase.from('businesses').select('*')
    if (q.ids?.length) query = query.in('id', q.ids)
    else if (q.ownerId) query = query.eq('owner_id', q.ownerId)
    if (q.activeOnly !== false) query = query.eq('is_active', true)
    const { data, error } = await query.order('created_at', { ascending: false })
    throwIfError(error, 'LIST_BUSINESSES', 'No se pudieron cargar los negocios')
    return (data ?? []) as Business[]
  },

  async listByEmployee(employeeId: string): Promise<Business[]> {
    const { data, error } = await supabase
      .from('business_employees')
      .select('businesses:business_id(*)')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
    throwIfError(error, 'LIST_EMPLOYEE_BUSINESSES', 'No se pudieron cargar los negocios del empleado')
    const rows = (data as unknown as Array<{ businesses: Business | null }> | null) ?? []
    return rows.map(r => r.businesses).filter((b): b is Business => !!b)
  },

  async get(id: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()
    throwIfError(error, 'GET_BUSINESS', 'No se pudo cargar el negocio')
    return data as Business | null
  },

  async getBySlug(slug: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single()
    throwIfError(error, 'GET_BUSINESS_BY_SLUG', 'No se pudo cargar el negocio')
    return data as Business | null
  },

  async update(id: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_BUSINESS', 'No se pudo actualizar el negocio')
    return data as Business
  },
}
