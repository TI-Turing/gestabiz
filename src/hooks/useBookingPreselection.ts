/**
 * useBookingPreselection
 * Manages localStorage-based preselection state for the booking wizard.
 * Fills as the user opens entity modals; cleared when the wizard closes.
 */

const KEY = 'gestabiz_booking_presel'

export interface BookingPreselection {
  businessId?: string
  serviceId?: string
  employeeId?: string
  locationId?: string
}

export function useBookingPreselection() {
  const get = (): BookingPreselection => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}')
    } catch {
      return {}
    }
  }

  const patch = (updates: Partial<BookingPreselection>) => {
    const current = get()
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...updates }))
  }

  const clear = () => localStorage.removeItem(KEY)

  return { get, patch, clear }
}
