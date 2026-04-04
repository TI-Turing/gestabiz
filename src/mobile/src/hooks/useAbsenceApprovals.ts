import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { absencesService } from '../lib/services/absences'
import { QUERY_CONFIG } from '../lib/queryClient'

/**
 * Perspective: Admin — view and manage absence requests for a business.
 */
export function useAbsenceApprovals(businessId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['absence-approvals', businessId]

  const query = useQuery({
    queryKey,
    queryFn: () => absencesService.listByBusiness(businessId!),
    enabled: !!businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const approve = useMutation({
    mutationFn: ({ id, reviewedBy }: { id: string; reviewedBy: string }) =>
      absencesService.updateStatus(id, 'approved', reviewedBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const reject = useMutation({
    mutationFn: ({ id, reviewedBy, reason }: { id: string; reviewedBy: string; reason?: string }) =>
      absencesService.updateStatus(id, 'rejected', reviewedBy, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const pending = (query.data ?? []).filter(a => a.status === 'pending')
  const approved = (query.data ?? []).filter(a => a.status === 'approved')

  return { ...query, absences: query.data ?? [], pending, approved, approve, reject }
}
