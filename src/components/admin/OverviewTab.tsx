import React, { useEffect, useState } from 'react'
import * as Sentry from '@sentry/react'
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
  Copy,
  ExternalLink,
  QrCode,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Business } from '@/types/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import PublicBusinessProfile from '@/pages/PublicBusinessProfile'
import { BusinessQRModal } from './BusinessQRModal'
import { AssignmentHealthPanel } from './AssignmentHealthPanel'
import { toast } from 'sonner'

interface OverviewTabProps {
  business: Business
}

interface Stats {
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  /** Siempre es el total del negocio, independiente de la sede seleccionada */
  totalLocations: number
  /** Filtrado por sede cuando hay una seleccionada */
  totalServices: number
  /** Filtrado por sede cuando hay una seleccionada */
  totalEmployees: number
  monthlyRevenue: number
  averageAppointmentValue: number
  /** Siempre a nivel de negocio (para el checklist de configuración) */
  hasServicesInLocations: boolean
  /** Siempre a nivel de negocio (para el checklist de configuración) */
  hasEmployeesWithServices: boolean
  /** Siempre a nivel de negocio (para trigger del checklist) */
  businessTotalServices: number
  /** Servicios activos del negocio sin empleados asignados */
  servicesWithoutEmployees: number
  /** Sedes del negocio sin servicios asignados */
  locationsWithoutServices: number
  /** Empleados (no manager/owner) sin jefe directo */
  employeesWithoutSupervisor: number
  /** Empleados (no manager/owner) sin al menos un día laboral activo */
  employeesWithoutSchedule: number
  /** Empleados (no manager/owner) sin servicios asignados */
  employeesWithoutServices: number
  /** Empleados evaluados para checks operativos */
  regularEmployeesChecked: number
}

interface IdRow {
  id: string
}

interface EmployeeRoleRow {
  employee_id: string
  role: string | null
}

interface EmployeeServiceRow {
  employee_id: string
  service_id: string
}

interface LocationServiceRow {
  location_id: string
}

interface BusinessRoleRow {
  user_id: string
  reports_to: string | null
}

interface WorkScheduleRow {
  employee_id: string
}

export function OverviewTab({ business }: Readonly<OverviewTabProps>) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPublicProfile, setShowPublicProfile] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
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
      // Filtered by location when one is selected
      let apptQuery = supabase
        .from('appointments')
        .select('*')
        .eq('business_id', business.id)
        .gte('start_time', monthStartISO)
        .lt('start_time', nextMonthStartISO)

      if (preferredLocationId) {
        apptQuery = apptQuery.eq('location_id', preferredLocationId)
      }

      const { data: appointments, error: apptError } = await apptQuery

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

      // Get locations - ALWAYS business-wide (the "Sedes" card shows total del negocio)
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id')
        .eq('business_id', business.id)

      if (locError) throw locError

      // Get services - filtered by location when one is selected
      let totalServices: number
      if (preferredLocationId) {
        const { data: locationSvcs } = await supabase
          .from('location_services')
          .select('service_id')
          .eq('location_id', preferredLocationId)
        totalServices = locationSvcs?.length || 0
      } else {
        const { data: services, error: svcError } = await supabase
          .from('services')
          .select('id')
          .eq('business_id', business.id)
        if (svcError) throw svcError
        totalServices = services?.length || 0
      }

      // Get employees - filtered by location when one is selected (exclude auto-registered owner)
      let empQuery = supabase
        .from('business_employees')
        .select('employee_id')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .neq('employee_id', business.owner_id)

      if (preferredLocationId) {
        empQuery = empQuery.eq('location_id', preferredLocationId)
      }

      const { data: employees, error: empError } = await empQuery

      if (empError) throw empError

      // Check if services are linked to active locations — ALWAYS business-wide (for setup checklist)
      const locationIds = locations?.map((l) => l.id) || []
      let hasServicesInLocations = false
      let locationsWithoutServices = 0
      if (locationIds.length > 0) {
        const { data: locationServices } = await supabase
          .from('location_services')
          .select('location_id')
          .in('location_id', locationIds)
        const locationServicesRows = (locationServices as LocationServiceRow[] | null) ?? []
        const locationsWithServices = new Set(locationServicesRows.map((row) => row.location_id))

        locationsWithoutServices = locationIds.filter((locationId) => !locationsWithServices.has(locationId)).length
        hasServicesInLocations = (locationServices?.length || 0) > 0
      }

      // Business-wide services count for setup checklist trigger
      const { data: businessServices } = await supabase
        .from('services')
        .select('id')
        .eq('business_id', business.id)
        .eq('is_active', true)
      const businessServiceRows = (businessServices as IdRow[] | null) ?? []
      const businessServiceIds = businessServiceRows.map((service) => service.id)
      const businessTotalServices = businessServiceRows.length

      // Check if active employees are linked to services — ALWAYS business-wide (for setup checklist)
      // We check all employees in the business, not just those in the selected location
      const { data: allBusinessEmployees } = await supabase
        .from('business_employees')
        .select('employee_id, role')
        .eq('business_id', business.id)
        .eq('is_active', true)
      const allBusinessEmployeesRows = (allBusinessEmployees as EmployeeRoleRow[] | null) ?? []
      const allActiveEmployeeIds = allBusinessEmployeesRows.map((e) => e.employee_id)

      const regularActiveEmployeeIds = allBusinessEmployeesRows
        .filter((employee) => !['manager', 'owner'].includes((employee.role ?? '').toLowerCase()))
        .map((employee) => employee.employee_id)

      let employeeServicesRows: EmployeeServiceRow[] = []
      let hasEmployeesWithServices = false
      if (allActiveEmployeeIds.length > 0 && businessServiceIds.length > 0) {
        const { data: employeeServices } = await supabase
          .from('employee_services')
          .select('employee_id, service_id')
          .in('employee_id', allActiveEmployeeIds)
          .in('service_id', businessServiceIds)
        employeeServicesRows = (employeeServices as EmployeeServiceRow[] | null) ?? []
        hasEmployeesWithServices = employeeServicesRows.length > 0
      }

      const assignedServiceIds = new Set(employeeServicesRows.map((row) => row.service_id))
      const servicesWithoutEmployees = businessServiceIds.filter((serviceId) => !assignedServiceIds.has(serviceId)).length

      const employeesWithServices = new Set(employeeServicesRows.map((row) => row.employee_id))
      const employeesWithoutServices = regularActiveEmployeeIds.filter(
        (employeeId) => !employeesWithServices.has(employeeId),
      ).length

      let employeesWithoutSchedule = 0
      if (regularActiveEmployeeIds.length > 0) {
        const { data: workSchedules } = await supabase
          .from('work_schedules')
          .select('employee_id')
          .in('employee_id', regularActiveEmployeeIds)
          .eq('is_working', true)

        const employeesWithSchedule = new Set(
          ((workSchedules as WorkScheduleRow[] | null) ?? []).map((row) => row.employee_id),
        )

        employeesWithoutSchedule = regularActiveEmployeeIds.filter(
          (employeeId) => !employeesWithSchedule.has(employeeId),
        ).length
      }

      let employeesWithoutSupervisor = 0
      if (regularActiveEmployeeIds.length > 0) {
        const { data: hierarchyRows } = await supabase
          .from('business_roles')
          .select('user_id, reports_to')
          .eq('business_id', business.id)
          .in('user_id', regularActiveEmployeeIds)

        const employeesWithSupervisor = new Set(
          ((hierarchyRows as BusinessRoleRow[] | null) ?? [])
            .filter((row) => !!row.reports_to)
            .map((row) => row.user_id),
        )

        employeesWithoutSupervisor = regularActiveEmployeeIds.filter(
          (employeeId) => !employeesWithSupervisor.has(employeeId),
        ).length
      }

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
        totalServices,
        totalEmployees: employees?.length || 0,
        monthlyRevenue,
        averageAppointmentValue,
        hasServicesInLocations,
        hasEmployeesWithServices,
        businessTotalServices,
        servicesWithoutEmployees,
        locationsWithoutServices,
        employeesWithoutSupervisor,
        employeesWithoutSchedule,
        employeesWithoutServices,
        regularEmployeesChecked: regularActiveEmployeeIds.length,
      })
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'OverviewTab' } })
    } finally {
      setIsLoading(false)
    }
  }, [business.id, business.owner_id, preferredLocationId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const currentMonthName = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  const handleCopyLink = () => {
    const url = `${window.location.origin}/negocio/${business.slug}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Enlace copiado al portapapeles')
    }).catch(() => {
      toast.error('No se pudo copiar el enlace')
    })
  }

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
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)), { tags: { component: 'OverviewTab' } })
    }
    navigate('/app/admin/appointments')
  }

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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

  const hasOperationalIssues =
    stats.servicesWithoutEmployees > 0
    || stats.locationsWithoutServices > 0
    || stats.employeesWithoutSupervisor > 0
    || stats.employeesWithoutSchedule > 0
    || stats.employeesWithoutServices > 0

  const isBusinessFullyConfigured =
    business.is_configured === true
    && stats.totalLocations > 0
    && stats.businessTotalServices > 0
    && stats.hasServicesInLocations
    && stats.hasEmployeesWithServices
    && !hasOperationalIssues

  return (
    <div className="space-y-4">
      {/* Setup Checklist — shown when business is not fully configured */}
      {(stats.totalLocations === 0 || stats.businessTotalServices === 0 || business.is_configured === false) && (() => {
        const checklistItems = [
          {
            key: 'location',
            label: 'Al menos una sede',
            hint: 'Define dónde atenderás a tus clientes.',
            done: stats.totalLocations > 0,
            navigateTo: '/app/admin/locations',
            required: true,
          },
          {
            key: 'services',
            label: 'Servicios configurados',
            hint: 'Define qué ofreces y sus precios para recibir reservas.',
            done: stats.businessTotalServices > 0 && stats.hasServicesInLocations,
            navigateTo: '/app/admin/services',
            required: true,
          },
          {
            key: 'employees',
            label: 'Profesionales o recursos asignados',
            hint: 'Asigna al menos un empleado a un servicio para que los clientes puedan reservar.',
            done: stats.hasEmployeesWithServices,
            navigateTo: '/app/admin/employees',
            required: true,
          },
          {
            key: 'logo',
            label: 'Logo del negocio',
            hint: 'Un logo mejora la confianza y reconocimiento de tu marca.',
            done: !!business.logo_url,
            navigateTo: '/app/admin/settings',
            required: false,
          },
          {
            key: 'description',
            label: 'Descripción del negocio',
            hint: 'Cuéntales a tus clientes qué hace especial tu negocio.',
            done: !!business.description,
            navigateTo: '/app/admin/settings',
            required: false,
          },
          {
            key: 'phone',
            label: 'Teléfono de contacto',
            hint: 'Facilita que los clientes puedan contactarte directamente.',
            done: !!business.phone,
            navigateTo: '/app/admin/settings',
            required: false,
          },
        ]
        const completedCount = checklistItems.filter((i) => i.done).length
        const totalCount = checklistItems.length
        const progressPct = Math.round((completedCount / totalCount) * 100)

        return (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="pt-4 pb-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground leading-tight">
                      Completa la configuración de tu negocio
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {completedCount} de {totalCount} pasos completados · Tu negocio{' '}
                      {business.is_configured
                        ? 'ya es visible al público'
                        : 'aún no es visible al público'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    business.is_configured
                      ? 'border-green-500/50 text-green-400 shrink-0'
                      : 'border-red-500/50 text-red-400 shrink-0'
                  }
                >
                  {business.is_configured ? 'Público' : 'No público'}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Checklist items */}
              <div className="space-y-1">
                {checklistItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 py-1.5 px-1 rounded-md"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium leading-tight ${
                            item.done
                              ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                              : 'text-foreground'
                          }`}
                        >
                          {item.label}
                          {item.required && !item.done && (
                            <span className="ml-1.5 text-xs font-normal text-amber-400">
                              requerido
                            </span>
                          )}
                        </p>
                        {!item.done && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                            {item.hint}
                          </p>
                        )}
                      </div>
                    </div>
                    {!item.done && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs shrink-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        onClick={() => navigate(item.navigateTo)}
                      >
                        Ir →
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {hasOperationalIssues && (
        <AssignmentHealthPanel
          servicesWithoutEmployees={stats.servicesWithoutEmployees}
          locationsWithoutServices={stats.locationsWithoutServices}
          employeesWithoutSupervisor={stats.employeesWithoutSupervisor}
          employeesWithoutSchedule={stats.employeesWithoutSchedule}
          employeesWithoutServices={stats.employeesWithoutServices}
          regularEmployeesChecked={stats.regularEmployeesChecked}
          onNavigate={navigate}
        />
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
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
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Futuras en {currentMonthName}
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
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Completadas en {currentMonthName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
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
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-400" />
              Ingresos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${stats.monthlyRevenue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Ingresos por citas completadas en {currentMonthName}
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
              ${stats.averageAppointmentValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio de ingresos por cita completada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Info Summary */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="space-y-4 pt-6">
          {/* Header: Logo + Nombre + Botón */}
          <div className="flex items-start justify-between gap-4">
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
            <div className="flex items-center gap-1 shrink-0 mt-3">
              {isBusinessFullyConfigured && (
                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 mr-1">
                  Negocio disponible al público
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                title="Copiar enlace del perfil público"
                className="px-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {business.slug && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/negocio/${business.slug}`, '_blank')}
                  title="Abrir perfil público en nueva pestaña"
                  className="px-2"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              {business.slug && business.is_configured && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRModal(true)}
                  className="gap-1.5"
                >
                  <QrCode className="h-4 w-4" />
                  Generar QR
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPublicProfile((prev) => !prev)}
              >
                {showPublicProfile ? 'Ocultar perfil' : 'Ver perfil'}
              </Button>
            </div>
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

      <BusinessQRModal
        business={business}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  )
}