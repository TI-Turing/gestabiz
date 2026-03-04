/**
 * @file EmployeeProfileModal.tsx
 * @description Modal que muestra el perfil detallado de un empleado
 * Información: contacto, horarios, servicios, ubicaciones, estadísticas
 * Tabs: Información (lectura) y Nómina (configuración de salario)
 * Not finished.
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es as esLocale } from 'date-fns/locale'
import { Mail, Phone, Calendar, MapPin, Star, TrendingUp, Clock, ChevronRight, Globe, Briefcase, Umbrella, Loader2, Sun, Check, X, Pencil, GitBranch, Users, Info } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { hierarchyService } from '@/lib/hierarchyService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmployeeSalaryConfig } from '@/components/admin/employees/EmployeeSalaryConfig'
import { LocationProfileModal } from '@/components/admin/LocationProfileModal'
import { ReviewList } from '@/components/reviews/ReviewList'
import { ServiceProfileModal } from '@/components/admin/ServiceProfileModal'
import { HierarchyMapView } from '@/components/admin/HierarchyMapView'
import { EmployeeOccupancyModal } from '@/components/admin/EmployeeOccupancyModal'
import { EmployeeAppointmentsModal } from '@/components/admin/EmployeeAppointmentsModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeProfileModalProps {
  employee: EmployeeHierarchy | null
  isOpen: boolean
  onClose: () => void
  /** Lista completa de empleados del negocio — habilita organigrama y perfil de supervisor */
  employees?: EmployeeHierarchy[]
}

// =====================================================
// CONSTANTES
// =====================================================

const HIERARCHY_LABELS = {
  0: 'Propietario',
  1: 'Administrador',
  2: 'Gerente',
  3: 'Líder de Equipo',
  4: 'Personal',
}

const HIERARCHY_COLORS = {
  0: 'bg-purple-100 text-purple-800',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-gray-100 text-gray-800',
}

const EXPERTISE_LABELS: Record<string, string> = {
  '1': 'Principiante',
  '2': 'Básico',
  '3': 'Intermedio',
  '4': 'Avanzado',
  '5': 'Experto',
}

const SCHEDULE_DAYS = [
  { key: 'monday',    label: 'Lun' },
  { key: 'tuesday',   label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday',  label: 'Jue' },
  { key: 'friday',    label: 'Vie' },
  { key: 'saturday',  label: 'Sáb' },
  { key: 'sunday',    label: 'Dom' },
]

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  vacation:   'Vacaciones',
  emergency:  'Emergencia',
  sick_leave: 'Ausencia Médica',
  personal:   'Permiso Personal',
  other:      'Otro',
}

const ABSENCE_TYPE_COLORS: Record<string, string> = {
  vacation:   'bg-blue-50 text-blue-700 border-blue-200',
  emergency:  'bg-red-50 text-red-700 border-red-200',
  sick_leave: 'bg-orange-50 text-orange-700 border-orange-200',
  personal:   'bg-purple-50 text-purple-700 border-purple-200',
  other:      'bg-gray-100 text-gray-700 border-gray-200',
}

// =====================================================
// COMPONENTE
// =====================================================

export function EmployeeProfileModal({
  employee,
  isOpen,
  onClose,
  employees,
}: Readonly<EmployeeProfileModalProps>) {
  const [activeTab, setActiveTab] = useState<'info' | 'payroll'>('info')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const [profileServiceId, setProfileServiceId] = useState<string | null>(null)
  // Estado para edición inline del cargo
  const [editingCargo, setEditingCargo] = useState(false)
  const [cargoValue, setCargoValue] = useState('')
  const [savingCargo, setSavingCargo] = useState(false)
  const queryClient = useQueryClient()
  // Estado para organigrama y perfil del supervisor
  const [showHierarchyMap, setShowHierarchyMap] = useState(false)
  const [supervisorEmployee, setSupervisorEmployee] = useState<EmployeeHierarchy | null>(null)
  const [isNestedProfileOpen, setIsNestedProfileOpen] = useState(false)
  // Estado para edición inline del jefe directo
  const [editingSupervisor, setEditingSupervisor] = useState(false)
  const [supervisorSelectValue, setSupervisorSelectValue] = useState('')
  const [savingSupervisor, setSavingSupervisor] = useState(false)
  // Estado para modal de ocupación
  const [showOccupancyModal, setShowOccupancyModal] = useState(false)
  // Estado para modal de historial de citas
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)

  // Horario y contrato del empleado
  const { data: empData } = useQuery({
    queryKey: ['employee-modal-detail', employee?.user_id, employee?.business_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_employees')
        .select('has_lunch_break, lunch_break_start, lunch_break_end, contract_type, job_title')
        .eq('employee_id', employee!.user_id)
        .eq('business_id', employee!.business_id)
        .single()
      if (error) return null
      return data
    },
    enabled: !!employee?.user_id && !!employee?.business_id,
  })

  // Perfil profesional del empleado
  const { data: profileData } = useQuery({
    queryKey: ['employee-profile-modal', employee?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('employee_profiles')
        .select('linkedin_url, portfolio_url, professional_summary, specializations, years_of_experience')
        .eq('user_id', employee!.user_id)
        .maybeSingle()
      return data ?? null
    },
    enabled: !!employee?.user_id,
  })

  // Ausencias aprobadas (las únicas visibles al admin)
  const { data: approvedAbsences = [], isLoading: loadingAbsences } = useQuery({
    queryKey: ['employee-approved-absences', employee?.user_id, employee?.business_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_absences')
        .select('id, absence_type, start_date, end_date, reason')
        .eq('employee_id', employee!.user_id)
        .eq('business_id', employee!.business_id)
        .eq('status', 'approved')
        .order('start_date', { ascending: false })
        .limit(10)
      if (error) return []
      return data ?? []
    },
    enabled: !!employee?.user_id && !!employee?.business_id,
  })

  if (!employee) return null

  // Objeto Location mínimo para LocationProfileModal
  const locationObj = employee.location_id ? {
    id: employee.location_id,
    business_id: employee.business_id,
    name: employee.location_name ?? '',
    is_active: true,
    created_at: '',
    updated_at: '',
  } : null

  // Clase reutilizable para cards clickeables
  const clickable = 'cursor-pointer hover:bg-accent/40 transition-colors rounded-lg'

  const hierarchyLevel = employee.hierarchy_level || 4
  const hierarchyLabel = HIERARCHY_LABELS[hierarchyLevel as keyof typeof HIERARCHY_LABELS] || 'Desconocido'
  const hierarchyColor = HIERARCHY_COLORS[hierarchyLevel as keyof typeof HIERARCHY_COLORS]

  // Cargo actual: prioriza valor cargado de BD, luego el del objeto de jerarquía
  const currentJobTitle = empData?.job_title ?? employee.job_title ?? ''

  // Supervisor en la lista de empleados (para abrir su perfil al hacer clic)
  const supervisorInList = employees?.find(e => e.user_id === employee.reports_to) ?? null

  const handleStartEditCargo = () => {
    setCargoValue(currentJobTitle)
    setEditingCargo(true)
  }

  const handleSaveCargo = async () => {
    if (!employee) return
    setSavingCargo(true)
    try {
      const { error } = await supabase
        .from('business_employees')
        .update({ job_title: cargoValue.trim() || null })
        .eq('employee_id', employee.user_id)
        .eq('business_id', employee.business_id)
      if (error) throw error
      toast.success('Cargo actualizado')
      await queryClient.invalidateQueries({ queryKey: ['employee-modal-detail', employee.user_id, employee.business_id] })
      setEditingCargo(false)
    } catch {
      toast.error('Error al actualizar el cargo')
    } finally {
      setSavingCargo(false)
    }
  }

  const handleSaveSupervisor = async () => {
    if (!employee) return
    setSavingSupervisor(true)
    try {
      const result = await hierarchyService.assignSupervisor({
        employeeId: employee.user_id,
        businessId: employee.business_id,
        newSupervisorId: supervisorSelectValue === '__none__' ? null : supervisorSelectValue,
      })
      if (!result.success) throw new Error(result.error ?? 'Error desconocido')
      toast.success('Jefe directo actualizado')
      await queryClient.invalidateQueries({ queryKey: ['businessHierarchy', employee.business_id] })
      await queryClient.invalidateQueries({ queryKey: ['pending-setup-employees', employee.business_id] })
      await queryClient.invalidateQueries({ queryKey: ['employee-modal-detail', employee.user_id, employee.business_id] })
      setEditingSupervisor(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el jefe directo')
    } finally {
      setSavingSupervisor(false)
    }
  }

  // Nombre del supervisor con enlace (o texto si no está en la lista)
  const supervisorNameNode = supervisorInList ? (
    <button
      className="text-sm font-medium text-primary hover:underline truncate"
      onClick={() => {
        setSupervisorEmployee(supervisorInList)
        setIsNestedProfileOpen(true)
      }}
    >
      {employee.supervisor_name}
    </button>
  ) : (
    <span className={employee.supervisor_name ? 'text-sm font-medium truncate' : 'text-sm text-muted-foreground italic'}>
      {employee.supervisor_name ?? 'Sin asignar'}
    </span>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* ENCABEZADO FIJO: avatar + nombre */}
        <div className="shrink-0 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 pr-8">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={employee.avatar_url ?? undefined} alt={employee.full_name} />
                <AvatarFallback className="bg-linear-to-br from-blue-400 to-purple-500 text-white font-bold">
                  {employee.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{employee.full_name}</h2>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* TABS: Información y Nómina */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'payroll')} className="flex flex-col flex-1 min-h-0">

          {/* PESTAÑAS FIJAS */}
          <div className="shrink-0 px-6 pb-3 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="payroll">Nómina</TabsTrigger>
            </TabsList>
          </div>

          {/* CONTENIDO SCROLLABLE */}
          <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* TAB 1: INFORMACIÓN (contenido original) */}
          <TabsContent value="info">
            <div className="space-y-6">
          {/* CARGO */}
          <Card
            className={`p-4 group ${editingCargo ? '' : clickable}`}
            onClick={() => { if (!editingCargo) setShowHierarchyMap(true) }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <h3 className="font-semibold text-sm">Cargo</h3>
                  {!editingCargo && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
                      title="Editar cargo"
                      onClick={e => { e.stopPropagation(); handleStartEditCargo() }}
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {editingCargo ? (
                  <div
                    role="none"
                    className="flex items-center gap-2"
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                  >
                    <Input
                      value={cargoValue}
                      onChange={e => setCargoValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveCargo()
                        if (e.key === 'Escape') setEditingCargo(false)
                      }}
                      placeholder="Ej: Recepcionista, Estilista, Terapeuta..."
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={handleSaveCargo}
                      disabled={savingCargo}
                    >
                      {savingCargo
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4 text-green-600" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setEditingCargo(false)}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {currentJobTitle || <span className="text-muted-foreground italic">Sin cargo asignado</span>}
                  </p>
                )}
              </div>
              {/* Badge de nivel jerárquico como contexto secundario */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge className={`${hierarchyColor}`}>
                  {hierarchyLabel}
                </Badge>
                {employees && employees.length > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Users className="w-3 h-3" />
                    Ver organigrama
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* SUPERVISOR (jefe directo) — siempre visible, editable si hay lista de empleados */}
          {(employee.supervisor_name || (employees && employees.length > 1)) && (
            <Card className="p-4 group">
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground shrink-0">Jefe directo:</span>

                {editingSupervisor ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Select
                      value={supervisorSelectValue}
                      onValueChange={setSupervisorSelectValue}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                        <SelectValue placeholder="Seleccionar jefe..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs text-muted-foreground">
                          Sin jefe directo
                        </SelectItem>
                        {employees
                          ?.filter(e => e.user_id !== employee.user_id && e.hierarchy_level < employee.hierarchy_level)
                          .map(e => (
                            <SelectItem key={e.user_id} value={e.user_id} className="text-xs">
                              {e.full_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={handleSaveSupervisor}
                      disabled={!supervisorSelectValue || savingSupervisor}
                    >
                      {savingSupervisor
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4 text-green-600" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setEditingSupervisor(false)}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {supervisorNameNode}
                    {employees && employees.length > 1 && (
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent shrink-0"
                        title="Cambiar jefe directo"
                        onClick={() => {
                          setSupervisorSelectValue(employee.reports_to ?? '')
                          setEditingSupervisor(true)
                        }}
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* INFORMACIÓN DE CONTACTO */}
          {/* PENDIENTE: Crear EmployeeContactModal para editar datos de contacto del empleado */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{employee.email || 'No especificado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">{employee.phone ?? 'No especificado'}</p>
                </div>
              </div>
              {profileData?.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">LinkedIn</p>
                    <a
                      href={profileData.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-xs"
                    >
                      {profileData.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                </div>
              )}
              {profileData?.portfolio_url && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Portafolio</p>
                    <a
                      href={profileData.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-xs"
                    >
                      {profileData.portfolio_url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                </div>
              )}
              {(profileData?.years_of_experience !== null && profileData?.years_of_experience !== undefined) && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Experiencia</p>
                    <p className="text-sm font-medium">{profileData.years_of_experience} año{profileData.years_of_experience === 1 ? '' : 's'}</p>
                  </div>
                </div>
              )}
              {profileData?.specializations && profileData.specializations.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Especializaciones</p>
                  <div className="flex flex-wrap gap-1">
                    {profileData.specializations.map((s) => (
                      <span key={s} className="text-xs bg-accent px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {profileData?.professional_summary && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resumen Profesional</p>
                  <p className="text-sm text-foreground leading-relaxed">{profileData.professional_summary}</p>
                </div>
              )}
            </div>
          </Card>

          {/* INFORMACIÓN LABORAL */}
          {/* PENDIENTE: Crear EmployeeWorkInfoModal para ver contrato, historial y rol del empleado */}
          {(employee.hired_at || employee.role) && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Información Laboral
              </h3>
              <div className="space-y-3">
                {employee.hired_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Contratación</p>
                      <p className="text-sm font-medium">
                        {new Date(employee.hired_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
                {employee.role && (
                  <div>
                    <p className="text-xs text-muted-foreground">Rol</p>
                    <p className="text-sm font-medium capitalize">{employee.role}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* HORARIO DE TRABAJO */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Horario de Trabajo
            </h3>
            <div className="space-y-1">
              {SCHEDULE_DAYS.map(({ key, label }) => {
                const isWeekend = key === 'saturday' || key === 'sunday'
                return (
                  <div
                    key={key}
                    className={`grid grid-cols-[48px_1fr_1fr] items-center gap-2 px-2 py-1.5 rounded text-sm ${isWeekend ? 'opacity-50' : ''}`}
                  >
                    <span className={`font-medium text-xs ${isWeekend ? 'text-muted-foreground' : 'text-foreground'}`}>{label}</span>
                    <span className="text-muted-foreground text-xs">
                      {isWeekend ? 'No laboral' : 'No configurado'}
                    </span>
                    <span />
                  </div>
                )
              })}
            </div>
            {empData?.has_lunch_break && (empData.lunch_break_start || empData.lunch_break_end) && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs">Almuerzo:</span>
                <span className="text-sm font-medium">
                  {empData.lunch_break_start ?? '—'} – {empData.lunch_break_end ?? '—'}
                </span>
              </div>
            )}
            {empData && !empData.has_lunch_break && (
              <p className="mt-3 pt-3 border-t text-xs text-muted-foreground">Sin pausa de almuerzo configurada</p>
            )}
          </Card>

          {/* UBICACIONES — abre LocationProfileModal */}
          {employee.location_name && (
            <Card
              className={`p-4 ${clickable}`}
              onClick={() => setShowLocationModal(true)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ubicación Asignada
                </h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start gap-3 p-2 rounded mt-4">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm font-medium">{employee.location_name}</p>
              </div>
            </Card>
          )}

          {/* ESTADÍSTICAS */}
          <div className="grid grid-cols-2 gap-4">

            {/* Rating — abre diálogo de reseñas */}
            {employee.average_rating !== undefined && (
              <Card
                className={`p-4 ${clickable}`}
                onClick={() => setShowReviewsModal(true)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <p className="text-xs text-muted-foreground">Calificación</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{(employee.average_rating || 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{employee.total_reviews || 0} reseñas</p>
              </Card>
            )}

            {/* Ocupación — clicable abre EmployeeOccupancyModal */}
            {employee.occupancy_rate !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className="p-4 cursor-pointer hover:ring-2 hover:ring-blue-500/40 transition-all group"
                      onClick={() => setShowOccupancyModal(true)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Ocupación</p>
                        <Info className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-2xl font-bold">{(employee.occupancy_rate || 0).toFixed(0)}%</p>
                      <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min((employee.occupancy_rate || 0), 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalle de ocupación →
                      </p>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Ocupación de los últimos 30 días. Clic para ver el análisis completo.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Citas Completadas — clicable abre EmployeeAppointmentsModal */}
            {employee.completed_appointments !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className="p-4 cursor-pointer hover:ring-2 hover:ring-green-500/40 transition-all group"
                      onClick={() => setShowAppointmentsModal(true)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <p className="text-xs text-muted-foreground">Citas Completadas</p>
                        <Info className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-2xl font-bold">{employee.completed_appointments || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver historial de citas →
                      </p>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Citas atendidas en los últimos 30 días. Clic para ver el historial completo.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Ingresos */}
            {/* PENDIENTE: Crear EmployeeRevenueModal para ver desglose de ingresos por período */}
            {employee.gross_revenue !== undefined && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">Ingresos Totales</p>
                </div>
                <p className="text-lg font-bold truncate">
                  ${(employee.gross_revenue || 0).toLocaleString('es-CO')}
                </p>
              </Card>
            )}
          </div>

          {/* SERVICIOS — cada fila abre ServiceProfileModal */}
          {employee.services_offered && employee.services_offered.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-1">Servicios que atiende</h3>
              <p className="text-xs text-muted-foreground mb-3">Servicios que este empleado está autorizado a gestionar</p>
              <div className="space-y-2">
                {employee.services_offered.slice(0, 5).map((service) => (
                  <button
                    key={service.service_id}
                    type="button"
                    className={`w-full flex items-center justify-between p-2 rounded gap-2 ${clickable}`}
                    onClick={() => setProfileServiceId(service.service_id)}
                  >
                    <span className="text-sm font-medium">{service.service_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {EXPERTISE_LABELS[String(service.expertise_level)] ?? `Nivel ${service.expertise_level}`}
                      </Badge>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {employee.services_offered.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{employee.services_offered.length - 5} servicios más
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* AUSENCIAS Y VACACIONES APROBADAS */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Umbrella className="w-4 h-4" />
              Ausencias y Vacaciones
              <span className="ml-auto text-xs text-muted-foreground font-normal">Solo aprobadas</span>
            </h3>
            {loadingAbsences && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingAbsences && approvedAbsences.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">Sin ausencias aprobadas registradas</p>
            )}
            {!loadingAbsences && approvedAbsences.length > 0 && (
              <div className="space-y-2">
                {approvedAbsences.map((absence) => {
                  const start = parseISO(absence.start_date)
                  const end = parseISO(absence.end_date)
                  const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1
                  const colorClass = ABSENCE_TYPE_COLORS[absence.absence_type] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                  const label = ABSENCE_TYPE_LABELS[absence.absence_type] ?? absence.absence_type
                  return (
                    <div key={absence.id} className="flex items-start gap-3 p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>{label}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{days} día{days === 1 ? '' : 's'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(start, 'dd MMM yyyy', { locale: esLocale })} – {format(end, 'dd MMM yyyy', { locale: esLocale })}
                        </p>
                        {absence.reason && (
                          <p className="text-xs text-foreground/70 mt-0.5 truncate">{absence.reason}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* BOTÓN CERRAR */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </TabsContent>

          {/* TAB 2: NÓMINA */}
          <TabsContent value="payroll">
            <div className="space-y-4">
              <EmployeeSalaryConfig
                employeeId={employee.employee_id ?? employee.user_id}
                businessId={employee.business_id}
                employeeName={employee.full_name}
                currentSalaryBase={employee.salary_base}
                currentSalaryType={employee.salary_type}
                onSaveSuccess={onClose}
              />
            </div>
          </TabsContent>

          </div>{/* fin contenido scrollable */}
        </Tabs>
        </DialogContent>
      </Dialog>

    {/* MODAL: Perfil de servicio */}
    <ServiceProfileModal
      serviceId={profileServiceId}
      onClose={() => setProfileServiceId(null)}
    />

    {/* MODAL: Perfil de ubicación asignada */}
    {locationObj && (
      <LocationProfileModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        location={locationObj}
      />
    )}

    {/* DIALOG: Organigrama / Mapa de jerarquía */}
    <Dialog open={showHierarchyMap} onOpenChange={setShowHierarchyMap}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Organigrama del negocio
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-hidden">
          {employees && employees.length > 0 ? (
            <HierarchyMapView
              employees={employees}
              focusEmployeeId={employee?.user_id ?? undefined}
              onEmployeeSelect={(emp) => {
                setShowHierarchyMap(false)
                setSupervisorEmployee(emp)
                setIsNestedProfileOpen(true)
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No hay datos de jerarquía disponibles
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* MODAL ANIDADO: Perfil del supervisor u otro empleado */}
    <EmployeeProfileModal
      employee={supervisorEmployee}
      isOpen={isNestedProfileOpen}
      onClose={() => {
        setIsNestedProfileOpen(false)
        setSupervisorEmployee(null)
      }}
      employees={employees}
    />

    {/* MODAL: Ocupación del empleado */}
    {showOccupancyModal && (
      <EmployeeOccupancyModal
        employeeId={employee.user_id}
        businessId={employee.business_id}
        employeeName={employee.full_name}
        currentOccupancyRate={employee.occupancy_rate ?? null}
        isOpen={showOccupancyModal}
        onClose={() => setShowOccupancyModal(false)}
      />
    )}

    {/* MODAL: Historial de citas completadas */}
    {showAppointmentsModal && (
      <EmployeeAppointmentsModal
        employeeId={employee.user_id}
        businessId={employee.business_id}
        employeeName={employee.full_name}
        initialCount={employee.completed_appointments}
        isOpen={showAppointmentsModal}
        onClose={() => setShowAppointmentsModal(false)}
      />
    )}

    {/* MODAL: Reseñas del empleado */}
    <Dialog open={showReviewsModal} onOpenChange={setShowReviewsModal}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Reseñas de {employee.full_name}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <ReviewList
            businessId={employee.business_id}
            employeeId={employee.user_id}
            canModerate
            canRespond
          />
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
