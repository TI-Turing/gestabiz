import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';

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

async function fetchService(serviceId: string): Promise<ServiceCardData> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price, category, image_url, business_id, businesses:business_id(id, name, logo_url)')
    .eq('id', serviceId)
    .single();
  if (error) throw error;
  const biz = data.businesses
    ? (Array.isArray(data.businesses) ? data.businesses[0] : data.businesses)
    : undefined;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    duration: data.duration_minutes,
    duration_minutes: data.duration_minutes,
    price: data.price,
    category: data.category,
    image_url: data.image_url,
    business_id: data.business_id,
    business: biz ? { id: biz.id, name: biz.name, logo_url: biz.logo_url } : undefined,
  };
}

interface ServiceCardProps {
  /** ID del servicio — el card resuelve sus datos internamente */
  serviceId?: string;
  /** Datos pre-cargados (initialData para evitar refetch) */
  service?: ServiceCardData;
  initialData?: ServiceCardData;
  isSelected?: boolean;
  onSelect?: (service: ServiceCardData) => void;
  isPreselected?: boolean;
  onViewProfile?: (serviceId: string) => void;
  readOnly?: boolean;
  className?: string;
  renderActions?: (id: string) => React.ReactNode;
  /** Modo compacto: sin imagen, layout horizontal para listas de gestión */
  compact?: boolean;
}

export function ServiceCard({
  serviceId,
  service: serviceProp,
  initialData,
  isSelected = false,
  onSelect,
  isPreselected = false,
  onViewProfile,
  readOnly = false,
  className,
  renderActions,
  compact = false,
}: Readonly<ServiceCardProps>) {
  const seed = initialData ?? serviceProp;
  const resolvedId = serviceId ?? seed?.id;

  const { data: service } = useQuery({
    queryKey: ['service-card', resolvedId],
    queryFn: () => fetchService(resolvedId!),
    initialData: seed,
    enabled: !!resolvedId,
    ...QUERY_CONFIG.STABLE,
  });

  if (!service) {
    return (
      <div className={cn('bg-card border-2 border-border rounded-xl overflow-hidden animate-pulse', className)}>
        <div className="aspect-square w-full bg-muted" />
        <div className="p-3 space-y-2"><div className="h-4 bg-muted rounded w-3/4 mx-auto" /><div className="h-3 bg-muted rounded w-1/2 mx-auto" /></div>
      </div>
    );
  }
  const duration = service.duration ?? service.duration_minutes ?? 0;

  // ── Compact variant (admin management lists) ──
  if (compact) {
    return (
      <div
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        onClick={() => !readOnly && onSelect?.(service)}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(service);
        }}
        className={cn(
          'relative bg-card border rounded-xl p-4 transition-all duration-200',
          !readOnly && 'cursor-pointer hover:shadow-md hover:border-primary/50',
          isSelected ? 'border-primary bg-primary/10' : 'border-border',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">{service.name}</h3>
            {service.category && (
              <Badge variant="outline" className="mt-1 text-xs">{service.category}</Badge>
            )}
          </div>
          {renderActions?.(service.id)}
        </div>
        {service.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{service.description}</p>
        )}
        <div className="flex items-center justify-between text-sm mt-3">
          {duration > 0 && (
            <span className="text-muted-foreground">{duration} min</span>
          )}
          {service.price != null && (
            <span className="font-semibold text-primary">
              ${service.price.toLocaleString('es-CO')}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Default variant (wizard / grid selection) ──
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
        className,
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
        {renderActions?.(service.id)}
      </div>
    </div>
  );
}
