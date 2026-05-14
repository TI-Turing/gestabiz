import { describe, it, expect } from 'vitest'
import {
  computeAssigneeStepName,
  buildWizardStepOrder,
  canProceedAtStep,
} from '../wizardLogic'
import type { WizardData } from '../wizard-types'

/**
 * Helpers puros del AppointmentWizard. La lógica que decide qué paso va a
 * continuación según el resource_model del negocio se aísla aquí para poder
 * testear las 4 ramas (professional / physical_resource / hybrid / group_class)
 * sin levantar el hook completo.
 */

describe('computeAssigneeStepName', () => {
  it('professional => employee', () => {
    expect(computeAssigneeStepName('professional')).toBe('employee')
  })
  it('null/undefined => employee (back-compat)', () => {
    expect(computeAssigneeStepName(null)).toBe('employee')
    expect(computeAssigneeStepName(undefined)).toBe('employee')
  })
  it('physical_resource => resource', () => {
    expect(computeAssigneeStepName('physical_resource')).toBe('resource')
  })
  it('group_class => resource', () => {
    expect(computeAssigneeStepName('group_class')).toBe('resource')
  })
  it('hybrid => resourceOrEmployee', () => {
    expect(computeAssigneeStepName('hybrid')).toBe('resourceOrEmployee')
  })
})

describe('buildWizardStepOrder', () => {
  const base = {
    hasBusinessId: true,
    resourceModel: 'professional' as const,
    isAdminBooking: false,
    needsEmployeeBusinessSelection: false,
  }

  it('professional + businessId fijo: omite business, incluye employee', () => {
    expect(buildWizardStepOrder(base)).toEqual([
      'location', 'service', 'employee', 'dateTime', 'confirmation', 'success',
    ])
  })

  it('sin businessId arranca con business', () => {
    expect(buildWizardStepOrder({ ...base, hasBusinessId: false })).toEqual([
      'business', 'location', 'service', 'employee', 'dateTime', 'confirmation', 'success',
    ])
  })

  it('physical_resource: reemplaza employee por resource', () => {
    expect(buildWizardStepOrder({ ...base, resourceModel: 'physical_resource' })).toEqual([
      'location', 'service', 'resource', 'dateTime', 'confirmation', 'success',
    ])
  })

  it('group_class: reemplaza employee por resource', () => {
    expect(buildWizardStepOrder({ ...base, resourceModel: 'group_class' })).toEqual([
      'location', 'service', 'resource', 'dateTime', 'confirmation', 'success',
    ])
  })

  it('hybrid: reemplaza employee por resourceOrEmployee', () => {
    expect(buildWizardStepOrder({ ...base, resourceModel: 'hybrid' })).toEqual([
      'location', 'service', 'resourceOrEmployee', 'dateTime', 'confirmation', 'success',
    ])
  })

  it('isAdminBooking inserta clientData antes de confirmation', () => {
    expect(buildWizardStepOrder({ ...base, isAdminBooking: true })).toEqual([
      'location', 'service', 'employee', 'dateTime', 'clientData', 'confirmation', 'success',
    ])
  })

  it('needsEmployeeBusinessSelection inserta employeeBusiness después de employee', () => {
    expect(buildWizardStepOrder({ ...base, needsEmployeeBusinessSelection: true })).toEqual([
      'location', 'service', 'employee', 'employeeBusiness', 'dateTime', 'confirmation', 'success',
    ])
  })

  it('hybrid + needsEmployeeBusinessSelection inserta employeeBusiness después de resourceOrEmployee', () => {
    expect(buildWizardStepOrder({
      ...base,
      resourceModel: 'hybrid',
      needsEmployeeBusinessSelection: true,
    })).toEqual([
      'location', 'service', 'resourceOrEmployee', 'employeeBusiness',
      'dateTime', 'confirmation', 'success',
    ])
  })

  it('physical_resource no inserta employeeBusiness (no aplica)', () => {
    expect(buildWizardStepOrder({
      ...base,
      resourceModel: 'physical_resource',
      needsEmployeeBusinessSelection: true,
    })).toEqual([
      'location', 'service', 'resource', 'dateTime', 'confirmation', 'success',
    ])
  })
})

describe('canProceedAtStep', () => {
  const wd = (overrides: Partial<WizardData> = {}): WizardData =>
    ({
      businessId: 'b1',
      business: null,
      locationId: 'l1',
      location: null,
      serviceId: 's1',
      service: null,
      employeeId: null,
      employee: null,
      employeeBusinessId: null,
      employeeBusiness: null,
      resourceId: null,
      date: null,
      startTime: null,
      endTime: null,
      notes: '',
      ...overrides,
    }) as WizardData

  it('business: requiere businessId', () => {
    expect(canProceedAtStep('business', wd({ businessId: null }), { isEmployeeOfAnyBusiness: true })).toBe(false)
    expect(canProceedAtStep('business', wd({ businessId: 'b1' }), { isEmployeeOfAnyBusiness: true })).toBe(true)
  })

  it('location: requiere locationId', () => {
    expect(canProceedAtStep('location', wd({ locationId: null }), { isEmployeeOfAnyBusiness: true })).toBe(false)
    expect(canProceedAtStep('location', wd({ locationId: 'l1' }), { isEmployeeOfAnyBusiness: true })).toBe(true)
  })

  it('service: requiere serviceId', () => {
    expect(canProceedAtStep('service', wd({ serviceId: null }), { isEmployeeOfAnyBusiness: true })).toBe(false)
    expect(canProceedAtStep('service', wd({ serviceId: 's1' }), { isEmployeeOfAnyBusiness: true })).toBe(true)
  })

  it('employee: requiere employeeId + isEmployeeOfAnyBusiness', () => {
    expect(canProceedAtStep('employee', wd({ employeeId: null }), { isEmployeeOfAnyBusiness: true })).toBe(false)
    expect(canProceedAtStep('employee', wd({ employeeId: 'e1' }), { isEmployeeOfAnyBusiness: false })).toBe(false)
    expect(canProceedAtStep('employee', wd({ employeeId: 'e1' }), { isEmployeeOfAnyBusiness: true })).toBe(true)
  })

  it('resource: requiere resourceId', () => {
    expect(canProceedAtStep('resource', wd({ resourceId: null }), { isEmployeeOfAnyBusiness: true })).toBe(false)
    expect(canProceedAtStep('resource', wd({ resourceId: 'r1' }), { isEmployeeOfAnyBusiness: true })).toBe(true)
  })

  it('resourceOrEmployee: requiere resourceId OR employeeId (hybrid)', () => {
    const params = { isEmployeeOfAnyBusiness: true }
    expect(canProceedAtStep('resourceOrEmployee', wd({ resourceId: null, employeeId: null }), params)).toBe(false)
    expect(canProceedAtStep('resourceOrEmployee', wd({ resourceId: 'r1', employeeId: null }), params)).toBe(true)
    expect(canProceedAtStep('resourceOrEmployee', wd({ resourceId: null, employeeId: 'e1' }), params)).toBe(true)
  })

  it('employeeBusiness: requiere employeeBusinessId', () => {
    expect(canProceedAtStep('employeeBusiness', wd({ employeeBusinessId: null }), { isEmployeeOfAnyBusiness: true })).toBe(false)
    expect(canProceedAtStep('employeeBusiness', wd({ employeeBusinessId: 'b2' }), { isEmployeeOfAnyBusiness: true })).toBe(true)
  })

  it('dateTime: requiere date + startTime', () => {
    const params = { isEmployeeOfAnyBusiness: true }
    expect(canProceedAtStep('dateTime', wd({ date: null, startTime: null }), params)).toBe(false)
    expect(canProceedAtStep('dateTime', wd({ date: new Date(), startTime: null }), params)).toBe(false)
    expect(canProceedAtStep('dateTime', wd({ date: new Date(), startTime: '10:00 AM' }), params)).toBe(true)
  })

  it('clientData: requiere phone, email y nombre', () => {
    const params = { isEmployeeOfAnyBusiness: true }
    const partial = wd({ clientPhone: '300', clientEmail: 'a@b.c' })
    expect(canProceedAtStep('clientData', partial, params)).toBe(false)
    const complete = wd({ clientPhone: '300', clientEmail: 'a@b.c', clientName: 'Ana' })
    expect(canProceedAtStep('clientData', complete, params)).toBe(true)
  })

  it('confirmation: siempre true', () => {
    expect(canProceedAtStep('confirmation', wd(), { isEmployeeOfAnyBusiness: true })).toBe(true)
  })

  it('paso desconocido: false', () => {
    expect(canProceedAtStep('unknown', wd(), { isEmployeeOfAnyBusiness: true })).toBe(false)
  })
})
