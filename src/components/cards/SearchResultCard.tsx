import React from 'react';
import { MapPin, Star, Building2, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LocationAddress } from '@/components/ui/LocationAddress';

export interface SearchResultData {
  id: string;
  name: string;
  type: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  distance?: number;
  imageUrl?: string;
  category?: string;
  location?: {
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  business?: {
    id: string;
    name: string;
  };
  price?: number;
  currency?: string;
}

interface SearchResultCardProps {
  result: SearchResultData;
  typeLabel: string;
  typeIcon: React.ElementType;
  reviewLabel?: string;
  reviewsLabel?: string;
  onClick?: () => void;
  className?: string;
}

export function SearchResultCard({
  result,
  typeLabel,
  typeIcon: TypeIcon,
  reviewLabel = 'review',
  reviewsLabel = 'reviews',
  onClick,
  className,
}: Readonly<SearchResultCardProps>) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      className={cn(
        'group rounded-xl border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-all',
        className,
      )}
    >
      <div className="p-3 sm:p-5">
        {/* Image or Icon */}
        {result.imageUrl ? (
          <div className="w-full h-32 sm:h-40 rounded-lg overflow-hidden mb-3 sm:mb-4 bg-muted">
            <img
              src={result.imageUrl}
              alt={result.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        ) : (
          <div className="w-full h-32 sm:h-40 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-3 sm:mb-4">
            <TypeIcon className="h-12 w-12 sm:h-16 sm:w-16 text-primary/40" />
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          {/* Type Badge */}
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {typeLabel}
          </Badge>

          {/* Name */}
          <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {result.name}
          </h3>

          {/* Description */}
          {result.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {result.description}
            </p>
          )}

          {/* Business (for services/users) */}
          {result.business && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{result.business.name}</span>
            </div>
          )}

          {/* Rating */}
          {result.rating !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {result.rating.toFixed(1)}
                </span>
              </div>
              {result.reviewCount !== undefined && result.reviewCount > 0 && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  ({result.reviewCount} {result.reviewCount === 1 ? reviewLabel : reviewsLabel})
                </span>
              )}
            </div>
          )}

          {/* Distance */}
          {result.distance !== undefined && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{result.distance.toFixed(1)} km</span>
            </div>
          )}

          {/* Location */}
          {result.location?.city && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <MapPin size={12} /> <LocationAddress cityId={result.location.city} showFullAddress={false} showCountry={false} />
            </div>
          )}

          {/* Price (for services) */}
          {result.price !== undefined && (
            <div className="pt-2 border-t border-border">
              <span className="text-base sm:text-lg font-bold text-primary">
                ${result.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
              </span>
            </div>
          )}

          {/* Category */}
          {result.category && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <Tag className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{result.category}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
