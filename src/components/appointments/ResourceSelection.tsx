import { useResourcesForService } from '@/hooks/useBusinessResources'
import { ResourceCard } from '@/components/cards/ResourceCard'

/**
 * Selector de Recursos para AppointmentWizard
 * Alternativa a EmployeeSelection cuando resource_model='physical_resource'
 * 
 * Fecha: 21 de Octubre de 2025
 * Parte del sistema de Modelo de Negocio Flexible
 */

interface ResourceSelectionProps {
  businessId: string
  serviceId: string
  locationId?: string
  selectedResourceId?: string
  onSelect: (resourceId: string) => void
}


export function ResourceSelection({
  businessId,
  serviceId,
  locationId,
  selectedResourceId,
  onSelect,
}: Readonly<ResourceSelectionProps>) {
  const { data: resources, isLoading } = useResourcesForService(
    businessId,
    serviceId,
    locationId
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!resources?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No hay recursos disponibles para este servicio.
        </p>
        {locationId && (
          <p className="text-sm text-muted-foreground mt-2">
            Intenta cambiar la ubicación seleccionada.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Selecciona el recurso que deseas reservar
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isSelected={resource.id === selectedResourceId}
            onSelect={(r) => onSelect(r.id)}
          />
        ))}
      </div>
    </div>
  )
}

