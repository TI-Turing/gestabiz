import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger'

/**
 * Interface para los datos de favoritos que vienen de la RPC function
 */
export interface FavoriteBusiness {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  average_rating: number;
  review_count: number;
  is_active: boolean;
  favorited_at: string;
}

/**
 * Hook para gestionar favoritos de negocios
 * 
 * Características:
 * - Obtener lista de favoritos del usuario
 * - Toggle (marcar/desmarcar) favorito
 * - Verificar si un negocio es favorito
 * - Realtime subscriptions para sincronización multi-dispositivo
 * - Optimistic updates para mejor UX
 */
export function useFavorites(userId?: string) {
  const [favorites, setFavorites] = useState<FavoriteBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient(); // FIX: Agregar queryClient para invalidar cache del dashboard

  /**
   * Fetch favorites usando RPC function
   */
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_user_favorite_businesses');

      if (fetchError) throw fetchError;

      const favoritesData = (data || []) as FavoriteBusiness[];
      setFavorites(favoritesData);

      // Crear Set de IDs para verificación rápida
      const ids = new Set(favoritesData.map(fav => fav.id));
      setFavoriteIds(ids);

    } catch (err) {
      void logger.error('useFavorites: operation failed', err instanceof Error ? err : new Error(String(err)), { component: 'useFavorites' })
      const error = err as Error;
      setError(error);
       
      toast.error('Error al cargar favoritos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Toggle favorite (marcar/desmarcar) con optimistic update
   */
  const toggleFavorite = useCallback(async (businessId: string, businessName?: string): Promise<boolean> => {
    if (!userId) {
      toast.error('Debes iniciar sesión para marcar favoritos');
      return false;
    }

    // Optimistic update
    const wasAlreadyFavorite = favoriteIds.has(businessId);
    const newFavoriteIds = new Set(favoriteIds);
    
    if (wasAlreadyFavorite) {
      newFavoriteIds.delete(businessId);
      setFavoriteIds(newFavoriteIds);
      setFavorites(prev => prev.filter(fav => fav.id !== businessId));
    } else {
      newFavoriteIds.add(businessId);
      setFavoriteIds(newFavoriteIds);
    }

    try {
      const { data, error: toggleError } = await supabase
        .rpc('toggle_business_favorite', { p_business_id: businessId });

      if (toggleError) throw toggleError;

      const isNowFavorite = data as boolean;

      // Mostrar toast según el resultado
      if (isNowFavorite) {
        toast.success(businessName ? `${businessName} agregado a favoritos` : 'Agregado a favoritos');
      } else {
        toast.info(businessName ? `${businessName} eliminado de favoritos` : 'Eliminado de favoritos');
      }

      // Refetch para sincronizar con datos reales
      await fetchFavorites();

      // FIX CRÍTICO: Invalidar query del dashboard para que se actualice la lista de favoritos
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });

      return isNowFavorite;

    } catch (err) {
      void logger.error('useFavorites: operation failed', err instanceof Error ? err : new Error(String(err)), { component: 'useFavorites' })
      const error = err as Error;
       
      // Revert optimistic update
      setFavoriteIds(new Set(favoriteIds));
      await fetchFavorites();

      toast.error('Error al actualizar favorito');
      return wasAlreadyFavorite;
    }
  }, [userId, favoriteIds, fetchFavorites]);

  /**
   * Verificar si un negocio es favorito (optimizado con Set local)
   */
  const isFavorite = useCallback((businessId: string): boolean => {
    return favoriteIds.has(businessId);
  }, [favoriteIds]);

  /**
   * Verificar si un negocio es favorito (desde BD - más confiable pero más lento)
   */
  const checkIsFavorite = useCallback(async (businessId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { data, error: checkError } = await supabase
        .rpc('is_business_favorite', { p_business_id: businessId });

      if (checkError) throw checkError;

      return data as boolean;

    } catch (err) {
      void logger.error('useFavorites: operation failed', err instanceof Error ? err : new Error(String(err)), { component: 'useFavorites' })
       
      return false;
    }
  }, [userId]);

  /**
   * Effect: Fetch favorites on mount y cuando userId cambia
   */
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Stable ref for fetchFavorites to avoid realtime subscription cycling
  const fetchFavoritesRef = useRef(fetchFavorites);
  fetchFavoritesRef.current = fetchFavorites;

  /**
   * Effect: Realtime subscription para cambios en favoritos
   * Usa nombre de canal único por instancia para evitar conflictos cuando
   * múltiples componentes montan useFavorites simultáneamente (ej: FavoritesList + BusinessProfile).
   * usa removeChannel() en cleanup para eliminar el canal del registro interno de Supabase.
   */
  useEffect(() => {
    if (!userId) return;

    // Nombre único por instancia: evita el error
    // "cannot add postgres_changes callbacks after subscribe()"
    const channelName = `favorites:${userId}:${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_favorites',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchFavoritesRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [userId]);

  return {
    favorites,
    loading,
    error,
    favoriteIds,
    toggleFavorite,
    isFavorite,
    checkIsFavorite,
    refetch: fetchFavorites,
  };
}
