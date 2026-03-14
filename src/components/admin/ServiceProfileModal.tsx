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
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { LocationProfileModal } from '@/components/admin/LocationProfileModal'
import UserProfile from '@/components/user/UserProfile'
import BusinessProfile from '@/components/business/BusinessProfile'
import { EmployeeCard } from '@/components/cards/EmployeeCard'

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
  role?: string
  job_title?: string | null
  offers_services?: boolean
  services: Array<{
    service_id: string
    service_name: string
    expertise_level: number
  }>
}

interface LocationRow {
  id: string
  name: string
  business_id?: string
}

interface BusinessInfo {
  id: string
  name: string
  logo_url: string | null
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
  const [selectedLocation, setSelectedLocation] = useState<Parameters<typeof LocationProfileModal>[0]['location'] | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [businessProfileId, setBusinessProfileId] = useState<string | null>(null)

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

        // Datos del negocio
        if (svcData.business_id) {
          const { data: bizData } = await supabase
            .from('businesses')
            .select('id, name, logo_url')
            .eq('id', svcData.business_id)
            .single()
          if (!cancelled && bizData) setBusinessInfo(bizData)
        }

        // 2. Sedes asignadas
        const { data: locLinks } = await supabase
          .from('location_services')
          .select('location_id')
          .eq('service_id', serviceId)

        if (!cancelled && locLinks && locLinks.length > 0) {
          const ids = locLinks.map((r) => r.location_id)
          const { data: locData } = await supabase
            .from('locations')
            .select('id, name, business_id')
            .in('id', ids)
          if (!cancelled) setLocations(locData ?? [])
        } else if (!cancelled) {
          setLocations([])
        }

        // 3. Empleados asignados - traer con todos sus servicios
        // Primero, obtener employee_ids para este servicio
        const { data: empServiceLinks } = await supabase
          .from('employee_services')
          .select('employee_id')
          .eq('service_id', serviceId)

        if (!cancelled && empServiceLinks && empServiceLinks.length > 0) {
          const empIds = empServiceLinks.map((r) => r.employee_id)

          // Query profiles
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', empIds)

          // Query business_employees para obtener rol, job_title, offers_services
          const { data: beData } = await supabase
            .from('business_employees')
            .select('employee_id, role, job_title, offers_services, business_id')
            .in('employee_id', empIds)
            .eq('business_id', svcData.business_id)

          // Query todos los servicios de estos empleados, filtrado por negocio
          const { data: allEmpServices } = await supabase
            .from('employee_services')
            .select('employee_id, service_id, expertise_level, services(id, name)')
            .in('employee_id', empIds)
            .eq('business_id', svcData.business_id)

          if (!cancelled) {
            // Construir mapa de profiles
            const profileMap = new Map(
              (profilesData ?? []).map((p) => [
                p.id,
                { full_name: p.full_name ?? 'Sin nombre', email: p.email ?? '', avatar_url: p.avatar_url },
              ])
            )

            // Construir mapa de business_employees
            const beMap = new Map(
              (beData ?? []).map((be) => [
                be.employee_id,
                { role: be.role, job_title: be.job_title, offers_services: be.offers_services },
              ])
            )

            // Agrupar services por employee_id
            const empServicesMap = new Map<
              string,
              Array<{ service_id: string; service_name: string; expertise_level: number }>
            >()
            for (const row of allEmpServices ?? []) {
              const svcData = Array.isArray(row.services) ? row.services[0] : row.services
              if (!empServicesMap.has(row.employee_id)) {
                empServicesMap.set(row.employee_id, [])
              }
              if (svcData) {
                empServicesMap.get(row.employee_id)!.push({
                  service_id: svcData.id,
                  service_name: svcData.name,
                  expertise_level: row.expertise_level,
                })
              }
            }

            // Construir EmployeeRow para cada empleado
            const result: EmployeeRow[] = empIds
              .map((empId) => {
                const profile = profileMap.get(empId)
                const be = beMap.get(empId)
                if (!profile) return null

                return {
                  employee_id: empId,
                  full_name: profile.full_name,
                  email: profile.email,
                  avatar_url: profile.avatar_url,
                  role: be?.role,
                  job_title: be?.job_title,
                  offers_services: be?.offers_services,
                  services: empServicesMap.get(empId) ?? [],
                }
              })
              .filter((e) => e !== null) as EmployeeRow[]

            setEmployees(result)
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
    <>
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
          {/* Badge negocio - top left */}
          {businessInfo && (
            <button
              type="button"
              onClick={() => setBusinessProfileId(businessInfo.id)}
              className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white rounded-full pl-1 pr-3 py-1 transition-colors"
            >
              {businessInfo.logo_url ? (
                <img src={businessInfo.logo_url} alt={businessInfo.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-xs font-bold">
                  {businessInfo.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium">{businessInfo.name}</span>
            </button>
          )}

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
                <TabsTrigger value="employees">Profesionales ({employees.length})</TabsTrigger>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {employees.map((e) => (
                      <EmployeeCard
                        key={e.employee_id}
                        employee={{
                          id: e.employee_id,
                          full_name: e.full_name,
                          email: e.email ?? undefined,
                          avatar_url: e.avatar_url,
                          role: e.role,
                          job_title: e.job_title,
                          offers_services: e.offers_services,
                          services: e.services,
                        }}
                        readOnly
                        onViewProfile={() => setSelectedEmployeeId(e.employee_id)}
                      />
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
                      <Card
                        key={l.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedLocation({
                          id: l.id,
                          business_id: l.business_id ?? service?.business_id ?? '',
                          name: l.name,
                          is_active: true,
                          created_at: '',
                          updated_at: '',
                        })}
                      >
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

    {/* Location Profile Modal */}
    {selectedLocation && (
      <LocationProfileModal
        open={!!selectedLocation}
        onOpenChange={(open) => { if (!open) setSelectedLocation(null) }}
        location={selectedLocation}
      />
    )}
    {/* Professional Profile */}
    {selectedEmployeeId && (
      <UserProfile
        userId={selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
      />
    )}
    {/* Business Profile */}
    {businessProfileId && (
      <BusinessProfile
        businessId={businessProfileId}
        onClose={() => setBusinessProfileId(null)}
      />
    )}
  </>
  )
}
