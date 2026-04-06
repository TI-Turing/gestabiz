import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { TooltipProps, PieLabelRenderProps } from 'recharts';
import { CategoryDistribution } from '@/types/accounting.types';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { COLOR_DEFAULT } from '@/constants/chartColors';

interface CategoryPieChartProps {
  data: CategoryDistribution[];
  height?: number;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  height = 400,
}) => {
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: PieLabelRenderProps) => {
    const cxNum = Number(cx);
    const cyNum = Number(cy);
    const innerR = Number(innerRadius);
    const outerR = Number(outerRadius);
    const pct = Number(percent);
    const midAngleNum = Number(midAngle);
    const radius = innerR + (outerR - innerR) * 0.5;
    const x = cxNum + radius * Math.cos(-midAngleNum * RADIAN);
    const y = cyNum + radius * Math.sin(-midAngleNum * RADIAN);

    if (pct < 0.05) return null; // No mostrar etiquetas para segmentos muy pequeños

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cxNum ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(pct * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryDistribution }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryDistribution;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-1">
            {data.category}
          </p>
          <p className="text-sm text-muted-foreground">
            Total: {formatCOP(data.amount)}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.count} {data.count === 1 ? 'transacción' : 'transacciones'}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.percentage.toFixed(1)}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={height * 0.35}
          fill={COLOR_DEFAULT}
          dataKey="amount"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => (
            <span className="text-sm text-foreground">
              {entry.payload.category}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
