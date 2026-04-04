import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodSummary {
  period: string
  income: number
  expense: number
  net: number
  transactionCount: number
}

export interface FinancialReport {
  totalIncome: number
  totalExpense: number
  netBalance: number
  byPeriod: PeriodSummary[]
  topCategories: { category: string; total: number; type: 'income' | 'expense' }[]
}

// ─── Hook: useFinancialReports ────────────────────────────────────────────────

export function useFinancialReports(
  businessId: string | undefined,
  startDate?: string,
  endDate?: string
) {
  const queryKey = ['financial-reports', businessId, startDate, endDate]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<FinancialReport> => {
      let q = supabase
        .from('transactions')
        .select('type, amount, category, fiscal_period, status')
        .eq('business_id', businessId!)
        .eq('status', 'completed')

      if (startDate) q = q.gte('created_at', startDate)
      if (endDate) q = q.lte('created_at', endDate)

      const { data, error } = await q
      throwIfError(error, 'FETCH_FINANCIAL_REPORTS', 'No se pudieron cargar los reportes financieros')

      const rows = data ?? []

      // Aggregate totals
      let totalIncome = 0
      let totalExpense = 0
      const periodMap: Record<string, Omit<PeriodSummary, 'period'>> = {}
      const categoryMap: Record<string, { total: number; type: 'income' | 'expense' }> = {}

      for (const row of rows) {
        const amount = (row.amount as number) ?? 0
        const type = row.type as 'income' | 'expense'
        const period = (row.fiscal_period as string) ?? 'unknown'
        const category = (row.category as string) ?? 'other'

        if (type === 'income') totalIncome += amount
        else totalExpense += amount

        // By period
        if (!periodMap[period]) periodMap[period] = { income: 0, expense: 0, net: 0, transactionCount: 0 }
        const p = periodMap[period]
        if (type === 'income') p.income += amount
        else p.expense += amount
        p.net = p.income - p.expense
        p.transactionCount++

        // By category
        const catKey = `${type}::${category}`
        if (!categoryMap[catKey]) categoryMap[catKey] = { total: 0, type }
        categoryMap[catKey].total += amount
      }

      const byPeriod: PeriodSummary[] = Object.entries(periodMap)
        .map(([period, vals]) => ({ period, ...vals }))
        .sort((a, b) => a.period.localeCompare(b.period))

      const topCategories = Object.entries(categoryMap)
        .map(([key, vals]) => {
          const [, category] = key.split('::')
          return { category, ...vals }
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      return {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        byPeriod,
        topCategories,
      }
    },
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  return { ...query, report: query.data ?? null }
}
