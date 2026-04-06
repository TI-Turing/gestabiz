import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Appointment {
  id: string
  business_id: string
  service_id: string
  employee_id: string
  client_id: string
  location_id?: string | null
  resource_id?: string | null
  start_time: string      // ISO
  end_time: string        // ISO
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  price?: number | null
  currency?: string | null
  notes?: string | null
  client_notes?: string | null
  reminder_sent?: boolean
  created_at: string
  updated_at?: string
}

export interface AppointmentQuery {
  businessId?: string
  employeeId?: string
  clientId?: string
  dateRange?: { start: string; end: string }
  status?: Appointment['status'][]
  limit?: number
  offset?: number
  order?: 'asc' | 'desc'
}

export interface CreateAppointmentPayload extends Omit<Appointment, 'id' | 'created_at' | 'updated_at'> {}

// ─── Service ──────────────────────────────────────────────────────────────────

export const appointmentsService = {
  async list(q: AppointmentQuery = {}): Promise<Appointment[]> {
    let query = supabase
      .from('appointments')
      .select('*')

    if (q.businessId) query = query.eq('business_id', q.businessId)
    if (q.employeeId) query = query.eq('employee_id', q.employeeId)
    if (q.clientId) query = query.eq('client_id', q.clientId)
    if (q.status?.length) query = query.in('status', q.status)
    if (q.dateRange) {
      query = query
        .gte('start_time', q.dateRange.start)
        .lte('start_time', q.dateRange.end)
    }

    query = query.order('start_time', { ascending: q.order !== 'desc' })
    if (q.limit) query = query.limit(q.limit)
    if (q.offset) query = query.range(q.offset, q.offset + (q.limit ?? 20) - 1)

    const { data, error } = await query
    throwIfError(error, 'LIST_APPOINTMENTS', 'No se pudieron cargar las citas')
    return (data ?? []) as Appointment[]
  },

  async get(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()
    throwIfError(error, 'GET_APPOINTMENT', 'No se pudo cargar la cita')
    return data as Appointment | null
  },

  async create(payload: CreateAppointmentPayload): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert(payload)
      .select()
      .single()
    throwIfError(error, 'CREATE_APPOINTMENT', 'No se pudo crear la cita')
    return data as Appointment
  },

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'UPDATE_APPOINTMENT', 'No se pudo actualizar la cita')
    return data as Appointment
  },

  async cancel(id: string, reason?: string): Promise<void> {
    const updates: Partial<Appointment> = { status: 'cancelled' }
    if (reason) updates.notes = reason
    const { error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
    throwIfError(error, 'CANCEL_APPOINTMENT', 'No se pudo cancelar la cita')
  },

  /** Checks overlap for a given employee + time range */
  async hasOverlap(
    employeeId: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<boolean> {
    let query = supabase
      .from('appointments')
      .select('id')
      .eq('employee_id', employeeId)
      .lt('start_time', endTime)
      .gt('end_time', startTime)
      .neq('status', 'cancelled')

    if (excludeId) query = query.neq('id', excludeId)

    const { data, error } = await query
    throwIfError(error, 'CHECK_OVERLAP', 'No se pudo verificar disponibilidad')
    return (data ?? []).length > 0
  },
}
