import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'checking'

interface ServiceHealth {
  supabase: ServiceStatus
  auth: ServiceStatus
  database: ServiceStatus
  storage: ServiceStatus
  lastChecked: Date | null
  error: string | null
}

export function useServiceStatus() {
  const [status, setStatus] = useState<ServiceHealth>({
    supabase: 'checking',
    auth: 'checking',
    database: 'checking',
    storage: 'checking',
    lastChecked: null,
    error: null,
  })
  
  const [wasDown, setWasDown] = useState(false)

  const checkHealth = useCallback(async () => {
    const startTime = Date.now()
    let supabaseStatus: ServiceStatus = 'operational'
    let authStatus: ServiceStatus = 'operational'
    let databaseStatus: ServiceStatus = 'operational'
    let storageStatus: ServiceStatus = 'operational'
    let error: string | null = null

    try {
      // Check 1: Auth service (fast check)
      const authPromise = supabase.auth.getSession()
      const authTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )

      await Promise.race([authPromise, authTimeout])
        .then(() => {
          authStatus = 'operational'
        })
        .catch(() => {
          authStatus = 'down'
          supabaseStatus = 'degraded'
        })

      // Check 2: Database access
      // A 401/403 response means the DB is reachable (RLS requires auth — expected before login).
      // Only mark degraded/down on network errors or timeouts.
      if (authStatus === 'operational') {
        const dbPromise = supabase.from('profiles').select('count', { count: 'exact', head: true })
        const dbTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )

        await Promise.race([dbPromise, dbTimeout])
          .then((result: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: dbError } = result as any
            // Auth errors (401/403/JWT) mean the service IS up — user just isn't logged in yet
            const isAuthError = dbError && (
              dbError.code === 'PGRST301' ||
              dbError.message?.includes('JWT') ||
              dbError.message?.includes('permission') ||
              dbError.details?.includes('anon')
            )
            if (dbError && !isAuthError) {
              databaseStatus = 'degraded'
              supabaseStatus = 'degraded'
            } else {
              databaseStatus = 'operational'
            }
          })
          .catch(() => {
            // Network error or timeout → service actually down
            databaseStatus = 'down'
            supabaseStatus = 'degraded'
          })
      }

      // Check 3: Storage access
      // listBuckets() requires auth — a non-network error means storage is reachable.
      if (authStatus === 'operational') {
        try {
          const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
          // If we got any response (even an auth error), storage is operational
          if (buckets !== null || storageError !== null) {
            storageStatus = 'operational'
          } else {
            storageStatus = 'degraded'
          }
        } catch {
          // Network-level failure
          storageStatus = 'degraded'
        }
      }

      // Overall status
      const responseTime = Date.now() - startTime
      if (responseTime > 10000) {
        supabaseStatus = 'degraded'
        error = 'La conexión está lenta. Estamos trabajando para mejorarla.'
      } else if ((authStatus as ServiceStatus) === 'down' || (databaseStatus as ServiceStatus) === 'down') {
        supabaseStatus = 'down'
        error = 'No pudimos conectarnos. Estamos verificando el problema.'
      }

    } catch (err) {
      supabaseStatus = 'down'
      authStatus = 'down'
      databaseStatus = 'down'
      storageStatus = 'down'
      error = err instanceof Error ? err.message : 'Error desconocido'
      logger.fatal('Service health check failed completely', err as Error, {
        component: 'useServiceStatus',
        operation: 'checkHealth',
      });
    }

    // Detectar si Supabase se recuperó después de estar caído
    if (wasDown && supabaseStatus === 'operational') {
      toast.success('Conexión restaurada', {
        description: 'Recargando página para restablecer la conexión...',
        duration: 2000,
      })
      // Esperar 2 segundos para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
    
    // Actualizar el estado "wasDown" para la próxima verificación
    if (supabaseStatus === 'down' && !wasDown) {
      setWasDown(true)
    }

    setStatus({
      supabase: supabaseStatus,
      auth: authStatus,
      database: databaseStatus,
      storage: storageStatus,
      lastChecked: new Date(),
      error,
    })
  }, [wasDown])

  // Ref ensures the interval always calls the latest checkHealth (avoids stale wasDown closure)
  const checkHealthRef = useRef(checkHealth)
  useEffect(() => { checkHealthRef.current = checkHealth }, [checkHealth])

  useEffect(() => {
    checkHealthRef.current()
    const interval = setInterval(() => checkHealthRef.current(), 300000)
    return () => clearInterval(interval)
  }, [])

  return { ...status, refresh: checkHealth }
}
