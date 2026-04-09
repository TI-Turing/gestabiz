import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Building2, Phone, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Location } from '@/types/types';
import { LocationAddress } from '@/components/ui/LocationAddress';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';

async function fetchLocation(locationId: string): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();
  if (error) throw error;
  return data as Location;
}

async function fetchLocationBanner(locationId: string): Promise<string | null> {
  const { data } = await supabase
    .from('location_media')
    .select('url, description')
    .eq('location_id', locationId)
    .eq('is_banner', true)
    .eq('type', 'image')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return null;
  const chosen = data.find(x => (x.description ?? '').trim() !== 'Banner de prueba') ?? data[0];
  return chosen ? chosen.url.trim().replaceAll(/^[`'"]+|[`'"]+$/g, '') : null;
}

interface LocationCardProps {
  /** ID de la ubicación — el card resuelve sus datos internamente */
  locationId?: string;
  /** Datos pre-cargados (initialData para evitar refetch) */
  location?: Location;
  initialData?: Location;
  bannerUrl?: string;
  isSelected?: boolean;
  onSelect?: (location: Location) => void;
  isPreselected?: boolean;
  onViewProfile?: (location: Location) => void;
  readOnly?: boolean;
  className?: string;
  renderActions?: (id: string) => React.ReactNode;
  /** Modo compacto: layout estructurado para vistas de gestión admin */
  compact?: boolean;
  /** Contenido adicional inyectado dentro del card (ej: horarios, servicios) */
  children?: React.ReactNode;
}

export function LocationCard({
  locationId,
  location: locationProp,
  initialData,
  bannerUrl,
  isSelected = false,
  onSelect,
  isPreselected = false,
  onViewProfile,
  readOnly = false,
  className,
  renderActions,
  compact = false,
  children,
}: Readonly<LocationCardProps>) {
  const seed = initialData ?? locationProp;
  const resolvedId = locationId ?? seed?.id;

  const { data: location } = useQuery({
    queryKey: ['location-card', resolvedId],
    queryFn: () => fetchLocation(resolvedId!),
    initialData: seed,
    enabled: !!resolvedId,
    ...QUERY_CONFIG.STABLE,
  });

  // Si no se provee bannerUrl externamente, lo carga desde location_media
  const { data: fetchedBannerUrl } = useQuery({
    queryKey: ['location-banner', resolvedId],
    queryFn: () => fetchLocationBanner(resolvedId!),
    enabled: !!resolvedId && bannerUrl === undefined,
    ...QUERY_CONFIG.STABLE,
  });

  if (!location) {
    return (
      <div className={cn('rounded-xl p-5 border-2 border-border animate-pulse', className)}>
        <div className="w-12 h-12 rounded-lg bg-muted mb-4" />
        <div className="h-5 bg-muted rounded w-3/4 mb-3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  // ── Compact variant (admin management lists) ──
  if (compact) {
    return (
      <div
        className={cn(
          'relative rounded-xl border bg-card p-4 transition-all duration-200',
          !readOnly && 'hover:shadow-md',
          isSelected ? 'border-primary bg-primary/10' : 'border-border',
          className,
        )}
      >
        {location.is_primary && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-yellow-500 text-yellow-950 text-xs shadow-lg">
              <Check className="w-3 h-3 mr-1" />
              Principal
            </Badge>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              {location.name}
            </h3>
            {location.address && (
              <div className="mt-1 text-sm text-muted-foreground">
                <LocationAddress
                  address={location.address}
                  cityId={location.city}
                  stateId={location.state}
                  postalCode={location.postal_code}
                />
              </div>
            )}
          </div>
          {renderActions?.(location.id)}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
          {location.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{location.phone}</span>
            </div>
          )}
          {location.email && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>{location.email}</span>
            </div>
          )}
        </div>
        {children}
      </div>
    );
  }

  // ── Default variant (wizard / selection) ──
  const effectiveBannerUrl = bannerUrl ?? fetchedBannerUrl ?? location.banner_url;
  const hasBanner = !!effectiveBannerUrl;

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
        className,
      )}
    >
      {/* Banner de fondo */}
      {hasBanner && (
        <>
          <img
            src={effectiveBannerUrl}
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

      {/* Custom actions slot */}
      {renderActions?.(location.id)}
    </div>
  );
}
