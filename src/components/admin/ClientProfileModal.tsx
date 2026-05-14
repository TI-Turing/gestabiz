import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Phone, Calendar, Clock, CheckCircle2, User, Box } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ClientData {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
}

interface AppointmentHistoryRow {
  id: string
  start_time: string
  status: string
  service_id: string | null
  employee_id: string | null
  resource_id: string | null
  price: number | null
  service_name?: string
  assignee_label?: string
  assignee_kind?: 'employee' | 'resource' | null
}

interface ClientProfileModalProps {
  clientId: string | null
  businessId: string
  isOpen: boolean
  onClose: () => void
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  in_progress: 'En progreso',
  no_show: 'No asistió',
  rescheduled: 'Reprogramada',
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'cancelled' || status === 'no_show') return 'destructive'
  if (status === 'confirmed') return 'secondary'
  return 'outline'
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function ClientProfileModal({
  clientId,
  businessId,
  isOpen,
  onClose,
}: ClientProfileModalProps) {
  const [activeTab, setActiveTab] = useState('info')

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['client-profile-modal', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, created_at')
        .eq('id', clientId!)
        .single()
      if (error) throw error
      return data as ClientData
    },
    enabled: !!clientId && isOpen,
    ...QUERY_CONFIG.STABLE,
  })

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['client-appointment-history', clientId, businessId],
    queryFn: async () => {
      // 1. Obtener citas del cliente
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, status, service_id, employee_id, resource_id, price')
        .eq('business_id', businessId)
        .eq('client_id', clientId!)
        .order('start_time', { ascending: false })
        .limit(50)
      if (error) throw error
      if (!data || data.length === 0) return []

      const rows = data as Array<{
        id: string
        start_time: string
        status: string
        service_id: string | null
        employee_id: string | null
        resource_id: string | null
        price: number | null
      }>

      // 2. Batch fetch de servicios
      const serviceIds = [...new Set(rows.map((a) => a.service_id).filter((id): id is string => !!id))]
      const servicesRes = serviceIds.length
        ? await supabase.from('services').select('id, name').in('id', serviceIds)
        : null
      const serviceMap = new Map<string, string>(
        ((servicesRes?.data ?? []) as Array<{ id: string; name: string }>).map((s) => [s.id, s.name]),
      )

      // 3. Batch fetch de empleados (asignees humanos)
      const employeeIds = [...new Set(rows.map((a) => a.employee_id).filter((id): id is string => !!id))]
      const employeesRes = employeeIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', employeeIds)
        : null
      const employeeMap = new Map<string, string | null>(
        ((employeesRes?.data ?? []) as Array<{ id: string; full_name: string | null }>).map((p) => [p.id, p.full_name]),
      )

      // 4. Batch fetch de recursos (asignees físicos)
      const resourceIds = [...new Set(rows.map((a) => a.resource_id).filter((id): id is string => !!id))]
      const resourcesRes = resourceIds.length
        ? await supabase.from('business_resources').select('id, name').in('id', resourceIds)
        : null
      const resourceMap = new Map<string, string>(
        ((resourcesRes?.data ?? []) as Array<{ id: string; name: string }>).map((r) => [r.id, r.name]),
      )

      return rows.map((apt): AppointmentHistoryRow => {
        const employeeName = apt.employee_id ? employeeMap.get(apt.employee_id) ?? null : null
        const resourceName = apt.resource_id ? resourceMap.get(apt.resource_id) ?? null : null
        return {
          ...apt,
          service_name: apt.service_id ? serviceMap.get(apt.service_id) ?? 'Servicio' : 'Servicio',
          assignee_label: employeeName?.trim() || resourceName?.trim() || '',
          assignee_kind: apt.employee_id ? 'employee' : apt.resource_id ? 'resource' : null,
        }
      })
    },
    enabled: !!clientId && !!businessId && isOpen,
    ...QUERY_CONFIG.FREQUENT,
  })

  const completedCount = appointments.filter((a) => a.status === 'completed').length
  const totalRevenue = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + (a.price ?? 0), 0)
  const lastVisit = appointments[0]?.start_time
  const firstVisit = appointments[appointments.length - 1]?.start_time

  const name = profile?.full_name ?? '—'
  const initials = getInitials(profile?.full_name ?? null)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil del Cliente</DialogTitle>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Avatar + nombre */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{name}</h2>
                <p className="text-sm text-muted-foreground">
                  Cliente desde{' '}
                  {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>

            {/* Contacto */}
            <div className="flex flex-wrap gap-4 py-3 border-y border-border">
              {profile.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {!profile.email && !profile.phone && (
                <p className="text-sm text-muted-foreground">Sin información de contacto</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-primary">{completedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Visitas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-primary">{appointments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total citas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-base font-bold text-primary leading-tight">
                    {totalRevenue > 0 ? formatCOP(totalRevenue) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ingresos</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">
                  Información
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  Historial ({appointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-2 mt-3">
                {lastVisit && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Última visita:</span>
                    <span className="font-medium">
                      {format(new Date(lastVisit), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
                {firstVisit && firstVisit !== lastVisit && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Primera visita:</span>
                    <span className="font-medium">
                      {format(new Date(firstVisit), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
                {!lastVisit && (
                  <p className="text-sm text-muted-foreground">Sin visitas registradas</p>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-3">
                {loadingAppointments ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Sin historial de citas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{apt.service_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.start_time), "d MMM yyyy · HH:mm", {
                              locale: es,
                            })}
                          </p>
                          {apt.assignee_kind && apt.assignee_label && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                              {apt.assignee_kind === 'resource' ? (
                                <Box className="h-3 w-3 shrink-0" />
                              ) : (
                                <User className="h-3 w-3 shrink-0" />
                              )}
                              <span className="truncate">{apt.assignee_label}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {apt.price != null && apt.price > 0 && (
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatCOP(apt.price)}
                            </span>
                          )}
                          <Badge variant={statusVariant(apt.status)} className="text-xs">
                            {STATUS_LABELS[apt.status] ?? apt.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-muted-foreground">No se encontró información del cliente</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
