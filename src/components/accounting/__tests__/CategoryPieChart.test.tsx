import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryPieChart } from '../CategoryPieChart'
import type { CategoryDistribution } from '@/types/accounting.types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data, children }: { data?: unknown[]; children?: React.ReactNode }) => (
    <div data-testid="pie" data-count={data?.length ?? 0}>{children}</div>
  ),
  Cell: ({ fill }: { fill?: string }) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

vi.mock('@/lib/accounting/colombiaTaxes', () => ({
  formatCOP: (value: number) => `$${value.toLocaleString('es-CO')}`,
}))

vi.mock('@/constants/chartColors', () => ({
  COLOR_DEFAULT: '#6366f1',
}))

const mockData: CategoryDistribution[] = [
  { category: 'Servicios', amount: 500000, percentage: 60, count: 3, color: '#10b981' },
  { category: 'Productos', amount: 333000, percentage: 40, count: 2, color: '#3b82f6' },
]

describe('CategoryPieChart', () => {
  it('renders without crashing with valid data', () => {
    render(<CategoryPieChart data={mockData} />)
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('renders with empty data array', () => {
    render(<CategoryPieChart data={[]} />)
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('passes data to Pie component', () => {
    render(<CategoryPieChart data={mockData} />)
    const pie = screen.getByTestId('pie')
    expect(pie.getAttribute('data-count')).toBe(String(mockData.length))
  })

  it('renders a Cell for each data entry', () => {
    render(<CategoryPieChart data={mockData} />)
    const cells = screen.getAllByTestId('cell')
    expect(cells).toHaveLength(mockData.length)
  })

  it('passes correct fill color to each Cell', () => {
    render(<CategoryPieChart data={mockData} />)
    const cells = screen.getAllByTestId('cell')
    expect(cells[0].getAttribute('data-fill')).toBe('#10b981')
    expect(cells[1].getAttribute('data-fill')).toBe('#3b82f6')
  })

  it('renders Tooltip and Legend', () => {
    render(<CategoryPieChart data={mockData} />)
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('legend')).toBeInTheDocument()
  })

  it('accepts custom height prop', () => {
    const { container } = render(<CategoryPieChart data={mockData} height={300} />)
    expect(container.firstChild).toBeTruthy()
  })
})
