/**
 * @file HierarchyMapView.tsx
 * @description Vista de mapa/organigrama jerárquico
 * Visualización en árbol de la estructura organizacional
 * Phase 3 - UI Components
 */

import React, { useState, useEffect, useRef } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HierarchyNode } from './HierarchyNode'
import { cn } from '@/lib/utils'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface HierarchyMapViewProps {
  employees: EmployeeHierarchy[]
  onEmployeeSelect?: (employee: EmployeeHierarchy) => void
  /** ID (user_id) del empleado a enfocar al abrir el mapa — expande sus ancestros y hace scroll hasta él */
  focusEmployeeId?: string
}

// =====================================================
// HELPER: calcula los IDs de ancestros de un nodo (para expandirlos)
// =====================================================

function computeAncestorIds(targetId: string, emps: EmployeeHierarchy[]): Set<string> {
  const empMap = new Map<string, EmployeeHierarchy>()
  for (const e of emps) {
    const id = e.user_id ?? e.employee_id
    if (id) empMap.set(id, e)
  }
  const ancestors = new Set<string>()
  let cur = empMap.get(targetId)
  while (cur?.reports_to) {
    const parent = empMap.get(cur.reports_to)
    if (!parent) break
    const parentId = parent.user_id ?? parent.employee_id
    if (!parentId) break
    ancestors.add(parentId)
    cur = parent
  }
  return ancestors
}

interface TreeNode {
  employee: EmployeeHierarchy
  children: TreeNode[]
  isExpanded: boolean
}

// =====================================================
// COMPONENTE
// =====================================================

export function HierarchyMapView({ employees, onEmployeeSelect, focusEmployeeId }: Readonly<HierarchyMapViewProps>) {
  const [zoom, setZoom] = useState(100)
  // Inicializar con los ancestros del empleado enfocado expandidos
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() =>
    focusEmployeeId ? computeAncestorIds(focusEmployeeId, employees) : new Set()
  )
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const getEmployeeId = (employee: EmployeeHierarchy): string | undefined => employee.user_id ?? employee.employee_id

  // Scroll hasta el nodo enfocado tras el primer render (con debounce por la animación)
  useEffect(() => {
    if (!focusEmployeeId || !scrollContainerRef.current) return
    const timer = setTimeout(() => {
      const el = scrollContainerRef.current?.querySelector<HTMLElement>(
        `[data-focus-employee="${focusEmployeeId}"]`
      )
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }, 200)
    return () => clearTimeout(timer)
  }, [focusEmployeeId])

  // =====================================================
  // TREE BUILDER
  // =====================================================

  const buildTree = (): TreeNode[] => {
    // Encontrar nodos raíz (sin supervisor o supervisor no en lista)
    const rootEmployees = employees.filter(emp => {
      const reportsTo = emp.reports_to
      if (!reportsTo) return true
      return !employees.some(e => getEmployeeId(e) === reportsTo)
    })

    const buildNode = (employee: EmployeeHierarchy): TreeNode => {
      const employeeId = getEmployeeId(employee)
      const childEmployees = employeeId
        ? employees.filter(emp => emp.reports_to === employeeId)
        : []
      const children = childEmployees.map(child => buildNode(child))

      return {
        employee,
        children,
        isExpanded: employeeId ? expandedNodes.has(employeeId) : false,
      }
    }

    return rootEmployees.map(emp => buildNode(emp))
  }

  const tree = buildTree()

  // =====================================================
  // HANDLERS
  // =====================================================

  const toggleExpand = (userId?: string) => {
    if (!userId) return
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const handleExpandAll = () => {
    const allIds = new Set(
      employees
        .map(getEmployeeId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
    setExpandedNodes(allIds)
  }

  const handleCollapseAll = () => {
    setExpandedNodes(new Set())
  }

  // =====================================================
  // RENDER NODE RECURSIVO
  // =====================================================

  const renderNode = (node: TreeNode, depth = 0): React.ReactElement => {
    const hasChildren = node.children.length > 0
    const nodeId = getEmployeeId(node.employee)
    const isFocused = !!focusEmployeeId && nodeId === focusEmployeeId
    const isOnlyChild = node.children.length === 1

    return (
      <div
        key={nodeId ?? node.employee.email ?? node.employee.full_name}
        className="flex flex-col items-center"
        {...(isFocused ? { 'data-focus-employee': nodeId } : {})}
      >
        {/* NODO */}
        <HierarchyNode
          employee={node.employee}
          isExpanded={node.isExpanded}
          onToggleExpand={hasChildren ? () => toggleExpand(nodeId) : undefined}
          onClick={() => onEmployeeSelect?.(node.employee)}
          depth={depth}
          className={isFocused ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : undefined}
        />

        {/* CONECTORES Y DESCENDIENTES */}
        {hasChildren && node.isExpanded && (
          <>
            {/* Línea vertical que baja del card hasta el riel horizontal */}
            <div className="w-0.5 h-8 bg-border shrink-0" />

            {/* Fila de hijos */}
            <div className="flex flex-wrap items-start justify-center gap-4 md:gap-8">
              {node.children.map((child, i) => {
                const isFirst = i === 0
                const isLast = i === node.children.length - 1
                const childId = getEmployeeId(child.employee) ?? child.employee.email ?? child.employee.full_name
                return (
                  <div key={childId} className="relative flex flex-col items-center">
                    {/* Riel horizontal: segmento que conecta con los hermanos */}
                    {!isOnlyChild && (
                      <div
                        className={cn(
                          'absolute top-0 h-0.5 bg-border',
                          isFirst && 'left-1/2 right-[-16px]',
                          isLast && 'left-[-16px] right-1/2',
                          !isFirst && !isLast && 'left-[-16px] right-[-16px]',
                        )}
                      />
                    )}
                    {/* Stub vertical desde el riel hasta el nodo hijo */}
                    <div className="w-0.5 h-8 bg-border" />
                    {renderNode(child, depth + 1)}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No hay empleados para mostrar</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-[500px] bg-accent/20 rounded-lg overflow-hidden">
      {/* TOOLBAR — siempre visible, no flotante */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background border-b border-border shrink-0 flex-wrap">
        {/* Expandir / Colapsar */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            Expandir todo
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            Colapsar todo
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-muted rounded-lg px-1 py-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-10 text-center tabular-nums">{zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 150}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ORGANIGRAMA — scrollable */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div
          className="p-6 sm:p-12 w-full transition-transform"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-16">
            {tree.map(node => renderNode(node))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HierarchyMapView
