import { describe, it, expect } from 'vitest'
import {
  filterAppointments,
  sortAppointments,
  getUpcomingAppointments,
  getAppointmentsByDateRange,
  groupAppointmentsByDate,
  getAvailableTimeSlots,
} from '@/lib/appointmentUtils'
import type { Appointment, AppointmentFilter } from '@/types'

const apt = (overrides: Partial<Appointment> = {}): Appointment =>
  ({
    id: 'a1',
    business_id: 'b1',
    service_id: 's1',
    user_id: 'u1',
    client_id: 'c1',
    title: 'Cita',
    description: '',
    notes: '',
    location: '',
    start_time: '2025-06-15T10:00:00',
    end_time: '2025-06-15T11:00:00',
    date: '2025-06-15',
    startTime: '10:00',
    endTime: '11:00',
    status: 'scheduled',
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2025-06-01T00:00:00Z',
    ...overrides,
  }) as Appointment

describe('appointmentUtils', () => {
  describe('filterAppointments', () => {
    const all: Appointment[] = [
      apt({ id: '1', status: 'scheduled', client_id: 'c1', tags: ['vip'], priority: 'high', title: 'Hola' }),
      apt({ id: '2', status: 'completed', client_id: 'c2', tags: ['regular'], priority: 'low', title: 'Mundo' }),
      apt({ id: '3', status: 'cancelled', client_id: 'c1' }),
    ]

    it('sin filtros retorna todo', () => {
      expect(filterAppointments(all, {} as AppointmentFilter)).toHaveLength(3)
    })

    it('filtra por status', () => {
      const r = filterAppointments(all, { status: ['scheduled'] } as AppointmentFilter)
      expect(r).toHaveLength(1)
      expect(r[0].id).toBe('1')
    })

    it('filtra por cliente', () => {
      const r = filterAppointments(all, { clients: ['c1'] } as AppointmentFilter)
      expect(r).toHaveLength(2)
    })

    it('filtra por tags', () => {
      const r = filterAppointments(all, { tags: ['vip'] } as AppointmentFilter)
      expect(r).toHaveLength(1)
    })

    it('filtra por prioridad', () => {
      const r = filterAppointments(all, { priority: ['high'] } as AppointmentFilter)
      expect(r).toHaveLength(1)
    })

    it('filtra por search en título', () => {
      const r = filterAppointments(all, { search: 'mundo' } as AppointmentFilter)
      expect(r).toHaveLength(1)
      expect(r[0].id).toBe('2')
    })

    it('filtra por dateRange', () => {
      const r = filterAppointments(all, {
        dateRange: { start: '2025-06-15T00:00:00', end: '2025-06-15T23:59:59' },
      } as AppointmentFilter)
      expect(r.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('sortAppointments', () => {
    const a = apt({ id: '1', start_time: '2025-06-10T10:00:00', clientName: 'B', status: 'scheduled', priority: 'low' })
    const b = apt({ id: '2', start_time: '2025-06-15T10:00:00', clientName: 'A', status: 'completed', priority: 'high' })

    it('ordena por fecha asc', () => {
      const r = sortAppointments([b, a], 'date', 'asc')
      expect(r[0].id).toBe('1')
    })

    it('ordena por fecha desc', () => {
      const r = sortAppointments([a, b], 'date', 'desc')
      expect(r[0].id).toBe('2')
    })

    it('ordena por cliente', () => {
      const r = sortAppointments([a, b], 'client', 'asc')
      expect(r[0].clientName).toBe('A')
    })

    it('ordena por status', () => {
      const r = sortAppointments([b, a], 'status', 'asc')
      expect(r[0].status).toBe('scheduled')
    })

    it('ordena por prioridad', () => {
      const r = sortAppointments([a, b], 'priority', 'asc')
      expect(r[0].priority).toBe('high')
    })
  })

  describe('getUpcomingAppointments', () => {
    it('retorna solo scheduled futuras, ordenadas, con límite', () => {
      const future = new Date(Date.now() + 86400000).toISOString()
      const past = new Date(Date.now() - 86400000).toISOString()
      const list = [
        apt({ id: 'p', start_time: past, status: 'scheduled' }),
        apt({ id: 'f1', start_time: future, status: 'scheduled' }),
        apt({ id: 'fc', start_time: future, status: 'completed' }),
      ]
      const r = getUpcomingAppointments(list, 5)
      expect(r).toHaveLength(1)
      expect(r[0].id).toBe('f1')
    })
  })

  describe('getAppointmentsByDateRange', () => {
    it('filtra por rango Date', () => {
      const list = [
        apt({ id: '1', start_time: '2025-06-15T10:00:00' }),
        apt({ id: '2', start_time: '2025-07-15T10:00:00' }),
      ]
      const r = getAppointmentsByDateRange(list, new Date('2025-06-01'), new Date('2025-06-30'))
      expect(r).toHaveLength(1)
      expect(r[0].id).toBe('1')
    })
  })

  describe('groupAppointmentsByDate', () => {
    it('agrupa por fecha', () => {
      const list = [
        apt({ id: '1', date: '2025-06-15' }),
        apt({ id: '2', date: '2025-06-15' }),
        apt({ id: '3', date: '2025-06-16' }),
      ]
      const r = groupAppointmentsByDate(list)
      expect(r['2025-06-15']).toHaveLength(2)
      expect(r['2025-06-16']).toHaveLength(1)
    })
  })

  describe('getAvailableTimeSlots', () => {
    it('genera slots disponibles excluyendo conflictos', () => {
      const taken = apt({ date: '2025-06-15', startTime: '10:00', endTime: '11:00', status: 'scheduled' })
      const slots = getAvailableTimeSlots([taken], '2025-06-15', { start: '09:00', end: '12:00' }, 60)
      expect(slots).toContain('09:00')
      expect(slots).toContain('11:00')
      expect(slots).not.toContain('10:00')
    })

    it('ignora citas canceladas', () => {
      const cancelled = apt({ date: '2025-06-15', startTime: '10:00', endTime: '11:00', status: 'cancelled' })
      const slots = getAvailableTimeSlots([cancelled], '2025-06-15', { start: '09:00', end: '12:00' }, 60)
      expect(slots).toContain('10:00')
    })
  })
})
