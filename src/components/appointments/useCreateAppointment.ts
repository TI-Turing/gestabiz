/**
 * Hook para crear o actualizar una cita desde el AppointmentWizard.
 * Separa la lógica de persistencia del componente raíz.
 */
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '@/contexts/LanguageContext'
import { logger } from '@/lib/logger'
import supabase from '@/lib/supabase'
import type { WizardData } from './wizard-types'
import type { Appointment } from '@/types/types'

interface UseCreateAppointmentParams {
  wizardData: WizardData
  businessId?: string
  userId?: string
  appointmentToEdit?: Appointment | null
  onSuccess?: () => void
  setIsSubmitting: (v: boolean) => void
  createAppointmentWithNotifications: (data: Record<string, unknown>) => Promise<unknown>
  analytics: {
    trackBookingCompleted: (p: {
      businessId: string; businessName?: string; serviceId: string; serviceName?: string
      employeeId?: string; employeeName?: string; locationId?: string
      amount?: number; currency: string; duration: number
    }) => void
  }
  isAdminBooking?: boolean
}

/** Colombia UTC offset (hours to add when converting local → UTC) */
const COLOMBIA_UTC_OFFSET = 5

function parseTimeToUTC(date: Date, timeStr: string): Date {
  const timeRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i
  const timeMatch = timeStr.match(timeRegex)
  if (!timeMatch) throw new Error(`Formato de hora inválido: ${timeStr}`)

  const [, hourStr, minuteStr, meridiem] = timeMatch
  let hourNum = Number.parseInt(hourStr, 10)
  const minuteNum = Number.parseInt(minuteStr, 10)

  if (meridiem.toUpperCase() === 'PM' && hourNum !== 12) hourNum += 12
  else if (meridiem.toUpperCase() === 'AM' && hourNum === 12) hourNum = 0

  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hourNum + COLOMBIA_UTC_OFFSET,
      minuteNum,
      0,
    ),
  )
}

export function useCreateAppointment({
  wizardData,
  businessId,
  userId,
  appointmentToEdit,
  onSuccess,
  setIsSubmitting,
  createAppointmentWithNotifications,
  analytics,
  isAdminBooking,
}: UseCreateAppointmentParams) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const createAppointment = async (): Promise<boolean> => {
    if (!wizardData.businessId || !wizardData.serviceId || !wizardData.date || !wizardData.startTime) {
      toast.error(t('appointments.wizard_errors.missingRequiredData'))
      return false
    }
    if (!userId && !isAdminBooking) {
      toast.error(t('appointments.wizard_errors.mustLogin'))
      return false
    }

    setIsSubmitting(true)
    try {
      const utcTime = parseTimeToUTC(wizardData.date, wizardData.startTime)
      logger.debug('[WIZARD] Hora calculada', { selectedTime: wizardData.startTime, resultISO: utcTime.toISOString() })

      const duration = wizardData.service?.duration || 60
      const endDateTime = new Date(utcTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + duration)

      const finalBusinessId = wizardData.employeeBusinessId || wizardData.businessId

      // Determine client_id and guest_client_info for admin bookings
      const clientId = isAdminBooking
        ? (wizardData.clientProfileId || null)
        : userId
      const guestClientInfo = (isAdminBooking && !wizardData.clientProfileId)
        ? {
            name: wizardData.clientName,
            phone: `${wizardData.clientPhonePrefix || '+57'}${wizardData.clientPhone}`,
            email: wizardData.clientEmail,
          }
        : null

      const appointmentData = {
        client_id: clientId,
        business_id: finalBusinessId,
        service_id: wizardData.serviceId,
        location_id: wizardData.locationId,
        employee_id: wizardData.employeeId || null,
        resource_id: wizardData.resourceId || null,
        start_time: utcTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending' as const,
        notes: wizardData.notes || null,
        price: wizardData.service?.price ?? null,
        ...(guestClientInfo ? { guest_client_info: guestClientInfo } : {}),
      }

      if (appointmentToEdit) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointmentToEdit.id)

        if (error) {
          toast.error(`${t('appointments.wizard_errors.errorModifying')}: ${error.message}`)
          return false
        }
        toast.success(t('appointments.wizard_success.modified'))
      } else {
        logger.debug('[WIZARD] Creando cita con notificaciones automáticas')
        await createAppointmentWithNotifications(
          appointmentData as unknown as Record<string, unknown>,
        )

        analytics.trackBookingCompleted({
          businessId: finalBusinessId || '',
          businessName: wizardData.business?.name || wizardData.employeeBusiness?.name,
          serviceId: wizardData.serviceId || '',
          serviceName: wizardData.service?.name,
          employeeId: wizardData.employeeId || undefined,
          employeeName: wizardData.employee?.full_name || undefined,
          locationId: wizardData.locationId || undefined,
          amount: wizardData.service?.price,
          currency: 'COP',
          duration: wizardData.service?.duration || 60,
        })

        toast.success(t('appointments.wizard_success.created'))
      }

      // Invalidar cache de disponibilidad del wizard para que nuevas consultas
      // reflejen la cita recién creada/modificada
      queryClient.invalidateQueries({ queryKey: ['wizard-datetime-day'] })
      queryClient.invalidateQueries({ queryKey: ['wizard-datetime-month'] })
      // También invalidar las queries de calendario para que reflejen el cambio
      queryClient.invalidateQueries({ queryKey: ['appointments'] })

      onSuccess?.()
      return true
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Error inesperado'
      let userMessage = rawMessage
      if (rawMessage.toLowerCase().includes('conflicting appointment')) {
        userMessage = 'El empleado ya tiene una cita en ese horario. Por favor selecciona otro horario.'
      } else if (rawMessage.toLowerCase().includes('check constraint')) {
        userMessage = 'Datos de la cita inválidos. Verifica los campos e intenta de nuevo.'
      }
      const errorKey = appointmentToEdit ? 'errorModifying' : 'errorCreating'
      toast.error(`${t('appointments.wizard_errors.' + errorKey)}: ${userMessage}`, { duration: 6000 })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { createAppointment }
}
