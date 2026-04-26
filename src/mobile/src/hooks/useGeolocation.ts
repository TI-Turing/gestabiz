import { useState, useEffect, useCallback } from 'react'
import * as Location from 'expo-location'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coords {
  latitude: number
  longitude: number
  accuracy: number | null
}

export interface UseGeolocationResult {
  coords: Coords | null
  loading: boolean
  error: string | null
  permissionStatus: Location.PermissionStatus | null
  refreshLocation: () => Promise<void>
}

// ─── Hook: useGeolocation ─────────────────────────────────────────────────────

export function useGeolocation({ enabled = true } = {}): UseGeolocationResult {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null)

  const fetchLocation = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setPermissionStatus(status)

      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Permiso de ubicación denegado')
        return
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener la ubicación')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      fetchLocation()
    }
  }, [fetchLocation, enabled])

  return { coords, loading, error, permissionStatus, refreshLocation: fetchLocation }
}
