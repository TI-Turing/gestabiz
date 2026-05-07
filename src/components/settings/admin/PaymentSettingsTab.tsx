/**
 * PaymentSettingsTab
 *
 * Sub-tab "Pagos" dentro de Preferencias del Negocio (admin).
 * Centraliza:
 * - Conexión MercadoPago OAuth (MpConnectionCard) — bloquea el resto si no está activa
 * - Toggle activar/desactivar cobro de anticipos
 * - Toggle obligatorio vs opcional
 * - Slider % de anticipo
 * - Política de cancelación escalonada (3 tramos)
 * - Modo de acreditación MP (immediate/standard/deferred_14d)
 * - Calculadora ejemplo en vivo
 * - Aceptación de términos de pagos
 */
import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CreditCard, FloppyDisk as Save, Calculator, Scroll as ScrollText } from '@phosphor-icons/react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { MpConnectionCard } from './MpConnectionCard'
import { DepositBreakdown } from '@/components/payments/DepositBreakdown'
import {
  usePaymentSettings,
  useUpdatePaymentSettings,
  useAcceptPaymentsTos,
  useMpConnection,
} from '@/hooks/useAppointmentPayments'
import {
  calculateAppointmentFees,
  type SettlementMode,
  type CancellationPolicy,
  DEFAULT_CANCELLATION_POLICY,
} from '@/lib/payments/calculateAppointmentFees'

interface PaymentSettingsTabProps {
  businessId: string
}

export function PaymentSettingsTab({ businessId }: PaymentSettingsTabProps) {
  const { data: settings, isLoading } = usePaymentSettings(businessId)
  const { data: connection } = useMpConnection(businessId)
  const update = useUpdatePaymentSettings(businessId)
  const acceptTos = useAcceptPaymentsTos(businessId)

  const [enabled, setEnabled] = useState(false)
  const [required, setRequired] = useState(false)
  const [percentage, setPercentage] = useState(50)
  const [policy, setPolicy] = useState<CancellationPolicy>(DEFAULT_CANCELLATION_POLICY)
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('standard')
  const [tosAccepted, setTosAccepted] = useState(false)
  const [calcPrice, setCalcPrice] = useState(100_000)

  useEffect(() => {
    if (!settings) return
    setEnabled(settings.advance_payment_enabled)
    setRequired(settings.advance_payment_required)
    setPercentage(Number(settings.advance_payment_percentage) || 50)
    setPolicy(settings.cancellation_policy ?? DEFAULT_CANCELLATION_POLICY)
    setSettlementMode(settings.payments_settlement_mode ?? 'standard')
    setTosAccepted(!!settings.payments_tos_accepted_at)
  }, [settings])

  const isMpConnected = connection?.is_active && connection.connection_status === 'active'
  const canActivate = isMpConnected && tosAccepted
  const canEdit = !isLoading

  const previewFees = useMemo(() => {
    return calculateAppointmentFees({
      servicePrice: calcPrice,
      advancePaymentEnabled: true, // simulación: siempre activado para preview
      advancePaymentRequired: required,
      advancePaymentPercentage: percentage,
      settlementMode,
    })
  }, [calcPrice, required, percentage, settlementMode])

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        advance_payment_enabled: enabled && canActivate,
        advance_payment_required: required,
        advance_payment_percentage: percentage,
        cancellation_policy: policy,
        payments_settlement_mode: settlementMode,
      })
      toast.success('Configuración de pagos guardada')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  const handleAcceptTos = async () => {
    try {
      await acceptTos.mutateAsync()
      setTosAccepted(true)
      toast.success('Términos aceptados')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron aceptar los términos')
    }
  }

  return (
    <div className="space-y-4">
      {/* Bloque 1: Conexión MercadoPago — siempre visible */}
      <MpConnectionCard businessId={businessId} />

      {/* Bloque 2: Cobro de anticipos */}
      <PermissionGate permission="payments.configure" businessId={businessId} mode="disable">
        <Card className={!isMpConnected ? 'opacity-60 pointer-events-none' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#ff8c00]" />
              <CardTitle>Cobro de anticipo</CardTitle>
            </div>
            <CardDescription>
              Configura si y cuánto cobrar al cliente al momento de reservar.
              {!isMpConnected && (
                <span className="block mt-1 text-amber-700 font-medium">
                  Conecta primero tu cuenta MercadoPago para habilitar esta sección.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-advance">Activar cobro de anticipo</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Cobra un porcentaje del precio al reservar la cita.
                </p>
              </div>
              <Switch
                id="enable-advance"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={!canActivate || !canEdit}
              />
            </div>

            {enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="required-advance">Anticipo obligatorio</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Si está activo, no se puede agendar sin pagar el anticipo.
                      Si no, el cliente puede saltar el pago y pagar todo en sede.
                    </p>
                  </div>
                  <Switch
                    id="required-advance"
                    checked={required}
                    onCheckedChange={setRequired}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Porcentaje del anticipo</Label>
                    <Badge variant="outline" className="text-base font-bold">
                      {percentage}%
                    </Badge>
                  </div>
                  <Slider
                    min={10}
                    max={100}
                    step={5}
                    value={[percentage]}
                    onValueChange={(v) => setPercentage(v[0] ?? 50)}
                    disabled={!canEdit}
                  />
                  <p className="text-xs text-muted-foreground">
                    Por servicio puedes sobreescribir este % desde la configuración del servicio.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Modo de acreditación MercadoPago</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        { v: 'immediate', label: 'Inmediata', sub: '5.99% + IVA' },
                        { v: 'standard', label: 'Estándar 1-2d', sub: '3.99% + IVA' },
                        { v: 'deferred_14d', label: '14 días', sub: '2.99% + IVA' },
                      ] as { v: SettlementMode; label: string; sub: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setSettlementMode(opt.v)}
                        disabled={!canEdit}
                        className={`p-3 rounded-md border text-left transition-colors ${
                          settlementMode === opt.v
                            ? 'border-[#ff8c00] bg-orange-50'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Bloque 3: Política de cancelación */}
      <PermissionGate permission="payments.configure" businessId={businessId} mode="disable">
        <Card className={!enabled ? 'opacity-60 pointer-events-none' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-[#ff8c00]" />
              <CardTitle>Política de cancelación</CardTitle>
            </div>
            <CardDescription>
              Define cuánto se devuelve al cliente según cuánto antes cancele.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="full-hours">Devolución 100% (horas antes)</Label>
                <Input
                  id="full-hours"
                  type="number"
                  min={1}
                  max={720}
                  value={policy.full_refund_hours}
                  onChange={(e) =>
                    setPolicy({ ...policy, full_refund_hours: Math.max(1, Number(e.target.value) || 0) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="partial-hours">Devolución parcial (horas antes)</Label>
                <Input
                  id="partial-hours"
                  type="number"
                  min={0}
                  max={policy.full_refund_hours - 1}
                  value={policy.partial_refund_hours}
                  onChange={(e) =>
                    setPolicy({ ...policy, partial_refund_hours: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="partial-pct">% devolución parcial</Label>
                <Input
                  id="partial-pct"
                  type="number"
                  min={0}
                  max={99}
                  value={policy.partial_refund_percentage}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      partial_refund_percentage: Math.min(99, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                />
              </div>
            </div>
            <div className="text-sm bg-muted p-3 rounded-md">
              <strong>Vista previa para el cliente:</strong> Si cancelas con más de{' '}
              <strong>{policy.full_refund_hours}h</strong> de anticipación recibes el 100% del anticipo.
              Entre <strong>{policy.partial_refund_hours}h</strong> y <strong>{policy.full_refund_hours}h</strong>{' '}
              recibes el <strong>{policy.partial_refund_percentage}%</strong>. Con menos de{' '}
              <strong>{policy.partial_refund_hours}h</strong> o no asistir: sin devolución.
            </div>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Bloque 4: Calculadora ejemplo en vivo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#ff8c00]" />
            <CardTitle>Calculadora ejemplo</CardTitle>
          </div>
          <CardDescription>
            Simula cuánto recibirás según el precio del servicio con la configuración actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="calc-price">Precio del servicio (COP)</Label>
            <Input
              id="calc-price"
              type="number"
              min={0}
              step={1000}
              value={calcPrice}
              onChange={(e) => setCalcPrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <DepositBreakdown fees={previewFees} inline variant="full" />
        </CardContent>
      </Card>

      {/* Bloque 5: Términos de pagos */}
      {!tosAccepted && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">Términos del servicio de pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Al activar el cobro de anticipos aceptas que Gestabiz retiene una comisión del{' '}
              <strong>5% del anticipo recibido</strong> vía marketplace_fee de MercadoPago. Las
              comisiones de MercadoPago se descuentan adicionalmente según la tabla de tarifas
              vigente. Las devoluciones por cancelación siguen la política configurada en este negocio.
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="tos"
                checked={tosAccepted}
                onCheckedChange={(c) => setTosAccepted(!!c)}
              />
              <Label htmlFor="tos" className="text-sm cursor-pointer">
                He leído y acepto los términos del servicio de pagos
              </Label>
            </div>
            {tosAccepted && (
              <Button onClick={handleAcceptTos} disabled={acceptTos.isPending} size="sm">
                Confirmar aceptación
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botón guardar */}
      <PermissionGate permission="payments.configure" businessId={businessId} mode="disable">
        <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-4 border-t">
          <Button onClick={handleSave} disabled={update.isPending || !canEdit} className="min-w-[140px]">
            <Save className="h-4 w-4 mr-2" />
            {update.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </PermissionGate>
    </div>
  )
}
