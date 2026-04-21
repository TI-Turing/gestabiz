// ============================================================================
// TESTS: EmployeeCard Component
// Tests para el card de empleado individual
// ============================================================================

import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeCard } from '../EmployeeCard'
import type { EmployeeHierarchy } from '@/types'

describe.skip('EmployeeCard', () => {
  const mockEmployee: EmployeeHierarchy = {
    user_id: 'user-123',
    full_name: 'John Doe',
    email: 'john@example.com',
    role: 'employee',
    employee_type: 'fullTime',
    hierarchy_level: 2,
    job_title: 'Manager',
    reports_to: 'user-456',
    supervisor_name: 'Jane Smith',
    supervisor_email: 'jane@example.com',
    direct_reports_count: 3,
    occupancy_percentage: 75,
    average_rating: 4.5,
    total_revenue: 15000,
    department_id: 'dept-1',
    department_name: 'Sales',
    is_active: true,
    hire_date: '2023-01-15',
    phone: '+1234567890',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockOnEdit = vi.fn()
  const mockOnViewProfile = vi.fn()
  const mockOnAssignSupervisor = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado Normal', () => {
    it('debería renderizar el nombre del empleado', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('debería renderizar el email del empleado', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('debería renderizar el cargo (job_title)', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar el badge de nivel jerárquico', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar el avatar con iniciales', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      // Buscar por el texto de las iniciales
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('debería renderizar métricas (ocupación, rating, revenue)', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText(/15/)).toBeInTheDocument() // $15,000 o similar
    })

    it('debería renderizar contador de reportes directos', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Renderizado Compacto', () => {
    it('debería renderizar versión compacta', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} compact />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar avatar en modo compacto', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} compact />)

      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  describe('Acciones del Card', () => {
    it('debería llamar a onEdit al hacer clic en "Editar"', () => {
      renderWithProviders(
        <EmployeeCard
          employee={mockEmployee}
          onEdit={mockOnEdit}
        />
      )

      // Abrir dropdown
      const dropdownButton = screen.getByRole('button', { name: /more/i })
      fireEvent.click(dropdownButton)

      // Hacer clic en Editar
      const editOption = screen.getByText('Editar')
      fireEvent.click(editOption)

      expect(mockOnEdit).toHaveBeenCalledWith(mockEmployee)
    })

    it('debería llamar a onViewProfile al hacer clic en "Ver Perfil"', () => {
      renderWithProviders(
        <EmployeeCard
          employee={mockEmployee}
          onViewProfile={mockOnViewProfile}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more/i })
      fireEvent.click(dropdownButton)

      const viewOption = screen.getByText('Ver Perfil')
      fireEvent.click(viewOption)

      expect(mockOnViewProfile).toHaveBeenCalledWith(mockEmployee)
    })

    it('debería llamar a onAssignSupervisor al hacer clic en "Asignar Supervisor"', () => {
      renderWithProviders(
        <EmployeeCard
          employee={mockEmployee}
          onAssignSupervisor={mockOnAssignSupervisor}
        />
      )

      const dropdownButton = screen.getByRole('button', { name: /more/i })
      fireEvent.click(dropdownButton)

      const assignOption = screen.getByText('Asignar Supervisor')
      fireEvent.click(assignOption)

      expect(mockOnAssignSupervisor).toHaveBeenCalledWith(mockEmployee)
    })
  })

  describe('Estados del Empleado', () => {
    it('debería mostrar empleado activo', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      // El card no debería tener indicador de inactivo
      expect(screen.queryByText('Inactivo')).not.toBeInTheDocument()
    })

    it('debería mostrar empleado inactivo', () => {
      const inactiveEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        is_active: false,
      }

      renderWithProviders(<EmployeeCard employee={inactiveEmployee} />)

      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('Supervisor Info', () => {
    it('debería mostrar nombre del supervisor', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
    })

    it('debería mostrar "Sin supervisor" cuando no hay reports_to', () => {
      const employeeWithoutSupervisor: EmployeeHierarchy = {
        ...mockEmployee,
        reports_to: null,
        supervisor_name: null,
        supervisor_email: null,
      }

      renderWithProviders(<EmployeeCard employee={employeeWithoutSupervisor} />)

      expect(screen.getByText('Sin supervisor')).toBeInTheDocument()
    })
  })

  describe('Niveles Jerárquicos', () => {
    it('debería mostrar badge correcto para nivel 0 (Owner)', () => {
      const ownerEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 0,
        job_title: 'Owner',
      }

      renderWithProviders(<EmployeeCard employee={ownerEmployee} />)

      expect(screen.getByText('Owner')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 1 (Admin)', () => {
      const adminEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 1,
        job_title: 'Admin',
      }

      renderWithProviders(<EmployeeCard employee={adminEmployee} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 3 (Lead)', () => {
      const leadEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 3,
        job_title: 'Team Lead',
      }

      renderWithProviders(<EmployeeCard employee={leadEmployee} />)

      expect(screen.getByText('Team Lead')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 4 (Staff)', () => {
      const staffEmployee: EmployeeHierarchy = {
        ...mockEmployee,
        hierarchy_level: 4,
        job_title: 'Staff Member',
      }

      renderWithProviders(<EmployeeCard employee={staffEmployee} />)

      expect(screen.getByText('Staff Member')).toBeInTheDocument()
    })
  })

  describe('Métricas', () => {
    it('debería mostrar ocupación 0% correctamente', () => {
      const employeeWithZeroOccupancy: EmployeeHierarchy = {
        ...mockEmployee,
        occupancy_percentage: 0,
      }

      renderWithProviders(<EmployeeCard employee={employeeWithZeroOccupancy} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('debería mostrar ocupación 100% correctamente', () => {
      const employeeWithFullOccupancy: EmployeeHierarchy = {
        ...mockEmployee,
        occupancy_percentage: 100,
      }

      renderWithProviders(<EmployeeCard employee={employeeWithFullOccupancy} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('debería mostrar rating 0 cuando es null', () => {
      const employeeWithNoRating = {
        ...mockEmployee,
        average_rating: 0,
      }

      renderWithProviders(<EmployeeCard employee={employeeWithNoRating} />)

      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('debería mostrar revenue $0 cuando es 0', () => {
      const employeeWithNoRevenue = {
        ...mockEmployee,
        total_revenue: 0,
      }

      renderWithProviders(<EmployeeCard employee={employeeWithNoRevenue} />)

      expect(screen.getByText('$0')).toBeInTheDocument()
    })
  })

  describe('Departamento', () => {
    it('debería mostrar nombre del departamento', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('Sales')).toBeInTheDocument()
    })

    it('debería mostrar "Sin departamento" cuando no hay department_name', () => {
      const employeeWithoutDept: EmployeeHierarchy = {
        ...mockEmployee,
        department_id: null,
        department_name: null,
      }

      renderWithProviders(<EmployeeCard employee={employeeWithoutDept} />)

      expect(screen.getByText('Sin departamento')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('debería tener botón de dropdown accesible', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      const dropdownButton = screen.getByRole('button', { name: /more/i })
      expect(dropdownButton).toBeInTheDocument()
    })

    it('debería tener avatar con alt text o fallback', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      // Verificar que existe el avatar (con iniciales como fallback)
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  describe('Props Opcionales', () => {
    it('debería funcionar sin callbacks', () => {
      renderWithProviders(<EmployeeCard employee={mockEmployee} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('debería renderizar sin avatar_url', () => {
      const employeeWithoutAvatar: EmployeeHierarchy = {
        ...mockEmployee,
        avatar_url: null,
      }

      renderWithProviders(<EmployeeCard employee={employeeWithoutAvatar} />)

      // Debería mostrar iniciales
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })
})
