import { useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardData {
  selectedBusinessId: string | null
  selectedServiceId: string | null
  selectedLocationId: string | null
  selectedEmployeeId: string | null
  selectedDate: string | null      // ISO date string: 'YYYY-MM-DD'
  selectedTimeSlot: string | null  // ISO datetime string
  notes: string | null
}

const INITIAL_STATE: WizardData = {
  selectedBusinessId: null,
  selectedServiceId: null,
  selectedLocationId: null,
  selectedEmployeeId: null,
  selectedDate: null,
  selectedTimeSlot: null,
  notes: null,
}

// ─── Hook: useWizardDataCache ─────────────────────────────────────────────────

export function useWizardDataCache(initial?: Partial<WizardData>) {
  const [data, setData] = useState<WizardData>({
    ...INITIAL_STATE,
    ...initial,
  })

  const setBusiness = useCallback((id: string | null) => {
    setData(prev => ({
      ...prev,
      selectedBusinessId: id,
      // Reset downstream selections when business changes
      selectedServiceId: null,
      selectedLocationId: null,
      selectedEmployeeId: null,
      selectedDate: null,
      selectedTimeSlot: null,
    }))
  }, [])

  const setService = useCallback((id: string | null) => {
    setData(prev => ({
      ...prev,
      selectedServiceId: id,
      selectedEmployeeId: null,
      selectedDate: null,
      selectedTimeSlot: null,
    }))
  }, [])

  const setLocation = useCallback((id: string | null) => {
    setData(prev => ({
      ...prev,
      selectedLocationId: id,
      selectedEmployeeId: null,
      selectedDate: null,
      selectedTimeSlot: null,
    }))
  }, [])

  const setEmployee = useCallback((id: string | null) => {
    setData(prev => ({
      ...prev,
      selectedEmployeeId: id,
      selectedDate: null,
      selectedTimeSlot: null,
    }))
  }, [])

  const setDate = useCallback((date: string | null) => {
    setData(prev => ({ ...prev, selectedDate: date, selectedTimeSlot: null }))
  }, [])

  const setTimeSlot = useCallback((slot: string | null) => {
    setData(prev => ({ ...prev, selectedTimeSlot: slot }))
  }, [])

  const setNotes = useCallback((notes: string | null) => {
    setData(prev => ({ ...prev, notes }))
  }, [])

  const reset = useCallback(() => setData({ ...INITIAL_STATE, ...initial }), [initial])

  return {
    data,
    setBusiness,
    setService,
    setLocation,
    setEmployee,
    setDate,
    setTimeSlot,
    setNotes,
    reset,
  }
}
