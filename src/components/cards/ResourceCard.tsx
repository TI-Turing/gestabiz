import React from 'react';
import { Check, MapPin, Users, DollarSign, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BusinessResource } from '@/types/types';

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  room: 'Habitación',
  table: 'Mesa',
  court: 'Cancha',
  desk: 'Escritorio',
  equipment: 'Equipo',
  vehicle: 'Vehículo',
  space: 'Espacio',
  lane: 'Carril',
  field: 'Campo',
  station: 'Estación',
  parking_spot: 'Parqueadero',
  bed: 'Cama',
  studio: 'Estudio',
  meeting_room: 'Sala de Reuniones',
  other: 'Otro',
};

interface ResourceCardProps {
  resource: BusinessResource;
  isSelected?: boolean;
  onSelect?: (resource: BusinessResource) => void;
  isPreselected?: boolean;
  onViewProfile?: (resourceId: string) => void;
  readOnly?: boolean;
}

export function ResourceCard({
  resource,
  isSelected = false,
  onSelect,
  isPreselected = false,
  onViewProfile,
  readOnly = false,
}: Readonly<ResourceCardProps>) {
  const formattedPrice = resource.price_per_hour
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: resource.currency || 'COP',
        minimumFractionDigits: 0,
      }).format(resource.price_per_hour) + ' /hora'
    : null;

  return (
    <div
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onClick={() => !readOnly && onSelect?.(resource)}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(resource);
      }}
      className={cn(
        'relative bg-card border-2 rounded-xl overflow-hidden transition-all duration-200',
        !readOnly && 'cursor-pointer hover:border-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/20',
        isSelected ? 'border-primary bg-primary/10' : 'border-border',
        isPreselected && 'ring-2 ring-green-500/50',
        !resource.is_active && 'opacity-60',
      )}
    >
      {/* Badge preseleccionado */}
      {isPreselected && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-green-500 text-white text-xs shadow-lg">
            <Check className="w-3 h-3 mr-1" />
            Preseleccionado
          </Badge>
        </div>
      )}

      {/* Checkmark seleccionado */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-200">
          <Check className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      {/* Imagen / placeholder */}
      <div className="aspect-square w-full relative bg-muted">
        <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-primary/20 to-primary/5 gap-2">
          <span className="text-4xl font-bold text-primary/30 select-none">
            {resource.name.charAt(0).toUpperCase()}
          </span>
          <Badge variant="outline" className="text-[10px] bg-background/60">
            {RESOURCE_TYPE_LABELS[resource.resource_type] ?? resource.resource_type}
          </Badge>
        </div>
      </div>

      {/* Información */}
      <div className="p-3 bg-muted/50 space-y-1.5">
        <h3 className="text-base font-semibold text-foreground truncate">{resource.name}</h3>

        {resource.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
        )}

        <div className="space-y-1">
          {resource.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{resource.location.name}</span>
            </div>
          )}
          {resource.capacity && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              <span>Capacidad: {resource.capacity}</span>
            </div>
          )}
          {formattedPrice && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <DollarSign className="h-3 w-3 shrink-0" />
              <span>{formattedPrice}</span>
            </div>
          )}
        </div>

        {resource.amenities && resource.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {resource.amenities.slice(0, 2).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-[10px]">
                {amenity}
              </Badge>
            ))}
            {resource.amenities.length > 2 && (
              <Badge variant="secondary" className="text-[10px]">
                +{resource.amenities.length - 2}
              </Badge>
            )}
          </div>
        )}

        {!resource.is_active && (
          <Badge variant="destructive" className="text-xs w-full justify-center">
            No disponible
          </Badge>
        )}

        {onViewProfile && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewProfile(resource.id); }}
            className="mt-1 w-full py-1 px-2 rounded text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors flex items-center justify-center gap-1"
          >
            <Info className="h-3 w-3" />
            Ver perfil
          </button>
        )}
      </div>
    </div>
  );
}
