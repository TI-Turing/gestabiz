import type { ResourceModel } from '@/types/types'

interface EmployeeServiceRow {
  employee_id: string
  service_id: string
}

interface ResourceServiceRow {
  resource_id: string
  service_id: string
}

export interface ComputeAllowedServiceIdsParams {
  /** Modelo del negocio. undefined = back-compat con 'professional'. */
  resourceModel: ResourceModel | null | undefined
  /** Si false (no hay sede seleccionada), devuelve null = mostrar todos. */
  hasLocationFilter: boolean
  /** Rows de employee_services en la sede (ya filtrados por is_active + business + location). */
  employeeServices: EmployeeServiceRow[]
  /** Empleados de la sede aprobados + activos. */
  activeEmployeeIds: Set<string>
  /** Rows de resource_services activos para los recursos de la sede. */
  resourceServices: ResourceServiceRow[]
  /** Recursos físicos activos en la sede. */
  activeResourceIds: Set<string>
  /** Universo de servicios a filtrar (sin filtrar aún). Sólo se usa para casos edge en futuro. */
  allServiceIds: string[]
}

/**
 * Decide qué service_ids son elegibles para reservar según el modelo del negocio.
 *
 * Devuelve:
 * - `null` cuando no hay filtro de sede aplicado (la UI muestra todos los servicios).
 * - `Set<string>` con los IDs permitidos cuando hay sede.
 */
export function computeAllowedServiceIds(
  params: ComputeAllowedServiceIdsParams,
): Set<string> | null {
  const {
    resourceModel,
    hasLocationFilter,
    employeeServices,
    activeEmployeeIds,
    resourceServices,
    activeResourceIds,
  } = params

  if (!hasLocationFilter) return null

  const fromEmployees = new Set<string>(
    employeeServices
      .filter((row) => activeEmployeeIds.has(row.employee_id))
      .map((row) => row.service_id),
  )

  const fromResources = new Set<string>(
    resourceServices
      .filter((row) => activeResourceIds.has(row.resource_id))
      .map((row) => row.service_id),
  )

  const model = resourceModel ?? 'professional'

  if (model === 'physical_resource' || model === 'group_class') {
    return fromResources
  }

  if (model === 'hybrid') {
    return new Set<string>([...fromEmployees, ...fromResources])
  }

  // professional (default + back-compat)
  return fromEmployees
}
