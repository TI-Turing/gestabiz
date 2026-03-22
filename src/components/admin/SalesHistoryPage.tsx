import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Search, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ClientProfileModal } from './ClientProfileModal'

interface SalesHistoryPageProps {
  businessId: string
}

type DateRange = '7' | '30' | '90' | '365'

interface AptRow {
  id: string
  start_time: string
  client_id: string
  service_id: string
  price: number | null
}

interface SaleDisplay {
  id: string
  start_time: string
  client_id: string
  client_name: string
  service_name: string
  price: number | null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

async function fetchSales(businessId: string, since: string): Promise<SaleDisplay[]> {
  // 1. Obtener citas completadas con columnas reales de la tabla
  const { data: apts, error: aptsError } = await supabase
    .from('appointments')
    .select('id, start_time, client_id, service_id, price')
    .eq('business_id', businessId)
    .eq('status', 'completed')
    .gte('start_time', since)
    .order('start_time', { ascending: false })
    .limit(500)

  if (aptsError) throw aptsError
  if (!apts || apts.length === 0) return []

  const rows = apts as AptRow[]

  // 2. Batch fetch de perfiles de clientes
  const clientIds = [...new Set(rows.map((a) => a.client_id).filter(Boolean))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', clientIds)

  // 3. Batch fetch de servicios
  const serviceIds = [...new Set(rows.map((a) => a.service_id).filter(Boolean))]
  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .in('id', serviceIds)

  const profileMap = new Map<string, string | null>((profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]))
  const serviceMap = new Map<string, string>((services ?? []).map((s) => [s.id as string, s.name as string]))

  return rows.map((apt) => ({
    id: apt.id,
    start_time: apt.start_time,
    client_id: apt.client_id,
    client_name: profileMap.get(apt.client_id) || 'Cliente sin nombre',
    service_name: serviceMap.get(apt.service_id) || 'Servicio',
    price: apt.price,
  }))
}

export function SalesHistoryPage({ businessId }: SalesHistoryPageProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30')
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const since = useMemo(
    () => startOfDay(subDays(new Date(), parseInt(dateRange))).toISOString(),
    [dateRange],
  )

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales-history', businessId, dateRange],
    queryFn: () => fetchSales(businessId, since),
    enabled: !!businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return sales
    const q = search.toLowerCase()
    return sales.filter(
      (s) =>
        s.client_name.toLowerCase().includes(q) ||
        s.service_name.toLowerCase().includes(q),
    )
  }, [sales, search])

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, s) => sum + (s.price ?? 0), 0),
    [filtered],
  )

  const avgRevenue = filtered.length > 0 ? totalRevenue / filtered.length : 0

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Historial de Ventas</h2>
        <p className="text-sm text-muted-foreground">Citas completadas en el período</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-primary/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold">{filtered.length}</p>
                <p className="text-xs text-muted-foreground">Citas completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{formatCOP(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Ingresos en período</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hidden sm:block">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">
                  {avgRevenue > 0 ? formatCOP(avgRevenue) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Promedio por cita</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={dateRange}
          onValueChange={(v) => setDateRange(v as DateRange)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {search
              ? 'No hay resultados para esa búsqueda'
              : 'No hay ventas en el período seleccionado'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sale) => (
            <div
              key={sale.id}
              className="rounded-xl border bg-card p-3 flex items-center gap-3"
            >
              {/* Fecha */}
              <div className="hidden sm:flex flex-col items-center justify-center w-12 shrink-0">
                <p className="text-lg font-bold leading-none">
                  {format(new Date(sale.start_time), 'd')}
                </p>
                <p className="text-xs text-muted-foreground uppercase">
                  {format(new Date(sale.start_time), 'MMM', { locale: es })}
                </p>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block shrink-0" />

              {/* Servicio */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{sale.service_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(sale.start_time), "d MMM · HH:mm", { locale: es })}
                </p>
              </div>

              {/* Cliente (clicable) */}
              <button
                type="button"
                onClick={() => setSelectedClientId(sale.client_id)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors shrink-0"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(sale.client_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:block max-w-32 truncate">
                  {sale.client_name}
                </span>
              </button>

              {/* Precio */}
              {sale.price != null && sale.price > 0 && (
                <span className="text-sm font-semibold shrink-0">{formatCOP(sale.price)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <ClientProfileModal
        clientId={selectedClientId}
        businessId={businessId}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </div>
  )
}
