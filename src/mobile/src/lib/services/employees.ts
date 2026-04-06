import supabase from '../supabase'
import { throwIfError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployeeProfile {
  id: string               // matches profiles.id / auth.uid()
  business_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  role: 'manager' | 'professional' | 'receptionist' | 'accountant' | 'support_staff'
  employee_type?: string | null
  is_active?: boolean
  status?: string | null
  allow_client_messages?: boolean
  hire_date?: string | null
  lunch_break_start?: string | null  // HH:mm
  lunch_break_end?: string | null    // HH:mm
  created_at?: string
}

export interface EmployeeWithProfile extends EmployeeProfile {
  profile?: {
    full_name?: string
    email?: string
    avatar_url?: string
  } | null
}

export interface EmployeeQuery {
  businessId?: string
  locationId?: string
  status?: string
  activeOnly?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const employeesService = {
  async list(q: EmployeeQuery = {}): Promise<EmployeeProfile[]> {
    let query = supabase
      .from('business_employees')
      .select(`
        employee_id,
        business_id,
        role,
        employee_type,
        is_active,
        status,
        allow_client_messages,
        hire_date,
        lunch_break_start,
        lunch_break_end,
        created_at,
        profile:employee_id(full_name, email, phone, avatar_url)
      `)

    if (q.businessId) query = query.eq('business_id', q.businessId)
    if (q.status) query = query.eq('status', q.status)
    else query = query.eq('status', 'approved')
    if (q.activeOnly !== false) query = query.eq('is_active', true)

    const { data, error } = await query.order('created_at', { ascending: false })
    throwIfError(error, 'LIST_EMPLOYEES', 'No se pudieron cargar los empleados')

    const rows = (data as unknown as Array<{
      employee_id: string
      business_id: string
      role: EmployeeProfile['role']
      employee_type: string | null
      is_active: boolean
      status: string | null
      allow_client_messages: boolean
      hire_date: string | null
      lunch_break_start: string | null
      lunch_break_end: string | null
      created_at: string
      profile: { full_name?: string; email?: string; phone?: string; avatar_url?: string } | null
    }> | null) ?? []

    return rows.map(r => ({
      id: r.employee_id,
      business_id: r.business_id,
      full_name: r.profile?.full_name ?? '',
      email: r.profile?.email ?? null,
      phone: r.profile?.phone ?? null,
      avatar_url: r.profile?.avatar_url ?? null,
      role: r.role,
      employee_type: r.employee_type,
      is_active: r.is_active,
      status: r.status,
      allow_client_messages: r.allow_client_messages,
      hire_date: r.hire_date,
      lunch_break_start: r.lunch_break_start,
      lunch_break_end: r.lunch_break_end,
      created_at: r.created_at,
    }))
  },

  async get(employeeId: string, businessId: string): Promise<EmployeeProfile | null> {
    const { data, error } = await supabase
      .from('business_employees')
      .select(`
        employee_id, business_id, role, employee_type, is_active, status,
        allow_client_messages, hire_date, lunch_break_start, lunch_break_end, created_at,
        profile:employee_id(full_name, email, phone, avatar_url)
      `)
      .eq('employee_id', employeeId)
      .eq('business_id', businessId)
      .single()
    throwIfError(error, 'GET_EMPLOYEE', 'No se pudo cargar el empleado')
    if (!data) return null
    const r = data as unknown as {
      employee_id: string
      business_id: string
      role: EmployeeProfile['role']
      employee_type: string | null
      is_active: boolean
      status: string | null
      allow_client_messages: boolean
      hire_date: string | null
      lunch_break_start: string | null
      lunch_break_end: string | null
      created_at: string
      profile: { full_name?: string; email?: string; phone?: string; avatar_url?: string } | null
    }
    return {
      id: r.employee_id,
      business_id: r.business_id,
      full_name: r.profile?.full_name ?? '',
      email: r.profile?.email ?? null,
      phone: r.profile?.phone ?? null,
      avatar_url: r.profile?.avatar_url ?? null,
      role: r.role,
      employee_type: r.employee_type,
      is_active: r.is_active,
      status: r.status,
      allow_client_messages: r.allow_client_messages,
      hire_date: r.hire_date,
      lunch_break_start: r.lunch_break_start,
      lunch_break_end: r.lunch_break_end,
      created_at: r.created_at,
    }
  },

  async update(
    employeeId: string,
    businessId: string,
    updates: Partial<{
      role: EmployeeProfile['role']
      is_active: boolean
      allow_client_messages: boolean
      lunch_break_start: string | null
      lunch_break_end: string | null
    }>,
  ): Promise<void> {
    const { error } = await supabase
      .from('business_employees')
      .update(updates)
      .eq('employee_id', employeeId)
      .eq('business_id', businessId)
    throwIfError(error, 'UPDATE_EMPLOYEE', 'No se pudo actualizar el empleado')
  },
}
