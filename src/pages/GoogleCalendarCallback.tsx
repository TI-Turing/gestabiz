/**
 * GoogleCalendarCallback — Maneja el redirect de OAuth de Google Calendar.
 * Google redirige aquí con ?code=xxx después de que el usuario autoriza.
 * Intercambia el code por tokens y persiste en Supabase.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { googleCalendarService } from '@/lib/googleCalendar'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'

export default function GoogleCalendarCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')

      if (error || !code) {
        setStatus('error')
        toast.error('No se pudo conectar Google Calendar')
        setTimeout(() => navigate('/app'), 2500)
        return
      }

      try {
        // Exchange authorization code for access + refresh tokens
        await googleCalendarService.exchangeCodeForToken(code)

        // Fetch the user's calendar list to find the primary calendar
        const calendars = await googleCalendarService.getCalendars()
        const primaryCalendar = calendars.find(c => c.primary) || calendars[0]
        if (!primaryCalendar) throw new Error('No se encontraron calendarios')

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        // Persist settings to DB — upsert by (user_id, provider)
        const { error: upsertError } = await supabase
          .from('calendar_sync_settings')
          .upsert({
            user_id: user.id,
            provider: 'google',
            enabled: true,
            calendar_id: primaryCalendar.id,
            sync_direction: 'both',
            auto_sync: true,
            last_sync: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,provider' })

        if (upsertError) throw upsertError

        setStatus('success')
        toast.success('Google Calendar conectado correctamente')
        setTimeout(() => navigate('/app'), 1500)
      } catch (err) {
        console.error('Google Calendar callback error:', err)
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { component: 'GoogleCalendarCallback', operation: 'oauthExchange' } })
        setStatus('error')
        toast.error('Error al conectar Google Calendar')
        setTimeout(() => navigate('/app'), 2500)
      }
    }

    handleCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Conectando Google Calendar...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-foreground">¡Conectado! Redirigiendo...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-muted-foreground">Error al conectar. Redirigiendo...</p>
          </>
        )}
      </div>
    </div>
  )
}
