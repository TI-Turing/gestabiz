import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  Users,
  MapPin,
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Business } from '@/types/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import PublicBusinessProfile from '@/pages/PublicBusinessProfile'

interface OverviewTabProps {
  business: Business
}

interface Stats {
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  totalLocations: number
  totalServices: number
  totalEmployees: number
  monthlyRevenue: number
  averageAppointmentValue: number
}

export function OverviewTab({ business }: OverviewTabProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPublicProfile, setShowPublicProfile] = useState(false)
  const navigate = useNavigate()
  const { preferredLocationId } = usePreferredLocation(business.id)

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const todayStart = today.toISOString()
      const tomorrowStart = tomorrow.toISOString()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      const monthStartISO = monthStart.toISOString()
      const nextMonthStartISO = nextMonthStart.toISOString()
      const nowISO = now.toISOString()

      // Get appointments for current month only (includes today)
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', business.id)
        .gte('start_time', monthStartISO)
        .lt('start_time', nextMonthStartISO)

      if (apptError) throw apptError

      const totalAppointments = appointments?.length || 0
      const todayAppointments = appointments?.filter(
        (a) => a.start_time >= todayStart && a.start_time < tomorrowStart
          && a.status !== 'cancelled'
      ).length || 0
      const upcomingAppointments = appointments?.filter(
        (a) => a.start_time > nowISO && a.status !== 'cancelled'
      ).length || 0
      const completedAppointments = appointments?.filter(
        (a) => a.status === 'completed'
      ).length || 0
      const cancelledAppointments = appointments?.filter(
        (a) => a.status === 'cancelled'
      ).length || 0

      // Get locations
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id')
        .eq('business_id', business.id)

      if (locError) throw locError

      // Get services
      const { data: services, error: svcError } = await supabase
        .from('services')
        .select('id')
        .eq('business_id', business.id)

      if (svcError) throw svcError

      // Get employees (exclude auto-registered owner to match EmployeeManagement count)
      const { data: employees, error: empError } = await supabase
        .from('business_employees')
        .select('employee_id')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .neq('employee_id', business.owner_id)

      if (empError) throw empError

      // Calculate stats
      const monthlyRevenue = appointments?.filter(
        (a) => a.status === 'completed'
      ).reduce((sum, a) => sum + (a.price || 0), 0) || 0

      const averageAppointmentValue = totalAppointments > 0
        ? (appointments?.reduce((sum, a) => sum + (a.price || 0), 0) || 0) / totalAppointments
        : 0

      setStats({
        totalAppointments,
        todayAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalLocations: locations?.length || 0,
        totalServices: services?.length || 0,
        totalEmployees: employees?.length || 0,
        monthlyRevenue,
        averageAppointmentValue,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [business.id])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleTodayCardClick = () => {
    const filters = {
      status: ['pending', 'confirmed', 'completed'],
      location: preferredLocationId ? [preferredLocationId] : [],
      service: [],
      employee: [],
    }
    try {
      localStorage.setItem(`appointments-filters-${business.id}`, JSON.stringify(filters))
    } catch (e) {
      console.warn('Failed to set appointment filters', e)
    }
    navigate('/app/admin/appointments')
  }

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
        <Card
          className="bg-card border-border cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
          onClick={handleTodayCardClick}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Citas Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Citas programadas para hoy
            </p>
            <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver en calendario →
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-400" />
              Próximas Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Citas futuras este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Citas Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.completedAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completadas este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              Citas Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.cancelledAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Canceladas este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Miembros del equipo activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-pink-400" />
              Sedes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ubicaciones del negocio
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Servicios ofertados activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Avg Value */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-400" />
              Ingresos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${stats.monthlyRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de ingresos por citas completadas este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              Valor Promedio por Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${stats.averageAppointmentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio de ingresos por cita completada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions or Alerts */}
      {stats.totalLocations === 0 || stats.totalServices === 0 || business.is_configured === false ? (
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Configuración Incompleta
                </h3>
                <p className="text-sm text-foreground/90">
                  {stats.totalLocations === 0 && stats.totalServices === 0
                    ? 'Necesitas agregar sedes y servicios para empezar a recibir citas.'
                    : stats.totalLocations === 0
                    ? 'Necesitas agregar al menos una sede para tu negocio.'
                    : stats.totalServices === 0
                    ? 'Necesitas agregar servicios que ofrecer a tus clientes.'
                    : 'Verifica que todas las sedes tengan servicios activos y empleados/recursos asignados.'}
                </p>
                <div className="flex gap-2 mt-3">
                  {stats.totalLocations === 0 && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-300">
                      Sin sedes
                    </Badge>
                  )}
                  {stats.totalServices === 0 && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-300">
                      Sin servicios
                    </Badge>
                  )}
                  {business.is_configured === false && (
                    <Badge variant="destructive" className="bg-red-500 text-white flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> No disponible al público
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Business Info Summary */}
      <Card className="bg-card border-border overflow-hidden">
        {/* Banner con desvanecido */}
        {business.banner_url && (
          <div className="relative h-28 w-full overflow-hidden">
            <img
              src={business.banner_url}
              alt={`Banner de ${business.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-card via-card/20 to-transparent" />
          </div>
        )}
        <CardContent className={`space-y-4 ${business.banner_url ? 'pt-0' : 'pt-6'}`}>
          {/* Header: Logo + Nombre + Botón */}
          <div className={`flex items-start justify-between gap-4 ${business.banner_url ? '-mt-10' : ''}`}>
            <div className="flex items-center gap-3">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={`Logo de ${business.name}`}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-card shadow-lg bg-card shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 border-2 border-card shadow-lg">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="pt-1">
                <h3 className="text-lg font-bold text-foreground leading-tight">{business.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">Información del Negocio</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 mt-3"
              onClick={() => setShowPublicProfile((prev) => !prev)}
            >
              {showPublicProfile ? 'Ocultar perfil' : 'Ver perfil del negocio'}
            </Button>
          </div>
          {showPublicProfile && (
            <div className="mt-4">
              <PublicBusinessProfile slug={business.slug} embedded />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{(typeof business.category === 'string' ? business.category : business.category?.name) || 'Sin categoría'}</Badge>
              </div>
            </div>
            {business.subcategories && business.subcategories.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Subcategorías</p>
                <div className="flex flex-wrap gap-2">
                  {business.subcategories.map((sub) => (
                    <Badge key={sub.id} variant="outline" className="border-border">
                      {sub.subcategory?.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {business.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="text-foreground">{business.description}</p>
              </div>
            )}
            {business.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="text-foreground">{business.phone}</p>
              </div>
            )}
            {business.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground">{business.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}