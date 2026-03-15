/**
 * Cabecera sticky del AppointmentWizard con título, step label y barra de progreso.
 */
import React from 'react'
import { X } from 'lucide-react'
import { ProgressBar } from './wizard-steps'

interface WizardHeaderProps {
  title: string
  currentStepLabel: string
  effectiveCurrentStep: number
  effectiveTotalSteps: number
  completedSteps: number[]
  isSubmitting: boolean
  onClose: () => void
}

export function WizardHeader({
  title,
  currentStepLabel,
  effectiveCurrentStep,
  effectiveTotalSteps,
  completedSteps,
  isSubmitting,
  onClose,
}: Readonly<WizardHeaderProps>) {
  return (
    <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-md px-2 sm:px-3 pt-2 sm:pt-2 pb-2 sm:pb-2 border-b border-border">
      <div className="flex items-center justify-between gap-2 min-h-[40px]">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-foreground truncate">{title}</h2>
          <span className="text-xs font-normal text-primary whitespace-nowrap">
            · {currentStepLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-1">
        <ProgressBar
          currentStep={effectiveCurrentStep + 1}
          totalSteps={effectiveTotalSteps}
          label={''}
          completedSteps={Array.from({ length: effectiveCurrentStep }, (_, i) => i + 1)}
        />
      </div>
    </div>
  )
}
