/**
 * EmployeePerformanceCard — Métricas de rendimiento individuales de un empleado.
 * Usa useEmployeeMetrics para obtener ocupación, rating y revenue de los últimos 30 días.
 * Se puede usar en modo compacto (inline en listas) o completo (panel expandido).
 */
import { TrendingUp, Star, DollarSign, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEmployeeMetrics } from '@/hooks/useEmployeeMetrics'
import { formatCurrency } from '@/lib/utils'

interface EmployeePerformanceCardProps {
  employeeId: string
  businessId: string
  /** Compact mode: renders as a single inline row (for embedding in list items) */
  compact?: boolean
}

export function EmployeePerformanceCard({
  employeeId,
  businessId,
  compact = false,
}: Readonly<EmployeePerformanceCardProps>) {
  const { occupancy, rating, revenue, isLoading, refetch } = useEmployeeMetrics(
    employeeId,
    businessId,
  )

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground" />
        Cargando métricas...
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1" title="Ocupación (30 días)">
          <TrendingUp className="h-3 w-3 text-blue-500" />
          {occupancy !== null ? `${Number(occupancy).toFixed(0)}%` : '—'}
        </span>
        <span className="flex items-center gap-1" title="Rating promedio">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {rating !== null && Number(rating) > 0 ? Number(rating).toFixed(1) : '—'}
        </span>
        <span className="flex items-center gap-1" title="Ingresos (30 días)">
          <DollarSign className="h-3 w-3 text-green-500" />
          {revenue !== null && Number(revenue) > 0 ? formatCurrency(Number(revenue)) : '—'}
        </span>
      </div>
    )
  }

  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Rendimiento — últimos 30 días</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Actualizar métricas"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-background border border-border">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-foreground">
              {occupancy !== null ? `${Number(occupancy).toFixed(0)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Ocupación</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border border-border">
            <Star className="h-4 w-4 mx-auto mb-1 fill-yellow-400 text-yellow-400" />
            <p className="text-lg font-bold text-foreground">
              {rating !== null && Number(rating) > 0 ? Number(rating).toFixed(1) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border border-border">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-base font-bold text-foreground">
              {revenue !== null && Number(revenue) > 0 ? formatCurrency(Number(revenue)) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Ingresos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
