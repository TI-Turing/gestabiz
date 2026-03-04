/**
 * @file EmployeeRevenueModal.tsx
 * @description Modal reutilizable con desglose detallado de ingresos generados por un empleado.
 * Incluye: evolución temporal, breakdown por servicio, top clientes, comparativa vs período anterior.
 * Props públicas: employeeId, businessId, employeeName, currentRevenue?, isOpen, onClose.
 */

import { useMemo, useState, type ReactElement } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  sub,
  format,
  parseISO,
  startOfDay,
  isAfter,
  isBefore,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  eachMonthOfInterval,
  endOfMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Users,
  Scissors,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Info,
  AlertCircle,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
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
// TIPOS PÚBLICOS
// =====================================================

export interface EmployeeRevenueModalProps {
  /** user_id del empleado en business_employees */
  employeeId: string
  /** ID del negocio */
  businessId: string
  /** Nombre del empleado — solo para el header */
  employeeName: string
  /** Ingreso ya conocido (desde el perfil) para el badge del header */
  currentRevenue?: number | null
  isOpen: boolean
  onClose: () => void
}

export type RevenuePeriod = '7d' | '30d' | '90d' | '6m' | '1y'

// =====================================================
// TIPOS INTERNOS
// =====================================================

interface RevenueRow {
  id: string
  start_time: string
  service_id: string | null
  service_name: string | null
  service_price: number
  client_id: string | null
  client_name: string | null
  location_name: string | null
}

interface TimeSeries {
  label: string
  revenue: number
  count: number
}

interface ServiceShare {
  name: string
  revenue: number
  count: number
  color: string
}

interface ClientShare {
  name: string
  revenue: number
  count: number
}

// =====================================================
// CONSTANTES
// =====================================================

// PERIOD_OPTIONS se construye dentro del componente para soportar i18n

const SERVICE_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6',
  '#a855f7', '#14b8a6', '#f97316', '#ec4899', '#84cc16',
]

// =====================================================
// HELPERS
// =====================================================

function periodToDays(period: RevenuePeriod): number {
  switch (period) {
    case '7d':  return 7
    case '30d': return 30
    case '90d': return 90
    case '6m':  return 182
    case '1y':  return 365
  }
}

function periodToSub(period: RevenuePeriod): Parameters<typeof sub>[1] {
  switch (period) {
    case '7d':  return { days: 7 }
    case '30d': return { days: 30 }
    case '90d': return { days: 90 }
    case '6m':  return { months: 6 }
    case '1y':  return { years: 1 }
  }
}

/** Agrupa filas por día / semana / mes según duración del período */
function buildTimeSeries(
  rows: RevenueRow[],
  from: Date,
  to: Date,
  days: number,
): TimeSeries[] {
  if (days <= 30) {
    // Día a día
    const allDays = eachDayOfInterval({ start: from, end: to })
    return allDays.map(day => {
      const dayStart = startOfDay(day)
      const dayEnd   = new Date(dayStart.getTime() + 86_400_000 - 1)
      const inDay = rows.filter(r => {
        const t = parseISO(r.start_time)
        return !isBefore(t, dayStart) && !isAfter(t, dayEnd)
      })
      return {
        label: format(day, 'd MMM', { locale: es }),
        revenue: inDay.reduce((s, r) => s + r.service_price, 0),
        count: inDay.length,
      }
    })
  }

  if (days <= 182) {
    // Semana a semana
    const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 })
    return weeks.map(weekStart => {
      const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const inWeek = rows.filter(r => {
        const t = parseISO(r.start_time)
        return !isBefore(t, weekStart) && !isAfter(t, wEnd)
      })
      return {
        label: format(weekStart, 'd MMM', { locale: es }),
        revenue: inWeek.reduce((s, r) => s + r.service_price, 0),
        count: inWeek.length,
      }
    })
  }

  // Mes a mes
  const months = eachMonthOfInterval({ start: from, end: to })
  return months.map(monthStart => {
    const mEnd = endOfMonth(monthStart)
    const inMonth = rows.filter(r => {
      const t = parseISO(r.start_time)
      return !isBefore(t, monthStart) && !isAfter(t, mEnd)
    })
    return {
      label: format(monthStart, 'MMM yy', { locale: es }),
      revenue: inMonth.reduce((s, r) => s + r.service_price, 0),
      count: inMonth.length,
    }
  })
}

function formatCOP(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}k`
  return `$${amount.toLocaleString('es-CO')}`
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function EmployeeRevenueModal({
  employeeId,
  businessId,
  employeeName,
  currentRevenue,
  isOpen,
  onClose,
}: Readonly<EmployeeRevenueModalProps>) {
  const [period, setPeriod] = useState<RevenuePeriod>('30d')
  const { t } = useLanguage()

  const periodOptions: { value: RevenuePeriod; label: string }[] = [
    { value: '7d',  label: t('employeeProfile.periods.7d') },
    { value: '30d', label: t('employeeProfile.periods.30d') },
    { value: '90d', label: t('employeeProfile.periods.90d') },
    { value: '6m',  label: t('employeeProfile.periods.6m') },
    { value: '1y',  label: t('employeeProfile.periods.1y') },
  ]

  const now     = useMemo(() => new Date(), [])
  const days    = periodToDays(period)
  const fromDate = useMemo(() => sub(now, periodToSub(period)), [now, period])
  const prevFrom = useMemo(() => sub(fromDate, periodToSub(period)), [fromDate, period])

  // =====================================================
  // QUERY: Citas completadas del período actual
  // =====================================================

  const { data: rows = [], isLoading: loadingCurrent } = useQuery({
    queryKey: ['employeeRevenue', employeeId, businessId, period, 'current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          service_id,
          client_id,
          services(name, price),
          profiles!appointments_client_id_fkey(full_name),
          locations(name)
        `)
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .gte('start_time', fromDate.toISOString())
        .lte('start_time', now.toISOString())
        .order('start_time', { ascending: true })

      if (error) throw new Error(error.message)

      return (data ?? []).map((r): RevenueRow => {
        const service  = Array.isArray(r.services)  ? r.services[0]  : r.services
        const profile  = Array.isArray(r.profiles)  ? r.profiles[0]  : r.profiles
        const location = Array.isArray(r.locations) ? r.locations[0] : r.locations

        return {
          id: r.id,
          start_time: r.start_time,
          service_id: r.service_id ?? null,
          service_name: (service as { name?: string } | null)?.name ?? null,
          service_price: (service as { price?: number } | null)?.price ?? 0,
          client_id: r.client_id ?? null,
          client_name: (profile as { full_name?: string } | null)?.full_name ?? null,
          location_name: (location as { name?: string } | null)?.name ?? null,
        }
      })
    },
    enabled: isOpen && !!employeeId && !!businessId,
    staleTime: 5 * 60 * 1000,
  })

  // =====================================================
  // QUERY: Período anterior (comparativa)
  // =====================================================

  const { data: prevRows = [], isLoading: loadingPrev } = useQuery({
    queryKey: ['employeeRevenue', employeeId, businessId, period, 'prev'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, services(price)')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .gte('start_time', prevFrom.toISOString())
        .lt('start_time', fromDate.toISOString())

      if (error) throw new Error(error.message)

      return (data ?? []).map(r => {
        const service = Array.isArray(r.services) ? r.services[0] : r.services
        return { price: (service as { price?: number } | null)?.price ?? 0 }
      })
    },
    enabled: isOpen && !!employeeId && !!businessId,
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = loadingCurrent || loadingPrev

  // =====================================================
  // DERIVACIONES
  // =====================================================

  const timeSeries = useMemo(
    () => buildTimeSeries(rows, fromDate, now, days),
    [rows, fromDate, now, days],
  )

  const kpis = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.service_price, 0)
    const prevRevenue  = prevRows.reduce((s, r) => s + r.price, 0)
    const growth = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : null
    const avgPerAppointment = rows.length > 0 ? totalRevenue / rows.length : 0
    const best = timeSeries.reduce<TimeSeries | null>(
      (best, t) => (best == null || t.revenue > best.revenue ? t : best),
      null,
    )
    return {
      totalRevenue,
      prevRevenue,
      growth,
      appointmentCount: rows.length,
      avgPerAppointment,
      bestPeriodLabel: best?.label ?? '—',
      bestPeriodRevenue: best?.revenue ?? 0,
    }
  }, [rows, prevRows, timeSeries])

  const serviceBreakdown = useMemo((): ServiceShare[] => {
    const map = new Map<string, ServiceShare>()
    for (const r of rows) {
      const key = r.service_name ?? '—'
      const existing = map.get(key)
      if (existing) {
        existing.revenue += r.service_price
        existing.count++
      } else {
        map.set(key, { name: key, revenue: r.service_price, count: 1, color: '' })
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((s, i) => ({ ...s, color: SERVICE_COLORS[i % SERVICE_COLORS.length] }))
  }, [rows])

  const topClients = useMemo((): ClientShare[] => {
    const map = new Map<string, ClientShare>()
    for (const r of rows) {
      const key = r.client_name ?? '—'
      const existing = map.get(key)
      if (existing) {
        existing.revenue += r.service_price
        existing.count++
      } else {
        map.set(key, { name: key, revenue: r.service_price, count: 1 })
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [rows])

  const locationBreakdown = useMemo((): ServiceShare[] => {
    const map = new Map<string, ServiceShare>()
    for (const r of rows) {
      const key = r.location_name ?? 'Sin sede'
      const existing = map.get(key)
      if (existing) {
        existing.revenue += r.service_price
        existing.count++
      } else {
        map.set(key, { name: key, revenue: r.service_price, count: 1, color: '' })
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((s, i) => ({ ...s, color: SERVICE_COLORS[i % SERVICE_COLORS.length] }))
  }, [rows])

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            {t('employeeProfile.revenue.headerTitle')} — {employeeName}
            {currentRevenue != null && (
              <Badge variant="secondary" className="ml-1 tabular-nums">
                ${currentRevenue.toLocaleString('es-CO')} COP
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  {t('employeeProfile.revenue.infoTooltip')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        {/* SELECTOR DE PERÍODO */}
        <div className="flex gap-2 flex-wrap">
          {periodOptions.map(opt => (
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

        {isLoading && <LoadingState message={t('employeeProfile.revenue.loading')} />}

        {!isLoading && rows.length === 0 && (
          <EmptyState message={t('employeeProfile.revenue.empty')} />
        )}

        {!isLoading && rows.length > 0 && (
          <div className="space-y-5">

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                label={t('employeeProfile.revenue.kpis.periodRevenue')}
                value={`$${kpis.totalRevenue.toLocaleString('es-CO')}`}
                sub={t('employeeProfile.revenue.kpis.currency')}
                accent="emerald"
              />
              <KpiCard
                icon={<BarChart2 className="w-4 h-4 text-blue-500" />}
                label={t('employeeProfile.revenue.kpis.avgTicket')}
                value={`$${Math.round(kpis.avgPerAppointment).toLocaleString('es-CO')}`}
                sub={t('employeeProfile.revenue.kpis.appointments', { count: kpis.appointmentCount })}
                accent="blue"
              />
              <KpiCard
                icon={<Award className="w-4 h-4 text-amber-500" />}
                label={t('employeeProfile.revenue.kpis.bestPeriod')}
                value={formatCOP(kpis.bestPeriodRevenue)}
                sub={kpis.bestPeriodLabel}
                accent="amber"
              />
              {/* Variación vs período anterior */}
              <GrowthCard
                current={kpis.totalRevenue}
                previous={kpis.prevRevenue}
                growth={kpis.growth}
                period={period}
              />
            </div>

            {/* ── EVOLUCIÓN TEMPORAL ── */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                {t('employeeProfile.revenue.charts.evolution')}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={v => formatCOP(v as number)}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={54}
                  />
                  <RechartsTooltip
                    formatter={(v: number) => [`$${v.toLocaleString('es-CO')} COP`, t('employeeProfile.revenue.charts.revenue')]}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* ── BREAKDOWN POR SERVICIO ── */}
            {serviceBreakdown.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">

                {/* Barra horizontal */}
                <Card className="p-4 sm:col-span-3">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-indigo-500" />
                    {t('employeeProfile.revenue.charts.byService')}
                  </h3>
                  <ResponsiveContainer width="100%" height={Math.max(120, serviceBreakdown.length * 36)}>
                    <BarChart
                      data={serviceBreakdown}
                      layout="vertical"
                      margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={v => formatCOP(v as number)}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <RechartsTooltip
                        formatter={(v: number, _n, p) => [
                          `$${v.toLocaleString('es-CO')} COP (${(p.payload as ServiceShare).count} ${(p.payload as ServiceShare).count === 1 ? t('employeeProfile.revenue.clients.countSingular') : t('employeeProfile.revenue.clients.countPlural')})`,
                          t('employeeProfile.revenue.charts.revenue'),
                        ]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {serviceBreakdown.map(s => (
                          <Cell key={s.name} fill={s.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Torta */}
                <Card className="p-4 sm:col-span-2 flex flex-col">
                  <h3 className="text-sm font-semibold mb-3">{t('employeeProfile.revenue.charts.participation')}</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={serviceBreakdown}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                      >
                        {serviceBreakdown.map(s => (
                          <Cell key={s.name} fill={s.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(v: number) => [`$${v.toLocaleString('es-CO')} COP`, '']}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Leyenda manual compacta */}
                  <div className="mt-2 space-y-1 overflow-hidden">
                    {serviceBreakdown.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-xs truncate text-muted-foreground">{s.name}</span>
                        <span className="text-xs font-medium ml-auto shrink-0">
                          {formatCOP(s.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── TOP CLIENTES + SEDES ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Top clientes */}
              {topClients.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    {t('employeeProfile.revenue.clients.title')}
                  </h3>
                  <div className="space-y-2">
                    {topClients.map((c, i) => {
                      const pct = kpis.totalRevenue > 0 ? (c.revenue / kpis.totalRevenue) * 100 : 0
                      return (
                        <div key={c.name} className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium truncate">
                              <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                              {c.name}
                            </span>
                            <span className="shrink-0 font-semibold text-emerald-600">
                              ${c.revenue.toLocaleString('es-CO')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-8 text-right">
                              {c.count === 1
                                ? t('employeeProfile.revenue.clients.countSingular')
                                : t('employeeProfile.revenue.clients.countPlural')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Sedes */}
              {locationBreakdown.length > 1 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    {t('employeeProfile.revenue.locations.title')}
                  </h3>
                  <div className="space-y-2">
                    {locationBreakdown.map(loc => {
                      const pct = kpis.totalRevenue > 0 ? (loc.revenue / kpis.totalRevenue) * 100 : 0
                      return (
                        <div key={loc.name} className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-sm shrink-0"
                                style={{ backgroundColor: loc.color }}
                              />
                              <span className="font-medium truncate">{loc.name}</span>
                            </span>
                            <span className="shrink-0 font-semibold text-emerald-600">
                              ${loc.revenue.toLocaleString('es-CO')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: loc.color }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-10 text-right">
                              {loc.count === 1
                                ? t('employeeProfile.revenue.locations.countSingular')
                                : t('employeeProfile.revenue.locations.countPlural')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Si solo hay 1 sede, ocupa el espacio completo con sedes alineadas */}
              {locationBreakdown.length === 1 && (
                <Card className="p-4 flex flex-col justify-center items-center gap-1 text-center">
                  <Award className="w-6 h-6 text-purple-400 opacity-60" />
                  <p className="text-xs text-muted-foreground">
                    {t('employeeProfile.revenue.locations.singleLocation', { name: locationBreakdown[0].name })}
                  </p>
                </Card>
              )}
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// SUB-COMPONENTES
// =====================================================

interface KpiCardProps {
  icon: ReactElement
  label: string
  value: string
  sub?: string
  accent: 'emerald' | 'blue' | 'amber'
}

const ACCENT_BG: Record<KpiCardProps['accent'], string> = {
  emerald: 'bg-emerald-500/10',
  blue:    'bg-blue-500/10',
  amber:   'bg-amber-500/10',
}

function KpiCard({ icon, label, value, sub, accent }: Readonly<KpiCardProps>): ReactElement {
  return (
    <Card className={`p-3 flex flex-col gap-1 ${ACCENT_BG[accent]}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <p className="text-xs truncate">{label}</p>
      </div>
      <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  )
}

interface GrowthCardProps {
  current: number
  previous: number
  growth: number | null
  period: RevenuePeriod
}

function GrowthCard({ current, previous, growth, period }: Readonly<GrowthCardProps>): ReactElement {
  const { t } = useLanguage()

  const periodLabels: Record<RevenuePeriod, string> = {
    '7d':  t('employeeProfile.revenue.comparison.7d'),
    '30d': t('employeeProfile.revenue.comparison.30d'),
    '90d': t('employeeProfile.revenue.comparison.90d'),
    '6m':  t('employeeProfile.revenue.comparison.6m'),
    '1y':  t('employeeProfile.revenue.comparison.1y'),
  }

  const isPositive = (growth ?? 0) >= 0
  const hasData    = previous > 0

  let accentCls = 'bg-secondary/40'
  if (hasData) {
    accentCls = isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
  }
  let trendIcon: ReactElement = <TrendingDown className="w-4 h-4" />
  if (hasData && isPositive)  trendIcon = <ArrowUpRight className="w-4 h-4 text-green-500" />
  if (hasData && !isPositive) trendIcon = <ArrowDownRight className="w-4 h-4 text-red-500" />

  return (
    <Card className={`p-3 flex flex-col gap-1 ${accentCls}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {trendIcon}
        <p className="text-xs">vs. {periodLabels[period]}</p>
      </div>
      {hasData && growth !== null ? (
        <>
          <p className={`text-xl font-bold tabular-nums ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{growth.toFixed(1)}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t('employeeProfile.revenue.comparison.previous', { amount: previous.toLocaleString('es-CO') })}
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-muted-foreground">—</p>
          <p className="text-[11px] text-muted-foreground">{t('employeeProfile.revenue.comparison.noData')}</p>
        </>
      )}
    </Card>
  )
}

function LoadingState({ message }: Readonly<{ message: string }>): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
      <TrendingUp className="w-7 h-7 animate-pulse" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function EmptyState({ message }: Readonly<{ message: string }>): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
      <AlertCircle className="w-6 h-6 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default EmployeeRevenueModal
