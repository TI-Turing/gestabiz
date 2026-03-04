/**
 * @file EmployeeAppointmentsModal.tsx
 * @description Modal reutilizable que lista las citas completadas por un empleado.
 * Permite filtrar por período, buscar por cliente/servicio, y ver detalle de cada cita.
 * Props públicas: employeeId, businessId, employeeName, initialCount?, isOpen, onClose.
 */

import { useMemo, useState, type ReactElement } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sub, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Scissors,
  MapPin,
  DollarSign,
  Calendar,
  Info,
  AlertCircle,
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
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// =====================================================
// TIPOS PÚBLICOS
// =====================================================

export interface EmployeeAppointmentsModalProps {
  /** user_id del empleado en business_employees */
  employeeId: string
  /** ID del negocio */
  businessId: string
  /** Nombre del empleado — solo para el header */
  employeeName: string
  /** Cantidad ya conocida de citas completadas (para el badge del header) */
  initialCount?: number
  isOpen: boolean
  onClose: () => void
}

export type AppointmentsPeriod = '7d' | '30d' | '90d' | '6m' | '1y' | 'all'

// =====================================================
// TIPOS INTERNOS
// =====================================================

interface AppointmentDetail {
  id: string
  start_time: string
  end_time: string | null
  status: string
  client_name: string | null
  client_phone: string | null
  service_name: string | null
  service_price: number | null
  location_name: string | null
  notes: string | null
  duration_minutes: number | null
}

// =====================================================
// CONSTANTES
// =====================================================

const PERIOD_OPTIONS: { value: AppointmentsPeriod; label: string }[] = [
  { value: '7d',  label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: '6m',  label: '6 meses' },
  { value: '1y',  label: '1 año' },
  { value: 'all', label: 'Todo' },
]

function periodToFrom(period: AppointmentsPeriod): Date | null {
  const now = new Date()
  switch (period) {
    case '7d':  return sub(now, { days: 7 })
    case '30d': return sub(now, { days: 30 })
    case '90d': return sub(now, { days: 90 })
    case '6m':  return sub(now, { months: 6 })
    case '1y':  return sub(now, { years: 1 })
    case 'all': return null
  }
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function EmployeeAppointmentsModal({
  employeeId,
  businessId,
  employeeName,
  initialCount,
  isOpen,
  onClose,
}: Readonly<EmployeeAppointmentsModalProps>) {
  const [period, setPeriod] = useState<AppointmentsPeriod>('30d')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // =====================================================
  // QUERY
  // =====================================================

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['employeeAppointmentsList', employeeId, businessId, period],
    queryFn: async () => {
      const from = periodToFrom(period)

      let query = supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          duration_minutes,
          profiles!appointments_client_id_fkey(full_name, phone),
          services(name, price),
          locations(name)
        `)
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })

      if (from) {
        query = query.gte('start_time', from.toISOString())
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)

      return (data ?? []).map((r): AppointmentDetail => {
        // Supabase puede devolver el join como array o como objeto según la relación
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
        const service = Array.isArray(r.services)  ? r.services[0]  : r.services
        const location = Array.isArray(r.locations) ? r.locations[0] : r.locations

        return {
          id: r.id,
          start_time: r.start_time,
          end_time: r.end_time ?? null,
          status: r.status,
          client_name: (profile as { full_name?: string } | null)?.full_name ?? null,
          client_phone: (profile as { phone?: string } | null)?.phone ?? null,
          service_name: (service as { name?: string } | null)?.name ?? null,
          service_price: (service as { price?: number } | null)?.price ?? null,
          location_name: (location as { name?: string } | null)?.name ?? null,
          notes: r.notes ?? null,
          duration_minutes: r.duration_minutes ?? null,
        }
      })
    },
    enabled: isOpen && !!employeeId && !!businessId,
    staleTime: 5 * 60 * 1000,
  })

  // =====================================================
  // FILTRADO POR BÚSQUEDA
  // =====================================================

  const filtered = useMemo(() => {
    if (!search.trim()) return appointments
    const q = search.toLowerCase()
    return appointments.filter(
      a =>
        a.client_name?.toLowerCase().includes(q) ||
        a.service_name?.toLowerCase().includes(q) ||
        a.location_name?.toLowerCase().includes(q),
    )
  }, [appointments, search])

  // =====================================================
  // STATS RÁPIDAS
  // =====================================================

  const stats = useMemo(() => {
    const total = appointments.length
    const totalRevenue = appointments.reduce((sum, a) => sum + (a.service_price ?? 0), 0)
    const avgDuration =
      appointments.length > 0
        ? Math.round(
            appointments.reduce((sum, a) => sum + (a.duration_minutes ?? 0), 0) /
              appointments.length,
          )
        : 0
    return { total, totalRevenue, avgDuration }
  }, [appointments])

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Citas completadas — {employeeName}
            {initialCount !== undefined && (
              <Badge variant="secondary" className="ml-1">
                {initialCount}
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Historial de citas con estado "completada" atendidas por este empleado
                  en el período seleccionado.
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

        {/* STATS RÁPIDAS */}
        {!isLoading && appointments.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <MiniStat
              icon={<CheckCircle className="w-4 h-4 text-green-500" />}
              label="Completadas"
              value={String(stats.total)}
            />
            <MiniStat
              icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
              label="Ingresos"
              value={`$${stats.totalRevenue.toLocaleString('es-CO')}`}
            />
            <MiniStat
              icon={<Clock className="w-4 h-4 text-blue-500" />}
              label="Duración prom."
              value={stats.avgDuration > 0 ? `${stats.avgDuration} min` : '—'}
            />
          </div>
        )}

        {/* BUSCADOR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, servicio o sede…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* LISTA */}
        {isLoading && <LoadingState />}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            message={
              search
                ? 'No hay citas que coincidan con la búsqueda'
                : 'No hay citas completadas en este período'
            }
          />
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {filtered.length} cita{filtered.length === 1 ? '' : 's'}
              {search ? ' encontradas' : ''}
            </p>
              {filtered.map(apt => (
              <AppointmentRow
                key={apt.id}
                appointment={apt}
                isExpanded={expandedId === apt.id}
                onToggle={() =>
                  setExpandedId(prev => (prev === apt.id ? null : apt.id))
                }
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// SUB-COMPONENTES
// =====================================================

interface AppointmentRowProps {
  appointment: AppointmentDetail
  isExpanded: boolean
  onToggle: () => void
}

function AppointmentRow({
  appointment: apt,
  isExpanded,
  onToggle,
}: Readonly<AppointmentRowProps>): ReactElement {
  return (
    <Card className="overflow-hidden">
      {/* FILA PRINCIPAL — siempre visible */}
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/40 transition-colors"
        onClick={onToggle}
      >
        {/* Fecha + hora */}
        <div className="w-20 shrink-0 text-center">
          <p className="text-xs font-semibold">
            {format(parseISO(apt.start_time), 'd MMM', { locale: es })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(apt.start_time), 'HH:mm')}
          </p>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">
            {apt.client_name ?? 'Cliente sin nombre'}
          </span>
        </div>

        {/* Servicio */}
        <div className="flex items-center gap-1.5 w-36 shrink-0 min-w-0 max-sm:hidden">
          <Scissors className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {apt.service_name ?? '—'}
          </span>
        </div>

        {/* Precio */}
        {apt.service_price != null && (
          <span className="text-sm font-semibold text-green-600 w-20 text-right shrink-0">
            ${apt.service_price.toLocaleString('es-CO')}
          </span>
        )}

        {/* Chevron */}
        <div className="ml-2 shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* DETALLE EXPANDIBLE */}
      {isExpanded && (
        <div className="border-t px-4 py-3 bg-secondary/30 grid grid-cols-2 gap-3 text-xs">
          <DetailItem
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Fecha completa"
            value={format(parseISO(apt.start_time), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
          />
          {apt.end_time && (
            <DetailItem
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Hora finalización"
              value={format(parseISO(apt.end_time), 'HH:mm')}
            />
          )}
          {apt.duration_minutes != null && (
            <DetailItem
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Duración"
              value={`${apt.duration_minutes} minutos`}
            />
          )}
          {apt.location_name && (
            <DetailItem
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Sede"
              value={apt.location_name}
            />
          )}
          {apt.client_phone && (
            <DetailItem
              icon={<User className="w-3.5 h-3.5" />}
              label="Teléfono cliente"
              value={apt.client_phone}
            />
          )}
          {apt.service_price != null && (
            <DetailItem
              icon={<DollarSign className="w-3.5 h-3.5" />}
              label="Valor del servicio"
              value={`$${apt.service_price.toLocaleString('es-CO')} COP`}
            />
          )}
          {apt.notes && (
            <div className="col-span-2">
              <DetailItem
                icon={<Info className="w-3.5 h-3.5" />}
                label="Notas"
                value={apt.notes}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function DetailItem({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactElement; label: string; value: string }>): ReactElement {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactElement; label: string; value: string }>): ReactElement {
  return (
    <Card className="p-3 flex items-start gap-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold tabular-nums">{value}</p>
      </div>
    </Card>
  )
}

function LoadingState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
      <CheckCircle className="w-7 h-7 animate-pulse" />
      <p className="text-sm">Cargando citas…</p>
    </div>
  )
}

function EmptyState({ message }: Readonly<{ message: string }>): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
      <AlertCircle className="w-6 h-6 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default EmployeeAppointmentsModal
