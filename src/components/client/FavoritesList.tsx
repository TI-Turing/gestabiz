import { useCallback } from 'react';
import * as Sentry from '@sentry/react'
import { useQueryClient } from '@tanstack/react-query';
import { FavoriteBusiness, useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { Lightbulb } from '@phosphor-icons/react';
import { BusinessCard } from '@/components/cards/BusinessCard';

interface FavoritesListProps {
  favorites: FavoriteBusiness[];
  loading: boolean;
  onBookAppointment?: (businessId?: string, serviceId?: string, locationId?: string, employeeId?: string) => void;
  /** Callback para abrir el perfil de un negocio (manejado por el padre ClientDashboard) */
  onViewProfile?: (businessId: string) => void;
}

/**
 * FavoritesList - Componente para mostrar y gestionar negocios favoritos
 * OPTIMIZADO: Recibe favorites como prop desde ClientDashboard para evitar query duplicada
 * 
 * Características:
 * - Grid responsive de tarjetas de negocios
 * - Click en tarjeta abre BusinessProfile modal
 * - Botón "Reservar" para agendar cita rápidamente
 * - Empty state cuando no hay favoritos
 * - Loading states
 */
export default function FavoritesList({ favorites, loading, onBookAppointment, onViewProfile }: FavoritesListProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toggleFavorite } = useFavorites(user?.id);
  const queryClient = useQueryClient();

  // Función para remover de favoritos
  const handleRemoveFavorite = async (businessId: string) => {
    try {
      // toggleFavorite retorna true si se agregó, false si se quitó
      // Como estamos en favoritos, siempre debería quitar (retornar false)
      await toggleFavorite(businessId);
      
      // Invalidar query del dashboard para refrescar la lista
      // El hook useFavorites ya maneja su propio toast
      queryClient.invalidateQueries({ queryKey: ['client-dashboard-data'] });
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'FavoritesList' } })
      // El error ya se maneja en useFavorites con su propio toast    }
  };

  // ✅ OPTIMIZACIÓN: Definir useCallback ANTES de early returns (hooks rules)
  const renderBusinessCard = useCallback((business: FavoriteBusiness) => (
    <BusinessCard
      key={business.id}
      businessId={business.id}
      initialData={{
        id: business.id,
        name: business.name,
        description: business.description,
        logo_url: business.logo_url,
        banner_url: business.banner_url,
        city: business.city,
        average_rating: business.average_rating,
        total_reviews: business.review_count,
      }}
      panoramic
      onSelect={() => onViewProfile?.(business.id)}
      renderActions={(id) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveFavorite(id);
          }}
          className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
          title={t('favoritesList.removeFavorite')}
        >
          <Heart className="h-5 w-5 text-primary fill-primary" />
        </button>
      )}
    >
      <Button
        variant="default"
        className="w-full bg-primary hover:bg-primary/90 shadow-lg"
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile?.(business.id);
        }}
      >
        {t('favoritesList.bookButton')}
      </Button>
    </BusinessCard>
  ), [t, handleRemoveFavorite, onViewProfile]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-center">{t('favoritesList.loading')}</p>
      </div>
    );
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-muted/30 rounded-full p-6 mb-6">
          <Heart className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          {t('favoritesList.emptyTitle')}
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          {t('favoritesList.emptyDescription')}
        </p>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-md">
          <p className="text-sm text-primary font-medium">
            {t('favoritesList.tipHeader')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pt-8 sm:pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            {t('favoritesList.myFavorites')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {favorites.length} {favorites.length === 1 ? t('favoritesList.businessMarked') : t('favoritesList.businessesMarked')} {t('favoritesList.tipDescription')}
          </p>
        </div>
      </div>

      {/* Grid de tarjetas - 2 columnas máximo para cards más anchas y mostrar banner completo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {favorites.map(business => renderBusinessCard(business))}
      </div>

      {/* Info adicional */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Lightbulb size={18} weight="fill" /> <strong className="text-foreground">Tip:</strong> {t('favoritesList.tipDescription')}
        </p>
      </div>
    </div>
  );
}
