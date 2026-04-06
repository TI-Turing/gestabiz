import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'refunded'

export interface Transaction {
  id: string
  business_id: string
  appointment_id?: string | null
  client_id?: string | null
  employee_id?: string | null
  amount: number
  currency: string
  type: TransactionType
  status: TransactionStatus
  category?: string | null
  description?: string | null
  subtotal?: number | null
  tax_type?: string | null
  tax_rate?: number | null
  tax_amount?: number | null
  fiscal_period?: string | null
  payment_method?: string | null
  created_at: string
}

export type TransactionCreate = Omit<Transaction, 'id' | 'created_at'>
export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'business_id' | 'created_at'>>

export interface TransactionQuery {
  businessId: string
  type?: TransactionType
  status?: TransactionStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const transactionsService = {
  async list(query: TransactionQuery): Promise<Transaction[]> {
    const { businessId, type, status, startDate, endDate, limit = 50, offset = 0 } = query

    let q = supabase
      .from('transactions')
      .select('id, business_id, appointment_id, client_id, employee_id, amount, currency, type, status, category, description, subtotal, tax_type, tax_rate, tax_amount, fiscal_period, payment_method, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) q = q.eq('type', type)
    if (status) q = q.eq('status', status)
    if (startDate) q = q.gte('created_at', startDate)
    if (endDate) q = q.lte('created_at', endDate)

    const { data, error } = await q
    throwIfError(error, 'LIST_TRANSACTIONS', 'No se pudieron cargar las transacciones')
    return (data ?? []) as Transaction[]
  },

  async get(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, business_id, appointment_id, client_id, employee_id, amount, currency, type, status, category, description, subtotal, tax_type, tax_rate, tax_amount, fiscal_period, payment_method, created_at')
      .eq('id', id)
      .maybeSingle()
    throwIfError(error, 'GET_TRANSACTION', 'No se pudo obtener la transacción')
    return data as Transaction | null
  },

  async create(payload: TransactionCreate): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .single()
    throwIfError(error, 'CREATE_TRANSACTION', 'No se pudo crear la transacción')
    return data as Transaction
  },

  async update(id: string, updates: TransactionUpdate): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_TRANSACTION', 'No se pudo actualizar la transacción')
    return data as Transaction
  },
}
