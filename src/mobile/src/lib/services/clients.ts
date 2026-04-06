import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  business_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  document_type?: string | null
  document_number?: string | null
  avatar_url?: string | null
  notes?: string | null
  is_active?: boolean | null
  created_at: string
}

export type ClientCreate = Omit<Client, 'id' | 'created_at'>
export type ClientUpdate = Partial<Omit<Client, 'id' | 'business_id' | 'created_at'>>

export interface ClientQuery {
  businessId?: string
  search?: string
  limit?: number
  offset?: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const clientsService = {
  async list(query: ClientQuery = {}): Promise<Client[]> {
    const { businessId, search, limit = 50, offset = 0 } = query

    let q = supabase
      .from('clients')
      .select('id, business_id, full_name, email, phone, document_type, document_number, avatar_url, notes, is_active, created_at')
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (businessId) q = q.eq('business_id', businessId)
    if (search) q = q.ilike('full_name', `%${search}%`)

    const { data, error } = await q
    throwIfError(error, 'LIST_CLIENTS', 'No se pudieron cargar los clientes')
    return (data ?? []) as Client[]
  },

  async get(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('id, business_id, full_name, email, phone, document_type, document_number, avatar_url, notes, is_active, created_at')
      .eq('id', id)
      .maybeSingle()
    throwIfError(error, 'GET_CLIENT', 'No se pudo obtener el cliente')
    return data as Client | null
  },

  async create(payload: ClientCreate): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single()
    throwIfError(error, 'CREATE_CLIENT', 'No se pudo crear el cliente')
    return data as Client
  },

  async update(id: string, updates: ClientUpdate): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_CLIENT', 'No se pudo actualizar el cliente')
    return data as Client
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    throwIfError(error, 'DELETE_CLIENT', 'No se pudo eliminar el cliente')
  },
}
