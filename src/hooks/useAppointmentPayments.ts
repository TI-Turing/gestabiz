/**
 * Hooks de React Query para el sistema de pagos anticipados de citas.
 * Cubre: payment settings, conexión MP OAuth, cálculo de fees, refunds.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/queryConfig'
import {
  appointmentPaymentsService,
  type BusinessPaymentSettings,
} from '@/lib/services/appointmentPayments'

// ============================================================================
// PAYMENT SETTINGS (negocio)
// ============================================================================

export function usePaymentSettings(businessId: string | undefined) {
  return useQuery({
    queryKey: businessId ? QUERY_CONFIG.KEYS.PAYMENT_SETTINGS(businessId) : ['payment-settings', 'noop'],
    queryFn: () => appointmentPaymentsService.getSettings(businessId!),
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })
}

export function useUpdatePaymentSettings(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: Partial<BusinessPaymentSettings>) =>
      appointmentPaymentsService.updateSettings(businessId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.KEYS.PAYMENT_SETTINGS(businessId) })
    },
  })
}

export function useAcceptPaymentsTos(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => appointmentPaymentsService.acceptTermsOfService(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.KEYS.PAYMENT_SETTINGS(businessId) })
    },
  })
}

// ============================================================================
// MERCADOPAGO CONNECTION (OAuth)
// ============================================================================

export function useMpConnection(businessId: string | undefined) {
  return useQuery({
    queryKey: businessId ? QUERY_CONFIG.KEYS.MP_CONNECTION(businessId) : ['mp-connection', 'noop'],
    queryFn: () => appointmentPaymentsService.getMpConnection(businessId!),
    enabled: !!businessId,
    ...QUERY_CONFIG.STABLE,
  })
}

export function useInitMpOAuthFlow(businessId: string) {
  return useMutation({
    mutationFn: () => appointmentPaymentsService.initOAuthFlow(businessId),
  })
}

export function useDisconnectMp(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => appointmentPaymentsService.disconnectMp(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.KEYS.MP_CONNECTION(businessId) })
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.KEYS.PAYMENT_SETTINGS(businessId) })
    },
  })
}

// ============================================================================
// FEE CALCULATIONS
// ============================================================================

export function useAppointmentFees(params: {
  businessId: string | undefined
  serviceId: string | undefined
  overridePrice?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: QUERY_CONFIG.KEYS.APPOINTMENT_FEES(
      params.businessId ?? 'no-business',
      params.serviceId ?? 'no-service',
      params.overridePrice
    ),
    queryFn: () =>
      appointmentPaymentsService.computeFees({
        businessId: params.businessId!,
        serviceId: params.serviceId!,
        overridePrice: params.overridePrice,
      }),
    enabled: (params.enabled ?? true) && !!params.businessId && !!params.serviceId,
    ...QUERY_CONFIG.STABLE,
  })
}

export function useAppointmentRefundPreview(appointmentId: string | undefined) {
  return useQuery({
    queryKey: appointmentId
      ? QUERY_CONFIG.KEYS.APPOINTMENT_REFUND_PREVIEW(appointmentId)
      : ['refund-preview', 'noop'],
    queryFn: () => appointmentPaymentsService.computeRefund(appointmentId!),
    enabled: !!appointmentId,
    ...QUERY_CONFIG.FREQUENT,
  })
}

// ============================================================================
// DEPOSIT LIFECYCLE
// ============================================================================

export function useCreateDepositPreference() {
  return useMutation({
    mutationFn: (appointmentId: string) =>
      appointmentPaymentsService.createDepositPreference(appointmentId),
  })
}

export function useRefundDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { appointmentId: string; reason?: string }) =>
      appointmentPaymentsService.refundDeposit(params.appointmentId, params.reason),
    onSuccess: (_, { appointmentId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_CONFIG.KEYS.APPOINTMENT_PAYMENT_EVENTS(appointmentId),
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_CONFIG.KEYS.APPOINTMENT_REFUND_PREVIEW(appointmentId),
      })
    },
  })
}

export function useAppointmentPaymentEvents(appointmentId: string | undefined) {
  return useQuery({
    queryKey: appointmentId
      ? QUERY_CONFIG.KEYS.APPOINTMENT_PAYMENT_EVENTS(appointmentId)
      : ['payment-events', 'noop'],
    queryFn: () => appointmentPaymentsService.listEvents(appointmentId!),
    enabled: !!appointmentId,
    ...QUERY_CONFIG.FREQUENT,
  })
}
