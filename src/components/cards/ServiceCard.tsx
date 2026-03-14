import React from 'react';
import { Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ServiceCardData {
  id: string;
  name: string;
  description?: string;
  duration?: number;         // minutes
  duration_minutes?: number; // retrocompat
  price?: number;
  category?: string;
  image_url?: string;
  business_id?: string;
  business?: { id: string; name: string; logo_url?: string };
}

interface ServiceCardProps {
  service: ServiceCardData;
  isSelected?: boolean;
  onSelect?: (service: ServiceCardData) => void;
  isPreselected?: boolean;
  onViewProfile?: (serviceId: string) => void;
  /** Muestra solo la imagen/info sin interactividad de selección */
  readOnly?: boolean;
}

export function ServiceCard({
  service,
  isSelected = false,
  onSelect,
  isPreselected = false,
  onViewProfile,
  readOnly = false,
}: Readonly<ServiceCardProps>) {
  const duration = service.duration ?? service.duration_minutes ?? 0;

  return (
    <div
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onClick={() => !readOnly && onSelect?.(service)}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(service);
      }}
      className={cn(
        'relative bg-card border-2 rounded-xl overflow-hidden transition-all duration-200',
        !readOnly && 'cursor-pointer hover:border-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/20',
        isSelected ? 'border-primary bg-primary/10' : 'border-border',
        isPreselected && 'ring-2 ring-green-500/50',
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
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/30 select-none">
              {service.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-3 text-center bg-muted/50">
        <h3 className="text-base font-semibold text-foreground truncate">{service.name}</h3>
        {duration > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{duration} min</p>
        )}
        {service.price != null && (
          <p className="text-xs font-semibold text-primary mt-0.5">
            ${service.price.toLocaleString('es-CO')}
          </p>
        )}
        {service.business && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{service.business.name}</p>
        )}

        {onViewProfile && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewProfile(service.id); }}
            className="mt-2 w-full py-1 px-2 rounded text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors flex items-center justify-center gap-1"
          >
            <Info className="h-3 w-3" />
            Ver perfil
          </button>
        )}
      </div>
    </div>
  );
}
