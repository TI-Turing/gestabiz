/**
 * Tipos compartidos del AppointmentWizard
 */
import type { Service, Location, Appointment } from '@/types/types'

export interface AppointmentWizardProps {
  open: boolean
  onClose: () => void
  businessId?: string
  preselectedServiceId?: string
  preselectedLocationId?: string
  preselectedEmployeeId?: string
  userId?: string
  onSuccess?: () => void
  preselectedDate?: Date
  preselectedTime?: string
  appointmentToEdit?: Appointment | null
}

export interface WizardBusiness {
  id: string
  name: string
  description?: string | null
  resource_model?: string | null
}

export interface WizardEmployee {
  id: string
  full_name: string | null
  email: string
  role: string
  avatar_url?: string | null
}

export interface WizardData {
  businessId: string | null
  business: WizardBusiness | null
  locationId: string | null
  location: Location | null
  serviceId: string | null
  service: Service | null
  employeeId: string | null
  employee: WizardEmployee | null
  employeeBusinessId: string | null
  employeeBusiness: WizardBusiness | null
  resourceId: string | null
  date: Date | null
  startTime: string | null
  endTime: string | null
  notes: string
}
