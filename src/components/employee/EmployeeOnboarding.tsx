/**
 * EmployeeOnboarding — Join a business via invite code or QR.
 * Uses the new employee_join_requests table via useClaimInviteCode.
 * Admin must approve after the code is claimed.
 */

import { useState } from 'react'
import { Camera, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { QRScannerWeb } from '@/components/ui/QRScannerWeb'
import { useMyJoinRequests, useClaimInviteCode } from '@/hooks/useEmployeeJoinRequests'
import type { User } from '@/types/types'
import type { BusinessInvitationQRData } from '@/components/ui/QRScannerWeb'

interface EmployeeOnboardingProps {
  user: User
  onRequestCreated?: () => void
}

export function EmployeeOnboarding({
  user,
  onRequestCreated,
}: Readonly<EmployeeOnboardingProps>) {
  const [invitationCode, setInvitationCode] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: myRequests = [] } = useMyJoinRequests(user.id)
  const claimCode = useClaimInviteCode(user.id)

  const pendingRequests = myRequests.filter(r => r.status === 'pending')
  const approvedRequests = myRequests.filter(r => r.status === 'approved')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitationCode.trim()) {
      setRequestStatus('error')
      setErrorMsg('Ingresa el código de invitación')
      return
    }
    try {
      await claimCode.mutateAsync(invitationCode.trim())
      setRequestStatus('success')
      setInvitationCode('')
      onRequestCreated?.()
    } catch (err: unknown) {
      setRequestStatus('error')
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Código inválido o vencido'
      setErrorMsg(msg)
    }
  }

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setInvitationCode(cleaned)
    setRequestStatus('idle')
  }

  const handleQRScanned = (data: BusinessInvitationQRData) => {
    if (data.invitation_code) {
      setInvitationCode(data.invitation_code.toUpperCase())
    }
    setShowScanner(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Únete como Empleado</h1>
        <p className="text-muted-foreground">
          Ingresa el código de invitación que te proporcionó el administrador del negocio.
          Una vez aplicado, el administrador aprobará tu ingreso.
        </p>
      </div>

      {(pendingRequests.length > 0 || approvedRequests.length > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Solicitudes activas</AlertTitle>
          <AlertDescription>
            {pendingRequests.length > 0 && (
              <p>
                Tienes {pendingRequests.length} solicitud(es) pendiente(s). El administrador revisará tu solicitud pronto.
              </p>
            )}
            {approvedRequests.length > 0 && (
              <p className="text-green-600 dark:text-green-400 font-medium">
                Tienes {approvedRequests.length} solicitud(es) aprobada(s). Recarga la página para ver tu nuevo rol.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ingresar código de invitación</CardTitle>
          <CardDescription>
            Solicita el código de 6 caracteres al administrador del negocio o escanea el código QR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requestStatus === 'success' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">¡Solicitud enviada!</AlertTitle>
              <AlertDescription className="text-green-600">
                El código fue aplicado correctamente. Espera a que el administrador apruebe tu ingreso.
              </AlertDescription>
            </Alert>
          )}

          {requestStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="invitation-code" className="text-sm font-medium">
                Código de invitación
              </label>
              <Input
                id="invitation-code"
                type="text"
                value={invitationCode}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="ABC123"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                disabled={claimCode.isPending}
              />
              <p className="text-xs text-muted-foreground text-center">
                Código de 6 caracteres (letras y números) · Válido por 24 horas
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={claimCode.isPending || invitationCode.length !== 6}
            >
              {claimCode.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando código...
                </>
              ) : (
                'Enviar solicitud'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setShowScanner(true)}
            disabled={claimCode.isPending}
          >
            <Camera className="mr-2 h-4 w-4" />
            Escanear código QR
          </Button>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">¿Cómo funciona?</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>El administrador del negocio genera un código de invitación desde su panel</li>
              <li>Ingresas el código aquí o escaneas el código QR</li>
              <li>El administrador recibe tu solicitud y la aprueba</li>
              <li>Una vez aprobada, podrás acceder como empleado del negocio</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis solicitudes</CardTitle>
            <CardDescription>Historial de solicitudes enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myRequests.map(req => {
                const bizName = (req.business as unknown as { name?: string })?.name
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{bizName ?? req.business_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      req.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : req.status === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <QRScannerWeb
        isOpen={showScanner}
        onScan={handleQRScanned}
        onCancel={() => setShowScanner(false)}
      />
    </div>
  )
}
