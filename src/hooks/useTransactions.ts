import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { Transaction, TransactionFilters, TransactionType, TransactionCategory } from '@/types/types';
import { toast } from 'sonner';
import { QUERY_CONFIG } from '@/lib/queryConfig';

/**
 * Hook para gestionar transacciones financieras (ingresos y egresos)
 * Migrado a React Query — eliminados 5 llamados manuales a fetchTransactions()
 */

// ── Clave de caché estable basada en los filtros activos ──────────────────────
function buildQueryKey(filters?: TransactionFilters) {
  return [
    'transactions',
    filters?.business_id ?? null,
    filters?.location_id ?? null,
    filters?.type ?? null,
    filters?.category ?? null,
    filters?.is_verified ?? null,
    filters?.min_amount ?? null,
    filters?.max_amount ?? null,
    filters?.date_range?.start ?? null,
    filters?.date_range?.end ?? null,
  ] as const;
}

// ── Función de fetch extraída (testeable independientemente) ──────────────────
async function fetchTransactionsData(filters?: TransactionFilters) {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      location:locations(id, name),
      employee:profiles!transactions_employee_id_fkey(id, full_name, email)
    `);

  if (filters?.business_id) query = query.eq('business_id', filters.business_id);
  if (filters?.location_id) query = query.or(`location_id.eq.${filters.location_id},location_id.is.null`);
  if (filters?.type && filters.type.length > 0) query = query.in('type', filters.type);
  if (filters?.category && filters.category.length > 0) query = query.in('category', filters.category);
  if (filters?.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
  if (filters?.min_amount) query = query.gte('amount', filters.min_amount);
  if (filters?.max_amount) query = query.lte('amount', filters.max_amount);
  if (filters?.date_range) {
    query = query
      .gte('transaction_date', filters.date_range.start)
      .lte('transaction_date', filters.date_range.end);
  }

  query = query.order('transaction_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  // Gastos recurrentes para el summary
  let recurringExpensesTotal = 0;
  if (filters?.business_id) {
    const { data: recurringData } = await supabase
      .from('recurring_expenses')
      .select('amount')
      .eq('business_id', filters.business_id)
      .eq('is_active', true);
    if (recurringData) {
      recurringExpensesTotal = recurringData.reduce((sum, r) => sum + Number(r.amount), 0);
    }
  }

  const rows = (data ?? []) as Transaction[];
  const income = rows.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const transactionExpenses = rows.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    transactions: rows,
    summary: {
      total_income: income,
      total_expenses: transactionExpenses + recurringExpensesTotal,
      net_profit: income - (transactionExpenses + recurringExpensesTotal),
      transaction_count: rows.length,
    },
  };
}

export function useTransactions(filters?: TransactionFilters) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey(filters);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchTransactionsData(filters),
    enabled: Boolean(filters?.business_id),
    ...QUERY_CONFIG.FREQUENT,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, JSON.stringify(queryKey)],
  );

  // ── Create ──────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({
      businessId,
      type,
      category,
      amount,
      description,
      options,
    }: {
      businessId: string;
      type: TransactionType;
      category: TransactionCategory;
      amount: number;
      description?: string;
      options?: {
        location_id?: string;
        appointment_id?: string;
        employee_id?: string;
        transaction_date?: string;
        payment_method?: string;
        reference_number?: string;
        metadata?: Record<string, unknown>;
      };
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          business_id: businessId,
          type,
          category,
          amount,
          currency: 'COP',
          description,
          location_id: options?.location_id,
          appointment_id: options?.appointment_id,
          employee_id: options?.employee_id,
          transaction_date: options?.transaction_date ?? new Date().toISOString().split('T')[0],
          payment_method: options?.payment_method,
          reference_number: options?.reference_number,
          metadata: options?.metadata ?? {},
          is_verified: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transacción creada exitosamente');
      void invalidate();
    },
    onError: (err: Error) => toast.error(`Error al crear transacción: ${err.message}`),
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({
      transactionId,
      updates,
    }: {
      transactionId: string;
      updates: {
        type?: TransactionType;
        category?: TransactionCategory;
        amount?: number;
        description?: string;
        payment_method?: string;
        reference_number?: string;
      };
    }) => {
      const { error } = await supabase.from('transactions').update(updates).eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Transacción actualizada exitosamente');
      void invalidate();
    },
    onError: (err: Error) => toast.error(`Error al actualizar transacción: ${err.message}`),
  });

  // ── Verify ──────────────────────────────────────────────────────────────────
  const verifyMutation = useMutation({
    mutationFn: async ({ transactionId, verifiedBy }: { transactionId: string; verifiedBy: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ is_verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
        .eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Transacción verificada');
      void invalidate();
    },
    onError: (err: Error) => toast.error(`Error al verificar transacción: ${err.message}`),
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Transacción eliminada');
      void invalidate();
    },
    onError: (err: Error) => toast.error(`Error al eliminar transacción: ${err.message}`),
  });

  // ── Fiscal create ────────────────────────────────────────────────────────────
  const createFiscalMutation = useMutation({
    mutationFn: async (transaction: {
      business_id: string;
      location_id?: string;
      type: TransactionType;
      category: TransactionCategory;
      subtotal: number;
      tax_type?: string;
      tax_rate?: number;
      tax_amount?: number;
      total_amount: number;
      description?: string;
      appointment_id?: string;
      employee_id?: string;
      transaction_date?: string;
      payment_method?: string;
      reference_number?: string;
      is_tax_deductible?: boolean;
      metadata?: Record<string, unknown>;
    }) => {
      const effectiveDate = transaction.transaction_date ?? new Date().toISOString().split('T')[0];
      const [year, month] = effectiveDate.split('-');
      const fiscalPeriod = `${year}-${month}`;

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          business_id: transaction.business_id,
          location_id: transaction.location_id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.total_amount,
          subtotal: transaction.subtotal,
          tax_type: transaction.tax_type ?? 'none',
          tax_rate: transaction.tax_rate ?? 0,
          tax_amount: transaction.tax_amount ?? 0,
          total_amount: transaction.total_amount,
          currency: 'COP',
          description: transaction.description,
          appointment_id: transaction.appointment_id,
          employee_id: transaction.employee_id,
          transaction_date: effectiveDate,
          fiscal_period: fiscalPeriod,
          payment_method: transaction.payment_method,
          reference_number: transaction.reference_number,
          is_tax_deductible: transaction.is_tax_deductible ?? true,
          metadata: transaction.metadata ?? {},
          is_verified: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transacción fiscal creada exitosamente');
      void invalidate();
    },
    onError: (err: Error) => toast.error(`Error al crear transacción fiscal: ${err.message}`),
  });

  // ── Utility (no necesita caché) ──────────────────────────────────────────────
  const getTransactionsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, []);

  return {
    transactions: data?.transactions ?? [],
    loading: isLoading,
    error: error as Error | null,
    summary: data?.summary ?? { total_income: 0, total_expenses: 0, net_profit: 0, transaction_count: 0 },
    createTransaction: (
      businessId: string,
      type: TransactionType,
      category: TransactionCategory,
      amount: number,
      description?: string,
      options?: Parameters<typeof createMutation.mutateAsync>[0]['options'],
    ) => createMutation.mutateAsync({ businessId, type, category, amount, description, options }),
    createFiscalTransaction: (t: Parameters<typeof createFiscalMutation.mutateAsync>[0]) =>
      createFiscalMutation.mutateAsync(t),
    updateTransaction: (
      transactionId: string,
      updates: Parameters<typeof updateMutation.mutateAsync>[0]['updates'],
    ) => updateMutation.mutateAsync({ transactionId, updates }),
    verifyTransaction: (transactionId: string, verifiedBy: string) =>
      verifyMutation.mutateAsync({ transactionId, verifiedBy }),
    deleteTransaction: (transactionId: string) => deleteMutation.mutateAsync(transactionId),
    getTransactionsByDateRange,
    refetch,
  };
}
