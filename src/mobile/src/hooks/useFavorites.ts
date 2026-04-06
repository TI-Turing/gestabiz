import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavoriteBusiness {
  id: string
  user_id: string
  business_id: string
  created_at: string
  business?: {
    id: string
    name: string
    logo_url?: string | null
    category_id?: string | null
  } | null
}

// ─── Hook: useFavorites ───────────────────────────────────────────────────────

export function useFavorites(userId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['favorites', userId]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<FavoriteBusiness[]> => {
      const { data, error } = await supabase
        .from('favorite_businesses')
        .select('id, user_id, business_id, created_at, business:businesses(id, name, logo_url, category_id)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      throwIfError(error, 'FETCH_FAVORITES', 'No se pudieron cargar los favoritos')
      return (data ?? []) as unknown as FavoriteBusiness[]
    },
    enabled: !!userId,
    ...QUERY_CONFIG.STABLE,
  })

  const favorites = query.data ?? []
  const favoriteBusinessIds = new Set(favorites.map(f => f.business_id))

  const addFavorite = useMutation({
    mutationFn: async (businessId: string) => {
      const { data, error } = await supabase
        .from('favorite_businesses')
        .insert({ user_id: userId!, business_id: businessId })
        .select()
        .single()
      throwIfError(error, 'ADD_FAVORITE', 'No se pudo agregar a favoritos')
      return data as FavoriteBusiness
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const removeFavorite = useMutation({
    mutationFn: async (businessId: string) => {
      const { error } = await supabase
        .from('favorite_businesses')
        .delete()
        .eq('user_id', userId!)
        .eq('business_id', businessId)
      throwIfError(error, 'REMOVE_FAVORITE', 'No se pudo eliminar de favoritos')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const toggleFavorite = async (businessId: string) => {
    if (favoriteBusinessIds.has(businessId)) {
      await removeFavorite.mutateAsync(businessId)
    } else {
      await addFavorite.mutateAsync(businessId)
    }
  }

  const isFavorite = (businessId: string) => favoriteBusinessIds.has(businessId)

  return { ...query, favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite }
}
