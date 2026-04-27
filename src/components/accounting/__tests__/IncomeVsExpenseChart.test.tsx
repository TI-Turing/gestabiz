import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IncomeVsExpenseChart } from '../IncomeVsExpenseChart'
import type { ChartDataPoint } from '@/types/accounting.types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="bar-chart" data-count={data?.length ?? 0}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, name }: { dataKey?: string; name?: string }) => (
    <div data-testid="bar" data-key={dataKey} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

vi.mock('@/lib/accounting/colombiaTaxes', () => ({
  formatCOP: (value: number) => `$${value.toLocaleString('es-CO')}`,
}))

const mockData: ChartDataPoint[] = [
  { period: 'Ene 2026', income: 1000000, expenses: 600000, profit: 400000 },
  { period: 'Feb 2026', income: 1500000, expenses: 800000, profit: 700000 },
  { period: 'Mar 2026', income: 1200000, expenses: 500000, profit: 700000 },
]

describe('IncomeVsExpenseChart', () => {
  it('renders without crashing with valid data', () => {
    render(<IncomeVsExpenseChart data={mockData} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders with empty data array', () => {
    render(<IncomeVsExpenseChart data={[]} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('passes all data entries to BarChart', () => {
    render(<IncomeVsExpenseChart data={mockData} />)
    const chart = screen.getByTestId('bar-chart')
    expect(chart.getAttribute('data-count')).toBe(String(mockData.length))
  })

  it('renders two Bar components (income and expenses)', () => {
    render(<IncomeVsExpenseChart data={mockData} />)
    const bars = screen.getAllByTestId('bar')
    expect(bars).toHaveLength(2)
  })

  it('Bar components have correct dataKey attributes', () => {
    render(<IncomeVsExpenseChart data={mockData} />)
    const bars = screen.getAllByTestId('bar')
    const keys = bars.map((b) => b.getAttribute('data-key'))
    expect(keys).toContain('income')
    expect(keys).toContain('expenses')
  })

  it('Bar components have correct display names', () => {
    render(<IncomeVsExpenseChart data={mockData} />)
    const bars = screen.getAllByTestId('bar')
    const names = bars.map((b) => b.getAttribute('data-name'))
    expect(names).toContain('Ingresos')
    expect(names).toContain('Egresos')
  })

  it('renders axes, grid, tooltip and legend', () => {
    render(<IncomeVsExpenseChart data={mockData} />)
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('legend')).toBeInTheDocument()
  })

  it('accepts custom height prop', () => {
    const { container } = render(<IncomeVsExpenseChart data={mockData} height={250} />)
    expect(container.firstChild).toBeTruthy()
  })
})
