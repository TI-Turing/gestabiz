/**
 * JoinRequestsManager — Admin panel for reviewing employee join requests.
 * Shows pending requests from employees (search-based) and allows approve/reject.
 * Also lets admin generate invite codes (QR/code-based join flow).
 */

import { useState } from 'react'
import { UserCheck, X, Check, QrCode, Clock, Copy, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  usePendingJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useGenerateInviteCode,
  useActiveInviteCodes,
  type JoinRequest,
} from '@/hooks/useEmployeeJoinRequests'

interface JoinRequestsManagerProps {
  businessId: string
}

export function JoinRequestsManager({ businessId }: Readonly<JoinRequestsManagerProps>) {
  const [rejecting, setRejecting] = useState<JoinRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const { data: requests = [], isLoading } = usePendingJoinRequests(businessId)
  const { data: activeCodes = [] } = useActiveInviteCodes(businessId)
  const approve = useApproveJoinRequest(businessId)
  const reject = useRejectJoinRequest(businessId)
  const generateCode = useGenerateInviteCode(businessId)

  const handleApprove = async (req: JoinRequest) => {
    if (!req.employee_id) return
    await approve.mutateAsync({ requestId: req.id, employeeId: req.employee_id })
  }

  const handleReject = async () => {
    if (!rejecting) return
    await reject.mutateAsync({ requestId: rejecting.id, reason: rejectReason || undefined })
    setRejecting(null)
    setRejectReason('')
  }

  const handleGenerateCode = async () => {
    const code = await generateCode.mutateAsync()
    setGeneratedCode(code)
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
  }

  const getInitials = (name: string | null | undefined) =>
    (name ?? '?')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Cargando solicitudes...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pending Requests */}
      {requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No hay solicitudes pendientes</p>
          <p className="text-xs">
            Cuando un empleado solicite unirse, aparecerá aquí para tu aprobación.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const emp = req.employee as { full_name?: string; email?: string; avatar_url?: string } | undefined
            const name = emp?.full_name ?? emp?.email ?? 'Desconocido'
            return (
              <div
                key={req.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-background"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={emp?.avatar_url ?? undefined} alt={name} />
                  <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp?.email}</p>
                  {req.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                      "{req.message}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(req.created_at).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-8 gap-1"
                    onClick={() => handleApprove(req)}
                    disabled={approve.isPending}
                  >
                    <Check className="h-3 w-3" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-8 gap-1"
                    onClick={() => setRejecting(req)}
                  >
                    <X className="h-3 w-3" />
                    Rechazar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Invite Code Section */}
      <div className="pt-3 border-t space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Códigos de invitación</p>
            <p className="text-xs text-muted-foreground">
              Genera un código de 6 dígitos para compartir con un empleado. Caduca en 24 horas.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateCode}
            disabled={generateCode.isPending}
            className="gap-2 shrink-0"
          >
            <QrCode className="h-4 w-4" />
            {generateCode.isPending ? 'Generando...' : 'Nuevo código'}
          </Button>
        </div>

        {/* Last generated code */}
        {generatedCode && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <code className="flex-1 font-mono text-lg font-bold tracking-widest text-center">
              {generatedCode}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyCode(generatedCode)}
              className="gap-1"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </div>
        )}

        {/* Active codes */}
        {activeCodes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Códigos activos:</p>
            {activeCodes.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <code className="font-mono font-bold text-sm">{c.invite_code}</code>
                <Badge variant="outline" className="text-xs">
                  Vence {new Date(c.invite_code_expires_at!).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </Badge>
                <button
                  onClick={() => copyCode(c.invite_code!)}
                  className="text-muted-foreground hover:text-foreground ml-auto"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={!!rejecting} onOpenChange={() => { setRejecting(null); setRejectReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Puedes incluir un motivo opcional para que el empleado entienda la decisión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo (opcional)</Label>
              <Textarea
                id="rejection-reason"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ej: No hay vacantes disponibles en este momento..."
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setRejecting(null); setRejectReason('') }}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={reject.isPending}
              >
                {reject.isPending ? 'Rechazando...' : 'Rechazar solicitud'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Compact badge for showing pending count in headers
export function JoinRequestsBadge({ businessId }: { businessId: string }) {
  const { data: requests = [] } = usePendingJoinRequests(businessId)
  if (requests.length === 0) return null
  return (
    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
      {requests.length}
    </Badge>
  )
}

// Card version for embedding in EmployeeManagementHierarchy
export function JoinRequestsCard({ businessId }: { businessId: string }) {
  const { data: requests = [] } = usePendingJoinRequests(businessId)

  if (requests.length === 0) return null

  return (
    <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          {requests.length} solicitud{requests.length > 1 ? 'es' : ''} de ingreso pendiente{requests.length > 1 ? 's' : ''}
        </CardTitle>
        <CardDescription className="text-xs text-blue-700 dark:text-blue-300">
          Empleados que quieren unirse a tu equipo esperan tu aprobación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <JoinRequestsManager businessId={businessId} />
      </CardContent>
    </Card>
  )
}
