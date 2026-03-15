/**
 * Pie de navegación del AppointmentWizard (Atrás / Siguiente / Confirmar).
 */
import React from 'react'
import { Button } from '@/components/ui/button'
import { Check, Hourglass } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'

interface WizardFooterProps {
  currentStep: number
  minStep: number
  confirmationStep: number
  isSubmitting: boolean
  canProceed: boolean
  isEditing: boolean
  onBack: () => void
  onNext: () => void
  onConfirm: () => Promise<void>
}

export function WizardFooter({
  currentStep,
  minStep,
  confirmationStep,
  isSubmitting,
  canProceed,
  isEditing,
  onBack,
  onNext,
  onConfirm,
}: Readonly<WizardFooterProps>) {
  const { t } = useLanguage()

  return (
    <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-start sm:justify-between gap-2 sm:gap-0">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === minStep || isSubmitting}
        className="bg-transparent border-border text-foreground hover:bg-muted min-h-[44px] order-2 sm:order-1"
      >
        ← {t('common.back')}
      </Button>

      {currentStep < confirmationStep ? (
        <Button
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] order-1 sm:order-2"
        >
          {t('appointments.wizard.nextStep')} →
        </Button>
      ) : (
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Hourglass size={16} weight="fill" className="animate-spin mr-2" />
              <span className="hidden sm:inline">{t('appointments.wizard.saving')}</span>
              <span className="sm:hidden">{t('appointments.wizard.savingShort')}</span>
            </>
          ) : (
            <>
              <Check size={16} weight="bold" className="mr-1 hidden sm:inline" />
              <span className="hidden sm:inline">
                {isEditing ? t('appointments.wizard.saveChanges') : t('appointments.wizard.confirmAndBook')}
              </span>
              <Check size={16} weight="bold" className="mr-1 sm:hidden" />
              <span className="sm:hidden">
                {isEditing ? t('appointments.wizard.save') : t('appointments.wizard.confirm')}
              </span>
            </>
          )}
        </Button>
      )}
    </div>
  )
}
