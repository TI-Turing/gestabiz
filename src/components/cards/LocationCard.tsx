import React from 'react';
import { MapPin, Building2, Phone, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Location } from '@/types/types';
import { LocationAddress } from '@/components/ui/LocationAddress';

interface LocationCardProps {
  location: Location;
  bannerUrl?: string;
  isSelected?: boolean;
  onSelect?: (location: Location) => void;
  isPreselected?: boolean;
  onViewProfile?: (location: Location) => void;
  readOnly?: boolean;
}

export function LocationCard({
  location,
  bannerUrl,
  isSelected = false,
  onSelect,
  isPreselected = false,
  onViewProfile,
  readOnly = false,
}: Readonly<LocationCardProps>) {
  const hasBanner = !!bannerUrl;

  return (
    <div
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onClick={() => !readOnly && onSelect?.(location)}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(location);
      }}
      className={cn(
        'relative group rounded-xl p-5 text-left transition-all duration-200 border-2 overflow-hidden',
        !readOnly && 'cursor-pointer hover:scale-[1.02] hover:shadow-xl',
        isSelected
          ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20'
          : 'bg-muted/50 border-border hover:bg-muted hover:border-border/50',
        isPreselected && 'ring-2 ring-green-500/50',
      )}
    >
      {/* Banner de fondo */}
      {hasBanner && (
        <>
          <img
            src={bannerUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Badge preseleccionado */}
      {isPreselected && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-green-500 text-white text-xs shadow-lg">
            <Check className="w-3 h-3 mr-1" />
            Preseleccionado
          </Badge>
        </div>
      )}

      {/* Checkmark seleccionado */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check size={14} className="text-primary-foreground" />
        </div>
      )}

      {/* Ícono de ubicación */}
      <div className={cn(
        'relative z-10 w-12 h-12 rounded-lg flex items-center justify-center mb-4',
        isSelected ? 'bg-primary/30' : hasBanner ? 'bg-black/30' : 'bg-muted group-hover:bg-muted/80',
      )}>
        <MapPin className={cn(
          'h-6 w-6',
          isSelected ? 'text-primary' : hasBanner ? 'text-white/80' : 'text-muted-foreground',
        )} />
      </div>

      {/* Nombre */}
      <h4 className={cn(
        'relative z-10 text-lg font-semibold mb-3',
        hasBanner ? 'text-white drop-shadow' : 'text-foreground',
      )}>
        {location.name}
      </h4>

      {/* Detalles */}
      <div className="relative z-10 space-y-2 text-sm">
        {location.address && (
          <div className={cn('flex items-start gap-2', hasBanner ? 'text-white/80' : 'text-muted-foreground')}>
            <Building2 className={cn('h-4 w-4 mt-0.5 shrink-0', hasBanner ? 'text-white/70' : 'text-muted-foreground')} />
            <LocationAddress
              address={location.address}
              cityId={location.city}
              stateId={location.state}
              postalCode={location.postal_code}
              className={cn('line-clamp-2', hasBanner ? 'text-white/80' : 'text-muted-foreground')}
            />
          </div>
        )}
        {location.phone && (
          <div className={cn('flex items-center gap-2', hasBanner ? 'text-white/80' : 'text-muted-foreground')}>
            <Phone className={cn('h-4 w-4 shrink-0', hasBanner ? 'text-white/70' : 'text-muted-foreground')} />
            <span>{location.phone}</span>
          </div>
        )}
      </div>

      {/* Botón Ver perfil */}
      {onViewProfile && (
        <div className="relative z-10 mt-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewProfile(location); }}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/30 text-white border border-white/25 transition-colors flex items-center justify-center gap-1.5"
          >
            <Info className="h-3.5 w-3.5" />
            Ver perfil de sede
          </button>
        </div>
      )}

      {/* Hover gradient */}
      {!readOnly && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-linear-to-br from-purple-500/10 to-transparent" />
      )}
    </div>
  );
}
