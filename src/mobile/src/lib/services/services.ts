import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Service {
  id: string
  business_id: string
  service_name: string
  description?: string | null
  price: number
  duration_minutes?: number | null
  category?: string | null
  image_url?: string | null
  is_active?: boolean
  created_at: string
  updated_at?: string
}

export interface ServiceQuery {
  businessId?: string
  locationId?: string
  employeeId?: string
  activeOnly?: boolean
  search?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const servicesService = {
  async list(q: ServiceQuery = {}): Promise<Service[]> {
    if (q.locationId) {
      // Join via location_services
      const { data, error } = await supabase
        .from('location_services')
        .select('services:service_id(*)')
        .eq('location_id', q.locationId)
      throwIfError(error, 'LIST_LOCATION_SERVICES', 'No se pudieron cargar los servicios de la sede')
      const rows = (data as unknown as Array<{ services: Service | null }> | null) ?? []
      return rows.map(r => r.services).filter((s): s is Service => !!s)
    }

    if (q.employeeId) {
      // Join via employee_services
      const { data, error } = await supabase
        .from('employee_services')
        .select('services:service_id(*)')
        .eq('employee_id', q.employeeId)
      throwIfError(error, 'LIST_EMPLOYEE_SERVICES', 'No se pudieron cargar los servicios del empleado')
      const rows = (data as unknown as Array<{ services: Service | null }> | null) ?? []
      return rows.map(r => r.services).filter((s): s is Service => !!s)
    }

    let query = supabase.from('services').select('*')
    if (q.businessId) query = query.eq('business_id', q.businessId)
    if (q.activeOnly !== false) query = query.eq('is_active', true)
    if (q.search) query = query.ilike('service_name', `%${q.search}%`)
    const { data, error } = await query.order('service_name')
    throwIfError(error, 'LIST_SERVICES', 'No se pudieron cargar los servicios')
    return (data ?? []) as Service[]
  },

  async get(id: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()
    throwIfError(error, 'GET_SERVICE', 'No se pudo cargar el servicio')
    return data as Service | null
  },

  async create(payload: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert(payload)
      .select()
      .single()
    throwIfError(error, 'CREATE_SERVICE', 'No se pudo crear el servicio')
    return data as Service
  },

  async update(id: string, updates: Partial<Service>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_SERVICE', 'No se pudo actualizar el servicio')
    return data as Service
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id)
    throwIfError(error, 'DELETE_SERVICE', 'No se pudo eliminar el servicio')
  },
}
