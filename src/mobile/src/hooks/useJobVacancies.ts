import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vacanciesService, VacancyCreate, VacancyUpdate } from '../lib/services/vacancies'
import { QUERY_CONFIG } from '../lib/queryClient'

export function useJobVacancies(businessId: string | undefined, activeOnly = false) {
  const queryClient = useQueryClient()
  const queryKey = ['job-vacancies', businessId, activeOnly]

  const query = useQuery({
    queryKey,
    queryFn: () => vacanciesService.list({ businessId, activeOnly }),
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  const create = useMutation({
    mutationFn: (payload: VacancyCreate) => vacanciesService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: VacancyUpdate }) =>
      vacanciesService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => vacanciesService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      vacanciesService.toggleActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...query, vacancies: query.data ?? [], create, update, remove, toggleActive }
}
