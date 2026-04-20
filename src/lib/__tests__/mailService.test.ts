import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendAppointmentCancellationNotification } from '@/lib/mailService'

const mockInvoke = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
  default: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}))

describe('mailService.sendAppointmentCancellationNotification', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null })
  })

  const baseParams = {
    appointmentId: 'apt-1',
    businessId: 'biz-1',
    recipientUserId: 'user-1',
    date: '2025-06-15',
    time: '10:00',
    service: 'Corte',
  }

  it('invoca send-notification con el body correcto', async () => {
    await sendAppointmentCancellationNotification({
      ...baseParams,
      recipientEmail: 'a@b.com',
      recipientName: 'Ana',
    })

    expect(mockInvoke).toHaveBeenCalledTimes(1)
    const [fnName, opts] = mockInvoke.mock.calls[0]
    expect(fnName).toBe('send-notification')
    const body = (opts as { body: Record<string, unknown> }).body
    expect(body.type).toBe('appointment_cancellation')
    expect(body.recipient_user_id).toBe('user-1')
    expect(body.recipient_email).toBe('a@b.com')
    expect(body.recipient_name).toBe('Ana')
    expect(body.business_id).toBe('biz-1')
    expect(body.appointment_id).toBe('apt-1')
    expect(body.skip_preferences).toBe(true)
    expect(body.priority).toBe(1)
    expect(body.action_url).toBe('/cliente/citas/apt-1')
    expect((body.data as Record<string, string>).date).toBe('2025-06-15')
    expect((body.data as Record<string, string>).service).toBe('Corte')
  })

  it('usa "Cliente" como recipient_name por defecto', async () => {
    await sendAppointmentCancellationNotification(baseParams)
    const body = (mockInvoke.mock.calls[0][1] as { body: Record<string, unknown> }).body
    expect(body.recipient_name).toBe('Cliente')
  })

  it('omite recipient_email si no se provee', async () => {
    await sendAppointmentCancellationNotification(baseParams)
    const body = (mockInvoke.mock.calls[0][1] as { body: Record<string, unknown> }).body
    expect(body.recipient_email).toBeUndefined()
  })

  it('fuerza canales in_app y email', async () => {
    await sendAppointmentCancellationNotification(baseParams)
    const body = (mockInvoke.mock.calls[0][1] as { body: Record<string, unknown> }).body
    expect(body.force_channels).toEqual(['in_app', 'email'])
  })

  it('propaga el resultado de invoke', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { id: 'n1' }, error: null })
    const r = await sendAppointmentCancellationNotification(baseParams)
    expect(r).toEqual({ data: { id: 'n1' }, error: null })
  })
})
