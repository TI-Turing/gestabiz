import React, { useState, useMemo, useEffect } from 'react'
import { Calendar, List, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmployeeAppointmentsList } from './EmployeeAppointmentsList'
import { AppointmentsCalendar } from '@/components/admin/AppointmentsCalendar'
import { useEmployeeAppointments } from '@/hooks/useEmployeeAppointments'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/types'

const COLOMBIA_TIME_ZONE = 'America/Bogota'

const getDateKeyInColombia = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString('en-CA', { timeZone: COLOMBIA_TIME_ZONE })
}

const isScheduledStatus = (status: Appointment['status']) => {
  return status === 'scheduled' || status === 'rescheduled'
}

const isConfirmedStatus = (status: Appointment['status']) => {
  return status === 'confirmed' || status === 'in_progress'
}

interface Service {
  id: string
  name: string
}

interface EmployeeAppointmentsPageProps {
  readonly employeeId: string
  readonly businessId: string
}

type ViewMode = 'list' | 'calendar'
type StatusFilter = 'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'

export function EmployeeAppointmentsPage({ 
  employeeId, 
  businessId
}: Readonly<EmployeeAppointmentsPageProps>) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [services, setServices] = useState<Service[]>([])

  // Fetch services of the business
  useEffect(() => {
    const fetchServices = async () => {
      if (!businessId) return
      
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name')
          .eq('business_id', businessId)
          .order('name')
        
        if (!error && data) {
          setServices(data)
        }
      } catch {
        // Error handling
      }
    }
    
    fetchServices()
  }, [businessId])

  // Fetch appointments asignadas al empleado
  const { 
    appointments, 
    loading, 
    error,
    refetch 
  } = useEmployeeAppointments(employeeId, businessId)

  // Filtrar citas
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => {
        if (statusFilter === 'scheduled') {
          return isScheduledStatus(apt.status)
        }

        if (statusFilter === 'confirmed') {
          return isConfirmedStatus(apt.status)
        }

        return apt.status === statusFilter
      })
    }

    // Filtro por servicio
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.service_id === serviceFilter)
    }

    // Búsqueda por nombre de cliente
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(apt => 
        apt.client_name?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [appointments, statusFilter, serviceFilter, searchTerm])

  // Contar citas de hoy (usando zona horaria de Colombia)
  const todayAppointments = useMemo(() => {
    const todayStr = getDateKeyInColombia(new Date())

    return appointments.filter(apt => {
      const aptStr = getDateKeyInColombia(apt.start_time)
      return aptStr === todayStr
    })
  }, [appointments])

  // Stats por estado
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      today: todayAppointments.length,
      scheduled: appointments.filter(a => isScheduledStatus(a.status)).length,
      confirmed: appointments.filter(a => isConfirmedStatus(a.status)).length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    }
  }, [appointments, todayAppointments])

  const hasSingleResult = filteredAppointments.length === 1
  const resultPluralSuffix = hasSingleResult ? '' : 's'
  const resultsLabel = filteredAppointments.length === 0
    ? 'No se encontraron citas'
    : `${filteredAppointments.length} cita${resultPluralSuffix} encontrada${resultPluralSuffix}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar las citas: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header con stats */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Mis Citas</h2>
            <p className="text-muted-foreground">
              Gestiona tus citas asignadas
            </p>
          </div>
          
          {/* Toggle View Mode */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {viewMode === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.today}</div>
              <div className="text-sm text-muted-foreground">Citas Hoy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.scheduled}</div>
              <div className="text-sm text-muted-foreground">Programadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-sm text-muted-foreground">Confirmadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completadas</div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>

      {/* Filters */}
      {viewMode === 'list' && (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda por cliente */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="scheduled">Programadas</SelectItem>
                <SelectItem value="confirmed">Confirmadas / En curso</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por servicio */}
            {services.length > 0 && (
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servicios</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Limpiar filtros */}
            {(statusFilter !== 'all' || serviceFilter !== 'all' || searchTerm) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all')
                  setServiceFilter('all')
                  setSearchTerm('')
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Resultados count */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{resultsLabel}</p>
        </div>
      )}

      {/* Content - List or Calendar */}
      {viewMode === 'list' ? (
        <EmployeeAppointmentsList 
          appointments={filteredAppointments}
          onRefresh={refetch}
        />
      ) : (
        <AppointmentsCalendar
          businessId={businessId}
          employeeId={employeeId}
        />
      )}
    </div>
  )
}
