/**
 * Hook central del AppointmentWizard.
 * Gestiona el estado, el orden de pasos, la hidratación en modo edición,
 * el backfill de sede/negocio desde servicio preseleccionado,
 * y los handlers de navegación (next, back, close).
 */
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses'
import supabase from '@/lib/supabase'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import { logger } from '@/lib/logger'
import type { WizardData, WizardBusiness, WizardEmployee, AppointmentWizardProps } from './wizard-types'
import type { Service, Location, Appointment } from '@/types/types'

interface UseWizardStateParams {
  open: boolean
  businessId?: string
  preselectedServiceId?: string
  preselectedLocationId?: string
  preselectedEmployeeId?: string
  preselectedDate?: Date
  preselectedTime?: string
  appointmentToEdit?: Appointment | null
  onClose: () => void
  dataCache: { locations: Location[] | null; services: Service[] | null }
  analytics: {
    trackBookingStarted: (p: { businessId: string; businessName?: string }) => void
    trackBookingStepCompleted: (p: {
      businessId: string; businessName?: string; stepNumber: number; totalSteps: number
      serviceId?: string; serviceName?: string; employeeId?: string; employeeName?: string
      locationId?: string; currency: string
    }) => void
    trackBookingAbandoned: (p: {
      businessId: string; businessName?: string; stepNumber: number; totalSteps: number
      serviceId?: string; serviceName?: string; employeeId?: string; employeeName?: string
      locationId?: string; currency: string
    }) => void
  }
}

export function useWizardState({
  open,
  businessId,
  preselectedServiceId,
  preselectedLocationId,
  preselectedEmployeeId,
  preselectedDate,
  preselectedTime,
  appointmentToEdit,
  onClose,
  dataCache,
  analytics,
}: UseWizardStateParams) {
  const { t } = useLanguage()

  const STEP_LABELS_MAP: Record<string, string> = {
    business: t('appointments.wizard.stepLabels.business'),
    location: t('appointments.wizard.stepLabels.location'),
    service: t('appointments.wizard.stepLabels.service'),
    employee: t('appointments.wizard.stepLabels.employee'),
    employeeBusiness: t('appointments.wizard.stepLabels.employeeBusiness'),
    dateTime: t('appointments.wizard.stepLabels.dateTime'),
    confirmation: t('appointments.wizard.stepLabels.confirmation'),
    success: t('appointments.wizard.stepLabels.success'),
  }

  // ── Normalize preselected time ──────────────────────────────────────────────
  const normalizePreselectedTime = (time?: string | null): string | null => {
    if (!time) return null
    const ampmRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i
    const twentyFourRegex = /^(\d{1,2}):(\d{2})$/

    const ampmMatch = time.match(ampmRegex)
    if (ampmMatch) {
      const hourNum = Number.parseInt(ampmMatch[1], 10)
      const minuteStr = ampmMatch[2]
      const suffix = ampmMatch[3].toUpperCase()
      const hourStr = (hourNum === 0 ? 12 : hourNum).toString().padStart(2, '0')
      return `${hourStr}:${minuteStr} ${suffix}`
    }

    const tfMatch = time.match(twentyFourRegex)
    if (tfMatch) {
      const hourNum = Number.parseInt(tfMatch[1], 10)
      const minuteStr = tfMatch[2]
      const suffix = hourNum >= 12 ? 'PM' : 'AM'
      let hour12 = hourNum % 12
      if (hour12 === 0) hour12 = 12
      const hourStr = hour12.toString().padStart(2, '0')
      return `${hourStr}:${minuteStr} ${suffix}`
    }

    return time
  }

  // ── Core state ──────────────────────────────────────────────────────────────
  const [wizardData, setWizardData] = useState<WizardData>({
    businessId: businessId || null,
    business: null,
    locationId: preselectedLocationId || null,
    location: null,
    serviceId: preselectedServiceId || null,
    service: null,
    employeeId: preselectedEmployeeId || null,
    employee: null,
    employeeBusinessId: null,
    employeeBusiness: null,
    resourceId: null,
    date: preselectedDate || null,
    startTime: normalizePreselectedTime(preselectedTime) || null,
    endTime: null,
    notes: '',
  })

  // ── updateWizardData (early definition for use in queries below) ────────────
  const updateWizardData = React.useCallback((data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }))
  }, [])

  const { businesses: employeeBusinesses, isEmployeeOfAnyBusiness } = useEmployeeBusinesses(
    wizardData.employeeId,
    true,
  )

  // When wizard opens with a businessId prop but business object not yet loaded,
  // fetch it with React Query so canProceed() can detect resource_model for resource-based businesses
  const { data: fetchedBusiness } = useQuery({
    queryKey: QUERY_CONFIG.KEYS.BUSINESS(businessId || ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('businesses')
        .select('id, name, description, resource_model')
        .eq('id', businessId!)
        .single();
      return data as WizardBusiness | null;
    },
    enabled: !!businessId && !wizardData.business,
    ...QUERY_CONFIG.STABLE,
  });

  // Update wizardData when business is fetched via React Query
  React.useEffect(() => {
    if (fetchedBusiness && !wizardData.business) {
      updateWizardData({ business: fetchedBusiness });
    }
  }, [fetchedBusiness, wizardData.business, updateWizardData])

  const initiatedFromEmployeeProfile = Boolean(preselectedEmployeeId)
  const needsEmployeeBusinessSelection =
    !!initiatedFromEmployeeProfile && !!wizardData.employeeId && employeeBusinesses.length > 1

  // ── Step order ──────────────────────────────────────────────────────────────
  const stepOrder = React.useMemo<string[]>(() => {
    const base = businessId
      ? ['location', 'service', 'employee', 'dateTime', 'confirmation', 'success']
      : ['business', 'location', 'service', 'employee', 'dateTime', 'confirmation', 'success']
    if (needsEmployeeBusinessSelection) {
      const idx = base.indexOf('employee')
      return [...base.slice(0, idx + 1), 'employeeBusiness', ...base.slice(idx + 1)]
    }
    return base
  }, [businessId, needsEmployeeBusinessSelection])

  const getStepOrder = React.useCallback((): string[] => stepOrder, [stepOrder])

  const getTotalSteps = React.useCallback(() => stepOrder.length, [stepOrder])

  const getStepNumber = React.useCallback((logicalStep: string): number => stepOrder.indexOf(logicalStep), [stepOrder])

  const getInitialStepLogical = React.useCallback(() => {
    // When rescheduling (editing) an existing appointment, businessId plus
    // serviceId / locationId / employeeId are always pre-filled by
    // handleRescheduleAppointment — jump directly to date/time selection.
    if (appointmentToEdit && businessId) return 'dateTime'
    if (preselectedDate || preselectedTime) return 'business'
    if (!businessId) return 'business'
    if (preselectedEmployeeId && preselectedServiceId) return 'dateTime'
    if (preselectedEmployeeId && !preselectedServiceId) return 'service'
    if (preselectedServiceId && !preselectedEmployeeId) return 'location'
    if (preselectedLocationId) return 'service'
    return 'location'
  }, [
    appointmentToEdit,
    preselectedDate,
    preselectedTime,
    businessId,
    preselectedEmployeeId,
    preselectedServiceId,
    preselectedLocationId,
  ])

  const [currentStep, setCurrentStep] = useState(() => getStepNumber(getInitialStepLogical()))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTrackedStart, setHasTrackedStart] = React.useState(false)

  // ── Skippable / effective steps ─────────────────────────────────────────────
  const getSkippableSteps = React.useCallback((): string[] => {
    const skippable: string[] = []
    if (!dataCache.locations || !dataCache.services) return skippable

    if (dataCache.locations.length === 1) {
      skippable.push('location')
      const servicesForLocation = dataCache.services.filter(
        s => s.location_id === dataCache.locations![0].id,
      )
      if (servicesForLocation.length === 1) skippable.push('service')
    } else if (wizardData.locationId) {
      const servicesForLocation = dataCache.services.filter(
        s => s.location_id === wizardData.locationId,
      )
      if (servicesForLocation.length === 1) skippable.push('service')
    }

    return skippable
  }, [dataCache.locations, dataCache.services, wizardData.locationId])

  const getDisplaySteps = React.useCallback((): string[] =>
    stepOrder.filter(s => s !== 'success' && s !== 'employeeBusiness'),
  [stepOrder])

  const getEffectiveSteps = React.useCallback((): string[] => {
    const allSteps = getDisplaySteps()
    const skippable = getSkippableSteps()
    return allSteps.filter(s => !skippable.includes(s))
  }, [getDisplaySteps, getSkippableSteps])

  const getEffectiveTotalSteps = React.useCallback((): number => getEffectiveSteps().length, [getEffectiveSteps])

  const getEffectiveCurrentStep = React.useCallback((): number => {
    const effectiveSteps = getEffectiveSteps()
    let currentStepName = stepOrder[currentStep]
    if (currentStepName === 'employeeBusiness') currentStepName = 'employee'
    const idx = effectiveSteps.indexOf(currentStepName)
    if (idx >= 0) return idx
    const allSteps = stepOrder
    for (let i = currentStep + 1; i < allSteps.length; i++) {
      let stepName = allSteps[i]
      if (stepName === 'employeeBusiness') stepName = 'employee'
      const effectiveIdx = effectiveSteps.indexOf(stepName)
      if (effectiveIdx >= 0) return effectiveIdx
    }
    return Math.max(0, effectiveSteps.length - 1)
  }, [currentStep, getEffectiveSteps, stepOrder])

  const getCompletedSteps = React.useCallback((): number[] => {
    const completed: number[] = []
    const effectiveSteps = getEffectiveSteps()

    if (wizardData.businessId && effectiveSteps.includes('business'))
      completed.push(effectiveSteps.indexOf('business'))
    if (wizardData.locationId && effectiveSteps.includes('location'))
      completed.push(effectiveSteps.indexOf('location'))
    if (wizardData.serviceId && effectiveSteps.includes('service'))
      completed.push(effectiveSteps.indexOf('service'))
    if (wizardData.employeeId && effectiveSteps.includes('employee'))
      completed.push(effectiveSteps.indexOf('employee'))
    if (wizardData.date && wizardData.startTime && effectiveSteps.includes('dateTime'))
      completed.push(effectiveSteps.indexOf('dateTime'))

    const effectiveCurrentStepIndex = getEffectiveCurrentStep()
    const confirmationIndex = effectiveSteps.indexOf('confirmation')
    if (effectiveCurrentStepIndex > confirmationIndex && confirmationIndex !== -1)
      completed.push(confirmationIndex)

    return completed.map(i => i + 1)
  }, [
    getEffectiveSteps,
    wizardData.businessId,
    wizardData.locationId,
    wizardData.serviceId,
    wizardData.employeeId,
    wizardData.date,
    wizardData.startTime,
    getEffectiveCurrentStep,
  ])

  // ── canProceed ──────────────────────────────────────────────────────────────
  const canProceed = React.useCallback(() => {
    if (currentStep === getStepNumber('business')) return wizardData.businessId !== null
    if (currentStep === getStepNumber('location')) return wizardData.locationId !== null
    if (currentStep === getStepNumber('service')) return wizardData.serviceId !== null
    if (currentStep === getStepNumber('employee')) {
      // TODO: Cuando se implemente ResourceSelection, volver a distinguir por resource_model
      // para retornar wizardData.resourceId !== null en physical_resource / group_class
      return wizardData.employeeId !== null && isEmployeeOfAnyBusiness
    }
    if (currentStep === getStepNumber('employeeBusiness')) return wizardData.employeeBusinessId !== null
    if (currentStep === getStepNumber('dateTime')) return wizardData.date !== null && wizardData.startTime !== null
    if (currentStep === getStepNumber('confirmation')) return true
    return false
  }, [
    currentStep,
    getStepNumber,
    wizardData.businessId,
    wizardData.locationId,
    wizardData.serviceId,
    wizardData.business?.resource_model,
    wizardData.resourceId,
    wizardData.employeeId,
    isEmployeeOfAnyBusiness,
    wizardData.employeeBusinessId,
    wizardData.date,
    wizardData.startTime,
  ])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = React.useCallback(async () => {
    if (!dataCache.locations || !dataCache.services) {
      setCurrentStep(currentStep + 1)
      return
    }

    if (currentStep === getStepNumber('dateTime')) {
      if (!wizardData.date) {
        toast.error(t('appointments.wizard_errors.selectDate'))
        return
      }
      if (!wizardData.startTime) {
        toast.error(t('appointments.wizard_errors.selectTime'))
        return
      }
    }

    analytics.trackBookingStepCompleted({
      businessId: wizardData.businessId || businessId || '',
      businessName: wizardData.business?.name,
      stepNumber: currentStep,
      totalSteps: getTotalSteps(),
      serviceId: wizardData.serviceId || undefined,
      serviceName: wizardData.service?.name,
      employeeId: wizardData.employeeId || undefined,
      employeeName: wizardData.employee?.full_name || undefined,
      locationId: wizardData.locationId || undefined,
      currency: 'COP',
    })

    // Auto-select location if only one
    if (currentStep === getStepNumber('location') && dataCache.locations.length === 1) {
      const singleLocation = dataCache.locations[0]
      updateWizardData({ locationId: singleLocation.id, location: singleLocation })

      if (wizardData.serviceId) {
        setCurrentStep(getStepNumber('employee'))
        return
      }

      const servicesForLocation = dataCache.services.filter(s => s.location_id === singleLocation.id)
      if (servicesForLocation.length === 1) {
        updateWizardData({ serviceId: servicesForLocation[0].id, service: servicesForLocation[0] })
        setCurrentStep(getStepNumber('employee'))
      } else {
        setCurrentStep(getStepNumber('service'))
      }
      return
    }

    if (currentStep === getStepNumber('location') && wizardData.serviceId) {
      setCurrentStep(getStepNumber('employee'))
      return
    }

    // Auto-select service if only one
    if (currentStep === getStepNumber('service') && wizardData.locationId) {
      const servicesForLocation = dataCache.services.filter(
        s => s.location_id === wizardData.locationId,
      )
      if (servicesForLocation.length === 1) {
        updateWizardData({ serviceId: servicesForLocation[0].id, service: servicesForLocation[0] })
        setCurrentStep(getStepNumber('employee'))
        return
      }
    }

    if (currentStep === getStepNumber('employee') && needsEmployeeBusinessSelection) {
      if (!isEmployeeOfAnyBusiness) {
        toast.error(t('appointments.wizard_errors.professionalNotAvailable'))
        return
      }
      setCurrentStep(getStepNumber('employeeBusiness'))
      return
    }

    if (currentStep === getStepNumber('employee') && employeeBusinesses.length === 1) {
      updateWizardData({
        employeeBusinessId: employeeBusinesses[0].id,
        employeeBusiness: employeeBusinesses[0] as WizardBusiness,
      })
      setCurrentStep(getStepNumber('dateTime'))
      return
    }

    if (currentStep === getStepNumber('employee') && !initiatedFromEmployeeProfile) {
      const contextBusinessId = wizardData.businessId || businessId || null
      if (contextBusinessId) {
        updateWizardData({
          employeeBusinessId: contextBusinessId,
          employeeBusiness: wizardData.business || null,
        })
        setCurrentStep(getStepNumber('dateTime'))
        return
      }
    }

    if (currentStep === getStepNumber('employee') && !isEmployeeOfAnyBusiness) {
      // Resource bookings don't require an employee — skip this validation
      if (!wizardData.resourceId) {
        toast.error(t('appointments.wizard_errors.professionalCannotAccept'))
        return
      }
    }

    const maxStep = getTotalSteps() - 1
    if (currentStep < maxStep) setCurrentStep(prev => prev + 1)
  }, [
    dataCache.locations,
    dataCache.services,
    currentStep,
    getStepNumber,
    wizardData.date,
    wizardData.startTime,
    wizardData.businessId,
    wizardData.business,
    wizardData.serviceId,
    wizardData.service,
    wizardData.employeeId,
    wizardData.employee,
    wizardData.locationId,
    wizardData.resourceId,
    businessId,
    analytics,
    t,
    updateWizardData,
    needsEmployeeBusinessSelection,
    isEmployeeOfAnyBusiness,
    employeeBusinesses,
    initiatedFromEmployeeProfile,
    getTotalSteps,
  ])

  const handleBack = React.useCallback(() => {
    const minStep = businessId ? 1 : 0
    if (currentStep > minStep) setCurrentStep(prev => prev - 1)
  }, [businessId, currentStep])

  const handleClose = React.useCallback(() => {
    if (isSubmitting) return

    if (currentStep > 0 && currentStep < getTotalSteps() - 1) {
      analytics.trackBookingAbandoned({
        businessId: wizardData.businessId || businessId || '',
        businessName: wizardData.business?.name,
        stepNumber: currentStep,
        totalSteps: getTotalSteps(),
        serviceId: wizardData.serviceId || undefined,
        serviceName: wizardData.service?.name,
        employeeId: wizardData.employeeId || undefined,
        employeeName: wizardData.employee?.full_name || undefined,
        locationId: wizardData.locationId || undefined,
        currency: 'COP',
      })
    }

    hasBackfilledRef.current = false
    setCurrentStep(getStepNumber(getInitialStepLogical()))
    setWizardData({
      businessId: businessId || null,
      business: null,
      locationId: preselectedLocationId || null,
      location: null,
      serviceId: preselectedServiceId || null,
      service: null,
      employeeId: preselectedEmployeeId || null,
      employee: null,
      employeeBusinessId: null,
      employeeBusiness: null,
      resourceId: null,
      date: null,
      startTime: null,
      endTime: null,
      notes: '',
    })
    onClose()
  }, [
    isSubmitting,
    currentStep,
    getTotalSteps,
    analytics,
    wizardData.businessId,
    wizardData.business,
    wizardData.serviceId,
    wizardData.service,
    wizardData.employeeId,
    wizardData.employee,
    wizardData.locationId,
    businessId,
    getStepNumber,
    getInitialStepLogical,
    preselectedLocationId,
    preselectedServiceId,
    preselectedEmployeeId,
    onClose,
  ])

  // ── Edit mode hydration ─────────────────────────────────────────────────────
  const hasHydratedEditRef = React.useRef(false)
  React.useEffect(() => {
    if (!open || !appointmentToEdit || hasHydratedEditRef.current) return
    hasHydratedEditRef.current = true

    const apt = appointmentToEdit as unknown as Record<string, unknown>
    const updates: Partial<WizardData> = {}

    const svc = apt.service as Record<string, unknown> | null | undefined
    if (svc && !wizardData.service) {
      updates.service = {
        id: (svc.id as string) || wizardData.serviceId || '',
        name: (svc.name as string) || '',
        duration: (svc.duration_minutes as number) ?? (svc.duration as number) ?? 0,
        price: (svc.price as number) ?? undefined,
      } as unknown as Service
    }

    const emp = apt.employee as Record<string, unknown> | null | undefined
    if (emp && !wizardData.employee) {
      updates.employee = {
        id: (emp.id as string) || wizardData.employeeId || '',
        full_name: (emp.full_name as string) || null,
        email: (emp.email as string) || '',
        role: (emp.role as string) || '',
        avatar_url: (emp.avatar_url as string) || null,
      } as WizardEmployee
    }

    const loc = apt.location as Record<string, unknown> | null | undefined
    if (loc && !wizardData.location) {
      updates.location = {
        id: (loc.id as string) || wizardData.locationId || '',
        name: (loc.name as string) || '',
        address: (loc.address as string) || null,
      } as unknown as Location
    }

    const biz = apt.business as Record<string, unknown> | null | undefined
    if (biz && !wizardData.business) {
      updates.business = {
        id: (biz.id as string) || wizardData.businessId || '',
        name: (biz.name as string) || '',
        description: (biz.description as string) || null,
      } as WizardBusiness
    }

    if (apt.notes && !wizardData.notes) updates.notes = apt.notes as string

    if (Object.keys(updates).length > 0) updateWizardData(updates)
  }, [
    open, appointmentToEdit,
    wizardData.service, wizardData.employee, wizardData.location, wizardData.business,
    wizardData.serviceId, wizardData.employeeId, wizardData.locationId, wizardData.businessId,
    wizardData.notes,
    updateWizardData,
  ])

  React.useEffect(() => {
    if (!open) hasHydratedEditRef.current = false
  }, [open])

  // ── Service backfill (preselectedServiceId → business/location) ─────────────
  const hasBackfilledRef = React.useRef(false)
  React.useEffect(() => {
    const backfillFromService = async () => {
      if (!preselectedServiceId) return
      if (hasBackfilledRef.current) return
      if (wizardData.businessId && wizardData.locationId) return

      try {
        const { data, error } = await supabase
          .from('employee_services')
          .select('business_id, location_id')
          .eq('service_id', preselectedServiceId)
          .eq('is_active', true)

        if (error) throw error
        const rows = (data || []) as Array<{ business_id: string | null; location_id: string | null }>
        const businessIds = Array.from(new Set(rows.map(r => r.business_id).filter(Boolean))) as string[]
        const locationIds = Array.from(new Set(rows.map(r => r.location_id).filter(Boolean))) as string[]

        const updates: Partial<WizardData> = {}
        if (!wizardData.businessId && businessIds.length === 1) updates.businessId = businessIds[0]
        if (!wizardData.locationId && locationIds.length === 1) updates.locationId = locationIds[0]

        if (Object.keys(updates).length > 0) {
          updateWizardData(updates)
          hasBackfilledRef.current = true
        }
      } catch (e) {
        logger.warn('Backfill service→business/location failed', e)
      }
    }

    backfillFromService()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedServiceId])

  // ── Track booking started ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (open && !hasTrackedStart && (businessId || wizardData.businessId)) {
      analytics.trackBookingStarted({
        businessId: wizardData.businessId || businessId || '',
        businessName: wizardData.business?.name,
      })
      setHasTrackedStart(true)
    }
  }, [open, hasTrackedStart, analytics, businessId, wizardData.businessId, wizardData.business?.name])

  return {
    t,
    STEP_LABELS_MAP,
    wizardData,
    updateWizardData,
    currentStep,
    setCurrentStep,
    isSubmitting,
    setIsSubmitting,
    normalizePreselectedTime,
    // Step utilities
    getStepOrder,
    getTotalSteps,
    getStepNumber,
    getInitialStepLogical,
    getSkippableSteps,
    getDisplaySteps,
    getEffectiveSteps,
    getEffectiveTotalSteps,
    getEffectiveCurrentStep,
    getCompletedSteps,
    canProceed,
    // Derived
    initiatedFromEmployeeProfile,
    needsEmployeeBusinessSelection,
    employeeBusinesses,
    isEmployeeOfAnyBusiness,
    // Navigation
    handleNext,
    handleBack,
    handleClose,
  }
}
