/**
 * DepositCheckoutStep
 *
 * Paso del wizard que maneja el pago del anticipo DESPUÉS de que la cita
 * ya fue creada en BD. Se inserta entre ConfirmationStep y SuccessStep.
 *
 * Comportamiento:
 * - Si el negocio NO tiene advance_payment_enabled O el servicio no tiene precio:
 *   → auto-avanza a SuccessStep inmediatamente (sin flash de UI).
 * - Si el anticipo es REQUERIDO: muestra breakdown + único botón "Pagar anticipo".
 * - Si el anticipo es OPCIONAL: muestra breakdown + dos botones "Pagar" / "Pagar en sede".
 *
 * El botón "Pagar anticipo" llama a create-appointment-deposit-preference EF
 * y redirige a MP init_point (o sandbox_init_point en test mode).
 * El resultado (success/failure/pending) llega como query param en back_url
 * y lo procesa AppointmentConfirmation.tsx.
 */
import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, CreditCard, Storefront, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DepositBreakdown } from '@/components/payments/DepositBreakdown'
import { usePaymentSettings, useAppointmentFees, useCreateDepositPreference } from '@/hooks/useAppointmentPayments'

interface DepositCheckoutStepProps {
  /** ID de la cita recién creada (null cuando aún no creada) */
  appointmentId: string | null
  businessId: string
  serviceId: string
  servicePrice?: number | null
  /** El admin hace booking: siempre skip, los admins no pagan anticipos */
  isAdminBooking?: boolean
  /** Llamado para avanzar al paso siguiente (SuccessStep) */
  onAdvance: () => void
}

const IS_DEV = import.meta.env.DEV

export function DepositCheckoutStep({
  appointmentId,
  businessId,
  serviceId,
  servicePrice,
  isAdminBooking,
  onAdvance,
}: DepositCheckoutStepProps) {
  const { data: settings, isLoading: settingsLoading } = usePaymentSettings(businessId)
  const feesEnabled =
    !!settings?.advance_payment_enabled && (servicePrice ?? 0) > 0 && !isAdminBooking

  const { data: fees, isLoading: feesLoading } = useAppointmentFees({
    businessId,
    serviceId,
    enabled: feesEnabled,
  })

  const createPreference = useCreateDepositPreference()

  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoAdvancedRef = useRef(false)

  // Auto-advance when deposit is not applicable
  useEffect(() => {
    if (settingsLoading || feesLoading) return
    if (autoAdvancedRef.current) return

    const needsDeposit = feesEnabled && fees && fees.isEnabled && fees.depositRequired > 0
    if (!needsDeposit) {
      autoAdvancedRef.current = true
      onAdvance()
    }
  }, [settingsLoading, feesLoading, feesEnabled, fees, onAdvance])

  const handlePayDeposit = async () => {
    if (!appointmentId) {
      setError('No se pudo obtener el ID de la cita. Por favor recarga e intenta de nuevo.')
      return
    }
    setError(null)
    setIsRedirecting(true)
    try {
      const result = await createPreference.mutateAsync(appointmentId)
      const url = IS_DEV
        ? (result.sandbox_init_point || result.init_point)
        : result.init_point
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear la preferencia de pago')
      setIsRedirecting(false)
    }
  }

  // Loading skeleton while checking settings
  if (settingsLoading || feesLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Verificando configuración de pago…</p>
      </div>
    )
  }

  // If no deposit needed, render nothing (useEffect auto-advances)
  if (!feesEnabled || !fees || !fees.isEnabled || fees.depositRequired <= 0) {
    return null
  }

  const isRequired = settings?.advance_payment_required ?? false
  const policy = settings?.cancellation_policy ?? {
    full_refund_hours: 48,
    partial_refund_hours: 24,
    partial_refund_percentage: 50,
  }

  return (
    <div className="p-6 space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <CreditCard className="h-7 w-7 text-amber-600" weight="duotone" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {isRequired ? 'Anticipo requerido' : 'Anticipo opcional'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRequired
            ? 'Este negocio requiere el pago de un anticipo para confirmar tu cita.'
            : 'Puedes pagar el anticipo ahora o directamente en el negocio.'}
        </p>
      </div>

      {/* Fee breakdown */}
      <DepositBreakdown fees={fees} variant="client" />

      {/* Cancellation policy summary */}
      <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm mb-2">Política de cancelación</p>
        <p>• Cancelación con más de <strong>{policy.full_refund_hours}h</strong> de anticipación: devolución <strong>100%</strong> del anticipo.</p>
        <p>• Entre <strong>{policy.partial_refund_hours}h</strong> y <strong>{policy.full_refund_hours}h</strong>: devolución del <strong>{policy.partial_refund_percentage}%</strong>.</p>
        <p>• Menos de <strong>{policy.partial_refund_hours}h</strong> o no asistir: <strong>sin devolución</strong>.</p>
      </div>

      {/* Policy acceptance checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="policy-accept"
          checked={policyAccepted}
          onCheckedChange={(v) => setPolicyAccepted(!!v)}
          className="mt-0.5"
        />
        <Label htmlFor="policy-accept" className="text-sm cursor-pointer leading-relaxed">
          He leído y acepto la política de cancelación de este negocio.
        </Label>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          <Warning className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* CTA buttons */}
      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          disabled={!policyAccepted || isRedirecting || createPreference.isPending}
          onClick={handlePayDeposit}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {isRedirecting || createPreference.isPending
            ? 'Redirigiendo a MercadoPago…'
            : `Pagar anticipo $${fees.depositRequired.toLocaleString('es-CO')}`}
          {!isRedirecting && !createPreference.isPending && (
            <ArrowRight className="h-4 w-4 ml-2" />
          )}
        </Button>

        {!isRequired && (
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            disabled={isRedirecting}
            onClick={onAdvance}
          >
            <Storefront className="h-4 w-4 mr-2" />
            Pagar en el negocio
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Serás redirigido a MercadoPago de forma segura para completar el pago.
      </p>
    </div>
  )
}
