/**
 * @file EmployeeListView.tsx
 * @description Vista de lista/tabla de empleados con ordenamiento y expansión
 * Phase 3 - UI Components
 */

import { useEffect, useState } from 'react'
import { ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmployeeCard } from './EmployeeCard'
import { supabase } from '@/lib/supabase'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeListViewProps {
  employees: EmployeeHierarchy[]
  businessId: string
  onEmployeeSelect?: (employee: EmployeeHierarchy) => void
  onEdit?: (employee: EmployeeHierarchy) => void
  onViewProfile?: (employee: EmployeeHierarchy) => void
  onAssignSupervisor?: (employee: EmployeeHierarchy) => void
}

type SortField = 'name' | 'level' | 'occupancy' | 'rating' | 'revenue'
type SortDirection = 'asc' | 'desc'

interface WorkScheduleEmployeeRow {
  employee_id: string
}

interface EmployeeServiceRow {
  employee_id: string
}

// =====================================================
// COMPONENTE
// =====================================================

export function EmployeeListView({
  employees,
  businessId,
  onEmployeeSelect,
  onEdit,
  onViewProfile,
  onAssignSupervisor,
}: EmployeeListViewProps) {
  const [sortField, setSortField] = useState<SortField>('level')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())
  const [employeesWithSchedule, setEmployeesWithSchedule] = useState<Set<string>>(new Set())
  const [employeesWithServices, setEmployeesWithServices] = useState<Set<string>>(new Set())

  const getEmployeeId = (employee: EmployeeHierarchy): string | undefined =>
    employee.user_id ?? employee.employee_id

  useEffect(() => {
    const loadEmployeeConfiguration = async () => {
      const employeeIds = employees
        .map((employee) => getEmployeeId(employee))
        .filter((id): id is string => !!id)

      if (employeeIds.length === 0) {
        setEmployeesWithSchedule(new Set())
        setEmployeesWithServices(new Set())
        return
      }

      const [scheduleResponse, servicesResponse] = await Promise.all([
        supabase
          .from('work_schedules')
          .select('employee_id')
          .in('employee_id', employeeIds)
          .eq('is_working', true),
        supabase
          .from('employee_services')
          .select('employee_id')
          .in('employee_id', employeeIds)
          .eq('business_id', businessId),
      ])

      const scheduleRows = (scheduleResponse.data as WorkScheduleEmployeeRow[] | null) ?? []
      const serviceRows = (servicesResponse.data as EmployeeServiceRow[] | null) ?? []

      setEmployeesWithSchedule(new Set(scheduleRows.map((row) => row.employee_id)))
      setEmployeesWithServices(new Set(serviceRows.map((row) => row.employee_id)))
    }

    loadEmployeeConfiguration()
  }, [employees, businessId])

  // =====================================================
  // SORTING
  // =====================================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'name':
        comparison = a.full_name.localeCompare(b.full_name)
        break
      case 'level':
        comparison = a.hierarchy_level - b.hierarchy_level
        break
      case 'occupancy':
        comparison = (a.occupancy_rate ?? 0) - (b.occupancy_rate ?? 0)
        break
      case 'rating':
        comparison = (a.average_rating || 0) - (b.average_rating || 0)
        break
      case 'revenue':
        comparison = (a.gross_revenue ?? 0) - (b.gross_revenue ?? 0)
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // =====================================================
  // EXPANSION
  // =====================================================

  const toggleExpand = (userId?: string) => {
    if (!userId) return
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const getSubordinates = (userId: string): EmployeeHierarchy[] => {
    return employees.filter(emp => emp.reports_to === userId)
  }

  // =====================================================
  // RENDER SORT BUTTON
  // =====================================================

  const renderSortButton = (field: SortField, label: string) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="gap-1 h-8"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  )

  // =====================================================
  // RENDER EMPLOYEE ROW
  // =====================================================

  const renderEmployeeRow = (employee: EmployeeHierarchy, depth = 0) => {
    const employeeId = getEmployeeId(employee)

    if (!employeeId) {
      return null
    }

    const subordinates = getSubordinates(employeeId)
    const isExpanded = expandedEmployees.has(employeeId)
    const hasSubordinates = subordinates.length > 0
    const missingConfigItems: string[] = []

    const locationId = employee.location_id
    const employeeType = (employee.employee_type ?? '').toLowerCase()
    const skipLocationRequirement = ['manager', 'owner', 'location_manager'].includes(employeeType)

    if (!skipLocationRequirement && !locationId) {
      missingConfigItems.push('Sin sede')
    }

    if (!employeesWithSchedule.has(employeeId)) {
      missingConfigItems.push('Sin horario')
    }

    const servicesFromHierarchy = employee.services_offered ?? []
    const hasServicesInHierarchy = servicesFromHierarchy.length > 0
    const hasServicesInTable = employeesWithServices.has(employeeId)
    if (!hasServicesInHierarchy && !hasServicesInTable) {
      missingConfigItems.push('Sin servicios')
    }

    return (
      <div key={employeeId}>
        {/* MAIN ROW */}
        <div
          className="relative"
          style={{ paddingLeft: `${depth * 2}rem` }}
        >
          {/* EXPAND TOGGLE */}
          {hasSubordinates && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpand(employeeId)}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              style={{ left: `${depth * 2}rem` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* EMPLOYEE CARD */}
          <button
            type="button"
            className={`${hasSubordinates ? 'pl-8' : ''} w-full bg-transparent text-left border-0 outline-none`}
            onClick={() => onEmployeeSelect?.(employee)}
          >
            <EmployeeCard
              employee={employee}
              businessId={businessId}
              onEdit={onEdit}
              onViewProfile={onViewProfile}
              onAssignSupervisor={onAssignSupervisor}
              missingConfigItems={missingConfigItems}
            />
          </button>
        </div>

        {/* SUBORDINATES (Recursive) */}
        {isExpanded && hasSubordinates && (
          <div className="mt-2 space-y-2">
            {subordinates.map(sub => renderEmployeeRow(sub, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  // Filtrar solo empleados de nivel top (sin supervisor o supervisor no en la lista)
  const topLevelEmployees = sortedEmployees.filter(emp => {
    const reportsTo = emp.reports_to
    if (!reportsTo) return true

    return !employees.some(e => getEmployeeId(e) === reportsTo)
  })

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="min-w-max space-y-4">
        {/* SORT CONTROLS */}
        <div className="overflow-x-auto pb-3 border-b">
          <div className="flex min-w-max items-center gap-1 whitespace-nowrap">
            {renderSortButton('name', 'Nombre')}
            {renderSortButton('level', 'Nivel')}
            {renderSortButton('occupancy', 'Ocupación')}
            {renderSortButton('rating', 'Rating')}
            {renderSortButton('revenue', 'Revenue')}
          </div>
        </div>

        {/* EMPLOYEES LIST */}
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay empleados para mostrar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topLevelEmployees.map(employee => renderEmployeeRow(employee))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeListView
