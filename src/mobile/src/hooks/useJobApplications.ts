import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'
import { QUERY_CONFIG } from '../lib/queryClient'

export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn'

export interface JobApplication {
  id: string
  vacancy_id: string
  employee_id: string
  business_id: string
  status: ApplicationStatus
  cover_letter?: string | null
  cv_url?: string | null
  availability_notes?: string | null
  created_at: string
}

async function fetchApplications(vacancyId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, vacancy_id, employee_id, business_id, status, cover_letter, cv_url, availability_notes, created_at')
    .eq('vacancy_id', vacancyId)
    .order('created_at', { ascending: false })
  throwIfError(error, 'FETCH_APPLICATIONS', 'No se pudieron cargar las aplicaciones')
  return (data ?? []) as JobApplication[]
}

async function fetchMyApplications(employeeId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, vacancy_id, employee_id, business_id, status, cover_letter, cv_url, availability_notes, created_at')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  throwIfError(error, 'FETCH_MY_APPLICATIONS', 'No se pudieron cargar sus aplicaciones')
  return (data ?? []) as JobApplication[]
}

export function useJobApplications(vacancyId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['job-applications', vacancyId]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchApplications(vacancyId!),
    enabled: !!vacancyId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id)
      throwIfError(error, 'UPDATE_APPLICATION', 'No se pudo actualizar la aplicación')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { ...query, applications: query.data ?? [], updateStatus }
}

export function useMyJobApplications(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['my-job-applications', employeeId],
    queryFn: () => fetchMyApplications(employeeId!),
    enabled: !!employeeId,
    ...QUERY_CONFIG.FREQUENT,
  })
}
