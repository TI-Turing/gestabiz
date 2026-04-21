import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getNotificationNavigation,
  handleNotificationNavigation,
  getNotificationTypeLabel,
  getNotificationTypeIcon,
} from '@/lib/notificationNavigation'
import type { InAppNotification } from '@/types/types'

function makeNotif(overrides: Partial<InAppNotification>): InAppNotification {
  return {
    id: 'n-1',
    user_id: 'u-1',
    type: 'system_announcement',
    title: 'T',
    body: 'B',
    data: {},
    is_read: false,
    created_at: '2026-04-04T00:00:00Z',
    ...overrides,
  } as InAppNotification
}

describe('getNotificationNavigation', () => {
  it('job_application_new → ruta a vacante con id', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'job_application_new',
      data: { vacancy_id: 'v-1' },
    }))
    expect(result.destination).toBe('internal')
    expect(result.path).toBe('/mis-empleos/vacante/v-1')
    expect(result.modalType).toBe('vacancy_applications')
    expect(result.modalProps).toEqual({ vacancyId: 'v-1' })
  })

  it('job_application_new sin vacancy_id → ruta base', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'job_application_new',
      data: {},
    }))
    expect(result.path).toBe('/mis-empleos')
    expect(result.modalProps).toEqual({})
  })

  it('appointment_* → ruta a cita con id', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'appointment_confirmed',
      data: { appointment_id: 'a-1' },
    }))
    expect(result.destination).toBe('internal')
    expect(result.path).toBe('/citas/a-1')
    expect(result.modalType).toBe('appointment')
  })

  it('reminder_* también va a citas', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'reminder_24h',
      data: { appointment_id: 'a-2' },
    }))
    expect(result.path).toBe('/citas/a-2')
  })

  it('chat_message → ruta a conversación', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'chat_message',
      data: { conversation_id: 'c-1' },
    }))
    expect(result.path).toBe('/chat/c-1')
    expect(result.modalType).toBe('chat')
  })

  it('employee_request_* → ruta a solicitud', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'employee_request_new',
      data: { request_id: 'r-1' },
    }))
    expect(result.path).toBe('/admin/empleados/solicitudes/r-1')
  })

  it('daily_digest/weekly_summary → ruta a reseñas', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'daily_digest',
      data: { business_id: 'b-1' },
    }))
    expect(result.path).toBe('/negocio/b-1/resenas')
    expect(result.modalType).toBe('reviews')
  })

  it('absence_request → modal de aprobación', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'absence_request',
      data: { absenceId: 'ab-1' },
    }))
    expect(result.path).toBe('/admin')
    expect(result.modalType).toBe('absence_approval')
    expect(result.modalProps).toEqual({ absenceId: 'ab-1' })
  })

  it('system_* con action_url → external', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'system_update',
      action_url: 'https://example.com/release',
    } as Partial<InAppNotification>))
    expect(result.destination).toBe('external')
    expect(result.path).toBe('https://example.com/release')
  })

  it('tipo desconocido → none', () => {
    const result = getNotificationNavigation(makeNotif({ type: 'unknown_type' }))
    expect(result.destination).toBe('none')
  })

  it('soporta data como número (toString)', () => {
    const result = getNotificationNavigation(makeNotif({
      type: 'appointment_confirmed',
      data: { appointment_id: 12345 } as never,
    }))
    expect(result.path).toBe('/citas/12345')
  })
})

describe('handleNotificationNavigation', () => {
  let navigate: ReturnType<typeof vi.fn>
  let openModal: ReturnType<typeof vi.fn>

  beforeEach(() => {
    navigate = vi.fn()
    openModal = vi.fn()
  })

  it('internal navega y abre modal', () => {
    const notif = makeNotif({
      type: 'appointment_confirmed',
      data: { appointment_id: 'a-1' },
    })
    handleNotificationNavigation(notif, navigate, { openModal })
    expect(navigate).toHaveBeenCalledWith('/citas/a-1')
    expect(openModal).toHaveBeenCalledWith('appointment', { appointmentId: 'a-1' })
  })

  it('external abre window.open', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const notif = makeNotif({
      type: 'system_update',
      action_url: 'https://example.com',
    } as Partial<InAppNotification>)
    handleNotificationNavigation(notif, navigate)
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank')
    openSpy.mockRestore()
  })

  it('none no hace nada', () => {
    const notif = makeNotif({ type: 'unknown_xyz' })
    handleNotificationNavigation(notif, navigate, { openModal })
    expect(navigate).not.toHaveBeenCalled()
    expect(openModal).not.toHaveBeenCalled()
  })
})

describe('getNotificationTypeLabel', () => {
  it('retorna labels conocidos', () => {
    expect(getNotificationTypeLabel('appointment_confirmed')).toBe('Cita confirmada')
    expect(getNotificationTypeLabel('chat_message')).toBe('Nuevo mensaje')
    expect(getNotificationTypeLabel('reminder_24h')).toBe('Recordatorio (24h)')
    expect(getNotificationTypeLabel('absence_request')).toBe('Nueva solicitud de ausencia')
  })

  it('hace fallback al tipo raw', () => {
    expect(getNotificationTypeLabel('inexistente')).toBe('inexistente')
  })
})

describe('getNotificationTypeIcon', () => {
  it('mapea por prefijo', () => {
    expect(getNotificationTypeIcon('job_application_new')).toBe('briefcase')
    expect(getNotificationTypeIcon('appointment_confirmed')).toBe('calendar')
    expect(getNotificationTypeIcon('reminder_24h')).toBe('calendar')
    expect(getNotificationTypeIcon('absence_request')).toBe('calendar')
    expect(getNotificationTypeIcon('chat_message')).toBe('message-circle')
    expect(getNotificationTypeIcon('employee_request_new')).toBe('users')
    expect(getNotificationTypeIcon('review_received')).toBe('star')
    expect(getNotificationTypeIcon('system_update')).toBe('alert-circle')
  })

  it('default es bell', () => {
    expect(getNotificationTypeIcon('xyz')).toBe('bell')
  })
})
