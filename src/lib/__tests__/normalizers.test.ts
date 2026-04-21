import { describe, it, expect } from 'vitest'
import {
  normalizeService,
  normalizeLocation,
  normalizeBusiness,
  normalizeAppointmentStatus,
  toDbAppointmentStatus,
  normalizeAppointment,
  normalizeUserSettings,
} from '@/lib/normalizers'

describe('normalizeService', () => {
  it('mapea campos de DB con defaults', () => {
    const row = {
      id: 's-1',
      business_id: 'b-1',
      name: 'Corte',
      description: null,
      duration_minutes: 30,
      price: 30000,
      currency: null,
      category: null,
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    } as never

    const result = normalizeService(row)
    expect(result.id).toBe('s-1')
    expect(result.duration).toBe(30)
    expect(result.currency).toBe('COP') // default
    expect(result.category).toBe('General') // default
    expect(result.description).toBeUndefined()
  })

  it('preserva valores no nulos', () => {
    const row = {
      id: 's-2',
      business_id: 'b-1',
      name: 'Manicure',
      description: 'Spa completo',
      duration_minutes: 60,
      price: 50000,
      currency: 'USD',
      category: 'Belleza',
      is_active: false,
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    } as never

    const result = normalizeService(row)
    expect(result.description).toBe('Spa completo')
    expect(result.currency).toBe('USD')
    expect(result.category).toBe('Belleza')
    expect(result.is_active).toBe(false)
  })
})

describe('normalizeLocation', () => {
  it('mapea con horarios default', () => {
    const row = {
      id: 'l-1',
      business_id: 'b-1',
      name: 'Sede Norte',
      address: 'Calle 1',
      city: 'Medellin',
      state: null,
      country: 'CO',
      postal_code: null,
      phone: null,
      latitude: null,
      longitude: null,
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    } as never

    const result = normalizeLocation(row)
    expect(result.id).toBe('l-1')
    expect(result.business_hours.monday.open).toBe('09:00')
    expect(result.business_hours.sunday.closed).toBe(true)
    expect(result.state).toBe('')
    expect(result.postal_code).toBe('')
    expect(result.phone).toBeUndefined()
  })
})

describe('normalizeBusiness', () => {
  it('aplica defaults en business_hours y settings', () => {
    const row = {
      id: 'b-1',
      name: 'Mi Negocio',
      description: null,
      logo_url: null,
      website: null,
      phone: null,
      email: null,
      address: null,
      city: null,
      state: null,
      country: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      business_hours: null,
      owner_id: 'u-1',
      settings: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
      is_active: true,
    } as never

    const result = normalizeBusiness(row)
    expect(result.id).toBe('b-1')
    expect(result.description).toBe('')
    expect(result.timezone).toBe('America/Bogota')
    expect(result.resource_model).toBe('professional')
    expect(result.business_hours.monday.open).toBe('09:00')
    expect(result.settings.appointment_buffer).toBe(15)
    expect(result.settings.advance_booking_days).toBe(30)
    expect(result.settings.currency).toBe('COP')
  })

  it('preserva business_hours y settings provistos', () => {
    const customHours = {
      monday: { open: '10:00', close: '20:00', closed: false },
      tuesday: { open: '10:00', close: '20:00', closed: false },
      wednesday: { open: '10:00', close: '20:00', closed: false },
      thursday: { open: '10:00', close: '20:00', closed: false },
      friday: { open: '10:00', close: '20:00', closed: false },
      saturday: { open: '10:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    }
    const row = {
      id: 'b-2', name: 'B', description: 'desc', business_hours: customHours,
      settings: { appointment_buffer: 30 },
      owner_id: 'u-1', created_at: '2026-01-01', updated_at: '2026-01-02', is_active: true,
    } as never

    const result = normalizeBusiness(row)
    expect(result.business_hours.monday.open).toBe('10:00')
    expect(result.settings.appointment_buffer).toBe(30)
  })
})

describe('normalizeAppointmentStatus', () => {
  it('"pending" se traduce a "scheduled"', () => {
    expect(normalizeAppointmentStatus('pending')).toBe('scheduled')
  })

  it('estados válidos pasan tal cual', () => {
    expect(normalizeAppointmentStatus('confirmed')).toBe('confirmed')
    expect(normalizeAppointmentStatus('completed')).toBe('completed')
    expect(normalizeAppointmentStatus('cancelled')).toBe('cancelled')
    expect(normalizeAppointmentStatus('no_show')).toBe('no_show')
  })

  it('estados desconocidos → "scheduled"', () => {
    expect(normalizeAppointmentStatus('mystery')).toBe('scheduled')
    expect(normalizeAppointmentStatus('')).toBe('scheduled')
  })
})

describe('toDbAppointmentStatus', () => {
  it('scheduled → pending', () => {
    expect(toDbAppointmentStatus('scheduled')).toBe('pending')
  })

  it('in_progress y rescheduled → confirmed', () => {
    expect(toDbAppointmentStatus('in_progress')).toBe('confirmed')
    expect(toDbAppointmentStatus('rescheduled')).toBe('confirmed')
  })

  it('estados directos', () => {
    expect(toDbAppointmentStatus('confirmed')).toBe('confirmed')
    expect(toDbAppointmentStatus('completed')).toBe('completed')
    expect(toDbAppointmentStatus('cancelled')).toBe('cancelled')
    expect(toDbAppointmentStatus('no_show')).toBe('no_show')
  })

  it('default → pending', () => {
    expect(toDbAppointmentStatus('unknown' as never)).toBe('pending')
  })
})

describe('normalizeAppointment', () => {
  it('mapea campos mínimos con defaults', () => {
    const row = {
      id: 'a-1',
      business_id: 'b-1',
      location_id: 'l-1',
      service_id: 's-1',
      employee_id: 'e-1',
      client_id: 'c-1',
      notes: 'descripción',
      client_notes: 'nota cliente',
      start_time: '2026-04-04T10:00:00Z',
      end_time: '2026-04-04T11:00:00Z',
      status: 'pending',
      price: 50000,
      currency: 'COP',
      reminder_sent: false,
      created_at: '2026-04-01',
      updated_at: '2026-04-02',
      cancelled_by: null,
      cancel_reason: null,
    } as never

    const result = normalizeAppointment(row)
    expect(result.id).toBe('a-1')
    expect(result.user_id).toBe('e-1')
    expect(result.employee_id).toBe('e-1')
    expect(result.status).toBe('scheduled') // pending → scheduled
    expect(result.description).toBe('descripción')
    expect(result.notes).toBe('nota cliente')
    expect(result.title).toBe('')
    expect(result.client_name).toBe('')
  })

  it('employee_id null → user_id ""', () => {
    const row = {
      id: 'a-2', business_id: 'b-1', service_id: 's-1', client_id: 'c-1',
      employee_id: null, location_id: null, notes: null, client_notes: null,
      start_time: 't', end_time: 't', status: 'confirmed',
      price: null, currency: null, reminder_sent: false,
      created_at: '2026', updated_at: '2026',
      cancelled_by: null, cancel_reason: null,
    } as never

    const result = normalizeAppointment(row)
    expect(result.user_id).toBe('')
    expect(result.employee_id).toBeUndefined()
    expect(result.location_id).toBeUndefined()
  })
})

describe('normalizeUserSettings', () => {
  it('aplica defaults cuando row es null', () => {
    const result = normalizeUserSettings(null)
    expect(result.theme).toBe('system')
    expect(result.language).toBe('es')
    expect(result.timezone).toBe('America/Bogota')
    expect(result.default_appointment_duration).toBe(60)
    expect(result.business_hours.start).toBe('09:00')
    expect(result.business_hours.end).toBe('18:00')
    expect(result.business_hours.days).toEqual([1, 2, 3, 4, 5])
    expect(result.auto_reminders).toBe(true)
    expect(result.reminder_times).toEqual([1440, 60, 15])
    expect(result.email_notifications.appointment_reminders).toBe(true)
    expect(result.whatsapp_notifications.appointment_reminders).toBe(false)
    expect(result.date_format).toBe('DD/MM/YYYY')
    expect(result.time_format).toBe('24h')
  })

  it('preserva valores válidos del row', () => {
    const row = {
      id: 'us-1',
      user_id: 'u-1',
      theme: 'dark',
      language: 'en',
      timezone: 'America/New_York',
      default_appointment_duration: 45,
      business_hours: { start: '08:00', end: '20:00', days: [1, 2, 3] },
      auto_reminders: false,
      reminder_times: [60, 15],
      email_notifications: { appointment_reminders: false, marketing: true },
      whatsapp_notifications: { appointment_reminders: true },
      date_format: 'YYYY-MM-DD',
      time_format: '12h',
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    }
    const result = normalizeUserSettings(row)
    expect(result.theme).toBe('dark')
    expect(result.language).toBe('en')
    expect(result.timezone).toBe('America/New_York')
    expect(result.default_appointment_duration).toBe(45)
    expect(result.business_hours.days).toEqual([1, 2, 3])
    expect(result.auto_reminders).toBe(false)
    expect(result.reminder_times).toEqual([60, 15])
    expect(result.email_notifications.appointment_reminders).toBe(false)
    expect(result.email_notifications.marketing).toBe(true)
    expect(result.whatsapp_notifications.appointment_reminders).toBe(true)
    expect(result.date_format).toBe('YYYY-MM-DD')
    expect(result.time_format).toBe('12h')
  })

  it('rechaza valores inválidos y aplica fallback', () => {
    const row = {
      theme: 'invalid',
      language: 'fr',
      date_format: 'MMDDYYYY',
      time_format: '36h',
      reminder_times: ['not', 'numbers', 60],
    }
    const result = normalizeUserSettings(row)
    expect(result.theme).toBe('system')
    expect(result.language).toBe('es')
    expect(result.date_format).toBe('DD/MM/YYYY')
    expect(result.time_format).toBe('24h')
    expect(result.reminder_times).toEqual([60])
  })
})
