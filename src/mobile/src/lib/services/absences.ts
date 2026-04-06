import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AbsenceType = 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other'
export type AbsenceStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Absence {
  id: string
  employee_id: string
  business_id: string
  absence_type: AbsenceType
  start_date: string
  end_date: string
  reason?: string | null
  status: AbsenceStatus
  reviewed_by?: string | null
  reviewed_at?: string | null
  rejection_reason?: string | null
  created_at: string
}

export type AbsenceCreate = {
  employee_id: string
  business_id: string
  absence_type: AbsenceType
  start_date: string
  end_date: string
  reason?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const absencesService = {
  async listByEmployee(employeeId: string, businessId: string): Promise<Absence[]> {
    const { data, error } = await supabase
      .from('employee_absences')
      .select('id, employee_id, business_id, absence_type, start_date, end_date, reason, status, reviewed_by, reviewed_at, rejection_reason, created_at')
      .eq('employee_id', employeeId)
      .eq('business_id', businessId)
      .order('start_date', { ascending: false })
    throwIfError(error, 'LIST_EMPLOYEE_ABSENCES', 'No se pudieron cargar las ausencias')
    return (data ?? []) as Absence[]
  },

  async listByBusiness(businessId: string, status?: AbsenceStatus): Promise<Absence[]> {
    let q = supabase
      .from('employee_absences')
      .select('id, employee_id, business_id, absence_type, start_date, end_date, reason, status, reviewed_by, reviewed_at, rejection_reason, created_at')
      .eq('business_id', businessId)
      .order('start_date', { ascending: false })

    if (status) q = q.eq('status', status)

    const { data, error } = await q
    throwIfError(error, 'LIST_BUSINESS_ABSENCES', 'No se pudieron cargar las ausencias del negocio')
    return (data ?? []) as Absence[]
  },

  async get(id: string): Promise<Absence | null> {
    const { data, error } = await supabase
      .from('employee_absences')
      .select('id, employee_id, business_id, absence_type, start_date, end_date, reason, status, reviewed_by, reviewed_at, rejection_reason, created_at')
      .eq('id', id)
      .maybeSingle()
    throwIfError(error, 'GET_ABSENCE', 'No se pudo obtener la ausencia')
    return data as Absence | null
  },

  async create(payload: AbsenceCreate): Promise<Absence> {
    const { data, error } = await supabase
      .from('employee_absences')
      .insert({ ...payload, status: 'pending' })
      .select()
      .single()
    throwIfError(error, 'CREATE_ABSENCE', 'No se pudo crear la solicitud de ausencia')
    return data as Absence
  },

  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<Absence> {
    const { data, error } = await supabase
      .from('employee_absences')
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
      })
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_ABSENCE_STATUS', 'No se pudo actualizar el estado de la ausencia')
    return data as Absence
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_absences')
      .update({ status: 'cancelled' })
      .eq('id', id)
    throwIfError(error, 'CANCEL_ABSENCE', 'No se pudo cancelar la ausencia')
  },

  /**
   * Count appointments potentially affected by an absence range.
   * Used to show a warning before submitting an absence request.
   */
  async countAffectedAppointments(
    employeeId: string,
    businessId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const { count, error } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .neq('status', 'cancelled')
    throwIfError(error, 'COUNT_AFFECTED_APPOINTMENTS', 'No se pudieron contar las citas afectadas')
    return count ?? 0
  },
}
