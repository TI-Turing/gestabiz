/**
 * Hook para manejar la Sede Preferida/Administrada del negocio
 * Se guarda en localStorage para persistencia entre sesiones
 */

import { useState, useEffect } from 'react'

const STORAGE_KEY_PREFIX = 'preferred-location-'

export interface PreferredLocationHook {
  preferredLocationId: string | null
  setPreferredLocation: (locationId: string | null) => void
  isAllLocations: boolean
  /** true una vez que el efecto inicial de lectura de localStorage terminó */
  isInitialized: boolean
  /** true si el usuario (o la app) alguna vez guardó explícitamente un valor */
  isExplicitlySet: boolean
}

/**
 * Hook para obtener y establecer la sede preferida de un negocio.
 * Se guarda en localStorage con la clave `preferred-location-{businessId}`.
 * Valores posibles en storage: `'all'` (todas las sedes) o un UUID de sede.
 *
 * @param businessId ID del negocio
 * @returns { preferredLocationId, setPreferredLocation, isAllLocations, isInitialized, isExplicitlySet }
 */
export function usePreferredLocation(businessId: string | undefined): PreferredLocationHook {
  const [preferredLocationId, setPreferredLocationId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isExplicitlySet, setIsExplicitlySet] = useState(false)

  // Cargar desde localStorage al montar o cuando cambia el negocio
  useEffect(() => {
    if (!businessId) return

    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${businessId}`)
    if (stored) {
      setPreferredLocationId(stored === 'all' ? null : stored)
      setIsExplicitlySet(true)
    }
    // Marcar como inicializado independientemente de si había un valor
    setIsInitialized(true)
  }, [businessId])

  // Función para actualizar la sede preferida
  const setPreferredLocation = (locationId: string | null) => {
    if (!businessId) return

    // Si es null, significa "Todas las sedes"
    const valueToStore = locationId || 'all'
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${businessId}`, valueToStore)
    setPreferredLocationId(locationId)
    setIsExplicitlySet(true)
  }

  const isAllLocations = preferredLocationId === null

  return {
    preferredLocationId,
    setPreferredLocation,
    isAllLocations,
    isInitialized,
    isExplicitlySet,
  }
}
