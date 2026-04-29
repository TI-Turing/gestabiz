/**
 * useEmployeeWorkSchedule
 *
 * CRUD de bloques de horario laboral en employee_work_schedule.
 * Permite configurar jornadas partidas (múltiples bloques por día).
 * Utilizado por EmployeeWorkScheduleEditor en Settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import { toast } from 'sonner'
import type { WorkScheduleSlot } from '@/types/types'

// ============================================================================
// QUERY KEYS
// ============================================================================

const SCHEDULE_KEYS = {
  all: (employeeId: string, businessId: string) =>
    ['employee_work_schedule', employeeId, businessId] as const,
}

// ============================================================================
// HOOK
// ============================================================================

export function useEmployeeWorkSchedule(employeeId: string, businessId: string) {
  const queryClient = useQueryClient()

  // ── Leer horarios ────────────────────────────────────────────────────────
  const {
    data: slots = [],
    isLoading,
    error,
  } = useQuery<WorkScheduleSlot[]>({
    queryKey: SCHEDULE_KEYS.all(employeeId, businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_work_schedule')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .order('day_of_week')
        .order('start_time')

      if (error) throw error
      return (data || []) as WorkScheduleSlot[]
    },
    enabled: !!employeeId && !!businessId,
    ...QUERY_CONFIG.STABLE,
  })

  // ── Crear bloque ─────────────────────────────────────────────────────────
  const addSlot = useMutation({
    mutationFn: async (
      slot: Omit<WorkScheduleSlot, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const { data, error } = await supabase
        .from('employee_work_schedule')
        .insert({
          business_id: businessId,
          employee_id: employeeId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_active: slot.is_active ?? true,
        })
        .select()
        .single()

      if (error) throw error
      return data as WorkScheduleSlot
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_KEYS.all(employeeId, businessId),
      })
      toast.success('Bloque de horario agregado')
    },
    onError: (err: Error) => {
      toast.error(`Error al agregar horario: ${err.message}`)
    },
  })

  // ── Actualizar bloque ────────────────────────────────────────────────────
  const updateSlot = useMutation({
    mutationFn: async ({
      id,
      ...changes
    }: Partial<WorkScheduleSlot> & { id: string }) => {
      const { data, error } = await supabase
        .from('employee_work_schedule')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as WorkScheduleSlot
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_KEYS.all(employeeId, businessId),
      })
    },
    onError: (err: Error) => {
      toast.error(`Error al actualizar horario: ${err.message}`)
    },
  })

  // ── Eliminar bloque ──────────────────────────────────────────────────────
  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from('employee_work_schedule')
        .delete()
        .eq('id', slotId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_KEYS.all(employeeId, businessId),
      })
      toast.success('Bloque de horario eliminado')
    },
    onError: (err: Error) => {
      toast.error(`Error al eliminar horario: ${err.message}`)
    },
  })

  // ── Toggle activo/inactivo ───────────────────────────────────────────────
  const toggleSlotActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('employee_work_schedule')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_KEYS.all(employeeId, businessId),
      })
    },
  })

  return {
    slots,
    isLoading,
    error: error as Error | null,
    addSlot: addSlot.mutateAsync,
    updateSlot: updateSlot.mutateAsync,
    deleteSlot: deleteSlot.mutateAsync,
    toggleSlotActive: toggleSlotActive.mutateAsync,
    isAdding: addSlot.isPending,
    isUpdating: updateSlot.isPending,
    isDeleting: deleteSlot.isPending,
  }
}
