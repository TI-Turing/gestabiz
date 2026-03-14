import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Star, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';

export interface BusinessCardData {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  average_rating?: number;
  total_reviews?: number;
  locations_count?: number;
}

async function fetchBusiness(businessId: string): Promise<BusinessCardData> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, description, logo_url, banner_url, city, address, average_rating, total_reviews, business_categories:category_id(name)')
    .eq('id', businessId)
    .single();
  if (error) throw error;
  const cat = data.business_categories
    ? (Array.isArray(data.business_categories) ? data.business_categories[0] : data.business_categories)
    : null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    logo_url: data.logo_url,
    banner_url: data.banner_url,
    city: data.city,
    address: data.address,
    average_rating: data.average_rating,
    total_reviews: data.total_reviews,
    category: cat?.name ?? null,
  };
}

interface BusinessCardProps {
  /** ID del negocio — el card resuelve sus datos internamente */
  businessId?: string;
  /** Datos pre-cargados (initialData para evitar refetch) */
  business?: BusinessCardData;
  initialData?: BusinessCardData;
  isSelected?: boolean;
  onSelect?: (business: BusinessCardData) => void;
  isPreselected?: boolean;
  onViewProfile?: (businessId: string) => void;
  readOnly?: boolean;
  services?: string[];
  className?: string;
  renderActions?: (id: string) => React.ReactNode;
  /** Modo compacto: layout horizontal tipo lista, sin banner grande */
  compact?: boolean;
  /** Modo panorámico: banner full-bleed con info superpuesta (favoritos, hero) */
  panoramic?: boolean;
  /** Contenido extra inyectado dentro del card */
  children?: React.ReactNode;
}

export function BusinessCard({
  businessId,
  business: businessProp,
  initialData,
  isSelected = false,
  onSelect,
  isPreselected = false,
  onViewProfile,
  readOnly = false,
  services,
  className,
  renderActions,
  compact = false,
  panoramic = false,
  children,
}: Readonly<BusinessCardProps>) {
  const seed = initialData ?? businessProp;
  const resolvedId = businessId ?? seed?.id;

  const { data: business } = useQuery({
    queryKey: ['business-card', resolvedId],
    queryFn: () => fetchBusiness(resolvedId!),
    initialData: seed,
    enabled: !!resolvedId,
    ...QUERY_CONFIG.STABLE,
  });

  if (!business) {
    return (
      <div className={cn('rounded-xl overflow-hidden border-2 border-border animate-pulse', className)}>
        <div className="h-36 bg-muted" />
        <div className="p-3 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div>
      </div>
    );
  }

  // ── Compact variant (lists, management views, suggestions) ──
  if (compact) {
    return (
      <div
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        onClick={() => !readOnly && onSelect?.(business)}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(business);
        }}
        className={cn(
          'relative group rounded-xl border bg-card p-4 transition-all duration-200',
          !readOnly && 'cursor-pointer hover:shadow-lg hover:border-primary/50',
          isSelected ? 'border-primary bg-primary/10' : 'border-border',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden border border-border/50">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {business.name}
            </h4>
            {business.category && (
              <span className="text-xs text-muted-foreground">{business.category}</span>
            )}
            {(business.average_rating ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{(business.average_rating ?? 0).toFixed(1)}</span>
                {Boolean(business.total_reviews) && (
                  <span className="text-xs text-muted-foreground">({business.total_reviews})</span>
                )}
              </div>
            )}
            {business.city && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{business.city}</span>
              </div>
            )}
          </div>

          {renderActions?.(business.id)}
        </div>
        {business.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{business.description}</p>
        )}
        {children}
      </div>
    );
  }

  // ── Panoramic variant (full-bleed banner with overlaid info) ──
  if (panoramic) {
    return (
      <div
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        onClick={() => !readOnly && onSelect?.(business)}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(business);
        }}
        className={cn(
          'group relative rounded-xl overflow-hidden border transition-all duration-200',
          !readOnly && 'cursor-pointer hover:shadow-lg hover:border-primary/50',
          isSelected ? 'border-primary bg-primary/10' : 'border-border',
          className,
        )}
      >
        {/* Full-bleed banner */}
        <div
          className="relative w-full h-56"
          style={{
            backgroundImage: business.banner_url ? `url(${business.banner_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!business.banner_url && <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5" />}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent" />

          {/* Logo top-left */}
          {business.logo_url && (
            <div className="absolute top-3 left-3 z-10">
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-16 h-16 rounded-lg object-cover border-2 border-white/80 shadow-lg"
              />
            </div>
          )}

          {/* renderActions top-right (heart, etc.) */}
          {renderActions && (
            <div className="absolute top-3 right-3 z-10">
              {renderActions(business.id)}
            </div>
          )}

          {/* Info overlaid on banner */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 space-y-2">
            <h4 className="font-bold text-white text-xl truncate drop-shadow-md">
              {business.name}
            </h4>
            {business.description && (
              <p className="text-sm text-white/90 line-clamp-2 drop-shadow-md">
                {business.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(business.average_rating ?? 0) > 0 && (
                  <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-white">
                      {(business.average_rating ?? 0).toFixed(1)}
                    </span>
                  </div>
                )}
                {Boolean(business.total_reviews) && (
                  <span className="text-xs text-white/90 bg-black/30 rounded-full px-2 py-0.5">
                    ({business.total_reviews})
                  </span>
                )}
              </div>
              {business.city && (
                <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5">
                  <MapPin className="h-3.5 w-3.5 text-white/90" />
                  <span className="text-xs text-white/90 truncate max-w-[120px]">{business.city}</span>
                </div>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ── Default variant (grid with banner) ──
  const hasBanner = !!business.banner_url;
  const hasServices = services && services.length > 0;

  return (
    <div
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onClick={() => !readOnly && onSelect?.(business)}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === 'Enter' || e.key === ' ')) onSelect?.(business);
      }}
      className={cn(
        'relative group rounded-xl overflow-hidden border-2 transition-all duration-200',
        !readOnly && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20',
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border',
        !readOnly && !isSelected && 'hover:border-primary/60',
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
        <div className="absolute top-2 right-2 z-30 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-200">
          <Check className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}

      {/* Banner / hero área (60% altura) */}
      <div className="relative h-36 overflow-hidden">
        {hasBanner && (
          <img
            src={business.banner_url ?? undefined}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        {!hasBanner && business.logo_url && (
          <div className="w-full h-full bg-linear-to-br from-primary/30 via-muted to-muted/50 flex items-center justify-center">
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-16 h-16 object-contain rounded-lg opacity-80"
            />
          </div>
        )}
        {!hasBanner && !business.logo_url && (
          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-primary/30" />
          </div>
        )}

        {/* Degradado sobre banner */}
        {hasBanner && (
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
        )}

        {/* Overlay de servicios al hacer hover */}
        {!readOnly && hasServices && (
          <div
            className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(0,0,0,0.70)',
            }}
          >
            <div className="p-2 flex flex-col gap-0.5 overflow-y-auto flex-1">
              <p className="text-[10px] font-semibold text-white/55 uppercase tracking-wide mb-1">Servicios</p>
              {services?.map((svc) => (
                <span key={svc} className="text-xs text-white/85 truncate leading-tight">
                  · {svc}
                </span>
              ))}
            </div>
            {onViewProfile && (
              <div className="p-2 pt-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onViewProfile(business.id); }}
                  className="w-full py-1 px-2 rounded text-[11px] font-semibold bg-white/15 hover:bg-white/30 text-white border border-white/25 transition-colors"
                >
                  Perfil del negocio
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel inferior con info */}
      <div className="relative p-3 bg-card flex flex-col gap-1.5">
        {/* Logo + nombre */}
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-border bg-muted">
            {business.logo_url ? (
              <img src={business.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate leading-tight">{business.name}</p>
            {business.category && (
              <p className="text-xs text-muted-foreground truncate leading-tight">{business.category}</p>
            )}
          </div>
        </div>

        {/* Rating */}
        {(business.average_rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{(business.average_rating ?? 0).toFixed(1)}</span>
            {Boolean(business.total_reviews) && (
              <span className="text-muted-foreground">· {business.total_reviews} reseñas</span>
            )}
          </div>
        )}

        {/* Ciudad */}
        {business.city && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{business.city}</span>
          </div>
        )}

        {/* Descripción */}
        {business.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{business.description}</p>
        )}

        {/* Botón Ver perfil (solo si no hay overlay de servicios) */}
        {onViewProfile && (!hasServices || readOnly) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewProfile(business.id); }}
            className="mt-1 w-full py-1 px-2 rounded text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors flex items-center justify-center gap-1"
          >
            <Info className="h-3 w-3" />
            Ver perfil
          </button>
        )}
        {renderActions?.(business.id)}
      </div>

      {/* Hover gradient */}
      {!readOnly && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-linear-to-br from-purple-500/5 to-transparent" />
      )}
    </div>
  );
}
