/**
 * @file EmployeeProfileModal.tsx
 * @description Modal que muestra el perfil detallado de un empleado
 * Información: contacto, horarios, servicios, ubicaciones, estadísticas
 * Tabs: Información (lectura) y Nómina (configuración de salario)
 * Not finished.
 */

import { useEffect, useState } from 'react'
import * as Sentry from '@sentry/react'
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
import { EmployeeRevenueModal } from '@/components/admin/EmployeeRevenueModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'
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

// Labels of hierarchy, expertise, schedule days and absence types are
// built inside the component using the i18n t() function.

const HIERARCHY_COLORS = {
  0: 'bg-purple-100 text-purple-800',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-gray-100 text-gray-800',
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
  const { t } = useLanguage()
  // Estado para organigrama y perfil del supervisor
  const [showHierarchyMap, setShowHierarchyMap] = useState(false)
  const [supervisorEmployee, setSupervisorEmployee] = useState<EmployeeHierarchy | null>(null)
  const [isNestedProfileOpen, setIsNestedProfileOpen] = useState(false)
  // Estado para edición inline del jefe directo
  const [editingSupervisor, setEditingSupervisor] = useState(false)
  const [supervisorSelectValue, setSupervisorSelectValue] = useState('')
  const [savingSupervisor, setSavingSupervisor] = useState(false)
  // Estado para modal de ocupación
  const [showOccupancyModal, setShowOccupancyModal]       = useState(false)
  // Estado para modal de historial de citas
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)
  // Estado para modal de ingresos
  const [showRevenueModal, setShowRevenueModal]           = useState(false)

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

  // Sede asignada — query directa para datos frescos (independiente del RPC)
  const { data: locationData } = useQuery({
    queryKey: ['employee-modal-location', employee?.user_id, employee?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_employees')
        .select('location_id, locations(id, name)')
        .eq('employee_id', employee!.user_id)
        .eq('business_id', employee!.business_id)
        .maybeSingle()
      if (!data?.location_id) return null
      const loc = data.locations as { id: string; name: string } | null
      return loc ? { id: data.location_id as string, name: loc.name } : null
    },
    enabled: !!employee?.user_id && !!employee?.business_id,
  })

  // Servicios asignados — query directa para datos frescos (independiente del RPC)
  const { data: servicesData = [] } = useQuery({
    queryKey: ['employee-modal-services', employee?.user_id, employee?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('employee_services')
        .select('service_id, expertise_level, commission_percentage, services(id, name)')
        .eq('employee_id', employee!.user_id)
        .eq('business_id', employee!.business_id)
        .eq('is_active', true)
      if (!data) return []
      return data.map(es => ({
        service_id: es.service_id,
        service_name: (es.services as { id: string; name: string } | null)?.name ?? '',
        expertise_level: es.expertise_level ?? 'beginner',
        commission_percentage: es.commission_percentage ?? 0,
      }))
    },
    enabled: !!employee?.user_id && !!employee?.business_id,
  })

  const { planId, isLoading: planLoading } = usePlanFeatures(employee?.business_id ?? null)
  const isPayrollAvailable = !planLoading && planId === 'pro'

  useEffect(() => {
    if (!isPayrollAvailable && activeTab === 'payroll') {
      setActiveTab('info')
    }
  }, [activeTab, isPayrollAvailable])

  if (!employee) return null

  // Datos frescos de sede y servicios (fallback al prop si las queries aún no han resuelto)
  const resolvedLocationId = locationData?.id ?? employee.location_id
  const resolvedLocationName = locationData?.name ?? employee.location_name
  const resolvedServices = servicesData.length > 0 ? servicesData : (employee.services_offered ?? [])

  // Objeto Location mínimo para LocationProfileModal
  const locationObj = resolvedLocationId ? {
    id: resolvedLocationId,
    business_id: employee.business_id,
    name: resolvedLocationName ?? '',
    is_active: true,
    created_at: '',
    updated_at: '',
  } : null

  // Clase reutilizable para cards clickeables
  const clickable = 'cursor-pointer hover:bg-accent/40 transition-colors rounded-lg'

  const hierarchyLevel = employee.hierarchy_level ?? 4
  const hierarchyLabel = t(`employeeProfile.modal.hierarchy.${hierarchyLevel}`) || t('employeeProfile.modal.hierarchy.unknown')
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
      const { data: updatedRows, error } = await supabase
        .from('business_employees')
        .update({ job_title: cargoValue.trim() || null })
        .eq('employee_id', employee.user_id)
        .eq('business_id', employee.business_id)
        .select('employee_id, business_id, job_title')
      if (error) throw error
      // Si no se actualizó ninguna fila, avisar en consola para diagnóstico
      if (!updatedRows || updatedRows.length === 0) {
      }
      toast.success(t('employeeProfile.modal.cargo.updated'))
      await queryClient.invalidateQueries({ queryKey: ['employee-modal-detail', employee.user_id, employee.business_id] })
      await queryClient.invalidateQueries({ queryKey: ['businessHierarchy', employee.business_id] })
      setEditingCargo(false)
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'EmployeeProfileModal' } })
      toast.error(t('employeeProfile.modal.cargo.updateError'))
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
        if (!result.success) throw new Error(result.error ?? t('employeeProfile.modal.supervisor.unknownError'))
      toast.success(t('employeeProfile.modal.supervisor.updated'))
      await queryClient.invalidateQueries({ queryKey: ['businessHierarchy', employee.business_id] })
      await queryClient.invalidateQueries({ queryKey: ['pending-setup-employees', employee.business_id] })
      await queryClient.invalidateQueries({ queryKey: ['employee-modal-detail', employee.user_id, employee.business_id] })
      setEditingSupervisor(false)
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'EmployeeProfileModal' } })
      toast.error(err instanceof Error ? err.message : t('employeeProfile.modal.supervisor.updateError'))
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
      {employee.supervisor_name ?? t('employeeProfile.modal.supervisor.unassigned')}
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
            <TabsList className={`grid w-full ${isPayrollAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="info">{t('employeeProfile.modal.tabs.info')}</TabsTrigger>
              {isPayrollAvailable && (
                <TabsTrigger value="payroll">{t('employeeProfile.modal.tabs.payroll')}</TabsTrigger>
              )}
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
                  <h3 className="font-semibold text-sm">{t('employeeProfile.modal.cargo.title')}</h3>
                  {!editingCargo && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
                      title={t('employeeProfile.modal.cargo.editTitle')}
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
                      placeholder={t('employeeProfile.modal.cargo.placeholder')}
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
                    {currentJobTitle || <span className="text-muted-foreground italic">{t('employeeProfile.modal.cargo.noAssigned')}</span>}
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
                    {t('employeeProfile.modal.cargo.viewOrgChart')}
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
                <span className="text-sm text-muted-foreground shrink-0">{t('employeeProfile.modal.supervisor.label')}</span>

                {editingSupervisor ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Select
                      value={supervisorSelectValue}
                      onValueChange={setSupervisorSelectValue}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                        <SelectValue placeholder={t('employeeProfile.modal.supervisor.selectPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs text-muted-foreground">
                          {t('employeeProfile.modal.supervisor.none')}
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
                        title={t('employeeProfile.modal.supervisor.changeTitle')}
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
              {t('employeeProfile.modal.contact.title')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.contact.email')}</p>
                  <p className="text-sm font-medium">{employee.email || t('employeeProfile.modal.contact.notSpecified')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.contact.phone')}</p>
                  <p className="text-sm font-medium">{employee.phone ?? t('employeeProfile.modal.contact.notSpecified')}</p>
                </div>
              </div>
              {profileData?.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.contact.linkedin')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.contact.portfolio')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.contact.experience')}</p>
                    <p className="text-sm font-medium">{profileData.years_of_experience} {profileData.years_of_experience === 1 ? t('employeeProfile.modal.contact.yearSingular') : t('employeeProfile.modal.contact.yearPlural')}</p>
                  </div>
                </div>
              )}
              {profileData?.specializations && profileData.specializations.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('employeeProfile.modal.contact.specializations')}</p>
                  <div className="flex flex-wrap gap-1">
                    {profileData.specializations.map((s) => (
                      <span key={s} className="text-xs bg-accent px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {profileData?.professional_summary && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('employeeProfile.modal.contact.summary')}</p>
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
              {t('employeeProfile.modal.work.title')}
              </h3>
              <div className="space-y-3">
                {employee.hired_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.work.hireDate')}</p>
                      <p className="text-sm font-medium">
                        {new Date(employee.hired_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
                {employee.role && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.work.role')}</p>
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
              {t('employeeProfile.modal.schedule.title')}
            </h3>
            <div className="space-y-1">
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((key) => {
                const isWeekend = key === 'saturday' || key === 'sunday'
                return (
                  <div
                    key={key}
                    className={`grid grid-cols-[48px_1fr_1fr] items-center gap-2 px-2 py-1.5 rounded text-sm ${isWeekend ? 'opacity-50' : ''}`}
                  >
                    <span className={`font-medium text-xs ${isWeekend ? 'text-muted-foreground' : 'text-foreground'}`}>{t(`employeeProfile.modal.days.${key}`)}</span>
                    <span className="text-muted-foreground text-xs">
                      {isWeekend ? t('employeeProfile.modal.schedule.nonWorkDay') : t('employeeProfile.modal.schedule.notConfigured')}
                    </span>
                    <span />
                  </div>
                )
              })}
            </div>
            {empData?.has_lunch_break && (empData.lunch_break_start || empData.lunch_break_end) && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs">{t('employeeProfile.modal.schedule.lunchBreak')}</span>
                <span className="text-sm font-medium">
                  {empData.lunch_break_start ?? '—'} – {empData.lunch_break_end ?? '—'}
                </span>
              </div>
            )}
            {empData && !empData.has_lunch_break && (
              <p className="mt-3 pt-3 border-t text-xs text-muted-foreground">{t('employeeProfile.modal.schedule.noLunchBreak')}</p>
            )}
          </Card>

          {/* UBICACIONES — abre LocationProfileModal */}
          <Card
            className={resolvedLocationName ? `p-4 ${clickable}` : 'p-4'}
            onClick={resolvedLocationName ? () => setShowLocationModal(true) : undefined}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('employeeProfile.modal.location.title')}
              </h3>
              {resolvedLocationName && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
            {resolvedLocationName ? (
              <div className="flex items-start gap-3 p-2 rounded mt-4">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm font-medium">{resolvedLocationName}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">Sin sede asignada</p>
            )}
          </Card>

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
                    <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.stats.rating')}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{(employee.average_rating || 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{employee.total_reviews || 0} {t('employeeProfile.modal.stats.reviews')}</p>
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
                        <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.stats.occupancy')}</p>
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
                        {t('employeeProfile.modal.stats.occupancyDetail')}
                      </p>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t('employeeProfile.modal.stats.occupancyTooltip')}
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
                        <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.stats.completedAppointments')}</p>
                        <Info className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-2xl font-bold">{employee.completed_appointments || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('employeeProfile.modal.stats.completedDetail')}
                      </p>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t('employeeProfile.modal.stats.completedTooltip')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Ingresos */}
            {employee.gross_revenue !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className="p-4 cursor-pointer hover:ring-2 hover:ring-emerald-500/40 transition-all group"
                      onClick={() => setShowRevenueModal(true)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <p className="text-xs text-muted-foreground">{t('employeeProfile.modal.stats.totalRevenue')}</p>
                        <Info className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-lg font-bold truncate">
                        ${(employee.gross_revenue || 0).toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('employeeProfile.modal.stats.revenueDetail')}
                      </p>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t('employeeProfile.modal.stats.revenueTooltip')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* SERVICIOS — cada fila abre ServiceProfileModal */}
          <Card className="p-4">
            <h3 className="font-semibold mb-1">{t('employeeProfile.modal.services.title')}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t('employeeProfile.modal.services.subtitle')}</p>
            {resolvedServices.length > 0 ? (
              <div className="space-y-2">
                {resolvedServices.slice(0, 5).map((service) => (
                  <button
                    key={service.service_id}
                    type="button"
                    className={`w-full flex items-center justify-between p-2 rounded gap-2 ${clickable}`}
                    onClick={() => setProfileServiceId(service.service_id)}
                  >
                    <span className="text-sm font-medium">{service.service_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {t(`employeeProfile.modal.expertise.${service.expertise_level}`) || `${t('employeeProfile.modal.expertise.levelFallback')} ${service.expertise_level}`}
                      </Badge>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {resolvedServices.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{resolvedServices.length - 5} {t('employeeProfile.modal.services.more')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin servicios asignados</p>
            )}
          </Card>

          {/* AUSENCIAS Y VACACIONES APROBADAS */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Umbrella className="w-4 h-4" />
              {t('employeeProfile.modal.absences.title')}
              <span className="ml-auto text-xs text-muted-foreground font-normal">{t('employeeProfile.modal.absences.onlyApproved')}</span>
            </h3>
            {loadingAbsences && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingAbsences && approvedAbsences.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">{t('employeeProfile.modal.absences.empty')}</p>
            )}
            {!loadingAbsences && approvedAbsences.length > 0 && (
              <div className="space-y-2">
                {approvedAbsences.map((absence) => {
                  const start = parseISO(absence.start_date)
                  const end = parseISO(absence.end_date)
                  const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1
                  const colorClass = ABSENCE_TYPE_COLORS[absence.absence_type] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                  const label = t(`employeeProfile.modal.absenceTypes.${absence.absence_type}`) || absence.absence_type
                  return (
                    <div key={absence.id} className="flex items-start gap-3 p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>{label}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{days} {days === 1 ? t('employeeProfile.modal.absences.daySingular') : t('employeeProfile.modal.absences.dayPlural')}</span>
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
              {t('employeeProfile.modal.close')}
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
              {t('employeeProfile.modal.orgChart.title')}
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
              {t('employeeProfile.modal.orgChart.noData')}
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

    {/* MODAL: Desglose de ingresos */}
    {showRevenueModal && (
      <EmployeeRevenueModal
        employeeId={employee.user_id}
        businessId={employee.business_id}
        employeeName={employee.full_name}
        currentRevenue={employee.gross_revenue ?? null}
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
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
              {t('employeeProfile.modal.reviews.title', { name: employee.full_name })}
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
