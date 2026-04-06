import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect } from 'react'

const KEY = (businessId: string) => `preferred-location-${businessId}`

/**
 * Persists the preferred (admin-managed) location for a business in AsyncStorage.
 * Returns the locationId and a setter. Pass 'all' to reset the preference.
 */
export function usePreferredLocation(businessId: string | undefined) {
  const [preferredLocationId, setPreferredLocationId] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) return
    AsyncStorage.getItem(KEY(businessId)).then(v => {
      if (v) setPreferredLocationId(v)
    })
  }, [businessId])

  const setPreferred = useCallback(
    async (locationId: string | null) => {
      if (!businessId) return
      if (!locationId || locationId === 'all') {
        await AsyncStorage.removeItem(KEY(businessId))
        setPreferredLocationId(null)
      } else {
        await AsyncStorage.setItem(KEY(businessId), locationId)
        setPreferredLocationId(locationId)
      }
    },
    [businessId],
  )

  return { preferredLocationId, setPreferred }
}
