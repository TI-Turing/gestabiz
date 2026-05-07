/**
 * Pure function to calculate appointment deposit fees.
 *
 * Mirror of the SQL RPC `compute_appointment_fees` for client-side previews
 * (e.g. ServiceCard, AppointmentWizard breakdown). Backend always re-validates
 * via the RPC before charging.
 *
 * Fee model (Plan B — MercadoPago Marketplace 1:1):
 * - Gateway fee: rate * (1 + IVA) over deposit. Withheld by MP automatically.
 * - Platform fee (Gestabiz): 5% over deposit. Sent via `marketplace_fee` of MP.
 * - Net to business: deposit - gatewayFee - platformFee. Lands in business MP account.
 *
 * @see supabase/migrations/20260707000003_payment_rpcs.sql for the SQL mirror
 */

export type SettlementMode = 'immediate' | 'standard' | 'deferred_14d'

/** MP Colombia 2026 standard rates (without IVA). Mirror of payment_gateway_fees seed. */
export const DEFAULT_GATEWAY_RATES: Record<SettlementMode, number> = {
  immediate: 0.0599,
  standard: 0.0399,
  deferred_14d: 0.0299,
}

/** IVA Colombia 19% applied to MP commission. */
export const DEFAULT_IVA_RATE = 0.19

/** Gestabiz platform fee: 5% of deposit received. Decided by Jose Luis. */
export const PLATFORM_FEE_RATE = 0.05

export interface FeeCalculationInput {
  /** Service price in COP (numeric, > 0 for fees to apply). */
  servicePrice: number
  /** Whether the business has advance payments enabled at all. */
  advancePaymentEnabled: boolean
  /** Whether deposit is mandatory (true) or optional (false). */
  advancePaymentRequired: boolean
  /** Business default deposit % (0-100). */
  advancePaymentPercentage: number
  /** MP settlement mode. */
  settlementMode: SettlementMode
  /** Optional per-service override (NULL = use business default). */
  serviceOverridePercentage?: number | null
  /** Optional override of gateway rate (for tests / custom regions). */
  gatewayRate?: number
  /** Optional override of IVA rate. */
  ivaRate?: number
}

export interface FeeCalculationResult {
  servicePrice: number
  depositRequired: number
  depositPercentage: number
  gatewayFee: number
  gatewayRate: number
  ivaRate: number
  platformFee: number
  platformFeeRate: number
  netToBusiness: number
  remainingBalance: number
  isEnabled: boolean
  isRequired: boolean
  settlementMode: SettlementMode
  currency: 'COP'
}

/** Round to 2 decimals avoiding floating point quirks. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function validatePercentage(value: number, label: string): void {
  if (value < 0 || value > 100) {
    throw new RangeError(`${label} percentage must be between 0 and 100, got ${value}`)
  }
}

export function calculateAppointmentFees(input: FeeCalculationInput): FeeCalculationResult {
  validatePercentage(input.advancePaymentPercentage, 'advancePayment')
  if (input.serviceOverridePercentage != null) {
    validatePercentage(input.serviceOverridePercentage, 'serviceOverride')
  }

  const servicePrice = Math.max(0, input.servicePrice ?? 0)
  const gatewayRate = input.gatewayRate ?? DEFAULT_GATEWAY_RATES[input.settlementMode] ?? 0.0399
  const ivaRate = input.ivaRate ?? DEFAULT_IVA_RATE

  // Bypass: si negocio no habilita o servicio gratis, no hay anticipo
  if (!input.advancePaymentEnabled || servicePrice <= 0) {
    return {
      servicePrice,
      depositRequired: 0,
      depositPercentage: 0,
      gatewayFee: 0,
      gatewayRate,
      ivaRate,
      platformFee: 0,
      platformFeeRate: PLATFORM_FEE_RATE,
      netToBusiness: 0,
      remainingBalance: servicePrice,
      isEnabled: false,
      isRequired: false,
      settlementMode: input.settlementMode,
      currency: 'COP',
    }
  }

  // Override por servicio gana sobre el del negocio
  const depositPercentage =
    input.serviceOverridePercentage != null
      ? input.serviceOverridePercentage
      : input.advancePaymentPercentage

  const depositRequired = round2((servicePrice * depositPercentage) / 100)

  if (depositRequired <= 0) {
    return {
      servicePrice,
      depositRequired: 0,
      depositPercentage,
      gatewayFee: 0,
      gatewayRate,
      ivaRate,
      platformFee: 0,
      platformFeeRate: PLATFORM_FEE_RATE,
      netToBusiness: 0,
      remainingBalance: servicePrice,
      isEnabled: true,
      isRequired: input.advancePaymentRequired,
      settlementMode: input.settlementMode,
      currency: 'COP',
    }
  }

  const gatewayFee = round2(depositRequired * gatewayRate * (1 + ivaRate))
  const platformFee = round2(depositRequired * PLATFORM_FEE_RATE)
  const netToBusiness = round2(depositRequired - gatewayFee - platformFee)
  const remainingBalance = round2(servicePrice - depositRequired)

  return {
    servicePrice,
    depositRequired,
    depositPercentage,
    gatewayFee,
    gatewayRate,
    ivaRate,
    platformFee,
    platformFeeRate: PLATFORM_FEE_RATE,
    netToBusiness,
    remainingBalance,
    isEnabled: true,
    isRequired: input.advancePaymentRequired,
    settlementMode: input.settlementMode,
    currency: 'COP',
  }
}

// ============================================================================
// Refund calculation (mirror of compute_refund_amount RPC)
// ============================================================================

export interface CancellationPolicy {
  full_refund_hours: number
  partial_refund_hours: number
  partial_refund_percentage: number
}

export interface RefundCalculationInput {
  depositPaid: number
  /** ISO 8601 timestamp of appointment start. */
  startTime: string
  policy: CancellationPolicy
  /** Override "now" for testing. */
  now?: Date
}

export type RefundTier = 'no_deposit' | 'full' | 'partial' | 'none'

export interface RefundCalculationResult {
  refundAmount: number
  refundPercentage: number
  tier: RefundTier
  eligible: boolean
  hoursUntilStart: number
  depositPaid: number
}

export function calculateRefundAmount(input: RefundCalculationInput): RefundCalculationResult {
  const { depositPaid, startTime, policy } = input
  const now = input.now ?? new Date()

  if (depositPaid <= 0) {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      tier: 'no_deposit',
      eligible: false,
      hoursUntilStart: 0,
      depositPaid,
    }
  }

  const startMs = new Date(startTime).getTime()
  const hoursUntilStart = (startMs - now.getTime()) / (1000 * 60 * 60)

  let refundPercentage: number
  let tier: RefundTier

  if (hoursUntilStart >= policy.full_refund_hours) {
    refundPercentage = 100
    tier = 'full'
  } else if (hoursUntilStart >= policy.partial_refund_hours) {
    refundPercentage = policy.partial_refund_percentage
    tier = 'partial'
  } else {
    refundPercentage = 0
    tier = 'none'
  }

  const refundAmount = round2((depositPaid * refundPercentage) / 100)

  return {
    refundAmount,
    refundPercentage,
    tier,
    eligible: refundPercentage > 0,
    hoursUntilStart: round2(hoursUntilStart),
    depositPaid,
  }
}

/** Default policy applied when business has no custom config. */
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  full_refund_hours: 48,
  partial_refund_hours: 24,
  partial_refund_percentage: 50,
}
