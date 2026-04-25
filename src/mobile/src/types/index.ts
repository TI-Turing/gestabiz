// Tipos principales — Gestabiz Mobile
// Portados desde la web app (src/types/types.ts)

export type UserRole = 'admin' | 'employee' | 'client'

export type EmployeeRole =
  | 'manager'
  | 'professional'
  | 'receptionist'
  | 'accountant'
  | 'support_staff'

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'pending'

export type AbsenceType = 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other'

export type ResourceModel = 'professional' | 'physical_resource' | 'hybrid' | 'group_class'

export interface UserRoleAssignment {
  id: string
  user_id: string
  role: UserRole
  business_id: string | null
  business_name?: string
  is_active: boolean
}

export interface Business {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  owner_id: string
  category_id?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  resource_model: ResourceModel
  is_active: boolean
  created_at: string
}

export interface Location {
  id: string
  business_id: string
  name: string
  address: string
  city?: string
  phone?: string
  opens_at: string
  closes_at: string
  lat?: number
  lng?: number
  is_active: boolean
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  price: number
  duration: number
  category?: string
  image_url?: string
  is_active: boolean
}

export interface Appointment {
  id: string
  business_id: string
  client_id: string
  employee_id?: string
  service_id: string
  location_id?: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes?: string
  price?: number
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  document_type?: string
  document_number?: string
  is_active: boolean
}

export interface Employee {
  id: string
  employee_id: string
  business_id: string
  role: EmployeeRole
  employee_type: string
  status: 'pending' | 'approved' | 'rejected'
  is_active: boolean
  offers_services: boolean
  profile?: Profile
}

export interface EmployeeAbsence {
  id: string
  employee_id: string
  business_id: string
  start_date: string
  end_date: string
  type: AbsenceType
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  created_at: string
}

export interface Review {
  id: string
  business_id: string
  reviewer_id: string
  employee_id?: string
  rating: number
  comment?: string
  response?: string
  review_type: 'business' | 'employee'
  is_visible: boolean
  created_at: string
}

export interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  totalLocations: number
  totalServices: number
  totalEmployees: number
  monthlyRevenue: number
}

export interface Transaction {
  id: string
  business_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  date: string
  created_at: string
}

export interface InAppNotification {
  id: string
  user_id: string
  business_id?: string
  type: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}
