/**
 * @file EmployeeManagementHierarchy.tsx
 * @description Componente principal para gestión de jerarquía de empleados
 * Vista dual: Lista y Mapa organizacional con filtros avanzados
 * Phase 3 - UI Components
 */

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, List, Network, Filter, AlertTriangle, Check, X, Loader2, Star, QrCode, Copy } from 'lucide-react'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'
import { PlanLimitBanner } from '@/components/ui/PlanLimitBanner'
import { useBusinessHierarchy } from '@/hooks/useBusinessHierarchy'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FiltersPanel } from './FiltersPanel'
import { EmployeeListView } from './EmployeeListView'
import { HierarchyMapView } from './HierarchyMapView'
import { EmployeeProfileModal } from './EmployeeProfileModal'
import { JoinRequestsCard } from './JoinRequestsManager'
import { useGenerateInviteCode, useActiveInviteCodes } from '@/hooks/useEmployeeJoinRequests'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import type { EmployeeHierarchy as EmployeeHierarchyFromTypes } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeManagementHierarchyProps {
  businessId: string
  onEmployeeSelect?: (employee: EmployeeHierarchyFromTypes) => void
}

type ViewMode = 'list' | 'map'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function EmployeeManagementHierarchy({
  businessId,
  onEmployeeSelect,
}: Readonly<EmployeeManagementHierarchyProps>) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { quotaInfo, upgradePlan } = usePlanFeatures(businessId)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchyFromTypes | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [showJoinRequests, setShowJoinRequests] = useState(false) // Oculto por defecto
  const [includeNoSede, setIncludeNoSede] = useState(false)

  // Hook de sede preferida
  const { preferredLocationId } = usePreferredLocation(businessId)

  // Hook principal de jerarquía
  const {
    data: rawEmployees,
    rawData: allEmployeesUnfiltered,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    assignSupervisorAsync,
    isAssigning,
  } = useBusinessHierarchy(businessId)
  const employees = rawEmployees as unknown as EmployeeHierarchyFromTypes[]
  // Lista sin filtro de sede para el combobox de supervisores (un supervisor puede estar en cualquier sede)
  const allEmployees = (allEmployeesUnfiltered ?? []) as unknown as EmployeeHierarchyFromTypes[]

  // Estado para asignación inline en la sección de pendientes
  const [assigningFor, setAssigningFor] = useState<string | null>(null)
  const [pendingSupervisorId, setPendingSupervisorId] = useState('')
  const queryClient = useQueryClient()

  // Hooks de invitación de empleados
  const { data: activeCodes = [] } = useActiveInviteCodes(businessId)
  const generateCode = useGenerateInviteCode(businessId)

  // Query: empleados sin configuración completa (sin supervisor y sin rol elevado)
  const { data: pendingSetup = [] } = useQuery({
    queryKey: ['pending-setup-employees', businessId],
    queryFn: async () => {
      // 1. Todos los empleados activos del negocio
      const { data: allBE } = await supabase
        .from('business_employees')
        .select('employee_id, role')
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (!allBE || allBE.length === 0) return []

      // 2. Excluir managers y owners (ya configurados por rol)
      const regularIds = allBE
        .filter(e => !['manager', 'owner'].includes(e.role || ''))
        .map(e => e.employee_id)
        .filter((id): id is string => !!id)

      if (regularIds.length === 0) return []

      // 3. Excluir quienes ya tienen supervisor asignado
      const { data: withSupervisor } = await supabase
        .from('business_roles')
        .select('user_id')
        .eq('business_id', businessId)
        .not('reports_to', 'is', null)
        .in('user_id', regularIds)

      const supervisedSet = new Set(withSupervisor?.map(r => r.user_id) || [])

      // 4. Excluir quienes tienen setup_completed = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: completedBE } = (await (supabase as any)
        .from('business_employees')
        .select('employee_id')
        .eq('business_id', businessId)
        .eq('setup_completed', true)
        .in('employee_id', regularIds)) as unknown as { data: { employee_id: string }[] | null }

      const completedSet = new Set(completedBE?.map(e => e.employee_id) || [])

      const trulyPendingIds = regularIds.filter(
        id => !supervisedSet.has(id) && !completedSet.has(id)
      )

      if (trulyPendingIds.length === 0) return []

      // 5. Obtener perfiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', trulyPendingIds)

      return (
        profiles?.map(p => ({
          employee_id: p.id,
          full_name: p.full_name ?? p.email,
          email: p.email,
          avatar_url: p.avatar_url,
        })) ?? []
      )
    },
    enabled: !!businessId,
    staleTime: 30_000,
  })

  // Handler: asignar supervisor y marcar como configurado
  const handlePendingAssign = async (employeeId: string) => {
    if (!pendingSupervisorId) return
    try {
      await assignSupervisorAsync({
        employeeId,
        businessId,
        newSupervisorId: pendingSupervisorId,
      })
      await queryClient.invalidateQueries({ queryKey: ['pending-setup-employees', businessId] })
      setAssigningFor(null)
      setPendingSupervisorId('')
      toast.success(t('employees.actions.assignSuccess'))
    } catch {
      toast.error(t('employees.actions.assignError'))
    }
  }
  
  // Pre-seleccionar sede preferida al montar el componente
  useEffect(() => {
    if (preferredLocationId && !filters.location_id) {
      updateFilters({ location_id: preferredLocationId })
    }
  }, [preferredLocationId, filters.location_id, updateFilters])

  // =====================================================
  // ESTADÍSTICAS HEADER
  // =====================================================

  const stats = {
    total: employees.length,
    byLevel: {
      0: employees.filter(e => e.hierarchy_level === 0).length, // Owner
      1: employees.filter(e => e.hierarchy_level === 1).length, // Admin
      2: employees.filter(e => e.hierarchy_level === 2).length, // Manager
      3: employees.filter(e => e.hierarchy_level === 3).length, // Lead
      4: employees.filter(e => e.hierarchy_level === 4).length, // Staff
    },
    avgOccupancy: employees.length > 0
      ? employees.reduce((acc, e) => acc + (e.occupancy_rate || 0), 0) / employees.length
      : 0,
    avgRating: employees.length > 0
      ? employees.reduce((acc, e) => acc + (e.average_rating || 0), 0) / employees.length
      : 0,
  }

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleEmployeeClick = (employee: EmployeeHierarchyFromTypes) => {
    setSelectedEmployee(employee)
    setIsProfileModalOpen(true)
    onEmployeeSelect?.(employee)
  }

  const toggleFilters = () => {
    setShowFilters(prev => !prev)
  }

  const handleClearFilters = () => {
    clearFilters()
    setIncludeNoSede(false)
    setShowFilters(false)
  }

  // =====================================================
  // LOADING & ERROR STATES
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <Users className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg">{t('common.error')}</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </Card>
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* HEADER CON ESTADÍSTICAS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('employees.management.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('employees.management.subtitle')}
            </p>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2 min-h-[44px]"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t('employees.management.listView')}</span>
              <span className="sm:hidden">Lista</span>
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="gap-2 min-h-[44px]"
            >
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">{t('employees.management.mapView')}</span>
              <span className="sm:hidden">Mapa</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInviteDialog(true)}
              className="gap-2 min-h-[44px]"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Invitar empleado</span>
              <span className="sm:hidden">Invitar</span>
            </Button>
            <Button
              variant={showJoinRequests ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowJoinRequests(!showJoinRequests)}
              className="gap-2 min-h-[44px]"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Solicitudes</span>
              <span className="sm:hidden">Solic.</span>
            </Button>
          </div>
        </div>

        {/* STATS CARDS - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('employees.management.totalEmployees')}
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {t('employees.management.byLevel')}
              </p>
              <div className="grid grid-cols-5 gap-0.5 sm:gap-1 text-xs">
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[0]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Prop.</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[1]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Admin</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[2]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Ger.</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[3]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Líder</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[4]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Pers.</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('employees.management.avgOccupancy')}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.avgOccupancy.toFixed(1)}%</p>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('employees.management.avgRating')}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1 flex items-center gap-1">{stats.avgRating.toFixed(1)}<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /></p>
            </div>
          </Card>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={toggleFilters}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('employees.management.filters')}
            {(filters.searchQuery || filters.hierarchyLevel !== undefined || filters.employeeType || filters.departmentId) && (
              <span className="ml-1 rounded-full bg-primary-foreground px-2 py-0.5 text-xs">
                {[filters.searchQuery, filters.hierarchyLevel, filters.employeeType, filters.departmentId].filter(Boolean).length}
              </span>
            )}
          </Button>

          {(filters.searchQuery || filters.hierarchyLevel !== undefined || filters.employeeType || filters.departmentId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              {t('employees.management.clearFilters')}
            </Button>
          )}

          {/* Toggle: incluir personal sin sede */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <Switch
              id="include-no-sede"
              checked={includeNoSede}
              onCheckedChange={(checked) => {
                setIncludeNoSede(checked)
                updateFilters({ includeNoSede: checked })
              }}
            />
            <Label htmlFor="include-no-sede" className="text-sm cursor-pointer select-none whitespace-nowrap">
              Incluir personal sin sede
            </Label>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {employees.length} {t('employees.management.employeesShown')}
        </div>
      </div>

      {/* FILTERS PANEL (Collapsible) */}
      {showFilters && (
        <Card className="p-4">
          <FiltersPanel
            businessId={businessId}
            filters={filters}
            onFiltersChange={updateFilters}
            onClear={handleClearFilters}
          />
        </Card>
      )}

      {/* PENDING SETUP ALERT - empleados sin jefe asignado */}
      {pendingSetup.length > 0 && (
        <Card className="p-4 border-amber-400 bg-amber-50 dark:border-amber-300/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
            <h3 className="font-semibold text-sm text-amber-950 dark:text-amber-200">
              {pendingSetup.length} empleado{pendingSetup.length > 1 ? 's' : ''} pendiente{pendingSetup.length > 1 ? 's' : ''} de configuración
            </h3>
            <Badge variant="outline" className="ml-auto border-amber-600 text-amber-900 text-xs dark:border-amber-400 dark:text-amber-300">
              Sin jefe directo
            </Badge>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-300 mb-3">
            Estos empleados no aparecerán disponibles para recibir citas hasta que se les asigne un jefe directo.
          </p>
          <div className="space-y-2">
            {pendingSetup.map(emp => (
              <div key={emp.employee_id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={emp.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {String(emp.full_name ?? '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{emp.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                </div>

                {assigningFor === emp.employee_id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={pendingSupervisorId} onValueChange={setPendingSupervisorId}>
                      <SelectTrigger className="w-44 h-8 text-xs">
                        <SelectValue placeholder="Seleccionar jefe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allEmployees
                          .filter(e => e.user_id !== emp.employee_id &&
                            e.hierarchy_level < (allEmployees.find(pe => pe.user_id === emp.employee_id)?.hierarchy_level ?? 999))
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
                      className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700"
                      onClick={() => handlePendingAssign(emp.employee_id)}
                      disabled={!pendingSupervisorId || isAssigning}
                    >
                      {isAssigning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => { setAssigningFor(null); setPendingSupervisorId('') }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs h-8 border-amber-600 text-amber-900 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-900/30"
                    onClick={() => { setAssigningFor(emp.employee_id); setPendingSupervisorId('') }}
                  >
                    Asignar jefe
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MAIN CONTENT - LIST OR MAP VIEW */}
      <div className="flex-1">
        {viewMode === 'list' ? (
          <Card className="p-6">
            <EmployeeListView
              employees={employees}
              businessId={businessId}
              onEmployeeSelect={handleEmployeeClick}
              onEdit={handleEmployeeClick}
              onViewProfile={handleEmployeeClick}
              onAssignSupervisor={handleEmployeeClick}
            />
          </Card>
        ) : (
          <Card className="p-6">
            <HierarchyMapView
              employees={employees}
              onEmployeeSelect={handleEmployeeClick}
            />
          </Card>
        )}
      </div>

      {/* Banner de límite de plan */}
      <PlanLimitBanner
        notShownCount={Math.max(0, employees.length - (quotaInfo('employees', employees.length).limit ?? employees.length))}
        resourceLabel="empleados"
        upgradePlanName={upgradePlan?.name}
        onUpgradeClick={() => navigate('/app/admin/billing')}
      />

      {/* EMPLOYEE PROFILE MODAL */}
      <EmployeeProfileModal
        employee={selectedEmployee}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        employees={employees}
      />

      {/* INVITE DIALOG */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Invitar empleado
            </DialogTitle>
            <DialogDescription>
              Genera un código de 6 dígitos para compartir con un empleado. El código caduca en 24 horas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Generate Code Button */}
            <Button
              onClick={async () => {
                try {
                  const code = await generateCode.mutateAsync()
                  setGeneratedCode(code)
                  toast.success('Código generado correctamente')
                } catch (error) {
                  toast.error('Error al generar el código')
                }
              }}
              disabled={generateCode.isPending}
              className="w-full gap-2"
            >
              <QrCode className="h-4 w-4" />
              {generateCode.isPending ? 'Generando...' : 'Generar código'}
            </Button>

            {/* Display Generated Code */}
            {generatedCode && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <p className="text-xs text-muted-foreground">Código de invitación:</p>
                <code className="block font-mono text-2xl font-bold tracking-widest text-center text-primary">
                  {generatedCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedCode)
                    toast.success('Código copiado al portapapeles')
                  }}
                  className="w-full gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar código
                </Button>
              </div>
            )}

            {/* Active Codes */}
            {activeCodes.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Códigos activos:</p>
                <div className="space-y-2">
                  {activeCodes.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 p-2 rounded bg-background/50 border border-border/50"
                    >
                      <code className="font-mono font-bold text-sm flex-1">
                        {c.invite_code}
                      </code>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {new Date(c.invite_code_expires_at!).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Badge>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(c.invite_code!)
                          toast.success('Código copiado')
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
              <p className="font-medium mb-1">Cómo usar:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Comparte el código con el empleado</li>
                <li>El empleado lo ingresa en su app como código de invitación</li>
                <li>Tú recibirás una solicitud para aprobar</li>
                <li>Una vez aprobado, el empleado se agrega a tu equipo</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* JOIN REQUESTS - empleados que quieren unirse (al final, oculto por defecto) */}
      {showJoinRequests && (
        <JoinRequestsCard businessId={businessId} />
      )}
    </div>
  )
}

export default EmployeeManagementHierarchy
