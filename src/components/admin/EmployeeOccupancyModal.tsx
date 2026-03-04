/**
 * @file EmployeeOccupancyModal.tsx
 * @description Modal de detalle de ocupación de un empleado.
 * Muestra gráfico temporal, horas pico, tipos de servicio y citas futuras.
 * Reutilizable: solo requiere employeeId, businessId y datos de presentación.
 */

import { useMemo, useState, type ReactElement } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  sub,
  format,
  startOfDay,
  eachDayOfInterval,
  isAfter,
  isBefore,
  parseISO,
  getHours,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  Clock,
  Calendar,
  BarChart2,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarClock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// =====================================================
// TIPOS PÚBLICOS (reutilizables en otros flujos)
// =====================================================

export interface EmployeeOccupancyModalProps {
  /** ID del empleado (user_id en business_employees) */
  employeeId: string
  /** ID del negocio al que pertenece el empleado */
  businessId: string
  /** Nombre visible del empleado — solo para el header */
  employeeName: string
  /** Tasa de ocupación ya calculada (los últimos 30 días) — opcional, para el resumen */
  currentOccupancyRate?: number | null
  isOpen: boolean
  onClose: () => void
}

export type OccupancyPeriod = '7d' | '30d' | '90d' | '6m' | '1y'

interface AppointmentRow {
  id: string
  start_time: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'pending'
  service_name?: string | null
  service_id?: string | null
}

interface DaySeries {
  label: string      // "15 ene"
  date: string       // ISO date string
  completed: number
  confirmed: number
  cancelled: number
  total: number
}

interface ServiceCount {
  name: string
  value: number
  color: string
}

// =====================================================
// HELPERS
// =====================================================

const PERIOD_OPTIONS: { value: OccupancyPeriod; label: string }[] = [
  { value: '7d',  label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: '6m',  label: '6 meses' },
  { value: '1y',  label: '1 año' },
]

function periodToDays(period: OccupancyPeriod): number {
  switch (period) {
    case '7d':  return 7
    case '30d': return 30
    case '90d': return 90
    case '6m':  return 182
    case '1y':  return 365
  }
}

/** Agrupa citas por día dentro del rango pasado */
function buildDaySeries(
  rows: AppointmentRow[],
  from: Date,
  to: Date,
  bucketDays: number,
): DaySeries[] {
  const days = eachDayOfInterval({ start: from, end: to })

  // Para períodos largos, agrupar por semanas o meses para legibilidad
  if (bucketDays <= 30) {
    // Agrupar día a día
    return days.map(day => {
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1)
      const inDay = rows.filter(r => {
        const t = parseISO(r.start_time)
        return !isBefore(t, dayStart) && !isAfter(t, dayEnd)
      })
      return {
        label: format(day, 'd MMM', { locale: es }),
        date: day.toISOString(),
        completed: inDay.filter(r => r.status === 'completed').length,
        confirmed: inDay.filter(r => r.status === 'confirmed').length,
        cancelled: inDay.filter(r => r.status === 'cancelled' || r.status === 'no_show').length,
        total: inDay.length,
      }
    })
  } else {
    // Agrupar por semana
    const weeks: DaySeries[] = []
    let cursor = from
    while (!isAfter(cursor, to)) {
      const weekEnd = new Date(Math.min(cursor.getTime() + 6 * 86_400_000, to.getTime()))
      const inWeek = rows.filter(r => {
        const t = parseISO(r.start_time)
        return !isBefore(t, cursor) && !isAfter(t, weekEnd)
      })
      weeks.push({
        label: format(cursor, 'd MMM', { locale: es }),
        date: cursor.toISOString(),
        completed: inWeek.filter(r => r.status === 'completed').length,
        confirmed: inWeek.filter(r => r.status === 'confirmed').length,
        cancelled: inWeek.filter(r => r.status === 'cancelled' || r.status === 'no_show').length,
        total: inWeek.length,
      })
      cursor = new Date(cursor.getTime() + 7 * 86_400_000)
    }
    return weeks
  }
}

const SERVICE_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6',
  '#a855f7', '#14b8a6', '#f97316', '#ec4899', '#84cc16',
]

function occupancyBarColor(pct: number): string {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#6366f1'
  return '#f59e0b'
}

function formatLegendLabel(value: string): ReactElement {
  return (
    <span className="text-xs truncate max-w-[100px] inline-block">{value}</span>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function EmployeeOccupancyModal({
  employeeId,
  businessId,
  employeeName,
  currentOccupancyRate,
  isOpen,
  onClose,
}: Readonly<EmployeeOccupancyModalProps>) {
  const [period, setPeriod] = useState<OccupancyPeriod>('30d')

  const now = useMemo(() => new Date(), [])
  const periodDays = periodToDays(period)
  const fromDate = useMemo(() => sub(now, { days: periodDays }), [now, periodDays])

  // =====================================================
  // QUERY: Citas pasadas del período
  // =====================================================

  const { data: pastAppointments = [], isLoading: loadingPast } = useQuery({
    queryKey: ['employeeOccupancyDetail', employeeId, businessId, period, 'past'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, status, service_id, services(name)')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .gte('start_time', fromDate.toISOString())
        .lte('start_time', now.toISOString())
        .in('status', ['completed', 'confirmed', 'cancelled', 'no_show', 'pending'])
        .order('start_time', { ascending: true })

      if (error) throw new Error(error.message)

      return (data ?? []).map((r): AppointmentRow => ({
        id: r.id,
        start_time: r.start_time,
        status: r.status as AppointmentRow['status'],
        service_id: r.service_id ?? null,
        // @ts-expect-error — Supabase join returns array or object depending on relation
        service_name: Array.isArray(r.services) ? r.services[0]?.name : r.services?.name ?? null,
      }))
    },
    enabled: isOpen && !!employeeId && !!businessId,
    staleTime: 5 * 60 * 1000,
  })

  // =====================================================
  // QUERY: Citas futuras
  // =====================================================

  const { data: futureAppointments = [], isLoading: loadingFuture } = useQuery({
    queryKey: ['employeeOccupancyDetail', employeeId, businessId, 'future'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, status, service_id, services(name)')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .gt('start_time', now.toISOString())
        .in('status', ['confirmed', 'pending'])
        .order('start_time', { ascending: true })
        .limit(50)

      if (error) throw new Error(error.message)

      return (data ?? []).map((r): AppointmentRow => ({
        id: r.id,
        start_time: r.start_time,
        status: r.status as AppointmentRow['status'],
        service_id: r.service_id ?? null,
        // @ts-expect-error — Supabase join
        service_name: Array.isArray(r.services) ? r.services[0]?.name : r.services?.name ?? null,
      }))
    },
    enabled: isOpen && !!employeeId && !!businessId,
    staleTime: 2 * 60 * 1000,
  })

  // =====================================================
  // DERIVACIONES
  // =====================================================

  const daySeries = useMemo(
    () => buildDaySeries(pastAppointments, fromDate, now, periodDays),
    [pastAppointments, fromDate, now, periodDays],
  )

  const stats = useMemo(() => {
    const total     = pastAppointments.length
    const completed = pastAppointments.filter(r => r.status === 'completed').length
    const cancelled = pastAppointments.filter(r => r.status === 'cancelled' || r.status === 'no_show').length
    const confirmed = pastAppointments.filter(r => r.status === 'confirmed').length
    const occupancy = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, cancelled, confirmed, occupancy }
  }, [pastAppointments])

  // Horas pico (0-23) — solo citas completadas o confirmadas
  const peakHours = useMemo(() => {
    const hours: number[] = new Array(24).fill(0)
    const relevant = pastAppointments.filter(
      r => r.status === 'completed' || r.status === 'confirmed',
    )
    for (const apt of relevant) {
      const h = getHours(parseISO(apt.start_time))
      hours[h]++
    }
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: hours[i],
      isPeak: hours[i] === Math.max(...hours) && hours[i] > 0,
    })).filter((_, i) => i >= 7 && i <= 21) // solo mostrar horario laboral
  }, [pastAppointments])

  // Top servicios — basado en citas completadas o confirmadas
  const topServices = useMemo((): ServiceCount[] => {
    const map = new Map<string, number>()
    const relevant = pastAppointments.filter(
      r => r.status === 'completed' || r.status === 'confirmed',
    )
    for (const apt of relevant) {
      const key = apt.service_name ?? 'Sin servicio'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name,
        value,
        color: SERVICE_COLORS[i % SERVICE_COLORS.length],
      }))
  }, [pastAppointments])

  const isLoading = loadingPast || loadingFuture

  // Intervalo del eje X según período — extraído para evitar ternarios anidados en JSX
  let xAxisInterval: number | 'preserveStartEnd' = 'preserveStartEnd'
  if (periodDays > 90) xAxisInterval = 3
  else if (periodDays > 30) xAxisInterval = 2

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Ocupación — {employeeName}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  La ocupación refleja el porcentaje de citas completadas sobre el total de citas
                  asignadas en un período. Las citas futuras se muestran como proyección sujeta a
                  cancelaciones de los clientes.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        {/* SELECTOR DE PERÍODO */}
        <div className="flex gap-2 flex-wrap">
          {PERIOD_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              variant={period === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <BarChart2 className="w-8 h-8 animate-pulse" />
            <p className="text-sm">Cargando datos de ocupación…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── RESUMEN ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
                label="Ocupación"
                tooltip="Citas completadas / total en el período seleccionado."
                value={`${stats.occupancy}%`}
                sub={currentOccupancyRate == null ? undefined : `Global 30d: ${currentOccupancyRate.toFixed(0)}%`}
                highlight
              />
              <StatCard
                icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                label="Completadas"
                tooltip="Citas con estado 'completada' en el período."
                value={String(stats.completed)}
                sub={`de ${stats.total} totales`}
              />
              <StatCard
                icon={<XCircle className="w-4 h-4 text-red-500" />}
                label="Canceladas"
                tooltip="Incluye cancelaciones y no-shows."
                value={String(stats.cancelled)}
                sub={stats.total > 0 ? `${Math.round((stats.cancelled / stats.total) * 100)}% del total` : ''}
              />
              <StatCard
                icon={<CalendarClock className="w-4 h-4 text-amber-500" />}
                label="Citas futuras"
                tooltip="Citas confirmadas o pendientes a partir de hoy. Sujeto a cancelaciones."
                value={String(futureAppointments.length)}
                sub="próximas confirmadas"
              />
            </div>

            {/* ── GRÁFICO TEMPORAL ── */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Actividad en el período</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Línea verde = completadas. Azul = confirmadas. Rojo = canceladas.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {daySeries.length === 0 || stats.total === 0 ? (
                <EmptyState message="Sin citas en este período" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={daySeries} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradConfirmed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCancelled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={xAxisInterval}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <ReTooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          completed: 'Completadas',
                          confirmed: 'Confirmadas',
                          cancelled: 'Canceladas',
                        }
                        return [value, labels[name] ?? name]
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#gradCompleted)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="confirmed"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#gradConfirmed)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="cancelled"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      fill="url(#gradCancelled)"
                      dot={false}
                      strokeDasharray="4 3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* Leyenda manual */}
              {stats.total > 0 && (
                <div className="flex flex-wrap gap-4 mt-3 justify-center">
                  <LegendDot color="#22c55e" label="Completadas" />
                  <LegendDot color="#6366f1" label="Confirmadas" />
                  <LegendDot color="#ef4444" label="Canceladas / No-show" dashed />
                </div>
              )}
            </Card>

            {/* ── CITAS FUTURAS ── */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Citas futuras confirmadas</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Proyección de ocupación futura. Estas citas pueden cancelarse por los clientes,
                      por lo que son estimadas.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge variant="secondary" className="ml-auto">
                  {futureAppointments.length} citas
                </Badge>
              </div>

              {futureAppointments.length === 0 ? (
                <EmptyState message="No hay citas futuras registradas" />
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {futureAppointments.map(apt => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-28">
                          {format(parseISO(apt.start_time), "d MMM, HH:mm", { locale: es })}
                        </span>
                        <span className="font-medium truncate max-w-[140px]">
                          {apt.service_name ?? 'Servicio'}
                        </span>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ── HORAS PICO + SERVICIOS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Horas pico */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-sm">Horas pico</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Cantidad de citas completadas o confirmadas por hora del día.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {peakHours.every(h => h.count === 0) ? (
                  <EmptyState message="Sin datos de horas" />
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={peakHours} margin={{ top: 0, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <ReTooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(v: number) => [v, 'Citas']}
                      />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {peakHours.map(entry => (
                          <Cell
                            key={entry.hour}
                            fill={entry.isPeak ? '#6366f1' : '#6366f140'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Servicios más frecuentes */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-semibold text-sm">Servicios más frecuentes</h3>
                </div>

                {topServices.length === 0 ? (
                  <EmptyState message="Sin datos de servicios" />
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={topServices}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {topServices.map(entry => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(v: number, _: string, props) => [
                          `${v} citas`,
                          props.payload?.name ?? '',
                        ]}
                      />
                      <Legend formatter={formatLegendLabel} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* ── BARRA DE PROGRESO GLOBAL ── */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Tasa de ocupación en el período</span>
                </div>
                <span className="text-2xl font-bold tabular-nums">{stats.occupancy}%</span>
              </div>
              <div className="relative w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(stats.occupancy, 100)}%`,
                    background: occupancyBarColor(stats.occupancy),
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Baja ocupación</span>
                <span>Óptima</span>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// SUB-COMPONENTES INTERNOS
// =====================================================

interface StatCardProps {
  icon: React.ReactNode
  label: string
  tooltip: string
  value: string
  sub?: string
  highlight?: boolean
}

function StatCard({ icon, label, tooltip, value, sub, highlight }: Readonly<StatCardProps>) {
  return (
    <Card className={`p-3 ${highlight ? 'ring-1 ring-blue-500/30' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  )
}

function LegendDot({ color, label, dashed }: Readonly<{ color: string; label: string; dashed?: boolean }>) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="inline-block w-6 h-0.5 rounded"
        style={{
          background: color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      {label}
    </div>
  )
}

function StatusBadge({ status }: Readonly<{ status: AppointmentRow['status'] }>) {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
          Confirmada
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
          Pendiente
        </Badge>
      )
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function EmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
      <AlertCircle className="w-6 h-6 opacity-40" />
      <p className="text-xs">{message}</p>
    </div>
  )
}

export default EmployeeOccupancyModal
