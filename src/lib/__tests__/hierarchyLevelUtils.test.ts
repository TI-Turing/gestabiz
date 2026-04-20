import { describe, it, expect } from 'vitest'
import {
  HIERARCHY_LEVELS,
  getLevelData,
  getLevelLabel,
  getLevelBadgeColor,
  getLevelDescription,
  isValidHierarchyLevel,
} from '@/lib/hierarchyLevelUtils'

describe('hierarchyLevelUtils', () => {
  describe('HIERARCHY_LEVELS', () => {
    it('tiene 5 niveles del 0 al 4', () => {
      expect(HIERARCHY_LEVELS).toHaveLength(5)
      expect(HIERARCHY_LEVELS.map(l => l.value)).toEqual([0, 1, 2, 3, 4])
    })
  })

  describe('getLevelData', () => {
    it('retorna el nivel exacto para 0..4', () => {
      expect(getLevelData(0).label).toBe('Propietario')
      expect(getLevelData(1).label).toBe('Administrador')
      expect(getLevelData(2).label).toBe('Gerente')
      expect(getLevelData(3).label).toBe('Líder')
      expect(getLevelData(4).label).toBe('Personal')
    })

    it('retorna Personal (índice 4) si no existe', () => {
      expect(getLevelData(99).label).toBe('Personal')
      expect(getLevelData(-1).label).toBe('Personal')
    })
  })

  describe('getLevelLabel', () => {
    it('retorna labels correctas', () => {
      expect(getLevelLabel(0)).toBe('Propietario')
      expect(getLevelLabel(2)).toBe('Gerente')
    })
  })

  describe('getLevelBadgeColor', () => {
    it('retorna clases CSS', () => {
      expect(getLevelBadgeColor(0)).toContain('purple')
      expect(getLevelBadgeColor(1)).toContain('blue')
      expect(getLevelBadgeColor(99)).toContain('gray')
    })
  })

  describe('getLevelDescription', () => {
    it('retorna descripciones', () => {
      expect(getLevelDescription(0)).toBe('Propietario del negocio')
      expect(getLevelDescription(99)).toBe('Personal')
    })
  })

  describe('isValidHierarchyLevel', () => {
    it('válido para 0..4 enteros', () => {
      expect(isValidHierarchyLevel(0)).toBe(true)
      expect(isValidHierarchyLevel(4)).toBe(true)
      expect(isValidHierarchyLevel(2)).toBe(true)
    })

    it('inválido fuera de rango', () => {
      expect(isValidHierarchyLevel(-1)).toBe(false)
      expect(isValidHierarchyLevel(5)).toBe(false)
    })

    it('inválido para no enteros', () => {
      expect(isValidHierarchyLevel(2.5)).toBe(false)
    })
  })
})
