import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { absencesService, AbsenceStatus } from '../lib/services/absences'
import { QUERY_CONFIG } from '../lib/queryClient'

/**
 * Perspective: Employee — view my own absences for a business.
 */
export function useEmployeeAbsences(
  employeeId: string | undefined,
  businessId: string | undefined,
) {
  const queryClient = useQueryClient()
  const queryKey = ['employee-absences', employeeId, businessId]

  const query = useQuery({
    queryKey,
    queryFn: () => absencesService.listByEmployee(employeeId!, businessId!),
    enabled: !!employeeId && !!businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const requestAbsence = useMutation({
    mutationFn: absencesService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const cancelAbsence = useMutation({
    mutationFn: (id: string) => absencesService.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...query, absences: query.data ?? [], requestAbsence, cancelAbsence }
}
