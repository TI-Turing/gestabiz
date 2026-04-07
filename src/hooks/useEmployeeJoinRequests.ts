/**
 * useEmployeeJoinRequests — hook for the employee join request flow.
 * - Employee side: search businesses, send request, track status
 * - Admin side: list pending requests, approve, reject, generate invite codes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

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
      const normalizedCode = code.trim().toUpperCase()
      if (!normalizedCode) {
        throw new Error('Ingresa un código válido')
      }

      // Use SECURITY DEFINER RPC to claim the code server-side.
      // This avoids RLS WITH CHECK issues where auth.uid() may not match
      // the client-side employeeId due to token/session edge cases.
      const { data: result, error: rpcError } = await supabase
        .rpc('claim_invite_code', { invite_code_input: normalizedCode })

      if (rpcError) {
        // Convert PostgrestError to a proper Error with a user-friendly message
        const msg = rpcError.message ?? 'Código inválido o vencido'
        throw new Error(
          msg.includes('no encontrado') || msg.includes('ya fue usado')
            ? 'Código no encontrado o ya fue usado'
            : msg.includes('vencido')
            ? 'El código ha vencido'
            : msg.includes('autenticado')
            ? 'Debes iniciar sesión para usar un código de invitación'
            : 'Código inválido o vencido'
        )
      }

      if (!result) {
        throw new Error('Error al procesar el código')
      }

      const rpcData = result as {
        request_id: string
        business_id: string
        business_name: string | null
        owner_id: string | null
      }

      // Fetch employee name for notification content
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', employeeId)
        .maybeSingle()

      return {
        businessId: rpcData.business_id,
        businessName: rpcData.business_name ?? null,
        ownerUserId: rpcData.owner_id ?? null,
        employeeName: profile?.full_name ?? profile?.email ?? 'Un empleado',
      }
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['join-requests-mine', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['join-requests-pending', data.businessId] })

      // Notify business owner in-app + email
      if (data.ownerUserId) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'employee_request_new',
              recipient_user_id: data.ownerUserId,
              business_id: data.businessId,
              data: {
                business_name: data.businessName,
                employee_name: data.employeeName,
                message: `${data.employeeName} quiere unirse a tu equipo usando tu código de invitación.`,
              },
              force_channels: ['in_app', 'email'],
              action_url: '/app/admin/employees',
              priority: 1,
            },
          })
        } catch (err) {
          void logger.error(
            'useClaimInviteCode: failed to send admin notification',
            err instanceof Error ? err : new Error(String(err)),
            { component: 'useClaimInviteCode' }
          )
        }
      }
    },
  })
}

// =====================================================
// ADMIN SIDE: manage requests
// =====================================================

export function usePendingJoinRequests(businessId: string | null | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!businessId) return
    const channel = supabase
      .channel(`join-requests-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_join_requests',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['join-requests-pending', businessId] })
        }
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [businessId, queryClient])

  return useQuery({
    queryKey: ['join-requests-pending', businessId],
    queryFn: async () => {
      if (!businessId) return []

      // Step 1: fetch requests (no profile join — FK points to auth.users, not profiles)
      const { data: rows, error } = await supabase
        .from('employee_join_requests')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .not('employee_id', 'is', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      if (!rows || rows.length === 0) return []

      // Step 2: batch-fetch profiles for all employee_ids
      const ids = rows.map(r => r.employee_id as string)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', ids)

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

      return rows.map(r => ({
        ...r,
        employee: r.employee_id ? (profileMap.get(r.employee_id) ?? undefined) : undefined,
      })) as JoinRequest[]
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
        role: 'employee',
        employee_type: 'service_provider',
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
      queryClient.invalidateQueries({ queryKey: ['pending-setup-employees', businessId] })
      queryClient.refetchQueries({ queryKey: ['businessHierarchy', businessId] })
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
      let attempt = 0
      let lastError: unknown = null
      while (attempt < 3) {
        attempt += 1
        const code = generateCode()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const { error } = await supabase.from('employee_join_requests').insert({
          business_id: businessId,
          employee_id: null,
          invite_code: code,
          invite_code_expires_at: expiresAt,
          status: 'pending',
        })
        if (!error) {
          return code
        }

        lastError = error
        if (error.code !== '23505') {
          throw error
        }
        // Retry on code collision
      }

      throw lastError instanceof Error ? lastError : new Error('Error al generar el código')
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

/**
 * Eliminates an unclaimed invite code (row where employee_id IS NULL).
 * If the code was already claimed, the delete is a no-op (the code is already
 * linked to an employee and the RPC will refuse any reuse attempt anyway).
 */
export function useDeleteInviteCode(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from('employee_join_requests')
        .delete()
        .eq('id', codeId)
        .is('employee_id', null) // safety: never delete claimed rows
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Código eliminado. Ya no podrá ser usado.')
      queryClient.invalidateQueries({ queryKey: ['join-invite-codes', businessId] })
    },
    onError: (err: Error) => {
      toast.error(`Error al eliminar código: ${err.message}`)
    },
  })
}
