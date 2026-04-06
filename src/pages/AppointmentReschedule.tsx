import { useEffect, useState } from 'react'
import * as Sentry from '@sentry/react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, MapPin, Calendar, CheckCircle, XCircle, CalendarClock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppointmentDetails {
  id: string
  service_name: string
  business_name: string
  location_name: string
  location_address: string
  start_time: string
  status: string
}

export const RESCHEDULE_STORAGE_KEY = 'reschedule_appointment_id'

export default function AppointmentReschedule() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Enlace de reprogramación no válido')
      setLoading(false)
      return
    }
    fetchAppointmentDetails()
  }, [token])

  const fetchAppointmentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          services (name),
          businesses (name),
          locations (name, address)
        `)
        .eq('confirmation_token', token)
        .in('status', ['pending', 'confirmed'])
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Esta cita no existe, ya fue cancelada o ya no puede reprogramarse')
        } else {
          setError('Error al cargar los detalles de la cita')
        }
        return
      }

      const service = Array.isArray(data.services) ? data.services[0] : data.services
      const business = Array.isArray(data.businesses) ? data.businesses[0] : data.businesses
      const location = Array.isArray(data.locations) ? data.locations[0] : data.locations

      setAppointment({
        id: data.id,
        service_name: (service as { name: string } | null)?.name || 'Servicio',
        business_name: (business as { name: string } | null)?.name || 'Negocio',
        location_name: (location as { name: string; address: string } | null)?.name || '',
        location_address: (location as { name: string; address: string } | null)?.address || '',
        start_time: data.start_time,
        status: data.status,
      })
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
        tags: { component: 'AppointmentReschedule' },
      })
      setError('Error al cargar los detalles de la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!appointment) return
    setRedirecting(true)

    // Persistir el ID para que ClientDashboard lo detecte al montar
    sessionStorage.setItem(RESCHEDULE_STORAGE_KEY, appointment.id)

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      navigate('/app/client')
    } else {
      // Usuario no autenticado → ir al login; post-login redirigirá a /app/client
      navigate('/login')
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando detalles de la cita...</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">No se puede reprogramar</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!appointment) return null

  const startDate = new Date(appointment.start_time)

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CalendarClock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Reprogramar cita</CardTitle>
          <CardDescription>
            Confirma los detalles y elige una nueva fecha y hora
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalles de la cita */}
          <div className="bg-white rounded-lg border p-5 space-y-4">
            <h3 className="font-semibold text-base">Tu cita actual</h3>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{appointment.service_name}</p>
                <p className="text-sm text-gray-500">{appointment.business_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">
                  {format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className="text-sm text-gray-500">{format(startDate, 'HH:mm')} hrs</p>
              </div>
            </div>

            {(appointment.location_name || appointment.location_address) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  {appointment.location_name && (
                    <p className="font-medium">{appointment.location_name}</p>
                  )}
                  {appointment.location_address && (
                    <p className="text-sm text-gray-500">{appointment.location_address}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleReschedule}
            disabled={redirecting}
          >
            {redirecting ? (
              <>
                <Clock className="h-4 w-4 animate-spin mr-2" />
                Abriendo la app...
              </>
            ) : (
              'Reprogramar en la app'
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={() => navigate('/')}
          >
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
