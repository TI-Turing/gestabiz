import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Users, Calendar, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ClientProfileModal } from '@/components/admin/ClientProfileModal'

interface EmployeeClientsPageProps {
  employeeId: string
  businessId: string
}

interface AptRow {
  client_id: string
  start_time: string
  status: string
}

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
}

interface ClientSummary {
  id: string
  name: string
  email: string | null
  total: number
  completed: number
  lastVisit: string | null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

async function fetchEmployeeClients(
  employeeId: string,
  businessId: string,
): Promise<ClientSummary[]> {
  // 1. Obtener citas del empleado
  const { data: apts, error: aptsError } = await supabase
    .from('appointments')
    .select('client_id, start_time, status')
    .eq('business_id', businessId)
    .eq('employee_id', employeeId)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: false })
    .limit(500)

  if (aptsError) throw aptsError
  if (!apts || apts.length === 0) return []

  // 2. Construir mapa de stats por cliente
  const statsMap = new Map<string, { total: number; completed: number; lastVisit: string }>()
  for (const apt of apts as AptRow[]) {
    if (!apt.client_id) continue
    const existing = statsMap.get(apt.client_id)
    if (existing) {
      existing.total += 1
      if (apt.status === 'completed') existing.completed += 1
    } else {
      statsMap.set(apt.client_id, {
        total: 1,
        completed: apt.status === 'completed' ? 1 : 0,
        lastVisit: apt.start_time,
      })
    }
  }

  const clientIds = Array.from(statsMap.keys())
  if (clientIds.length === 0) return []

  // 3. Batch fetch de perfiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', clientIds)

  if (profilesError) throw profilesError

  const profileMap = new Map((profiles as ProfileRow[]).map((p) => [p.id, p]))

  return clientIds
    .map((id) => {
      const stats = statsMap.get(id)!
      const profile = profileMap.get(id)
      return {
        id,
        name: profile?.full_name || 'Cliente sin nombre',
        email: profile?.email ?? null,
        total: stats.total,
        completed: stats.completed,
        lastVisit: stats.lastVisit,
      }
    })
    .sort((a, b) => b.completed - a.completed)
}

export function EmployeeClientsPage({ employeeId, businessId }: EmployeeClientsPageProps) {
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['employee-clients', employeeId, businessId],
    queryFn: () => fetchEmployeeClients(employeeId, businessId),
    enabled: !!employeeId && !!businessId,
    ...QUERY_CONFIG.FREQUENT,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    )
  }, [clients, search])

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Mis Clientes</h2>
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Cargando…'
            : `${clients.length} cliente${clients.length !== 1 ? 's' : ''} atendido${clients.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {search ? 'No se encontraron clientes' : 'Aún no tienes clientes atendidos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((client) => (
            <div
              key={client.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedClientId(client.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedClientId(client.id)
              }}
              className="rounded-xl border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{client.name}</p>
                  {client.email && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {client.completed} completada{client.completed !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {client.lastVisit && (
                      <span className="text-xs text-muted-foreground">
                        Última:{' '}
                        {format(new Date(client.lastVisit), 'd MMM', { locale: es })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientProfileModal
        clientId={selectedClientId}
        businessId={businessId}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </div>
  )
}
