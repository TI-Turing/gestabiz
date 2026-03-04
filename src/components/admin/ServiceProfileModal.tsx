/**
 * @file ServiceProfileModal.tsx
 * @description Modal reutilizable para ver el perfil de un servicio.
 * Carga todos los datos internamente dado un serviceId.
 * Usado en: ServicesManager, EmployeeProfileModal y cualquier otro contexto.
 */

import { useEffect, useState } from 'react'
import { DollarSign, Clock, MapPin, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

// =====================================================
// TIPOS
// =====================================================

interface ServiceData {
  id: string
  business_id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  currency: string
  category?: string
  image_url?: string
  is_active: boolean
}

interface EmployeeRow {
  employee_id: string
  full_name: string
  email: string
  avatar_url: string | null
}

interface LocationRow {
  id: string
  name: string
}

export interface ServiceProfileModalProps {
  /** ID del servicio a mostrar. Si es null el modal está cerrado. */
  serviceId: string | null
  onClose: () => void
  /** Callback opcional: se llama cuando el usuario quiere editar/asignar sedes. */
  onEditService?: (serviceId: string) => void
}

// =====================================================
// HELPERS
// =====================================================

function cacheBust(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('v', String(Math.floor(Date.now() / 1000)))
    return u.toString()
  } catch {
    return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  }
}

// =====================================================
// COMPONENTE
// =====================================================

export function ServiceProfileModal({
  serviceId,
  onClose,
  onEditService,
}: Readonly<ServiceProfileModalProps>) {
  const [service, setService] = useState<ServiceData | null>(null)
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar datos cada vez que cambia el serviceId
  useEffect(() => {
    if (!serviceId) {
      setService(null)
      setEmployees([])
      setLocations([])
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        // 1. Datos del servicio
        const { data: svcData, error: svcError } = await supabase
          .from('services')
          .select('id, business_id, name, description, duration_minutes, price, currency, category, image_url, is_active')
          .eq('id', serviceId)
          .single()

        if (svcError) throw svcError
        if (cancelled) return
        setService(svcData)

        // 2. Sedes asignadas
        const { data: locLinks } = await supabase
          .from('location_services')
          .select('location_id')
          .eq('service_id', serviceId)

        if (!cancelled && locLinks && locLinks.length > 0) {
          const ids = locLinks.map((r) => r.location_id)
          const { data: locData } = await supabase
            .from('locations')
            .select('id, name')
            .in('id', ids)
          if (!cancelled) setLocations(locData ?? [])
        } else if (!cancelled) {
          setLocations([])
        }

        // 3. Empleados asignados
        const { data: empLinks } = await supabase
          .from('employee_services')
          .select('employee_id')
          .eq('service_id', serviceId)

        if (!cancelled && empLinks && empLinks.length > 0) {
          const ids = empLinks.map((r) => r.employee_id)
          const { data: profData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', ids)
          if (!cancelled) {
            setEmployees(
              (profData ?? []).map((p) => ({
                employee_id: p.id,
                full_name: p.full_name ?? p.email ?? 'Sin nombre',
                email: p.email ?? '',
                avatar_url: p.avatar_url,
              }))
            )
          }
        } else if (!cancelled) {
          setEmployees([])
        }
      } catch {
        if (!cancelled) toast.error('Error al cargar el perfil del servicio')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [serviceId])

  const handleAssignLocations = () => {
    if (service && onEditService) {
      onClose()
      onEditService(service.id)
      toast.message('Asigna una o más sedes antes de publicar')
    }
  }

  return (
    <Dialog open={!!serviceId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent hideClose className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil de {service?.name ?? 'Servicio'}</DialogTitle>
        </DialogHeader>

        {/* Botón cerrar */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 rounded-full shadow-md"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Hero: imagen o placeholder */}
        <div className="relative h-56 sm:h-72 shrink-0">
          {service?.image_url ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${cacheBust(service.image_url)})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="relative z-10 p-4 sm:p-6 flex items-end h-full">
            {loading ? (
              <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
            ) : (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{service?.name}</h3>
                <div className="mt-2 flex items-center gap-3 text-white/90 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>$ {service ? service.price.toLocaleString('es-CO') : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{service?.duration_minutes} minutos</span>
                  </div>
                  {service?.category && (
                    <Badge variant="default" className="bg-white/80 text-gray-800">
                      {service.category}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido con tabs */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Detalle</TabsTrigger>
                <TabsTrigger value="employees">Empleados ({employees.length})</TabsTrigger>
                <TabsTrigger value="locations">Sedes ({locations.length})</TabsTrigger>
              </TabsList>

              {/* Detalle */}
              <TabsContent value="overview" className="mt-4">
                {service?.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {service.description}
                  </p>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-muted-foreground text-center">
                      Sin descripción
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Empleados */}
              <TabsContent value="employees" className="mt-4">
                {employees.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-muted-foreground text-center">
                      No hay empleados asignados
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {employees.map((e) => (
                      <Card key={e.employee_id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={e.avatar_url ?? undefined} alt={e.full_name} />
                              <AvatarFallback className="text-xs">
                                {e.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <div className="font-medium">{e.full_name}</div>
                              {e.email && (
                                <div className="text-xs text-muted-foreground">{e.email}</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Sedes */}
              <TabsContent value="locations" className="mt-4">
                {locations.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-muted-foreground text-center space-y-3">
                      <div>No hay sedes asignadas</div>
                      {onEditService && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={handleAssignLocations}
                        >
                          Asignar sedes
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {locations.map((l) => (
                      <Card key={l.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{l.name}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
