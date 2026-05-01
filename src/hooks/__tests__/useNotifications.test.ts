import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Appointment } from '@/types'

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockToastSuccess = vi.fn()
const mockToastInfo = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Keep track of stored values per key
const kvStore: Record<string, unknown> = {}
const kvSetters: Record<string, ReturnType<typeof vi.fn>> = {}

vi.mock('@/lib/useKV', () => ({
  useKV: (key: string, defaultValue: unknown) => {
    if (!(key in kvStore)) {
      kvStore[key] = defaultValue
    }
    if (!kvSetters[key]) {
      kvSetters[key] = vi.fn((updater: unknown) => {
        if (typeof updater === 'function') {
          kvStore[key] = (updater as (v: unknown) => unknown)(kvStore[key])
        } else {
          kvStore[key] = updater
        }
      })
    }
    return [kvStore[key], kvSetters[key]]
  },
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────
function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'apt-1',
    status: 'scheduled',
    start_time: '2025-12-31T10:00:00',
    // legacy fields used by the hook
    date: '2025-12-31',
    startTime: '10:00',
    title: 'Corte de Cabello',
    clientName: 'Juan Pérez',
    ...overrides,
  } as unknown as Appointment
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset the in-memory KV store
  for (const k of Object.keys(kvStore)) delete kvStore[k]
  for (const k of Object.keys(kvSetters)) delete kvSetters[k]
  mockToastSuccess.mockClear()
  mockToastInfo.mockClear()
})

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('useNotifications — settings', () => {
  it('returns default settings on first mount', () => {
    const { result } = renderHook(() => useNotifications())
    expect(result.current.settings.emailReminders).toBe(true)
    expect(result.current.settings.reminderTiming).toEqual([1440, 60])
    expect(result.current.settings.dailyDigest).toBe(true)
  })

  it('updateSettings merges partial changes and shows success toast', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.updateSettings({ emailReminders: false })
    })

    expect(mockToastSuccess).toHaveBeenCalledOnce()
    // The setter is called with a merge callback
    expect(kvSetters['notification-settings']).toHaveBeenCalled()
  })

  it('updateSettings partial change is applied via setter', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.updateSettings({ weeklyReport: true })
    })

    // The KV setter should have been called once
    expect(kvSetters['notification-settings']).toHaveBeenCalledOnce()
  })
})

describe('useNotifications — scheduleReminder', () => {
  it('does nothing when emailReminders is false', () => {
    // Force emailReminders = false in store
    kvStore['notification-settings'] = {
      id: 'default',
      userId: 'current-user',
      emailReminders: false,
      reminderTiming: [1440, 60],
      dailyDigest: true,
      weeklyReport: false,
    }

    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.scheduleReminder(makeAppointment())
    })

    // The queue setter is created at hook mount time (useKV always creates it),
    // but it must NOT have been called when emailReminders=false
    expect(kvSetters['notification-queue']).not.toHaveBeenCalled()
  })

  it('schedules one notification per reminderTiming entry when emailReminders is true', () => {
    // Default settings have emailReminders: true and reminderTiming: [1440, 60]
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.scheduleReminder(makeAppointment())
    })

    // Called twice (once per timing: 1440min and 60min)
    expect(kvSetters['notification-queue']).toHaveBeenCalledTimes(2)
  })

  it('notification entry has correct structure', () => {
    const { result } = renderHook(() => useNotifications())
    const apt = makeAppointment({ id: 'apt-42' })

    act(() => {
      result.current.scheduleReminder(apt)
    })

    const firstCallArg = kvSetters['notification-queue'].mock.calls[0][0]
    const fakeQueue = firstCallArg([]) as Array<{
      id: string
      appointmentId: string
      type: string
      sent: boolean
    }>

    expect(fakeQueue).toHaveLength(1)
    expect(fakeQueue[0].appointmentId).toBe('apt-42')
    expect(fakeQueue[0].type).toBe('reminder')
    expect(fakeQueue[0].sent).toBe(false)
  })
})

describe('useNotifications — processNotifications', () => {
  it('is a function returned by the hook', () => {
    const { result } = renderHook(() => useNotifications())
    expect(typeof result.current.processNotifications).toBe('function')
  })

  it('marks due notifications as sent', () => {
    // Pre-populate queue with a notification due in the past
    const pastTime = new Date(Date.now() - 1000).toISOString()
    kvStore['notification-queue'] = [
      {
        id: 'apt-1-1440',
        appointmentId: 'apt-1',
        scheduledFor: pastTime,
        type: 'reminder',
        sent: false,
      },
    ]

    const { result } = renderHook(() => useNotifications())
    const apt = makeAppointment({
      id: 'apt-1',
      status: 'scheduled',
      date: '2025-12-31',
      startTime: '10:00',
    })

    act(() => {
      result.current.processNotifications([apt])
    })

    // The queue setter should have been called (to mark sent / cleanup)
    expect(kvSetters['notification-queue']).toHaveBeenCalled()
  })
})
