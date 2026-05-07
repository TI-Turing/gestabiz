/**
 * MpConnectionCard
 *
 * UI para conectar/desconectar la cuenta MercadoPago del negocio (OAuth).
 * Bloquea el resto de la configuración de pagos hasta tener una conexión activa.
 */
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plug, PlugsConnected, Warning, ArrowSquareOut } from '@phosphor-icons/react'
import {
  useMpConnection,
  useInitMpOAuthFlow,
  useDisconnectMp,
} from '@/hooks/useAppointmentPayments'
import { PermissionGate } from '@/components/ui/PermissionGate'

interface MpConnectionCardProps {
  businessId: string
}

export function MpConnectionCard({ businessId }: MpConnectionCardProps) {
  const { data: connection, isLoading } = useMpConnection(businessId)
  const initOAuth = useInitMpOAuthFlow(businessId)
  const disconnect = useDisconnectMp(businessId)
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Detectar resultado del callback OAuth (?mp_oauth=success|error&detail=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('mp_oauth')
    const detail = params.get('detail')
    if (status === 'success') {
      setOauthMessage({ type: 'success', text: 'Cuenta MercadoPago conectada correctamente.' })
      // Limpiar query
      window.history.replaceState({}, '', window.location.pathname)
    } else if (status === 'error') {
      setOauthMessage({ type: 'error', text: `Error al conectar: ${detail ?? 'desconocido'}` })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = async () => {
    try {
      const { authorizationUrl } = await initOAuth.mutateAsync()
      window.location.href = authorizationUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo iniciar el flujo OAuth')
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar la cuenta MercadoPago? Se deshabilitará el cobro de anticipos.')) return
    try {
      await disconnect.mutateAsync()
      toast.success('Cuenta MercadoPago desconectada')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo desconectar')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-[#ff8c00]" />
          <CardTitle>Cuenta MercadoPago</CardTitle>
        </div>
        <CardDescription>
          Conecta tu cuenta de MercadoPago para recibir los anticipos directamente. Gestabiz nunca toca tu dinero — todo va a tu cuenta MP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {oauthMessage && (
          <div
            className={`p-3 rounded-md text-sm ${
              oauthMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {oauthMessage.text}
          </div>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Cargando estado de conexión...</p>}

        {!isLoading && (!connection || !connection.is_active) && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <Warning className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Sin conexión a MercadoPago</p>
                <p className="mt-1">
                  Para activar el cobro de anticipos necesitas conectar una cuenta MercadoPago verificada.
                  Si no tienes cuenta, créala gratis en{' '}
                  <a
                    href="https://www.mercadopago.com.co/registration-mp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    mercadopago.com.co
                  </a>
                  .
                </p>
              </div>
            </div>
            <PermissionGate permission="payments.connect_account" businessId={businessId} mode="disable">
              <Button onClick={handleConnect} disabled={initOAuth.isPending} className="w-full sm:w-auto">
                <Plug className="h-4 w-4 mr-2" />
                {initOAuth.isPending ? 'Redirigiendo...' : 'Conectar mi cuenta MercadoPago'}
                <ArrowSquareOut className="h-4 w-4 ml-2" />
              </Button>
            </PermissionGate>
          </div>
        )}

        {!isLoading && connection?.is_active && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <PlugsConnected className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 flex-1">
                <p className="font-medium flex items-center gap-2">
                  Cuenta conectada
                  <Badge variant={connection.mp_live_mode ? 'default' : 'secondary'}>
                    {connection.mp_live_mode ? 'Producción' : 'Sandbox'}
                  </Badge>
                  <Badge
                    variant={
                      connection.connection_status === 'active'
                        ? 'default'
                        : connection.connection_status === 'expiring_soon'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {connection.connection_status === 'active' && 'Activa'}
                    {connection.connection_status === 'expiring_soon' && 'Por expirar'}
                    {connection.connection_status === 'expired' && 'Expirada'}
                    {connection.connection_status === 'disconnected' && 'Desconectada'}
                  </Badge>
                </p>
                <p className="mt-1">ID Vendedor MP: <span className="font-mono">{connection.mp_user_id}</span></p>
                <p className="text-xs mt-1">
                  Conectada el {new Date(connection.connected_at).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <PermissionGate permission="payments.connect_account" businessId={businessId} mode="disable">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? 'Desconectando...' : 'Desconectar cuenta'}
              </Button>
            </PermissionGate>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
