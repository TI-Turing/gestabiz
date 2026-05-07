/**
 * DepositBreakdown
 *
 * Componente visual reutilizable que muestra el desglose completo de fees
 * para un anticipo. Usado en:
 * - PaymentSettingsTab (calculadora de ejemplo)
 * - ServiceCard (vista admin con showFinancials)
 * - AppointmentWizard ConfirmationStep (cliente ve qué va a pagar)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Info } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { FeeCalculationResult } from '@/lib/payments/calculateAppointmentFees'

interface DepositBreakdownProps {
  fees: FeeCalculationResult
  /** Si true, oculta el header del Card y aplica padding más compacto. */
  inline?: boolean
  /** Modo de visualización: full (todos los detalles) | client (simplificado para cliente). */
  variant?: 'full' | 'client'
  className?: string
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

export function DepositBreakdown({ fees, inline = false, variant = 'full', className = '' }: DepositBreakdownProps) {
  if (!fees.isEnabled || fees.depositRequired <= 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Este servicio no requiere anticipo. El cliente paga el total al recibir el servicio.
      </div>
    )
  }

  const Body = (
    <div className="space-y-2 text-sm">
      <Row label="Precio del servicio" value={formatCurrency(fees.servicePrice)} />
      <Row
        label={`Anticipo (${fees.depositPercentage}%)`}
        value={formatCurrency(fees.depositRequired)}
        highlight
      />

      <div className="border-t border-dashed pt-2 space-y-1.5">
        {variant === 'full' && (
          <>
            <Row
              label={
                <span className="flex items-center gap-1">
                  Comisión MercadoPago ({(fees.gatewayRate * 100).toFixed(2)}% + IVA)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Tarifa real de MercadoPago Colombia. Modo: {labelMode(fees.settlementMode)}.
                        El IVA del 19% se calcula sobre la comisión base.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              }
              value={`-${formatCurrency(fees.gatewayFee)}`}
              negative
            />
            <Row
              label={
                <span className="flex items-center gap-1">
                  Fee Gestabiz ({(fees.platformFeeRate * 100).toFixed(0)}%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Comisión de Gestabiz: 5% del anticipo recibido (no del total del servicio).
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              }
              value={`-${formatCurrency(fees.platformFee)}`}
              negative
            />
          </>
        )}
      </div>

      {variant === 'full' && (
        <div className="border-t pt-2">
          <Row
            label={<span className="font-semibold">Recibirás en tu cuenta MP</span>}
            value={<span className="font-bold text-green-700">{formatCurrency(fees.netToBusiness)}</span>}
          />
        </div>
      )}

      {fees.remainingBalance > 0 && (
        <div className="border-t pt-2">
          <Row
            label={
              <span className="text-muted-foreground">
                Saldo a cobrar al cliente en sede{variant === 'client' ? ' después del servicio' : ''}
              </span>
            }
            value={<span className="text-muted-foreground">{formatCurrency(fees.remainingBalance)}</span>}
          />
        </div>
      )}
    </div>
  )

  if (inline) {
    return <div className={className}>{Body}</div>
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-5 w-5 text-[#ff8c00]" />
          Desglose del anticipo
        </CardTitle>
      </CardHeader>
      <CardContent>{Body}</CardContent>
    </Card>
  )
}

function Row({
  label,
  value,
  highlight = false,
  negative = false,
}: {
  label: React.ReactNode
  value: React.ReactNode
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className={negative ? 'text-muted-foreground' : ''}>{label}</div>
      <div
        className={`font-medium tabular-nums ${
          highlight ? 'text-[#ff8c00] text-base font-bold' : negative ? 'text-red-700' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function labelMode(mode: 'immediate' | 'standard' | 'deferred_14d'): string {
  switch (mode) {
    case 'immediate':
      return 'inmediata (5.99%)'
    case 'standard':
      return 'estándar 1-2 días (3.99%)'
    case 'deferred_14d':
      return 'diferida 14 días (2.99%)'
  }
}
