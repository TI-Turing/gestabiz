/**
 * AppointmentWizard — Modal multi-paso para crear o editar citas.
 *
 * Arquitectura modular:
 *  - wizard-types.ts         — interfaces compartidas
 *  - useWizardState.ts       — estado, step utilities, efectos, navegación
 *  - useCreateAppointment.ts — lógica de persistencia (INSERT/UPDATE)
 *  - WizardHeader.tsx        — cabecera sticky con barra de progreso
 *  - WizardFooter.tsx        — botones de navegación
 *  - WizardStepContent.tsx   — enrutador de pasos
 */
import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWizardDataCache } from '@/hooks/useWizardDataCache'
import { useAnalytics } from '@/hooks/useAnalytics'
import { usePreferredCity } from '@/hooks/usePreferredCity'
import { useAppointments } from '@/hooks/useSupabase'
import { useWizardState } from './useWizardState'
import { useCreateAppointment } from './useCreateAppointment'
import { WizardHeader } from './WizardHeader'
import { WizardFooter } from './WizardFooter'
import { WizardStepContent } from './WizardStepContent'
import type { AppointmentWizardProps } from './wizard-types'

export function AppointmentWizard({
  open,
  onClose,
  businessId,
  preselectedServiceId,
  preselectedLocationId,
  preselectedEmployeeId,
  userId,
  onSuccess,
  preselectedDate,
  preselectedTime,
  appointmentToEdit,
  onStartChat,
}: Readonly<AppointmentWizardProps>) {
  const { t } = useLanguage()
  const { preferredCityName, preferredRegionName } = usePreferredCity()
  const dataCache = useWizardDataCache(businessId ?? null)
  const analytics = useAnalytics()
  const { createAppointment: createAppointmentWithNotifications } = useAppointments(userId, {
    autoFetch: false,
  })

  const state = useWizardState({
    open,
    businessId,
    preselectedServiceId,
    preselectedLocationId,
    preselectedEmployeeId,
    preselectedDate,
    preselectedTime,
    appointmentToEdit,
    onClose,
    dataCache,
    analytics,
  })

  const { createAppointment } = useCreateAppointment({
    wizardData: state.wizardData,
    businessId,
    userId,
    appointmentToEdit,
    onSuccess,
    setIsSubmitting: state.setIsSubmitting,
    createAppointmentWithNotifications: createAppointmentWithNotifications as (
      data: Record<string, unknown>,
    ) => Promise<unknown>,
    analytics,
  })

  const {
    wizardData,
    updateWizardData,
    currentStep,
    isSubmitting,
    getStepNumber,
    getStepOrder,
    STEP_LABELS_MAP,
    getEffectiveCurrentStep,
    getEffectiveTotalSteps,
    getCompletedSteps,
    canProceed,
    needsEmployeeBusinessSelection,
    initiatedFromEmployeeProfile,
    normalizePreselectedTime,
    handleNext,
    handleBack,
    handleClose,
  } = state

  const successStep = getStepNumber('success')
  const isSuccess = currentStep >= successStep

  const handleConfirm = async () => {
    const success = await createAppointment()
    if (success) handleNext()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        hideClose
        className={cn(
          'bg-card text-foreground p-0 overflow-hidden !flex !flex-col',
          'w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh]',
          'shadow-2xl rounded-xl',
        )}
      >
        <DialogTitle className="sr-only">
          {appointmentToEdit
            ? t('appointments.wizard.editAppointment')
            : t('appointments.wizard.newAppointment')}
        </DialogTitle>

        {!isSuccess && (
          <WizardHeader
            title={appointmentToEdit
              ? t('appointments.wizard.editAppointment')
              : t('appointments.wizard.newAppointment')}
            currentStepLabel={STEP_LABELS_MAP[getStepOrder()[currentStep]] ?? ''}
            effectiveCurrentStep={getEffectiveCurrentStep()}
            effectiveTotalSteps={getEffectiveTotalSteps()}
            completedSteps={getCompletedSteps()}
            isSubmitting={isSubmitting}
            onClose={handleClose}
          />
        )}

        <WizardStepContent
          wizardData={wizardData}
          updateWizardData={updateWizardData}
          currentStep={currentStep}
          getStepNumber={getStepNumber}
          preselectedServiceId={preselectedServiceId}
          preselectedLocationId={preselectedLocationId}
          preselectedEmployeeId={preselectedEmployeeId}
          filterByEmployeeId={preselectedEmployeeId}
          businessId={businessId}
          userId={userId}
          appointmentToEdit={appointmentToEdit}
          initiatedFromEmployeeProfile={initiatedFromEmployeeProfile}
          needsEmployeeBusinessSelection={needsEmployeeBusinessSelection}
          preferredCityName={preferredCityName}
          preferredRegionName={preferredRegionName}
          dataCache={dataCache}
          normalizePreselectedTime={normalizePreselectedTime}
          preselectedDate={preselectedDate}
          preselectedTime={preselectedTime}
          onSubmit={handleConfirm}
          onClose={handleClose}
          onStartChat={onStartChat}
        />

        {!isSuccess && (
          <WizardFooter
            currentStep={currentStep}
            minStep={businessId ? 1 : 0}
            confirmationStep={getStepNumber('confirmation')}
            isSubmitting={isSubmitting}
            canProceed={canProceed()}
            isEditing={!!appointmentToEdit}
            onBack={handleBack}
            onNext={handleNext}
            onConfirm={handleConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
