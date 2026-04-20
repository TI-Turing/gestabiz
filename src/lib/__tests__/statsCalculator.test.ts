import { describe, it, expect } from 'vitest'
import { calculateDashboardStats } from '@/lib/statsCalculator'
import type { Appointment } from '@/types'

const apt = (overrides: Partial<Appointment> = {}): Appointment =>
  ({
    id: 'a',
    business_id: 'b1',
    service_id: 's1',
    user_id: 'u1',
    client_id: 'c1',
    title: 'T',
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }) as Appointment

describe('calculateDashboardStats', () => {
  it('retorna ceros con array vacío', () => {
    const s = calculateDashboardStats([])
    expect(s.totalAppointments).toBe(0)
    expect(s.upcomingAppointments).toBe(0)
    expect(s.completedAppointments).toBe(0)
    expect(s.totalClients).toBe(0)
    expect(s.conversionRate).toBe(0)
  })

  it('cuenta totales por status', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    const list = [
      apt({ id: '1', status: 'scheduled', start_time: future, client_id: 'c1' }),
      apt({ id: '2', status: 'completed', client_id: 'c2' }),
      apt({ id: '3', status: 'cancelled', client_id: 'c1' }),
      apt({ id: '4', status: 'no_show', client_id: 'c3' }),
    ]
    const s = calculateDashboardStats(list)
    expect(s.totalAppointments).toBe(4)
    expect(s.upcomingAppointments).toBe(1)
    expect(s.completedAppointments).toBe(1)
    expect(s.cancelledAppointments).toBe(1)
    expect(s.noShowAppointments).toBe(1)
    expect(s.totalClients).toBe(3)
  })

  it('calcula conversionRate', () => {
    const list = [
      apt({ id: '1', status: 'completed' }),
      apt({ id: '2', status: 'completed' }),
      apt({ id: '3', status: 'cancelled' }),
      apt({ id: '4', status: 'cancelled' }),
    ]
    const s = calculateDashboardStats(list)
    expect(s.conversionRate).toBe(50)
  })

  it('genera popular_times agrupado por hora', () => {
    const baseDate = new Date()
    baseDate.setHours(14, 0, 0, 0)
    const t14 = baseDate.toISOString()
    const t10 = new Date(baseDate.getTime())
    t10.setHours(10, 0, 0, 0)
    const list = [
      apt({ id: '1', status: 'completed', start_time: t14 }),
      apt({ id: '2', status: 'completed', start_time: t14 }),
      apt({ id: '3', status: 'completed', start_time: t10.toISOString() }),
    ]
    const s = calculateDashboardStats(list)
    expect(s.popular_times.length).toBeGreaterThan(0)
    expect(s.popular_times[0].count).toBeGreaterThanOrEqual(s.popular_times[s.popular_times.length - 1].count)
  })

  it('recentActivity ordenada y limitada a 10', () => {
    const recent = new Date().toISOString()
    const list = Array.from({ length: 15 }, (_, i) =>
      apt({ id: `a${i}`, status: 'completed', updated_at: recent })
    )
    const s = calculateDashboardStats(list)
    expect(s.recentActivity.length).toBeLessThanOrEqual(10)
  })

  it('expone keys del nuevo schema', () => {
    const s = calculateDashboardStats([apt({ status: 'scheduled' })])
    expect(s.scheduled_appointments).toBe(1)
    expect(s.completed_appointments).toBe(0)
    expect(s.popular_services).toEqual([])
    expect(s.employee_performance).toEqual([])
  })
})
