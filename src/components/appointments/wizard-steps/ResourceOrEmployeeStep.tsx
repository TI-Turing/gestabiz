import React, { useState } from 'react'
import { Building2, User } from 'lucide-react'
import { ResourceSelection } from '../ResourceSelection'
import { EmployeeSelection } from './EmployeeSelection'
import type { BusinessResource } from '@/types/types'
import type { WizardEmployee } from '../wizard-types'

type AssigneeMode = 'resource' | 'employee'

interface ResourceOrEmployeeStepProps {
  businessId: string
  locationId: string
  serviceId: string
  selectedResourceId?: string | null
  selectedEmployeeId?: string | null
  onSelectResource: (resource: BusinessResource) => void
  onSelectEmployee: (employee: WizardEmployee) => void
}

export function ResourceOrEmployeeStep({
  businessId,
  locationId,
  serviceId,
  selectedResourceId,
  selectedEmployeeId,
  onSelectResource,
  onSelectEmployee,
}: Readonly<ResourceOrEmployeeStepProps>) {
  const initialMode: AssigneeMode =
    selectedEmployeeId ? 'employee' : 'resource'
  const [mode, setMode] = useState<AssigneeMode>(initialMode)

  function switchMode(next: AssigneeMode) {
    setMode(next)
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => switchMode('resource')}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            mode === 'resource'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted',
          ].join(' ')}
        >
          <Building2 className="h-4 w-4" />
          Reservar espacio
        </button>
        <button
          type="button"
          onClick={() => switchMode('employee')}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            mode === 'employee'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted',
          ].join(' ')}
        >
          <User className="h-4 w-4" />
          Reservar con profesional
        </button>
      </div>

      {mode === 'resource' && (
        <ResourceSelection
          businessId={businessId}
          serviceId={serviceId}
          locationId={locationId}
          selectedResourceId={selectedResourceId}
          onSelect={onSelectResource}
        />
      )}

      {mode === 'employee' && (
        <EmployeeSelection
          businessId={businessId}
          locationId={locationId}
          serviceId={serviceId}
          selectedEmployeeId={selectedEmployeeId ?? null}
          onSelectEmployee={(emp) => onSelectEmployee(emp as WizardEmployee)}
        />
      )}
    </div>
  )
}
