import { describe, it, expect } from 'vitest'
import { computeAllowedServiceIds } from '@/lib/services/servicesByModel'

/**
 * computeAllowedServiceIds — selecciona qué servicios mostrar en el wizard de
 * agendamiento según el resource_model del negocio.
 *
 * - 'professional': intersección con servicios asignados a empleados activos en la sede
 * - 'physical_resource': intersección con servicios asignados a recursos activos en la sede
 * - 'group_class': mismo filtro que physical_resource (grupos se reservan contra un recurso)
 * - 'hybrid': UNIÓN — un servicio es elegible si lo ofrece un empleado o un recurso
 * - default/undefined: comportamiento profesional (back-compat)
 *
 * Si NO hay locationId, el filtro no aplica y se devuelven todos los servicios.
 * Si no hay empleados/recursos activos en la sede para el modelo solicitado,
 * devuelve un Set vacío (la UI mostrará empty state).
 */

describe('computeAllowedServiceIds', () => {
  const allServiceIds = ['s1', 's2', 's3', 's4']

  const employeeServices = [
    { employee_id: 'e1', service_id: 's1' },
    { employee_id: 'e1', service_id: 's2' },
    { employee_id: 'e2', service_id: 's3' },
  ]
  const activeEmployeeIds = new Set(['e1', 'e2'])

  const resourceServices = [
    { resource_id: 'r1', service_id: 's3' },
    { resource_id: 'r2', service_id: 's4' },
  ]
  const activeResourceIds = new Set(['r1', 'r2'])

  it('sin locationId retorna null (= mostrar todos los servicios)', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'professional',
      hasLocationFilter: false,
      employeeServices,
      activeEmployeeIds,
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toBeNull()
  })

  it('modelo professional filtra por employee_services', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'professional',
      hasLocationFilter: true,
      employeeServices,
      activeEmployeeIds,
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s1', 's2', 's3']))
  })

  it('modelo undefined (back-compat) se comporta como professional', () => {
    const result = computeAllowedServiceIds({
      resourceModel: undefined,
      hasLocationFilter: true,
      employeeServices,
      activeEmployeeIds,
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s1', 's2', 's3']))
  })

  it('modelo physical_resource filtra por resource_services', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'physical_resource',
      hasLocationFilter: true,
      employeeServices,
      activeEmployeeIds,
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s3', 's4']))
  })

  it('modelo group_class se comporta igual que physical_resource', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'group_class',
      hasLocationFilter: true,
      employeeServices,
      activeEmployeeIds,
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s3', 's4']))
  })

  it('modelo hybrid devuelve la UNIÓN de empleados Y recursos', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'hybrid',
      hasLocationFilter: true,
      employeeServices,
      activeEmployeeIds,
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s1', 's2', 's3', 's4']))
  })

  it('ignora employee_services cuyo employee_id no está activo', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'professional',
      hasLocationFilter: true,
      employeeServices: [
        { employee_id: 'e1', service_id: 's1' },
        { employee_id: 'ghost', service_id: 's99' },
      ],
      activeEmployeeIds: new Set(['e1']),
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s1']))
  })

  it('ignora resource_services cuyo recurso no está activo', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'physical_resource',
      hasLocationFilter: true,
      employeeServices,
      activeEmployeeIds,
      resourceServices: [
        { resource_id: 'r1', service_id: 's3' },
        { resource_id: 'inactive', service_id: 's99' },
      ],
      activeResourceIds: new Set(['r1']),
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s3']))
  })

  it('physical_resource sin recursos activos en la sede devuelve Set vacío', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'physical_resource',
      hasLocationFilter: true,
      employeeServices,
      activeEmployeeIds,
      resourceServices: [],
      activeResourceIds: new Set(),
      allServiceIds,
    })
    expect(result).toEqual(new Set())
  })

  it('hybrid sin empleados activos pero con recursos devuelve solo los del recurso', () => {
    const result = computeAllowedServiceIds({
      resourceModel: 'hybrid',
      hasLocationFilter: true,
      employeeServices: [],
      activeEmployeeIds: new Set(),
      resourceServices,
      activeResourceIds,
      allServiceIds,
    })
    expect(result).toEqual(new Set(['s3', 's4']))
  })
})
