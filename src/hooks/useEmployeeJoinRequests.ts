/**
 * useEmployeeJoinRequests — hook for the employee join request flow.
 * - Employee side: search businesses, send request, track status
 * - Admin side: list pending requests, approve, reject, generate invite codes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// =====================================================
// TYPES
// =====================================================

export interface JoinRequest {
  id: string
  employee_id: string | null
  business_id: string
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  invite_code: string | null
  invite_code_expires_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  // Joined
  employee?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  business?: {
    id: string
    name: string
    logo_url: string | null
    city: string | null
    category_id: string | null
  }
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// =====================================================
// EMPLOYEE SIDE: my requests
// =====================================================

export function useMyJoinRequests(employeeId: string | null | undefined) {
  return useQuery({
    queryKey: ['join-requests-mine', employeeId],
    queryFn: async () => {
      if (!employeeId) return []
      const { data, error } = await supabase
        .from('employee_join_requests')
        .select('*, business:businesses(id, name, logo_url, city, category_id)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as JoinRequest[]
    },
    enabled: !!employeeId,
    staleTime: 30_000,
  })
}

export function useSendJoinRequest(employeeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ businessId, message }: { businessId: string; message?: string }) => {
      // Check no active request exists
      const { data: existing } = await supabase
        .from('employee_join_requests')
        .select('id, status')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) throw new Error('Ya tienes una solicitud pendiente para este negocio')

      const { error } = await supabase.from('employee_join_requests').insert({
        employee_id: employeeId,
        business_id: businessId,
        message: message?.trim() || null,
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests-mine', employeeId] })
    },
  })
}

export function useClaimInviteCode(employeeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      // Find the invite code
      const { data: invite, error: findError } = await supabase
        .from('employee_join_requests')
        .select('id, business_id, invite_code_expires_at, employee_id')
        .eq('invite_code', code.toUpperCase().trim())
        .maybeSingle()

      if (findError) throw findError
      if (!invite) throw new Error('Código no encontrado')
      if (invite.employee_id) throw new Error('Este código ya fue usado')
      if (invite.invite_code_expires_at && new Date(invite.invite_code_expires_at) < new Date()) {
        throw new Error('El código ha vencido')
      }

      // Claim: attach employee_id and set to pending (admin will approve)
      const { error: claimError } = await supabase
        .from('employee_join_requests')
        .update({ employee_id: employeeId, status: 'pending' })
        .eq('id', invite.id)
      if (claimError) throw claimError

      return { businessId: invite.business_id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests-mine', employeeId] })
    },
  })
}

// =====================================================
// ADMIN SIDE: manage requests
// =====================================================

export function usePendingJoinRequests(businessId: string | null | undefined) {
  return useQuery({
    queryKey: ['join-requests-pending', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const { data, error } = await supabase
        .from('employee_join_requests')
        .select(`
          *,
          employee:profiles!employee_id(id, full_name, email, avatar_url)
        `)
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .not('employee_id', 'is', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as JoinRequest[]
    },
    enabled: !!businessId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useApproveJoinRequest(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      employeeId,
    }: {
      requestId: string
      employeeId: string
    }) => {
      // 1. Insert into business_employees
      const { error: insertError } = await supabase.from('business_employees').upsert({
        employee_id: employeeId,
        business_id: businessId,
        role: 'professional',
        employee_type: 'full_time',
        status: 'approved',
        is_active: true,
        offers_services: true,
        hire_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'employee_id,business_id' })
      if (insertError) throw insertError

      // 2. Mark request approved
      const { error: updateError } = await supabase
        .from('employee_join_requests')
        .update({
          status: 'approved',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
      if (updateError) throw updateError
    },
    onSuccess: () => {
      toast.success('Solicitud aprobada. El empleado ha sido añadido al negocio.')
      queryClient.invalidateQueries({ queryKey: ['join-requests-pending', businessId] })
      queryClient.invalidateQueries({ queryKey: ['businessHierarchy', businessId] })
    },
    onError: (err: Error) => {
      toast.error(`Error al aprobar: ${err.message}`)
    },
  })
}

export function useRejectJoinRequest(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string
      reason?: string
    }) => {
      const { error } = await supabase
        .from('employee_join_requests')
        .update({
          status: 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason ?? null,
        })
        .eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Solicitud rechazada.')
      queryClient.invalidateQueries({ queryKey: ['join-requests-pending', businessId] })
    },
    onError: (err: Error) => {
      toast.error(`Error al rechazar: ${err.message}`)
    },
  })
}

export function useGenerateInviteCode(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<string> => {
      const code = generateCode()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase.from('employee_join_requests').insert({
        business_id: businessId,
        employee_id: null,
        invite_code: code,
        invite_code_expires_at: expiresAt,
        status: 'pending',
      })
      if (error) throw error
      return code
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-invite-codes', businessId] })
    },
    onError: (err: Error) => {
      toast.error(`Error al generar código: ${err.message}`)
    },
  })
}

export function useActiveInviteCodes(businessId: string | null | undefined) {
  return useQuery({
    queryKey: ['join-invite-codes', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const { data, error } = await supabase
        .from('employee_join_requests')
        .select('id, invite_code, invite_code_expires_at, created_at')
        .eq('business_id', businessId)
        .is('employee_id', null)
        .not('invite_code', 'is', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).filter(
        r => r.invite_code_expires_at && new Date(r.invite_code_expires_at) > new Date()
      )
    },
    enabled: !!businessId,
    staleTime: 60_000,
  })
}
