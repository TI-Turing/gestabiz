import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test-utils/render-with-providers'

// ──────────────────────────────────────────────────────────────────────────────
// MOCKS
// ──────────────────────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => {
  const __sb = { from: mockFrom }
  return { supabase: __sb, default: __sb }
})

vi.mock('@/lib/queryConfig', () => ({
  default: {
    STABLE: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
  },
  QUERY_CONFIG: {
    STABLE: { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
  },
}))

// ──────────────────────────────────────────────────────────────────────────────
// Hook — importar DESPUÉS de los mocks
// ──────────────────────────────────────────────────────────────────────────────

import { useLocationEmployees } from '../useLocationEmployees'

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

/** Construye la cadena de llamadas para `employee_services`. */
function buildServicesChain(result: { data: unknown; error: unknown }) {
  const finalEq = vi.fn().mockResolvedValue(result)
  const eqLoc = vi.fn().mockReturnValue({ eq: finalEq })
  const eqBiz = vi.fn().mockReturnValue({ eq: eqLoc })
  const inFn = vi.fn().mockReturnValue({ eq: eqBiz })
  const selectSvc = vi.fn().mockReturnValue({ in: inFn })
  return { select: selectSvc }
}

/** Construye la cadena de llamadas para `business_employees`. */
function buildEmployeesChain(result: { data: unknown; error: unknown }) {
  const finalEq = vi.fn().mockResolvedValue(result)
  const eqActive = vi.fn().mockReturnValue({ eq: finalEq })
  const orFn = vi.fn().mockReturnValue({ eq: eqActive })
  const eqBiz = vi.fn().mockReturnValue({ or: orFn })
  const selectEmp = vi.fn().mockReturnValue({ eq: eqBiz })
  return { select: selectEmp }
}

const LOCATION_ID = 'loc-1'
const BUSINESS_ID = 'biz-1'

const sampleEmployee = {
  employee_id: 'emp-1',
  role: 'professional',
  job_title: 'Estilista',
  employee_type: 'full_time',
  offers_services: true,
  is_active: true,
  profiles: {
    id: 'emp-1',
    full_name: 'Ana García',
    email: 'ana@test.com',
    avatar_url: null,
  },
}

const managerEmployee = {
  employee_id: 'mgr-1',
  role: 'manager',
  job_title: 'Gerente',
  employee_type: 'full_time',
  offers_services: false,
  is_active: true,
  profiles: {
    id: 'mgr-1',
    full_name: 'Carlos Pérez',
    email: 'carlos@test.com',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

const sampleService = {
  employee_id: 'emp-1',
  service_id: 'svc-1',
  expertise_level: 4,
  services: { id: 'svc-1', name: 'Corte de cabello' },
}

// ──────────────────────────────────────────────────────────────────────────────
// SUITE
// ──────────────────────────────────────────────────────────────────────────────

describe('useLocationEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Caso happy path ───────────────────────────────────────────────────────

  describe('caso exitoso', () => {
    it('retorna empleados mapeados con sus servicios', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [sampleEmployee], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [sampleService], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      const { employees } = result.current
      expect(employees).toHaveLength(1)

      const emp = employees[0]
      expect(emp.employee_id).toBe('emp-1')
      expect(emp.full_name).toBe('Ana García')
      expect(emp.email).toBe('ana@test.com')
      expect(emp.role).toBe('professional')
      expect(emp.offers_services).toBe(true)
      expect(emp.services_count).toBe(1)
    })

    it('mapea los servicios del empleado correctamente', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [sampleEmployee], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [sampleService], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      const svc = result.current.employees[0].services[0]
      expect(svc.service_id).toBe('svc-1')
      expect(svc.service_name).toBe('Corte de cabello')
      expect(svc.expertise_level).toBe(4)
    })

    it('mapea avatar_url correctamente', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [managerEmployee], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.employees[0].avatar_url).toBe('https://example.com/avatar.jpg')
    })
  })

  // ── Ordenamiento ──────────────────────────────────────────────────────────

  describe('ordenamiento', () => {
    it('pone managers primero, luego el resto por nombre', async () => {
      const anotherProfessional = {
        ...sampleEmployee,
        employee_id: 'emp-2',
        full_name: undefined,
        profiles: {
          id: 'emp-2',
          full_name: 'Beatriz Ríos',
          email: 'b@test.com',
          avatar_url: null,
        },
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({
            data: [anotherProfessional, managerEmployee, sampleEmployee],
            error: null,
          })
        if (table === 'employee_services')
          return buildServicesChain({ data: [], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))

      const names = result.current.employees.map((e) => e.role)
      expect(names[0]).toBe('manager')
    })
  })

  // ── Lista vacía ───────────────────────────────────────────────────────────

  describe('cuando no hay empleados', () => {
    it('retorna un array vacío', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.employees).toEqual([])
    })

    it('retorna empleado con services_count=0 si no hay servicios', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [sampleEmployee], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.employees[0].services_count).toBe(0)
      expect(result.current.employees[0].services).toEqual([])
    })
  })

  // ── Manejo de errores ─────────────────────────────────────────────────────

  describe('manejo de errores', () => {
    it('expone error cuando la query de empleados falla', async () => {
      const dbError = new Error('Error de base de datos')
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: null, error: dbError })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.error).toBeTruthy()
    })

    it('expone error cuando la query de servicios falla', async () => {
      const svcError = new Error('Error en employee_services')
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [sampleEmployee], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: null, error: svcError })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.error).toBeTruthy()
    })

    it('retorna error como string (no objeto Error)', async () => {
      const dbError = new Error('mensaje de error')
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: null, error: dbError })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(typeof result.current.error).toBe('string')
    })
  })

  // ── enabled=false ─────────────────────────────────────────────────────────

  describe('cuando enabled=false', () => {
    it('no hace fetch cuando enabled es false', async () => {
      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () =>
          useLocationEmployees({
            locationId: LOCATION_ID,
            businessId: BUSINESS_ID,
            enabled: false,
          }),
        { wrapper: Wrapper }
      )

      // Dar tiempo para que se ejecute si hubiera alguna query
      await new Promise((r) => setTimeout(r, 30))

      expect(mockFrom).not.toHaveBeenCalled()
      expect(result.current.employees).toEqual([])
    })
  })

  // ── IDs vacíos ─────────────────────────────────────────────────────────────

  describe('cuando locationId o businessId están vacíos', () => {
    it('no llama a Supabase con locationId vacío', async () => {
      const { Wrapper } = createWrapper()
      renderHook(
        () => useLocationEmployees({ locationId: '', businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await new Promise((r) => setTimeout(r, 30))
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('no llama a Supabase con businessId vacío', async () => {
      const { Wrapper } = createWrapper()
      renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: '' }),
        { wrapper: Wrapper }
      )

      await new Promise((r) => setTimeout(r, 30))
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  // ── Valores por defecto ────────────────────────────────────────────────────

  describe('valores por defecto en empleado', () => {
    it('usa "Empleado" como full_name cuando profiles es null', async () => {
      const empWithoutProfile = { ...sampleEmployee, profiles: null }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [empWithoutProfile], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.employees[0].full_name).toBe('Empleado')
    })

    it('usa "Servicio" como service_name cuando services es null en el join', async () => {
      const svcWithoutName = { ...sampleService, services: null }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [sampleEmployee], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [svcWithoutName], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.employees[0].services[0].service_name).toBe('Servicio')
    })

    it('usa expertise_level=3 cuando no viene del servicio', async () => {
      const svcNoLevel = { ...sampleService, expertise_level: undefined }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'business_employees')
          return buildEmployeesChain({ data: [sampleEmployee], error: null })
        if (table === 'employee_services')
          return buildServicesChain({ data: [svcNoLevel], error: null })
        return {}
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(
        () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.employees[0].services[0].expertise_level).toBe(3)
    })
  })

  // ── Estructura del retorno ─────────────────────────────────────────────────

  it('siempre retorna employees, loading, error, refetch', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'business_employees')
        return buildEmployeesChain({ data: [], error: null })
      if (table === 'employee_services')
        return buildServicesChain({ data: [], error: null })
      return {}
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useLocationEmployees({ locationId: LOCATION_ID, businessId: BUSINESS_ID }),
      { wrapper: Wrapper }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(Array.isArray(result.current.employees)).toBe(true)
    expect(typeof result.current.loading).toBe('boolean')
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true)
    expect(typeof result.current.refetch).toBe('function')
  })
})
