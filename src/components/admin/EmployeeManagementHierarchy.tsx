/**
 * @file EmployeeManagementHierarchy.tsx
 * @description Componente principal para gestión de jerarquía de empleados
 * Vista dual: Lista y Mapa organizacional con filtros avanzados
 * Phase 3 - UI Components
 */

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, List, Network, Filter, AlertTriangle, Check, X, Loader2, Star } from 'lucide-react'
import { useBusinessHierarchy } from '@/hooks/useBusinessHierarchy'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiltersPanel } from './FiltersPanel'
import { EmployeeListView } from './EmployeeListView'
import { HierarchyMapView } from './HierarchyMapView'
import { EmployeeProfileModal } from './EmployeeProfileModal'
import { JoinRequestsCard } from './JoinRequestsManager'
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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchyFromTypes | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
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
            <h1 className="text-3xl font-bold tracking-tight">
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
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Own</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[1]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Adm</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[2]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Mgr</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[3]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Lead</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg">{stats.byLevel[4]}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Staff</div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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

      {/* JOIN REQUESTS - empleados que quieren unirse */}
      <JoinRequestsCard businessId={businessId} />

      {/* PENDING SETUP ALERT - empleados sin jefe asignado */}
      {pendingSetup.length > 0 && (
        <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
              {pendingSetup.length} empleado{pendingSetup.length > 1 ? 's' : ''} pendiente{pendingSetup.length > 1 ? 's' : ''} de configuración
            </h3>
            <Badge variant="outline" className="ml-auto border-amber-400 text-amber-700 text-xs dark:text-amber-300">
              Sin jefe directo
            </Badge>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
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
                    className="shrink-0 text-xs h-8 border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-300"
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

      {/* EMPLOYEE PROFILE MODAL */}
      <EmployeeProfileModal
        employee={selectedEmployee}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        employees={employees}
      />
    </div>
  )
}

export default EmployeeManagementHierarchy
