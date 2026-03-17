/**
 * MyProfilePage — Full dedicated profile page for all user roles.
 * Shows: personal info, avatar, owned businesses, employee roles, join requests status.
 * Links to settings/profile for editing.
 */

import { useQuery } from '@tanstack/react-query'
import { Building2, Briefcase, Users, Edit, Mail, Phone, Calendar, Star, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { useAdminBusinesses } from '@/hooks/useAdminBusinesses'
import { useMyJoinRequests } from '@/hooks/useEmployeeJoinRequests'
import type { User } from '@/types'

interface MyProfilePageProps {
  user: User
  onNavigate?: (page: string) => void
}

interface EmployeeRole {
  business_id: string
  role: string | null
  employee_type: string | null
  is_active: boolean
  hire_date: string | null
  business: {
    id: string
    name: string
    logo_url: string | null
    city: string | null
  } | null
}

interface ProfileStats {
  total_appointments: number
  upcoming_appointments: number
  avg_rating: number | null
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Gerente',
  professional: 'Profesional',
  receptionist: 'Recepcionista',
  accountant: 'Contador',
  support_staff: 'Staff de Apoyo',
  owner: 'Propietario',
  admin: 'Administrador',
}

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  professional: 'bg-green-500/10 text-green-700 dark:text-green-400',
  receptionist: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  accountant: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  support_staff: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  owner: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  admin: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function MyProfilePage({ user, onNavigate }: Readonly<MyProfilePageProps>) {
  // Owned businesses
  const { businesses: ownedBusinesses, isLoading: loadingOwned } = useAdminBusinesses(user.id)

  // Employee roles
  const { data: employeeRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['my-employee-roles', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_employees')
        .select(`
          business_id, role, employee_type, is_active, hire_date,
          business:businesses(id, name, logo_url, city)
        `)
        .eq('employee_id', user.id)
        .eq('is_active', true)
        .order('hire_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as EmployeeRole[]
    },
    enabled: !!user.id,
    staleTime: 60_000,
  })

  // Profile stats (appointments)
  const { data: stats } = useQuery<ProfileStats>({
    queryKey: ['my-profile-stats', user.id],
    queryFn: async () => {
      const now = new Date().toISOString()
      const [total, upcoming, ratingData] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .in('status', ['confirmed', 'completed']),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('status', 'confirmed')
          .gte('start_time', now),
        supabase
          .from('reviews')
          .select('rating')
          .eq('reviewer_id', user.id),
      ])
      const ratings = ratingData.data?.map(r => r.rating as number) ?? []
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
      return {
        total_appointments: total.count ?? 0,
        upcoming_appointments: upcoming.count ?? 0,
        avg_rating: avg,
      }
    },
    enabled: !!user.id,
    staleTime: 120_000,
  })

  // Pending join requests
  const { data: joinRequests = [] } = useMyJoinRequests(user.id)
  const pendingJoinRequests = joinRequests.filter(r => r.status === 'pending')

  const isLoading = loadingOwned || loadingRoles

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* HEADER CARD */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage
                  src={user.avatar_url || undefined}
                  alt={user.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  {user.username && (
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.('settings')}
                  className="gap-2 shrink-0"
                >
                  <Edit className="h-4 w-4" />
                  Editar perfil
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </span>
                )}
                {memberSince && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Miembro desde {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Negocios (dueño)</p>
          <p className="text-2xl font-bold mt-1">{ownedBusinesses.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Empleos activos</p>
          <p className="text-2xl font-bold mt-1">{employeeRoles.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Citas totales</p>
          <p className="text-2xl font-bold mt-1">{stats?.total_appointments ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Próximas citas</p>
          <p className="text-2xl font-bold mt-1">{stats?.upcoming_appointments ?? 0}</p>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          Cargando datos...
        </div>
      )}

      {/* OWNED BUSINESSES */}
      {ownedBusinesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-primary" />
              Negocios que administro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ownedBusinesses.map(biz => (
              <div key={biz.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={biz.logo_url ?? undefined} alt={biz.name} />
                  <AvatarFallback>{(biz.name as string)[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{biz.name as string}</p>
                  <p className="text-xs text-muted-foreground">
                    {(biz.category as unknown as { name: string } | null)?.name ?? 'Negocio'}
                    {biz.city && ` · ${biz.city as string}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0 text-xs">
                    Propietario
                  </Badge>
                  {biz.is_active === false && (
                    <Badge variant="outline" className="text-xs">Inactivo</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigate?.('overview')}
                    className="h-7 px-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* EMPLOYEE ROLES */}
      {employeeRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-primary" />
              Empleos activos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employeeRoles.map(role => {
              const biz = role.business
              return (
                <div key={role.business_id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={biz?.logo_url ?? undefined} alt={biz?.name} />
                    <AvatarFallback>{biz?.name?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{biz?.name ?? role.business_id}</p>
                    {biz?.city && (
                      <p className="text-xs text-muted-foreground">{biz.city}</p>
                    )}
                    {role.hire_date && (
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(role.hire_date).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {role.role && (
                      <Badge className={`border-0 text-xs ${ROLE_COLORS[role.role] ?? ROLE_COLORS.support_staff}`}>
                        {ROLE_LABELS[role.role] ?? role.role}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* PENDING JOIN REQUESTS */}
      {pendingJoinRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Solicitudes pendientes de ingreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingJoinRequests.map(req => {
              const biz = req.business as unknown as { name?: string; logo_url?: string } | null
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={biz?.logo_url ?? undefined} />
                    <AvatarFallback>{biz?.name?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{biz?.name ?? req.business_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviada el {new Date(req.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0 text-xs">
                    Pendiente
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* RATING */}
      {stats?.avg_rating !== null && stats?.avg_rating !== undefined && (
        <>
          <Separator />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Calificación promedio de reseñas: <strong>{stats.avg_rating.toFixed(1)}</strong>
          </div>
        </>
      )}
    </div>
  )
}
