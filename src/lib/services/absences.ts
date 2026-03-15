/**
 * Servicio de ausencias de empleados
 * Centraliza las queries directas a `employee_absences` y `absence_approval_requests`
 */
import supabase from '@/lib/supabase'
import { throwIfError } from '@/lib/errors'

export interface AbsenceRow {
  id: string
  employee_id: string
  business_id: string
  absence_type: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other'
  start_date: string
  end_date: string
  reason: string
  employee_notes?: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export const absencesService = {
  /** Lista ausencias de un empleado en un negocio */
  async listByEmployee(employeeId: string, businessId: string): Promise<AbsenceRow[]> {
    const { data, error } = await supabase
      .from('employee_absences')
      .select('id, employee_id, business_id, absence_type, start_date, end_date, reason, employee_notes, status, created_at')
      .eq('employee_id', employeeId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    throwIfError(error, 'LIST_EMPLOYEE_ABSENCES', 'No se pudieron cargar las ausencias')
    return (data ?? []) as AbsenceRow[]
  },

  /** Lista TODAS las ausencias de un negocio (vista administrador) */
  async listByBusiness(businessId: string): Promise<AbsenceRow[]> {
    const { data, error } = await supabase
      .from('employee_absences')
      .select('id, employee_id, business_id, absence_type, start_date, end_date, reason, employee_notes, status, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    throwIfError(error, 'LIST_BUSINESS_ABSENCES', 'No se pudieron cargar las ausencias del negocio')
    return (data ?? []) as AbsenceRow[]
  },

  /** Cuenta las citas afectadas por una ausencia (para mostrar antes de aprobar) */
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

  /** Obtiene las citas afectadas con detalle */
  async getAffectedAppointments(
    employeeId: string,
    businessId: string,
    startDate: string,
    endDate: string,
  ) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, start_time, end_time,
        service:service_id(service_name),
        client:client_id(full_name, email)
      `)
      .eq('employee_id', employeeId)
      .eq('business_id', businessId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .neq('status', 'cancelled')
    throwIfError(error, 'GET_AFFECTED_APPOINTMENTS', 'No se pudieron cargar las citas afectadas')
    return data ?? []
  },
}
