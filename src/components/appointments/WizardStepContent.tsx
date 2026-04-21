/**
 * Enrutador de pasos del AppointmentWizard.
 * Renderiza el componente correcto según el paso actual.
 */
import React from 'react'
import {
  BusinessSelection,
  LocationSelection,
  ServiceSelection,
  EmployeeSelection,
  EmployeeBusinessSelection,
  DateTimeSelection,
  ClientDataStep,
  ConfirmationStep,
  SuccessStep,
} from './wizard-steps'
// TODO: Reimportar ResourceSelection cuando se implemente la selección de recursos en el wizard
// import { ResourceSelection } from './ResourceSelection'
import type { WizardData, WizardBusiness } from './wizard-types'
import type { Appointment } from '@/types/types'

interface WizardStepContentProps {
  wizardData: WizardData
  updateWizardData: (data: Partial<WizardData>) => void
  currentStep: number
  getStepNumber: (step: string) => number
  preselectedServiceId?: string
  preselectedLocationId?: string
  preselectedEmployeeId?: string
  filterByEmployeeId?: string
  businessId?: string
  userId?: string
  appointmentToEdit?: Appointment | null
  initiatedFromEmployeeProfile: boolean
  needsEmployeeBusinessSelection: boolean
  preferredCityName?: string | null
  preferredRegionName?: string | null
  dataCache: { locations: unknown[] | null; services: unknown[] | null }
  normalizePreselectedTime: (time?: string | null) => string | null
  preselectedDate?: Date
  preselectedTime?: string
  onSubmit: () => Promise<void>
  onClose: () => void
  onStartChat?: (conversationId: string) => void
  isAdminBooking?: boolean
}

export function WizardStepContent({
  wizardData,
  updateWizardData,
  currentStep,
  getStepNumber,
  preselectedServiceId,
  preselectedLocationId,
  preselectedEmployeeId,
  filterByEmployeeId,
  businessId,
  userId,
  appointmentToEdit,
  initiatedFromEmployeeProfile,
  needsEmployeeBusinessSelection,
  preferredCityName,
  preferredRegionName,
  dataCache,
  normalizePreselectedTime,
  preselectedDate,
  preselectedTime,
  onSubmit,
  onClose,
  onStartChat,
  isAdminBooking,
}: Readonly<WizardStepContentProps>) {
  const effectiveBusiness = wizardData.businessId || businessId || ''

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-3 pt-2">
      {/* Business selection */}
      {!businessId && currentStep === getStepNumber('business') && (
        <BusinessSelection
          selectedBusinessId={wizardData.businessId}
          preferredCityName={preferredCityName}
          preferredRegionName={preferredRegionName}
          onStartChat={(conversationId) => { onClose(); onStartChat?.(conversationId); }}
          onSelectBusiness={(business) => {
            updateWizardData({
              businessId: business.id,
              business,
              locationId: null,
              location: null,
              serviceId: null,
              service: null,
              employeeId: null,
              employee: null,
              employeeBusinessId: null,
              employeeBusiness: null,
              date: wizardData.date || preselectedDate || null,
              startTime: wizardData.startTime || normalizePreselectedTime(preselectedTime) || null,
              endTime: null,
              notes: '',
            })
          }}
        />
      )}

      {/* Location selection */}
      {currentStep === getStepNumber('location') && (
        <LocationSelection
          businessId={effectiveBusiness}
          selectedLocationId={wizardData.locationId}
          onSelectLocation={(location) => updateWizardData({ locationId: location.id, location })}
          preloadedLocations={dataCache.locations as Parameters<typeof LocationSelection>[0]['preloadedLocations']}
          isPreselected={!!preselectedLocationId}
          filterByEmployeeId={filterByEmployeeId}
        />
      )}

      {/* Service selection */}
      {currentStep === getStepNumber('service') && (
        <ServiceSelection
          businessId={effectiveBusiness}
          locationId={wizardData.locationId}
          selectedServiceId={wizardData.serviceId}
          onSelectService={(service) => updateWizardData({ serviceId: service.id, service })}
          preloadedServices={dataCache.services as Parameters<typeof ServiceSelection>[0]['preloadedServices']}
          isPreselected={!!preselectedServiceId}
          preselectedServiceId={preselectedServiceId}
          filterByEmployeeId={filterByEmployeeId}
        />
      )}

      {/* Employee selection */}
      {/* TODO: Implementar selección de recursos (ResourceSelection) para negocios con
          resource_model = 'physical_resource' | 'group_class'. Por ahora siempre se
          muestran profesionales independientemente del resource_model del negocio. */}
      {currentStep === getStepNumber('employee') && (
        <EmployeeSelection
          businessId={effectiveBusiness}
          locationId={wizardData.locationId || ''}
          serviceId={wizardData.serviceId || ''}
          selectedEmployeeId={wizardData.employeeId}
          onSelectEmployee={(employee) => {
            updateWizardData({ employeeId: employee.id, employee, resourceId: null })
            if (!initiatedFromEmployeeProfile) {
              const contextBusinessId = wizardData.businessId || businessId || null
              if (contextBusinessId) {
                updateWizardData({
                  employeeBusinessId: contextBusinessId,
                  employeeBusiness: wizardData.business || null,
                })
              }
            }
          }}
          isPreselected={!!preselectedEmployeeId}
        />
      )}

      {/* Employee business selection */}
      {needsEmployeeBusinessSelection && currentStep === getStepNumber('employeeBusiness') && (
        <EmployeeBusinessSelection
          employeeId={wizardData.employeeId || ''}
          employeeName={wizardData.employee?.full_name || 'Profesional'}
          selectedBusinessId={wizardData.employeeBusinessId}
          onSelectBusiness={(business) =>
            updateWizardData({
              employeeBusinessId: business.id,
              employeeBusiness: business as WizardBusiness,
            })
          }
        />
      )}

      {/* DateTime selection */}
      {currentStep === getStepNumber('dateTime') && (
        <DateTimeSelection
          service={wizardData.service}
          selectedDate={wizardData.date}
          selectedTime={wizardData.startTime}
          employeeId={wizardData.employeeId}
          resourceId={wizardData.resourceId}
          locationId={wizardData.locationId}
          businessId={wizardData.businessId}
          appointmentToEdit={appointmentToEdit}
          clientId={userId}
          onSelectDate={(date) => updateWizardData({ date })}
          onSelectTime={(startTime, endTime) => updateWizardData({ startTime, endTime })}
        />
      )}

      {/* Client data (admin booking only) */}
      {currentStep === getStepNumber('clientData') && isAdminBooking && (
        <ClientDataStep
          wizardData={wizardData}
          updateWizardData={updateWizardData}
        />
      )}

      {/* Confirmation */}
      {currentStep === getStepNumber('confirmation') && (
        <ConfirmationStep
          wizardData={wizardData}
          onUpdateNotes={(notes) => updateWizardData({ notes })}
          isEditing={!!appointmentToEdit}
          onSubmit={onSubmit}
          isAdminBooking={isAdminBooking}
        />
      )}

      {/* Success */}
      {currentStep === getStepNumber('success') && (
        <SuccessStep appointmentData={wizardData} onClose={onClose} />
      )}
    </div>
  )
}
