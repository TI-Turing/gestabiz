import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label: string;
  completedSteps?: number[]; // Array de índices de pasos completados (ej: [1, 2, 3])
}

export function ProgressBar({ currentStep, totalSteps, label, completedSteps = [] }: ProgressBarProps) {
  const { t } = useLanguage();
  const percentage = (currentStep / totalSteps) * 100;

  // Generar array de todos los pasos
  const allSteps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="mb-6">
      

      {/* Indicadores de pasos con check marks y conectores entre círculos */}
      <div className="flex items-center mb-3 px-1">
        {allSteps.map((step) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isPending = step > currentStep;

          const circle = (
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                isCompleted && "bg-primary text-primary-foreground shadow-lg shadow-primary/50",
                isCurrent && !isCompleted && "bg-primary text-primary-foreground shadow-lg shadow-primary/50 ring-2 ring-primary/30",
                isPending && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                step
              )}
            </div>
          );

          const connector = (
            <div
              className={cn(
                "flex-1 h-0.5",
                step < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          );

          return (
            <>
              {circle}
              {step < totalSteps && connector}
            </>
          );
        })}
      </div>

    </div>
  );
}
