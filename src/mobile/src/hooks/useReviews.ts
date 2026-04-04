import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsService, ReviewCreate, ReviewQuery } from '../lib/services/reviews'
import { QUERY_CONFIG } from '../lib/queryClient'

export function useReviews(query: ReviewQuery = {}) {
  const queryClient = useQueryClient()
  const queryKey = ['reviews', JSON.stringify(query)]

  const fetched = useQuery({
    queryKey,
    queryFn: () => reviewsService.list(query),
    enabled: !!(query.businessId || query.employeeId || query.clientId),
    ...QUERY_CONFIG.STABLE,
  })

  const create = useMutation({
    mutationFn: (payload: ReviewCreate) => reviewsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const respond = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      reviewsService.respond(id, response),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const toggleVisibility = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      reviewsService.toggleVisibility(id, isVisible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => reviewsService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...fetched, reviews: fetched.data ?? [], create, respond, toggleVisibility, remove }
}
