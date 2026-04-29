/**
 * useUserPresence
 *
 * Suscribe a user_presence de múltiples usuarios vía Supabase Realtime.
 * Consulta employee_work_schedule para determinar si el usuario está
 * "en horario laboral" (semáforo amarillo) cuando está offline.
 *
 * Semáforo:
 *   🟢 online    → status='online' en user_presence
 *   🟡 away      → offline pero dentro de horario laboral configurado
 *   ⚫ offline   → offline y fuera de horario (o sin horario configurado)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { UserPresenceInfo, WorkScheduleSlot } from '@/types/types'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica si la hora actual está dentro de algún bloque de horario del usuario
 * para el día de la semana actual.
 */
function isWithinWorkSchedule(slots: WorkScheduleSlot[]): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Dom ... 6=Sab
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return slots
    .filter(s => s.is_active && s.day_of_week === dayOfWeek)
    .some(s => currentTime >= s.start_time && currentTime <= s.end_time)
}

function buildPresenceInfo(
  status: 'online' | 'offline',
  inSchedule: boolean
): UserPresenceInfo {
  if (status === 'online') {
    return { status: 'online', color: 'green', tooltip: 'En línea' }
  }
  if (inSchedule) {
    return { status: 'away', color: 'yellow', tooltip: 'Disponible en horario laboral' }
  }
  return { status: 'offline', color: 'gray', tooltip: 'Desconectado' }
}

// ============================================================================
// HOOK
// ============================================================================

export function useUserPresence(
  userIds: string[],
  businessId?: string
): Map<string, UserPresenceInfo> {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresenceInfo>>(new Map())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const schedulesRef = useRef<Map<string, WorkScheduleSlot[]>>(new Map())

  // ── Cargar horarios laborales ────────────────────────────────────────────
  const loadSchedules = useCallback(async () => {
    if (userIds.length === 0) return

    const { data } = await supabase
      .from('employee_work_schedule')
      .select('*')
      .in('employee_id', userIds)
      .eq('is_active', true)

    if (!data) return

    const map = new Map<string, WorkScheduleSlot[]>()
    for (const row of data) {
      const existing = map.get(row.employee_id) || []
      existing.push(row as WorkScheduleSlot)
      map.set(row.employee_id, existing)
    }
    schedulesRef.current = map
  }, [userIds])

  // ── Cargar presencias iniciales ──────────────────────────────────────────
  const loadPresences = useCallback(async () => {
    if (userIds.length === 0) {
      setPresenceMap(new Map())
      return
    }

    const { data } = await supabase
      .from('user_presence')
      .select('user_id, status, last_seen_at')
      .in('user_id', userIds)

    const newMap = new Map<string, UserPresenceInfo>()

    // Usuarios con registro en user_presence
    for (const row of data || []) {
      const slots = schedulesRef.current.get(row.user_id) || []
      const inSchedule = isWithinWorkSchedule(slots)
      newMap.set(row.user_id, buildPresenceInfo(row.status as 'online' | 'offline', inSchedule))
    }

    // Usuarios sin registro (asumen offline)
    for (const uid of userIds) {
      if (!newMap.has(uid)) {
        const slots = schedulesRef.current.get(uid) || []
        const inSchedule = isWithinWorkSchedule(slots)
        newMap.set(uid, buildPresenceInfo('offline', inSchedule))
      }
    }

    setPresenceMap(newMap)
  }, [userIds])

  // ── Suscripción Realtime a user_presence ────────────────────────────────
  const subscribe = useCallback(() => {
    if (userIds.length === 0) return

    channelRef.current = supabase
      .channel(`presence:${userIds.sort().join(',')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=in.(${userIds.join(',')})`,
        },
        (payload) => {
          const row = (payload.new || payload.old) as { user_id: string; status: 'online' | 'offline' }
          if (!row?.user_id) return

          setPresenceMap(prev => {
            const next = new Map(prev)
            const slots = schedulesRef.current.get(row.user_id) || []
            const inSchedule = isWithinWorkSchedule(slots)
            next.set(row.user_id, buildPresenceInfo(row.status, inSchedule))
            return next
          })
        }
      )
      .subscribe()
  }, [userIds])

  // ── Efectos ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userIds.length === 0) return

    loadSchedules().then(() => {
      loadPresences()
      subscribe()
    })

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join(','), businessId])

  return presenceMap
}

// ============================================================================
// HELPER: actualizar presencia propia
// ============================================================================

/**
 * Actualiza el estado de presencia del usuario autenticado.
 * Llamar con 'online' al montar ChatLayout y 'offline' al desmontar.
 */
export async function updateOwnPresence(
  userId: string,
  status: 'online' | 'offline'
): Promise<void> {
  await supabase.from('user_presence').upsert(
    { user_id: userId, status, last_seen_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}
