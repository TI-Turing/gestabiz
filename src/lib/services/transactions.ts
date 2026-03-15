/**
 * Servicio de transacciones financieras
 * Centraliza las queries directas a `transactions` y `recurring_expenses`
 */
import supabase from '@/lib/supabase'
import { throwIfError } from '@/lib/errors'
import { PAGINATION } from '@/lib/queryConfig'
import type { TransactionFilters, TransactionType, TransactionCategory } from '@/types/types'

export const transactionsService = {
  /** Lista transacciones con filtros opcionales */
  async list(filters?: TransactionFilters, limit = PAGINATION.TRANSACTIONS) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        location:locations(id, name),
        employee:profiles!transactions_employee_id_fkey(id, full_name, email)
      `)

    if (filters?.business_id) query = query.eq('business_id', filters.business_id)
    if (filters?.location_id) query = query.or(`location_id.eq.${filters.location_id},location_id.is.null`)
    if (filters?.type?.length) query = query.in('type', filters.type)
    if (filters?.category?.length) query = query.in('category', filters.category)
    if (filters?.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified)
    if (filters?.min_amount) query = query.gte('amount', filters.min_amount)
    if (filters?.max_amount) query = query.lte('amount', filters.max_amount)
    if (filters?.date_range) {
      query = query
        .gte('transaction_date', filters.date_range.start)
        .lte('transaction_date', filters.date_range.end)
    }

    const { data, error } = await query
      .order('transaction_date', { ascending: false })
      .limit(limit)

    throwIfError(error, 'LIST_TRANSACTIONS', 'No se pudieron cargar las transacciones')
    return data ?? []
  },

  /** Lista gastos recurrentes activos de un negocio */
  async listRecurringExpenses(businessId: string) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('id, name, amount, category, frequency, is_active')
      .eq('business_id', businessId)
      .eq('is_active', true)
    throwIfError(error, 'LIST_RECURRING_EXPENSES', 'No se pudieron cargar los gastos recurrentes')
    return data ?? []
  },

  /** Crea una transacción simple */
  async create(payload: {
    business_id: string
    type: TransactionType
    category: TransactionCategory
    amount: number
    currency?: string
    description?: string
    location_id?: string
    appointment_id?: string
    employee_id?: string
    transaction_date?: string
    payment_method?: string
    reference_number?: string
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...payload,
        currency: payload.currency ?? 'COP',
        transaction_date: payload.transaction_date ?? new Date().toISOString().split('T')[0],
        metadata: payload.metadata ?? {},
        is_verified: false,
      })
      .select()
      .single()
    throwIfError(error, 'CREATE_TRANSACTION', 'No se pudo crear la transacción')
    return data
  },

  /** Actualiza una transacción */
  async update(transactionId: string, updates: Record<string, unknown>) {
    const { error } = await supabase.from('transactions').update(updates).eq('id', transactionId)
    throwIfError(error, 'UPDATE_TRANSACTION', 'No se pudo actualizar la transacción')
  },

  /** Verifica una transacción */
  async verify(transactionId: string, verifiedBy: string) {
    const { error } = await supabase
      .from('transactions')
      .update({ is_verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
      .eq('id', transactionId)
    throwIfError(error, 'VERIFY_TRANSACTION', 'No se pudo verificar la transacción')
  },

  /** Elimina una transacción */
  async delete(transactionId: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId)
    throwIfError(error, 'DELETE_TRANSACTION', 'No se pudo eliminar la transacción')
  },
}
