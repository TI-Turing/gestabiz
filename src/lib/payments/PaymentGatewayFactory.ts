/**
 * PaymentGatewayFactory.ts
 *
 * Retorna la instancia del gateway de pagos configurado (MercadoPago).
 *
 * Uso:
 * ```typescript
 * import { getPaymentGateway } from '@/lib/payments/PaymentGatewayFactory'
 * const gateway = getPaymentGateway()
 * const dashboard = await gateway.getSubscriptionDashboard(businessId)
 * ```
 */

import type { IPaymentGateway } from './PaymentGateway'
import { MercadoPagoGateway } from './MercadoPagoGateway'
import { supabase } from '@/lib/supabase'

export type PaymentGatewayType = 'mercadopago'

export function getConfiguredGatewayType(): PaymentGatewayType {
  return 'mercadopago'
}

export function getPaymentGateway(): IPaymentGateway {
  return new MercadoPagoGateway(supabase)
}

export function getGatewayDisplayName(): string {
  return 'MercadoPago'
}

export function isGatewayConfigured(): boolean {
  return !!import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY
}

export function isCurrentGatewayConfigured(): boolean {
  return isGatewayConfigured()
}
