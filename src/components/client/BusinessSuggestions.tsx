import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BusinessSuggestion } from '@/hooks/useClientDashboard';
import { BusinessCard } from '@/components/cards/BusinessCard';

// Type alias for backward compatibility
type SimpleBusiness = BusinessSuggestion;

interface BusinessSuggestionsProps {
  // ✅ v2.0: Recibir sugerencias desde useClientDashboard (consolidado)
  suggestions: BusinessSuggestion[];
  isLoading: boolean;
  preferredCityName: string | null;
  preferredRegionName: string | null; // ✅ NEW: For region-level filtering display
  onBusinessSelect?: (businessId: string) => void;
}

/**
 * BusinessSuggestions v2.0 - Refactorizado
 * 
 * CAMBIOS:
 * - ❌ Eliminado: Queries internas a Supabase (loadPreviouslyBookedBusinesses, loadSuggestedBusinesses)
 * - ✅ Agregado: Recibe `suggestions` desde useClientDashboard (datos consolidados)
              <div className="flex items-start gap-3">
 * 
                  <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden border border-border/50">
 * - 4 queries independientes en useEffect
 * - Lógica compleja de filtrado por ciudad
 * - Paginación manual
 * 
 * DESPUÉS (v2.0):
 * - 0 queries (renderizado puro)
 * - Data filtrada por RPC function en backend
 * - Límite de 6 sugerencias (desde backend)
 */
export function BusinessSuggestions({
  suggestions,
  isLoading,
  preferredCityName,
  preferredRegionName, // ✅ NEW
  onBusinessSelect
}: Readonly<BusinessSuggestionsProps>) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(true)
  const [isRecommendedOpen, setIsRecommendedOpen] = useState(false) // ✅ NUEVO: Sección RECOMENDADOS colapsada por defecto

  // ✅ OPTIMIZACIÓN: Memoizar handler para prevenir recreaciones
  const handleRebookClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, businessId: string) => {
    event.stopPropagation()
    onBusinessSelect?.(businessId)
  }, [onBusinessSelect])

  // ✅ OPTIMIZACIÓN: Memoizar renderBusinessCard para evitar recrear función en cada render
  const renderBusinessCard = useCallback((business: SimpleBusiness, options?: { highlight?: boolean }) => (
    <BusinessCard
      key={business.id}
      businessId={business.id}
      initialData={{
        id: business.id,
        name: business.name,
        description: options?.highlight ? undefined : business.description,
        logo_url: business.logo_url,
        city: business.city,
        average_rating: business.average_rating ?? undefined,
        total_reviews: business.total_reviews,
      }}
      compact
      className={cn(options?.highlight && 'border-primary/60')}
      onSelect={() => onBusinessSelect?.(business.id)}
      renderActions={() => (
        <Button
          size="sm"
          variant={options?.highlight ? 'default' : 'outline'}
          onClick={(event) => handleRebookClick(event, business.id)}
        >
          {options?.highlight
            ? t('businessSuggestions.bookAgain')
            : t('businessSuggestions.bookNow')}
        </Button>
      )}
    >
      {options?.highlight && business.visitsCount ? (
        <Badge variant="secondary" className="mt-1 w-fit">
          {business.visitsCount === 1
            ? t('businessSuggestions.singleVisit')
            : t('businessSuggestions.multiVisit', { count: business.visitsCount })}
        </Badge>
      ) : null}
      {options?.highlight && business.lastAppointmentDate && (
        <p className="text-xs text-muted-foreground mt-1">
          {t('businessSuggestions.lastVisit', {
            date: new Date(business.lastAppointmentDate).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short'
            })
          })}
        </p>
      )}
    </BusinessCard>
  ), [handleRebookClick, t, onBusinessSelect])

  // ✅ OPTIMIZACIÓN: Memoizar filtros para evitar recalcular en cada render
  const { frequentBusinesses, recommendedBusinesses } = useMemo(() => {
    const frequent = suggestions.filter((business) => business.isFrequent)
    const recommended = suggestions.filter((business) => !business.isFrequent)
    return { frequentBusinesses: frequent, recommendedBusinesses: recommended }
  }, [suggestions])

  const hasFrequent = frequentBusinesses.length > 0
  const hasSuggestions = recommendedBusinesses.length > 0
  const shouldShowEmptyState = !hasFrequent && !hasSuggestions

  return (
    <Card className={cn("border-border/50", !isOpen && "shadow-sm")}>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>
              {preferredCityName 
                ? t('businessSuggestions.titleWithCity', { city: preferredCityName })
                : preferredRegionName
                  ? t('businessSuggestions.titleWithCity', { city: preferredRegionName })
                  : t('businessSuggestions.title')
              }
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 pb-4">
          {(() => {
            if (isLoading) {
              return (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }

            if (shouldShowEmptyState) {
              return (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {preferredCityName 
                      ? `No hay negocios recomendados en ${preferredCityName}`
                      : 'No hay negocios recomendados disponibles'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Intenta seleccionar otra ciudad en el header
                  </p>
                </div>
              )
            }

            return (
              <div className="space-y-2">
                {hasFrequent && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('businessSuggestions.frequentTitle')}
                    </h4>
                    {frequentBusinesses.map((business) => renderBusinessCard(business, { highlight: true }))}
                  </div>
                )}

                {hasSuggestions && (
                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -mx-1 px-1 py-1 rounded transition-colors"
                      onClick={() => setIsRecommendedOpen(!isRecommendedOpen)}
                    >
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t('businessSuggestions.recommendedTitle')}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsRecommendedOpen(!isRecommendedOpen);
                        }}
                      >
                        <svg
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isRecommendedOpen && "rotate-180"
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    </div>
                    {isRecommendedOpen && recommendedBusinesses.map((business) => renderBusinessCard(business))}
                  </div>
                )}
                
                {recommendedBusinesses.length >= 6 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Mostrando los {recommendedBusinesses.length} negocios mejor valorados
                  </p>
                )}
              </div>
            )
          })()}
        </CardContent>
      )}
    </Card>
  )
}
