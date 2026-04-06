import { useCallback } from 'react'
import supabase from '../lib/supabase'
import { throwIfError } from '../lib/services/errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlotConflict {
  appointmentId: string
  clientId: string
  start: string
  end: string
}

export interface AvailabilityResult {
  available: boolean
  conflicts: SlotConflict[]
  isOnAbsence: boolean
  isOnLunch: boolean
}

// ─── Hook: useAssigneeAvailability ────────────────────────────────────────────

export function useAssigneeAvailability() {
  /**
   * Check if an employee is available for the given ISO datetime slot.
   * Validates: existing appointments (overlap), approved absences, lunch break.
   */
  const checkAvailability = useCallback(
    async (
      employeeId: string,
      startISO: string,
      endISO: string,
      excludeAppointmentId?: string
    ): Promise<AvailabilityResult> => {
      const startTime = new Date(startISO)
      const endTime = new Date(endISO)

      // ── 1. Check appointment overlaps ──────────────────────────────────────
      let aptQuery = supabase
        .from('appointments')
        .select('id, client_id, start_time, end_time')
        .eq('employee_id', employeeId)
        .not('status', 'in', '("cancelled","rejected")')
        .lt('start_time', endISO)
        .gt('end_time', startISO)

      if (excludeAppointmentId) {
        aptQuery = aptQuery.neq('id', excludeAppointmentId)
      }

      const { data: apts, error: aptErr } = await aptQuery
      throwIfError(aptErr, 'CHECK_APT_OVERLAP', 'No se pudo verificar disponibilidad de citas')

      const conflicts: SlotConflict[] = (apts ?? []).map((a: Record<string, unknown>) => ({
        appointmentId: a.id as string,
        clientId: a.client_id as string,
        start: a.start_time as string,
        end: a.end_time as string,
      }))

      // ── 2. Check approved absences ────────────────────────────────────────
      const dateStr = startTime.toISOString().split('T')[0]

      const { data: absences, error: absErr } = await supabase
        .from('employee_absences')
        .select('id, start_date, end_date')
        .eq('employee_id', employeeId)
        .eq('status', 'approved')
        .lte('start_date', dateStr)
        .gte('end_date', dateStr)

      throwIfError(absErr, 'CHECK_ABSENCE', 'No se pudo verificar ausencias')
      const isOnAbsence = (absences?.length ?? 0) > 0

      // ── 3. Check lunch break ──────────────────────────────────────────────
      const { data: empData, error: empErr } = await supabase
        .from('business_employees')
        .select('lunch_break_start, lunch_break_end')
        .eq('employee_id', employeeId)
        .maybeSingle()

      throwIfError(empErr, 'CHECK_LUNCH', 'No se pudo verificar el horario de almuerzo')

      let isOnLunch = false
      if (empData?.lunch_break_start && empData?.lunch_break_end) {
        const slotHour = startTime.getHours() * 60 + startTime.getMinutes()
        const [lsh, lsm] = (empData.lunch_break_start as string).split(':').map(Number)
        const [leh, lem] = (empData.lunch_break_end as string).split(':').map(Number)
        const lunchStart = lsh * 60 + lsm
        const lunchEnd = leh * 60 + lem
        const slotEnd = endTime.getHours() * 60 + endTime.getMinutes()
        isOnLunch = slotHour < lunchEnd && slotEnd > lunchStart
      }

      return {
        available: conflicts.length === 0 && !isOnAbsence && !isOnLunch,
        conflicts,
        isOnAbsence,
        isOnLunch,
      }
    },
    []
  )

  return { checkAvailability }
}
