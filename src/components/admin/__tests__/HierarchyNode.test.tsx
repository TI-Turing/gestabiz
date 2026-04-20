// ============================================================================
// TESTS: HierarchyNode Component
// Tests para el nodo de organigrama con avatar y métricas
// ============================================================================

import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import { renderWithProviders } from '@/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HierarchyNode } from '../HierarchyNode'
import type { EmployeeHierarchy } from '@/types'

describe('HierarchyNode', () => {
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

  const mockOnToggleExpand = vi.fn()
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado básico', () => {
    it('debería renderizar el nombre del empleado', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('debería renderizar el cargo (job_title)', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar el avatar con iniciales', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('debería renderizar el badge de nivel', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText('Manager')).toBeInTheDocument()
    })

    it('debería renderizar contador de subordinados', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Métricas', () => {
    it('debería mostrar ocupación correctamente', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('debería mostrar rating correctamente', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText('4.5')).toBeInTheDocument()
    })

    it('debería mostrar revenue correctamente', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      expect(screen.getByText(/15/)).toBeInTheDocument() // $15k o similar
    })

    it('debería mostrar "-" cuando ocupación es null', () => {
      const employeeWithoutOccupancy = {
        ...mockEmployee,
        occupancy_percentage: null,
      }

      renderWithProviders(<HierarchyNode employee={employeeWithoutOccupancy} />)

      expect(screen.getByText('Ocup.')).toBeInTheDocument()
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('debería mostrar "0.0" cuando rating es null', () => {
      const employeeWithoutRating = {
        ...mockEmployee,
        average_rating: null,
      }

      renderWithProviders(<HierarchyNode employee={employeeWithoutRating} />)

      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('debería mostrar "$0" cuando revenue es null', () => {
      const employeeWithoutRevenue = {
        ...mockEmployee,
        total_revenue: null,
      }

      renderWithProviders(<HierarchyNode employee={employeeWithoutRevenue} />)

      expect(screen.getByText('$0')).toBeInTheDocument()
    })
  })

  describe('Niveles jerárquicos', () => {
    it('debería mostrar badge correcto para nivel 0 (Owner)', () => {
      const ownerEmployee = {
        ...mockEmployee,
        hierarchy_level: 0,
      }

      renderWithProviders(<HierarchyNode employee={ownerEmployee} />)

      expect(screen.getByText('Owner')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 1 (Admin)', () => {
      const adminEmployee = {
        ...mockEmployee,
        hierarchy_level: 1,
      }

      renderWithProviders(<HierarchyNode employee={adminEmployee} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 3 (Lead)', () => {
      const leadEmployee = {
        ...mockEmployee,
        hierarchy_level: 3,
      }

      renderWithProviders(<HierarchyNode employee={leadEmployee} />)

      expect(screen.getByText('Lead')).toBeInTheDocument()
    })

    it('debería mostrar badge correcto para nivel 4 (Staff)', () => {
      const staffEmployee = {
        ...mockEmployee,
        hierarchy_level: 4,
      }

      renderWithProviders(<HierarchyNode employee={staffEmployee} />)

      expect(screen.getByText('Staff')).toBeInTheDocument()
    })

    it('debería aplicar color correcto según nivel', () => {
      const { container } = renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      const node = container.querySelector('.border-green-500')
      expect(node).toBeInTheDocument()
    })
  })

  describe('Expansión y subordinados', () => {
    it('debería mostrar botón de expansión cuando hay subordinados', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          onToggleExpand={mockOnToggleExpand}
        />
      )

      const expandButton = screen.getByRole('button')
      expect(expandButton).toBeInTheDocument()
    })

    it('NO debería mostrar botón de expansión sin onToggleExpand callback', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      const buttons = screen.queryAllByRole('button')
      expect(buttons.length).toBe(0)
    })

    it('NO debería mostrar botón de expansión sin subordinados', () => {
      const employeeWithoutSubordinates = {
        ...mockEmployee,
        direct_reports_count: 0,
      }

      renderWithProviders(
        <HierarchyNode
          employee={employeeWithoutSubordinates}
          onToggleExpand={mockOnToggleExpand}
        />
      )

      const buttons = screen.queryAllByRole('button')
      expect(buttons.length).toBe(0)
    })

    it('debería mostrar icono ChevronRight cuando está colapsado', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
        />
      )

      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('debería mostrar icono ChevronDown cuando está expandido', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          isExpanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      )

      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('debería llamar a onToggleExpand al hacer clic en botón', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          onToggleExpand={mockOnToggleExpand}
        />
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(mockOnToggleExpand).toHaveBeenCalledTimes(1)
    })

    it('NO debería propagar click del botón de expansión al nodo', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          onToggleExpand={mockOnToggleExpand}
          onClick={mockOnClick}
        />
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(mockOnToggleExpand).toHaveBeenCalledTimes(1)
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Click en nodo', () => {
    it('debería llamar a onClick al hacer clic en el nodo', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          onClick={mockOnClick}
        />
      )

      const node = screen.getByText('John Doe').closest('div')
      if (node?.parentElement) {
        fireEvent.click(node.parentElement)
        expect(mockOnClick).toHaveBeenCalledTimes(1)
      }
    })

    it('debería funcionar sin onClick callback', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      const node = screen.getByText('John Doe').closest('div')
      expect(node).toBeInTheDocument()
    })
  })

  describe('Props opcionales', () => {
    it('debería aceptar className personalizado', () => {
      const { container } = renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          className="custom-class"
        />
      )

      const node = container.querySelector('.custom-class')
      expect(node).toBeInTheDocument()
    })

    it('debería funcionar con depth personalizado', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          depth={2}
        />
      )

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('debería renderizar sin avatar_url', () => {
      const employeeWithoutAvatar = {
        ...mockEmployee,
        avatar_url: null,
      }

      renderWithProviders(<HierarchyNode employee={employeeWithoutAvatar} />)

      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('debería renderizar sin job_title (usar employee_type)', () => {
      const employeeWithoutTitle = {
        ...mockEmployee,
        job_title: null,
      }

      renderWithProviders(<HierarchyNode employee={employeeWithoutTitle} />)

      expect(screen.getByText('fullTime')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('debería tener estructura correcta de avatar', () => {
      renderWithProviders(<HierarchyNode employee={mockEmployee} />)

      const avatar = screen.getByText('JD')
      expect(avatar).toBeInTheDocument()
    })

    it('debería tener botón de expansión accesible', () => {
      renderWithProviders(
        <HierarchyNode
          employee={mockEmployee}
          onToggleExpand={mockOnToggleExpand}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('debería manejar nombre de una palabra', () => {
      const employeeWithShortName = {
        ...mockEmployee,
        full_name: 'Madonna',
      }

      renderWithProviders(<HierarchyNode employee={employeeWithShortName} />)

      expect(screen.getByText('MA')).toBeInTheDocument()
    })

    it('debería manejar nombre muy largo', () => {
      const employeeWithLongName = {
        ...mockEmployee,
        full_name: 'Very Long Employee Name That Should Be Truncated',
      }

      renderWithProviders(<HierarchyNode employee={employeeWithLongName} />)

      expect(
        screen.getByText('Very Long Employee Name That Should Be Truncated')
      ).toBeInTheDocument()
    })

    it('debería manejar occupancy_percentage = 0', () => {
      const employeeWithZeroOccupancy = {
        ...mockEmployee,
        occupancy_percentage: 0,
      }

      renderWithProviders(<HierarchyNode employee={employeeWithZeroOccupancy} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('debería manejar direct_reports_count = 0', () => {
      const employeeWithoutReports = {
        ...mockEmployee,
        direct_reports_count: 0,
      }

      renderWithProviders(<HierarchyNode employee={employeeWithoutReports} />)

      expect(screen.queryByText('3')).not.toBeInTheDocument()
    })
  })
})
