/**
 * ServiceDepositInfo
 *
 * Pequeño badge inline que muestra el anticipo configurado y la ganancia neta
 * estimada de un servicio. Se renderiza solo si el negocio tiene
 * advance_payment_enabled = true. Usado en ServicesManager y otras grids admin.
 */
import { CurrencyDollar, TrendUp } from '@phosphor-icons/react'
import { useAppointmentFees } from '@/hooks/useAppointmentPayments'
import { usePaymentSettings } from '@/hooks/useAppointmentPayments'

interface ServiceDepositInfoProps {
  businessId: string
  serviceId: string
  servicePrice?: number | null
  className?: string
}

export function ServiceDepositInfo({
  businessId,
  serviceId,
  servicePrice,
  className = '',
}: ServiceDepositInfoProps) {
  const { data: settings } = usePaymentSettings(businessId)
  const enabled = !!settings?.advance_payment_enabled && (servicePrice ?? 0) > 0

  const { data: fees } = useAppointmentFees({
    businessId,
    serviceId,
    enabled,
  })

  if (!enabled || !fees || !fees.isEnabled || fees.depositRequired <= 0) return null

  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-1 text-muted-foreground">
        <CurrencyDollar className="h-3.5 w-3.5 text-amber-500" />
        <span>
          Anticipo {fees.depositPercentage}%:{' '}
          <span className="font-semibold text-foreground tabular-nums">
            ${fees.depositRequired.toLocaleString('es-CO')}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <TrendUp className="h-3.5 w-3.5 text-green-500" />
        <span>
          Neto:{' '}
          <span className="font-semibold text-green-700 tabular-nums">
            ${fees.netToBusiness.toLocaleString('es-CO')}
          </span>
        </span>
      </div>
    </div>
  )
}
