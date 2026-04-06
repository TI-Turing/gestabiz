import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsService, TransactionQuery, Transaction } from '../lib/services/transactions'
import { QUERY_CONFIG } from '../lib/queryClient'

// ─── Hook: useTransactions ────────────────────────────────────────────────────

export function useTransactions(query: TransactionQuery) {
  const queryClient = useQueryClient()
  const queryKey = ['transactions', JSON.stringify(query)]

  const result = useQuery({
    queryKey,
    queryFn: () => transactionsService.list(query),
    enabled: !!query.businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const transactions = result.data ?? []

  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0)

  const createTransaction = useMutation({
    mutationFn: (payload: Omit<Transaction, 'id' | 'created_at'>) =>
      transactionsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const updateTransaction = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Transaction> }) =>
      transactionsService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    ...result,
    transactions,
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    createTransaction,
    updateTransaction,
  }
}
