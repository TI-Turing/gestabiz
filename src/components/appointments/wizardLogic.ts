import type { ResourceModel } from '@/types/types'
import type { WizardData } from './wizard-types'

/**
 * Helpers puros del AppointmentWizard.
 *
 * El hook `useWizardState` los consume para decidir el orden de pasos
 * (`stepOrder`) y si el botón "Siguiente" puede activarse (`canProceed`).
 * Se aíslan aquí para poder testearlos sin levantar el hook entero ni mocks
 * de React Query.
 */

export type WizardAssigneeStep = 'employee' | 'resource' | 'resourceOrEmployee'

/** Decide qué paso debe usarse para elegir "quién/qué atiende la cita". */
export function computeAssigneeStepName(
  resourceModel: ResourceModel | null | undefined,
): WizardAssigneeStep {
  const model = resourceModel ?? 'professional'
  if (model === 'physical_resource' || model === 'group_class') return 'resource'
  if (model === 'hybrid') return 'resourceOrEmployee'
  return 'employee'
}

export interface BuildStepOrderParams {
  hasBusinessId: boolean
  resourceModel: ResourceModel | null | undefined
  isAdminBooking: boolean
  needsEmployeeBusinessSelection: boolean
}

/** Construye el array ordenado de pasos lógicos del wizard. */
export function buildWizardStepOrder(params: BuildStepOrderParams): string[] {
  const { hasBusinessId, resourceModel, isAdminBooking, needsEmployeeBusinessSelection } = params
  const assigneeStep = computeAssigneeStepName(resourceModel)

  const base: string[] = hasBusinessId
    ? ['location', 'service', assigneeStep, 'dateTime', 'confirmation', 'success']
    : ['business', 'location', 'service', assigneeStep, 'dateTime', 'confirmation', 'success']

  if (isAdminBooking) {
    const confIdx = base.indexOf('confirmation')
    base.splice(confIdx, 0, 'clientData')
  }

  // employeeBusiness sólo aplica cuando hay paso 'employee' y el empleado pertenece
  // a múltiples negocios. No se inserta en flujos resource/resourceOrEmployee.
  if (needsEmployeeBusinessSelection && assigneeStep === 'employee') {
    const idx = base.indexOf('employee')
    base.splice(idx + 1, 0, 'employeeBusiness')
  } else if (needsEmployeeBusinessSelection && assigneeStep === 'resourceOrEmployee') {
    // En hybrid: si el cliente eligió empleado y ese empleado trabaja en más
    // negocios, también necesita seleccionar el negocio del empleado.
    const idx = base.indexOf('resourceOrEmployee')
    base.splice(idx + 1, 0, 'employeeBusiness')
  }

  return base
}

export interface CanProceedParams {
  isEmployeeOfAnyBusiness: boolean
}

/** Devuelve true si el wizard puede avanzar desde el paso `step`. */
export function canProceedAtStep(
  step: string,
  data: WizardData,
  params: CanProceedParams,
): boolean {
  switch (step) {
    case 'business':
      return data.businessId !== null
    case 'location':
      return data.locationId !== null
    case 'service':
      return data.serviceId !== null
    case 'employee':
      return data.employeeId !== null && params.isEmployeeOfAnyBusiness
    case 'resource':
      return data.resourceId !== null
    case 'resourceOrEmployee':
      return data.resourceId !== null || data.employeeId !== null
    case 'employeeBusiness':
      return data.employeeBusinessId !== null
    case 'dateTime':
      return data.date !== null && data.startTime !== null
    case 'clientData':
      return !!(data.clientPhone && data.clientEmail && data.clientName)
    case 'confirmation':
      return true
    default:
      return false
  }
}
