/**
 * useGoogleCalendarSync — Hook para gestionar la sincronización con Google Calendar.
 * Persiste la configuración en Supabase (tabla calendar_sync_settings).
 * El flujo OAuth completo ocorre en GoogleCalendarCallback.tsx.
 */
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { googleCalendarService } from '@/lib/googleCalendar'
import supabase from '@/lib/supabase'
import type { CalendarSyncSettings, Appointment, User } from '@/types'

export function useGoogleCalendarSync(user: User | null) {
  const [syncSettings, setSyncSettings] = useState<CalendarSyncSettings | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // ── Load settings from DB on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setIsLoaded(true)
      return
    }

    supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single()
      .then(({ data }) => {
        const settings = data as CalendarSyncSettings | null
        setSyncSettings(settings)
        if (settings?.access_token) {
          googleCalendarService.setAccessToken(settings.access_token)
        }
        setIsLoaded(true)
      })
  }, [user])

  // ── Connect: triggers Google OAuth redirect ──────────────────────────────────
  // Token exchange + DB save happen in GoogleCalendarCallback.tsx after redirect
  const connectGoogleCalendar = useCallback(async () => {
    if (!user) {
      toast.error('Usuario no autenticado')
      return
    }
    setIsConnecting(true)
    try {
      // Redirects to Google — page navigates away, setIsConnecting stays true
      await googleCalendarService.authenticate()
    } catch {
      toast.error('No se pudo iniciar la conexión con Google Calendar')
      setIsConnecting(false)
    }
  }, [user])

  // ── Disconnect ───────────────────────────────────────────────────────────────
  const disconnectGoogleCalendar = useCallback(async () => {
    if (!user) return
    await supabase
      .from('calendar_sync_settings')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google')
    setSyncSettings(null)
    googleCalendarService.setAccessToken(null)
  }, [user])

  // ── Manual sync ──────────────────────────────────────────────────────────────
  const syncWithGoogleCalendar = useCallback(async () => {
    if (!user || !syncSettings?.enabled) return

    setIsSyncing(true)
    try {
      if (syncSettings.access_token) {
        googleCalendarService.setAccessToken(syncSettings.access_token)
      }

      // Update last sync timestamp
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('calendar_sync_settings')
        .update({ last_sync: now, updated_at: now })
        .eq('user_id', user.id)
        .eq('provider', 'google')

      if (!error) {
        setSyncSettings(prev => prev ? { ...prev, last_sync: now, updated_at: now } : prev)
      }

      toast.success('Sincronización completada')
    } catch {
      toast.error('Error en la sincronización')
    } finally {
      setIsSyncing(false)
    }
  }, [user, syncSettings])

  // ── Update settings ──────────────────────────────────────────────────────────
  const updateSyncSettings = useCallback(async (updates: Partial<CalendarSyncSettings>) => {
    if (!syncSettings || !user) return

    const optimistic = { ...syncSettings, ...updates, updated_at: new Date().toISOString() }
    setSyncSettings(optimistic)

    await supabase
      .from('calendar_sync_settings')
      .update({ ...updates, updated_at: optimistic.updated_at })
      .eq('user_id', user.id)
      .eq('provider', 'google')
  }, [syncSettings, user])

  // ── Sync single appointment to Google ────────────────────────────────────────
  const syncSingleAppointment = useCallback(async (appointment: Appointment) => {
    if (!syncSettings?.enabled) return

    try {
      if (syncSettings.access_token) {
        googleCalendarService.setAccessToken(syncSettings.access_token)
      }
      const googleEvent = googleCalendarService.appointmentToGoogleEvent(
        appointment,
        user?.timezone || 'America/Bogota',
      )
      const existingEvents = await googleCalendarService.getEvents(
        syncSettings.calendar_id,
        appointment.start_time,
        appointment.end_time,
      )
      const existingEvent = existingEvents.find(
        e => e.extendedProperties?.private?.appointmentId === appointment.id,
      )
      if (existingEvent) {
        await googleCalendarService.updateEvent(syncSettings.calendar_id, existingEvent.id!, googleEvent)
      } else {
        await googleCalendarService.createEvent(syncSettings.calendar_id, googleEvent)
      }
      toast.success('Cita sincronizada con Google Calendar')
    } catch {
      toast.error('No se pudo sincronizar la cita')
      throw new Error('Sync failed')
    }
  }, [syncSettings, user])

  // ── Delete synced appointment from Google ────────────────────────────────────
  const deleteSyncedAppointment = useCallback(async (appointment: Appointment) => {
    if (!syncSettings?.enabled) return

    try {
      if (syncSettings.access_token) {
        googleCalendarService.setAccessToken(syncSettings.access_token)
      }
      const existingEvents = await googleCalendarService.getEvents(
        syncSettings.calendar_id,
        appointment.start_time,
        appointment.end_time,
      )
      const existingEvent = existingEvents.find(
        e => e.extendedProperties?.private?.appointmentId === appointment.id,
      )
      if (existingEvent) {
        await googleCalendarService.deleteEvent(syncSettings.calendar_id, existingEvent.id!)
        toast.success('Cita eliminada de Google Calendar')
      }
    } catch {
      toast.error('No se pudo eliminar la cita de Google Calendar')
      throw new Error('Delete sync failed')
    }
  }, [syncSettings])

  return {
    syncSettings,
    isConnected: !!syncSettings?.enabled,
    isConnecting,
    isSyncing,
    isLoaded,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncWithGoogleCalendar,
    updateSyncSettings,
    syncSingleAppointment,
    deleteSyncedAppointment,
  }
}
