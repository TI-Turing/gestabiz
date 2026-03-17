import supabase from '@/lib/supabase'
import type { Client } from '@/types'
import { throwIfError } from '@/lib/errors'

export interface ClientQuery {
  businessId?: string
  search?: string
}

export const clientsService = {
  async list(q: ClientQuery = {}): Promise<Client[]> {
    let query = supabase.from('clients').select('*')
    if (q.businessId) { query = query.eq('business_id', q.businessId) }
    if (q.search) {
      // simple ilike on name or email
      query = query.ilike ? query.ilike('name', `%${q.search}%`) : query
    }
    const { data, error } = await query.order('name')
    throwIfError(error, 'LIST_CLIENTS', 'No se pudieron cargar los clientes')
    return (data || []) as Client[]
  },

  async get(id: string): Promise<Client | null> {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
    throwIfError(error, 'GET_CLIENT', 'No se pudo cargar el cliente')
    return data as Client
  },

  async create(payload: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert(payload).select().single()
    throwIfError(error, 'CREATE_CLIENT', 'No se pudo crear el cliente')
    return data as Client
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    throwIfError(error, 'UPDATE_CLIENT', 'No se pudo actualizar el cliente')
    return data as Client
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    throwIfError(error, 'DELETE_CLIENT', 'No se pudo eliminar el cliente')
  }
}
