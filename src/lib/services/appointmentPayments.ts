import supabase from '@/lib/supabase'
import { throwIfError } from '@/lib/errors'
import type {
  CancellationPolicy,
  FeeCalculationResult,
  RefundCalculationResult,
} from '@/lib/payments/calculateAppointmentFees'

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessPaymentSettings {
  advance_payment_enabled: boolean
  advance_payment_required: boolean
  advance_payment_percentage: number
  cancellation_policy: CancellationPolicy
  payments_tos_accepted_at: string | null
  payments_settlement_mode: 'immediate' | 'standard' | 'deferred_14d'
}

export interface BusinessMpConnectionStatus {
  id: string
  business_id: string
  mp_user_id: string
  mp_public_key: string
  mp_live_mode: boolean
  expires_at: string
  connected_at: string
  disconnected_at: string | null
  is_active: boolean
  last_refreshed_at: string | null
  connection_status: 'active' | 'expired' | 'expiring_soon' | 'disconnected'
}

export interface AppointmentPaymentEvent {
  id: string
  appointment_id: string
  event_type:
    | 'deposit_charged'
    | 'deposit_refunded'
    | 'chargeback'
    | 'manual_adjustment'
    | 'hold_expired'
    | 'webhook_received'
  amount: number
  gateway: string
  gateway_reference: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
}

// ============================================================================
// SERVICE
// ============================================================================

export const appointmentPaymentsService = {
  // --------------------------------------------------------------------------
  // Business payment settings
  // --------------------------------------------------------------------------
  async getSettings(businessId: string): Promise<BusinessPaymentSettings | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select(
        'advance_payment_enabled, advance_payment_required, advance_payment_percentage, cancellation_policy, payments_tos_accepted_at, payments_settlement_mode'
      )
      .eq('id', businessId)
      .single()
    throwIfError(error, 'GET_PAYMENT_SETTINGS', 'No se pudo cargar la configuración de pagos')
    return (data as BusinessPaymentSettings | null) ?? null
  },

  async updateSettings(
    businessId: string,
    updates: Partial<BusinessPaymentSettings>
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.advance_payment_enabled !== undefined)
      dbUpdates.advance_payment_enabled = updates.advance_payment_enabled
    if (updates.advance_payment_required !== undefined)
      dbUpdates.advance_payment_required = updates.advance_payment_required
    if (updates.advance_payment_percentage !== undefined)
      dbUpdates.advance_payment_percentage = updates.advance_payment_percentage
    if (updates.cancellation_policy !== undefined)
      dbUpdates.cancellation_policy = updates.cancellation_policy
    if (updates.payments_tos_accepted_at !== undefined)
      dbUpdates.payments_tos_accepted_at = updates.payments_tos_accepted_at
    if (updates.payments_settlement_mode !== undefined)
      dbUpdates.payments_settlement_mode = updates.payments_settlement_mode

    const { error } = await supabase.from('businesses').update(dbUpdates).eq('id', businessId)
    throwIfError(error, 'UPDATE_PAYMENT_SETTINGS', 'No se pudo guardar la configuración de pagos')
  },

  async acceptTermsOfService(businessId: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ payments_tos_accepted_at: new Date().toISOString() })
      .eq('id', businessId)
    throwIfError(error, 'ACCEPT_PAYMENTS_TOS', 'No se pudieron aceptar los términos')
  },

  // --------------------------------------------------------------------------
  // MercadoPago connection (OAuth)
  // --------------------------------------------------------------------------
  async getMpConnection(businessId: string): Promise<BusinessMpConnectionStatus | null> {
    const { data, error } = await supabase
      .from('business_mp_connection_status')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle()
    throwIfError(error, 'GET_MP_CONNECTION', 'No se pudo cargar la conexión MP')
    return (data as BusinessMpConnectionStatus | null) ?? null
  },

  async initOAuthFlow(businessId: string): Promise<{ authorizationUrl: string }> {
    const { data, error } = await supabase.functions.invoke('mp-oauth-init', {
      body: { business_id: businessId },
    })
    throwIfError(error, 'MP_OAUTH_INIT', 'No se pudo iniciar la conexión con MercadoPago')
    return data as { authorizationUrl: string }
  },

  async disconnectMp(businessId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('mp-oauth-disconnect', {
      body: { business_id: businessId },
    })
    throwIfError(error, 'MP_OAUTH_DISCONNECT', 'No se pudo desconectar la cuenta MP')
  },

  // --------------------------------------------------------------------------
  // Fee calculations (preview vía RPC para mantener fuente única)
  // --------------------------------------------------------------------------
  async computeFees(params: {
    businessId: string
    serviceId: string
    overridePrice?: number
  }): Promise<FeeCalculationResult> {
    const { data, error } = await supabase.rpc('compute_appointment_fees', {
      p_business_id: params.businessId,
      p_service_id: params.serviceId,
      p_override_price: params.overridePrice ?? null,
    })
    throwIfError(error, 'COMPUTE_FEES', 'No se pudieron calcular las tarifas')

    // RPC retorna jsonb con snake_case → mapear a camelCase
    const raw = data as Record<string, unknown>
    return {
      servicePrice: Number(raw.service_price ?? 0),
      depositRequired: Number(raw.deposit_required ?? 0),
      depositPercentage: Number(raw.deposit_percentage ?? 0),
      gatewayFee: Number(raw.gateway_fee ?? 0),
      gatewayRate: Number(raw.gateway_rate ?? 0.0399),
      ivaRate: Number(raw.iva_rate ?? 0.19),
      platformFee: Number(raw.platform_fee ?? 0),
      platformFeeRate: Number(raw.platform_fee_rate ?? 0.05),
      netToBusiness: Number(raw.net_to_business ?? 0),
      remainingBalance: Number(raw.remaining_balance ?? 0),
      isEnabled: Boolean(raw.is_enabled),
      isRequired: Boolean(raw.is_required),
      settlementMode: (raw.settlement_mode as 'immediate' | 'standard' | 'deferred_14d') ?? 'standard',
      currency: 'COP',
    }
  },

  async computeRefund(appointmentId: string): Promise<RefundCalculationResult & { policy: CancellationPolicy }> {
    const { data, error } = await supabase.rpc('compute_refund_amount', {
      p_appointment_id: appointmentId,
    })
    throwIfError(error, 'COMPUTE_REFUND', 'No se pudo calcular la devolución')
    const raw = data as Record<string, unknown>
    return {
      refundAmount: Number(raw.refund_amount ?? 0),
      refundPercentage: Number(raw.refund_percentage ?? 0),
      tier: (raw.tier as 'no_deposit' | 'full' | 'partial' | 'none') ?? 'none',
      eligible: Boolean(raw.eligible),
      hoursUntilStart: Number(raw.hours_until_start ?? 0),
      depositPaid: Number(raw.deposit_paid ?? 0),
      policy: (raw.policy as CancellationPolicy) ?? {
        full_refund_hours: 48,
        partial_refund_hours: 24,
        partial_refund_percentage: 50,
      },
    }
  },

  // --------------------------------------------------------------------------
  // Appointment deposit lifecycle
  // --------------------------------------------------------------------------
  async createDepositPreference(appointmentId: string): Promise<{
    preference_id: string
    init_point: string
    sandbox_init_point: string
  }> {
    const { data, error } = await supabase.functions.invoke('create-appointment-deposit-preference', {
      body: { appointment_id: appointmentId },
    })
    throwIfError(error, 'CREATE_DEPOSIT_PREFERENCE', 'No se pudo iniciar el cobro del anticipo')
    return data as { preference_id: string; init_point: string; sandbox_init_point: string }
  },

  async refundDeposit(appointmentId: string, reason?: string): Promise<{ refund_amount: number; status: string }> {
    const { data, error } = await supabase.functions.invoke('refund-appointment-deposit', {
      body: { appointment_id: appointmentId, reason: reason ?? null },
    })
    throwIfError(error, 'REFUND_DEPOSIT', 'No se pudo emitir la devolución')
    return data as { refund_amount: number; status: string }
  },

  // --------------------------------------------------------------------------
  // Audit log
  // --------------------------------------------------------------------------
  async listEvents(appointmentId: string): Promise<AppointmentPaymentEvent[]> {
    const { data, error } = await supabase
      .from('appointment_payment_events')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
    throwIfError(error, 'LIST_PAYMENT_EVENTS', 'No se pudieron cargar los eventos de pago')
    return (data as AppointmentPaymentEvent[] | null) ?? []
  },
}
