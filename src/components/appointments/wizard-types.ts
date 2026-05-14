/**
 * Tipos compartidos del AppointmentWizard
 */
import type { Service, Location, Appointment, ResourceModel, BusinessResource } from '@/types/types'

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
  onStartChat?: (conversationId: string) => void
  /** Admin booking mode: skips business step, adds clientData step */
  isAdminBooking?: boolean
  /** Pre-selected preferred location from admin settings */
  adminPreferredLocationId?: string
}

export interface WizardBusiness {
  id: string
  name: string
  description?: string | null
  resource_model?: ResourceModel | null
}

export interface WizardEmployee {
  id: string
  full_name: string | null
  email: string
  role: string
  avatar_url?: string | null
  expertise_level?: number
  setup_completed?: boolean
  supervisor_name?: string | null
  avg_rating?: number
  total_reviews?: number
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
  /** Recurso físico poblado — hidrata nombre/precio/imagen en confirmación. */
  resource: BusinessResource | null
  /**
   * Cantidad de personas para esta reserva. Default 1.
   * Relevante para resource_model === 'group_class' (clase grupal con
   * cupos compartidos contra business_resources.capacity).
   */
  participantsCount: number
  date: Date | null
  startTime: string | null
  endTime: string | null
  notes: string
  // Admin booking client data
  clientPhone?: string
  clientPhonePrefix?: string
  clientEmail?: string
  clientName?: string
  clientProfileId?: string | null
}
