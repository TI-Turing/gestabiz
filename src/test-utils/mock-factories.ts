import type {
  User,
  Business,
  Appointment,
  Service,
  Location,
  Review,
  InAppNotification,
  Conversation,
  Message,
  BusinessEmployee,
  BusinessResource,
  Transaction,
  RecurringExpense,
  UserPermission,
  UserRole,
  TransactionCategory,
} from '@/types/types'
import type { JobVacancy } from '@/hooks/useJobVacancies'
import type { JobApplication } from '@/hooks/useJobApplications'

// ─── Helpers ───────────────────────────────────────────────

let counter = 0
function uid(): string {
  counter++
  return `00000000-0000-4000-a000-${String(counter).padStart(12, '0')}`
}

function isoNow(): string {
  return new Date().toISOString()
}

// ─── User ──────────────────────────────────────────────────

export function createMockUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? uid()
  return {
    id,
    email: `usuario${id.slice(-4)}@test.com`,
    name: 'Carlos Rodríguez',
    avatar_url: undefined,
    timezone: 'America/Bogota',
    roles: [],
    activeRole: 'client' as UserRole,
    role: 'client' as UserRole,
    phone: '+573001234567',
    language: 'es',
    notification_preferences: {
      email: true,
      push: true,
      browser: true,
      whatsapp: false,
      reminder_24h: true,
      reminder_1h: true,
      reminder_15m: false,
      daily_digest: false,
      weekly_report: false,
    },
    permissions: [],
    created_at: isoNow(),
    is_active: true,
    ...overrides,
  }
}

// ─── Business ──────────────────────────────────────────────

export function createMockBusiness(overrides: Partial<Business> = {}): Business {
  const id = overrides.id ?? uid()
  return {
    id,
    name: 'Salón Belleza Medellín',
    description: 'Salón de belleza profesional',
    owner_id: uid(),
    slug: 'salon-belleza-medellin',
    is_active: true,
    is_public: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    city: 'Medellín',
    country: 'Colombia',
    resource_model: 'professional',
    settings: {
      appointment_buffer: 15,
      advance_booking_days: 30,
      cancellation_policy: 24,
      auto_confirm: true,
      require_deposit: false,
      deposit_percentage: 0,
      currency: 'COP',
    },
    ...overrides,
  }
}

// ─── Service ───────────────────────────────────────────────

export function createMockService(overrides: Partial<Service> = {}): Service {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    name: 'Corte de cabello',
    description: 'Corte profesional con estilista',
    duration: 45,
    price: 35000,
    currency: 'COP',
    category: 'belleza',
    is_active: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── Location ──────────────────────────────────────────────

export function createMockLocation(overrides: Partial<Location> = {}): Location {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    name: 'Sede Principal',
    address: 'Calle 50 #65-20, El Poblado',
    city: 'Medellín',
    state: 'Antioquia',
    country: 'Colombia',
    postal_code: '050021',
    latitude: 6.2087,
    longitude: -75.5743,
    is_active: true,
    is_main: true,
    business_hours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '14:00' },
      sunday: { open: '09:00', close: '14:00', closed: true },
    },
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── Appointment ───────────────────────────────────────────

export function createMockAppointment(overrides: Partial<Appointment> = {}): Appointment {
  const id = overrides.id ?? uid()
  const now = new Date()
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // tomorrow
  const endTime = new Date(startTime.getTime() + 45 * 60 * 1000) // +45 min

  return {
    id,
    business_id: uid(),
    service_id: uid(),
    employee_id: uid(),
    client_id: uid(),
    user_id: uid(),
    title: 'Corte de cabello',
    client_name: 'María López',
    client_email: 'maria@test.com',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    status: 'scheduled',
    price: 35000,
    currency: 'COP',
    reminder_sent: false,
    created_at: isoNow(),
    updated_at: isoNow(),
    created_by: uid(),
    ...overrides,
  }
}

// ─── Employee ──────────────────────────────────────────────

export function createMockEmployee(overrides: Partial<BusinessEmployee> = {}): BusinessEmployee {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    employee_id: uid(),
    role: 'employee',
    status: 'approved',
    is_active: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── Review ────────────────────────────────────────────────

export function createMockReview(overrides: Partial<Review> = {}): Review {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    appointment_id: uid(),
    client_id: uid(),
    rating: 5,
    comment: 'Excelente servicio, muy profesional.',
    is_visible: true,
    is_verified: true,
    helpful_count: 0,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── InAppNotification ────────────────────────────────────

export function createMockNotification(overrides: Partial<InAppNotification> = {}): InAppNotification {
  const id = overrides.id ?? uid()
  return {
    id,
    user_id: uid(),
    type: 'appointment_reminder',
    title: 'Recordatorio de cita',
    message: 'Tu cita es mañana a las 10:00 AM',
    data: {},
    status: 'unread',
    priority: 'medium',
    is_deleted: false,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── Conversation ──────────────────────────────────────────

export function createMockConversation(overrides: Partial<Conversation> = {}): Conversation {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    type: 'direct',
    created_by: uid(),
    is_archived: false,
    scope: 'business',
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── Message ───────────────────────────────────────────────

export function createMockMessage(overrides: Partial<Message> = {}): Message {
  const id = overrides.id ?? uid()
  return {
    id,
    conversation_id: uid(),
    sender_id: uid(),
    type: 'text',
    body: 'Hola, ¿hay disponibilidad para mañana?',
    metadata: {},
    is_pinned: false,
    is_deleted: false,
    delivery_status: 'sent',
    read_by: [],
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── Batch Helpers ─────────────────────────────────────────

export function createMockServices(count: number, base: Partial<Service> = {}): Service[] {
  return Array.from({ length: count }, (_, i) =>
    createMockService({ name: `Servicio ${i + 1}`, price: 20000 + i * 5000, ...base })
  )
}

export function createMockAppointments(count: number, base: Partial<Appointment> = {}): Appointment[] {
  return Array.from({ length: count }, (_, i) => {
    const start = new Date()
    start.setDate(start.getDate() + i + 1)
    return createMockAppointment({
      title: `Cita ${i + 1}`,
      start_time: start.toISOString(),
      end_time: new Date(start.getTime() + 45 * 60 * 1000).toISOString(),
      ...base,
    })
  })
}

export function createMockNotifications(count: number, base: Partial<InAppNotification> = {}): InAppNotification[] {
  return Array.from({ length: count }, (_, i) =>
    createMockNotification({ title: `Notificación ${i + 1}`, ...base })
  )
}

// ─── Admin Role Factories ──────────────────────────────────

export function createMockResource(overrides: Partial<BusinessResource> = {}): BusinessResource {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    location_id: uid(),
    name: 'Sala de masajes 1',
    resource_type: 'room',
    description: 'Sala con camilla profesional',
    capacity: 1,
    is_active: true,
    image_url: undefined,
    amenities: ['wifi', 'a/c'],
    price_per_hour: 25000,
    currency: 'COP',
    max_simultaneous_bookings: 1,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    location_id: uid(),
    type: 'income',
    category: 'service_sale' as TransactionCategory,
    amount: 50000,
    currency: 'COP',
    description: 'Venta de servicio',
    transaction_date: new Date().toISOString().slice(0, 10),
    payment_method: 'cash',
    is_verified: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

export function createMockRecurringExpense(
  overrides: Partial<RecurringExpense> = {}
): RecurringExpense {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    location_id: uid(),
    description: 'Arriendo mensual',
    category: 'rent' as TransactionCategory,
    amount: 1500000,
    currency: 'COP',
    recurrence_frequency: 'monthly',
    recurrence_day: 1,
    next_payment_date: new Date().toISOString().slice(0, 10),
    is_active: true,
    is_automated: false,
    payment_method: 'transfer',
    total_paid: 0,
    payments_count: 0,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

export function createMockVacancy(overrides: Partial<JobVacancy> = {}): JobVacancy {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    title: 'Estilista profesional',
    description: 'Vacante para estilista con experiencia',
    requirements: 'Mínimo 2 años de experiencia',
    position_type: 'full_time',
    experience_required: '2 años',
    salary_min: 1200000,
    salary_max: 2000000,
    currency: 'COP',
    location_city: 'Medellín',
    remote_allowed: false,
    number_of_positions: 1,
    required_services: [],
    preferred_services: [],
    status: 'open',
    views_count: 0,
    applications_count: 0,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

export function createMockApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  const id = overrides.id ?? uid()
  return {
    id,
    vacancy_id: uid(),
    user_id: uid(),
    status: 'pending',
    cover_letter: 'Estoy interesado en la vacante.',
    expected_salary: 1500000,
    available_from: new Date().toISOString().slice(0, 10),
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

export function createMockUserPermission(
  overrides: Partial<UserPermission> = {}
): UserPermission {
  const id = overrides.id ?? uid()
  return {
    id,
    business_id: uid(),
    user_id: uid(),
    permission: 'services.view',
    granted_by: uid(),
    granted_at: isoNow(),
    is_active: true,
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  }
}

// ─── Admin batch helpers ──────────────────────────────────

export function createMockTransactions(
  count: number,
  base: Partial<Transaction> = {}
): Transaction[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      amount: 10000 * (i + 1),
      description: `Transacción ${i + 1}`,
      ...base,
    })
  )
}

export function createMockResources(
  count: number,
  base: Partial<BusinessResource> = {}
): BusinessResource[] {
  return Array.from({ length: count }, (_, i) =>
    createMockResource({ name: `Recurso ${i + 1}`, ...base })
  )
}

export function createMockVacancies(
  count: number,
  base: Partial<JobVacancy> = {}
): JobVacancy[] {
  return Array.from({ length: count }, (_, i) =>
    createMockVacancy({ title: `Vacante ${i + 1}`, ...base })
  )
}

export function createMockApplications(
  count: number,
  base: Partial<JobApplication> = {}
): JobApplication[] {
  return Array.from({ length: count }, (_, i) =>
    createMockApplication({
      cover_letter: `Carta de presentación ${i + 1}`,
      ...base,
    })
  )
}
