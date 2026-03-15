import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { EmployeeRevenue } from '@/types/accounting.types';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { CHART_COLORS_SERIES } from '@/constants/chartColors';

interface EmployeeRevenueChartProps {
  data: EmployeeRevenue[];
  height?: number;
}

export const EmployeeRevenueChart: React.FC<EmployeeRevenueChartProps> = ({
  data,
  height = 400,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const empData = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">
            {empData.employee}
          </p>
          <p className="text-sm text-chart-1">
            Ingresos generados: {formatCOP(empData.income)}
          </p>
          {empData.appointments !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {empData.appointments} citas completadas
            </p>
          )}
          {empData.avgPerAppointment !== undefined && (
            <p className="text-xs text-muted-foreground">
              Promedio por cita: {formatCOP(empData.avgPerAppointment)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="employee"
          className="text-muted-foreground"
          tick={{ fill: 'currentColor' }}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis
          className="text-muted-foreground"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={() => 'Ingresos Generados'}
        />
        <Bar
          dataKey="income"
          name="Ingresos"
          radius={[8, 8, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS_SERIES[index % CHART_COLORS_SERIES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
