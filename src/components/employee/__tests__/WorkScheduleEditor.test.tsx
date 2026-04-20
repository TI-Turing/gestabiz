import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { WorkScheduleEditor } from '../WorkScheduleEditor'
import { renderWithProviders } from '@/test-utils/render-with-providers'

const {
  fromMock,
  upsertMock,
  updateMock,
  toastSuccessMock,
  toastErrorMock,
  authState,
  permissionGateSpy,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  upsertMock: vi.fn(),
  updateMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  authState: {
    user: { id: 'emp-1' } as null | { id: string },
  },
  permissionGateSpy: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('@/contexts/LanguageContext', () => ({
  
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLanguage: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'common.actions.save': 'Guardar',
        'common.actions.saving': 'Guardando',
        'common.messages.updateSuccess': 'Actualizado correctamente',
        'common.messages.saveError': 'Error al guardar',
        'common.time.monday': 'Lunes',
        'common.time.tuesday': 'Martes',
        'common.time.wednesday': 'Miércoles',
        'common.time.thursday': 'Jueves',
        'common.time.friday': 'Viernes',
        'common.time.saturday': 'Sábado',
        'common.time.sunday': 'Domingo',
      }

      return labels[key] ?? key
    },
  }),
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}))

vi.mock('@/components/ui/PermissionGate', () => ({
  PermissionGate: ({ children, permission, businessId, mode }: { children: React.ReactNode; permission: string; businessId: string; mode: string }) => {
    permissionGateSpy({ permission, businessId, mode })
    return <div data-testid="permission-gate">{children}</div>
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

vi.mock('@/lib/supabase', () => { const __sb = {
    from: fromMock,
  }; return { supabase: __sb, default: __sb } })

const businessEmployeeResponse = {
  has_lunch_break: true,
  lunch_break_start: '12:30',
  lunch_break_end: '13:30',
}

const workSchedulesResponse = [
  { day_of_week: 1, start_time: '08:00', end_time: '16:00', is_working: true },
  { day_of_week: 2, start_time: '10:00', end_time: '18:00', is_working: false },
]

function createBusinessEmployeesTable() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: businessEmployeeResponse, error: null }),
        }),
      }),
    }),
    update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      updateMock(payload)
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }),
  }
}

function createWorkSchedulesTable() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: workSchedulesResponse, error: null }),
    }),
    upsert: vi.fn().mockImplementation((rows: Array<Record<string, unknown>>, options: Record<string, unknown>) => {
      upsertMock(rows, options)
      return Promise.resolve({ error: null })
    }),
  }
}

describe('WorkScheduleEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = { id: 'emp-1' }
    fromMock.mockImplementation((table: string) => {
      if (table === 'business_employees') {
        return createBusinessEmployeesTable()
      }

      if (table === 'work_schedules') {
        return createWorkSchedulesTable()
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('loads the stored schedule and lunch break configuration', async () => {
    renderWithProviders(
      <WorkScheduleEditor businessId="biz-1" employeeId="emp-1" />,
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('08:00')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('16:00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12:30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('13:30')).toBeInTheDocument()
    expect(screen.queryByTestId('permission-gate')).not.toBeInTheDocument()
  })

  it('allows a self editor to save the weekly schedule without going through PermissionGate', async () => {
    const onScheduleChanged = vi.fn()

    renderWithProviders(
      <WorkScheduleEditor businessId="biz-1" employeeId="emp-1" onScheduleChanged={onScheduleChanged} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledTimes(1)
    })

    expect(upsertMock.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ employee_id: 'emp-1', day_of_week: 1, start_time: '08:00', end_time: '16:00', is_working: true }),
        expect.objectContaining({ employee_id: 'emp-1', day_of_week: 2, start_time: '10:00', end_time: '18:00', is_working: false }),
      ]),
    )
    expect(updateMock).toHaveBeenCalledWith({
      has_lunch_break: true,
      lunch_break_start: '12:30',
      lunch_break_end: '13:30',
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Actualizado correctamente')
    expect(onScheduleChanged).toHaveBeenCalledTimes(1)
  })

  it('shows a validation error when a working day ends before it starts', async () => {
    const { container } = renderWithProviders(
      <WorkScheduleEditor businessId="biz-1" employeeId="emp-1" />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    })

    const timeInputs = Array.from(container.querySelectorAll('input[type="time"]')) as HTMLInputElement[]
    fireEvent.change(timeInputs[1], { target: { value: '07:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(toastErrorMock).toHaveBeenCalledWith('monday: La hora de inicio debe ser anterior a la hora de fin')
    expect(upsertMock).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('wraps the save action in PermissionGate when editing another employee', async () => {
    authState.user = { id: 'manager-1' }

    renderWithProviders(
      <WorkScheduleEditor businessId="biz-1" employeeId="emp-2" />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('permission-gate')).toBeInTheDocument()
    })

    expect(permissionGateSpy).toHaveBeenCalledWith({
      permission: 'employees.edit_own_schedule',
      businessId: 'biz-1',
      mode: 'disable',
    })
  })
})