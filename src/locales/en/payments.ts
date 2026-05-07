export const payments = {
  // ── Sidebar ─────────────────────────────────────────────────────────────────
  sidebar: {
    title: 'Advance payments',
  },

  // ── Dashboard ────────────────────────────────────────────────────────────────
  dashboard: {
    title: 'Advance payments',
    subtitle: 'Track collected deposits, refunds and retained amounts',

    // Tabs
    tabs: {
      recent: 'Received payments',
      refunds: 'Refunds',
      retained: 'Retained',
      disputes: 'Disputes',
    },

    // KPIs
    kpi: {
      totalCobrado: 'Total collected',
      netoNegocio: 'Net to business',
      totalFees: 'Fees (MP + Gestabiz)',
      totalDevuelto: 'Refunded',
      afterFees: 'After fees',
      feesDeducted: 'Deducted commissions',
      refundsIssued: 'Refunds issued',
    },

    // Table columns
    table: {
      dateAppointment: 'Appointment date',
      client: 'Client',
      service: 'Service',
      deposit: 'Deposit',
      fees: 'Fees',
      net: 'Net',
      status: 'Status',
      mpRef: 'MP ref.',
    },

    // Empty states
    empty: {
      recent: {
        title: 'No payments in this period',
        desc: 'Collected deposits will appear here once clients complete payment via MercadoPago.',
      },
      refunds: {
        title: 'No refunds',
        desc: 'No refunds have been issued in the selected period.',
      },
      retained: {
        title: 'No retained deposits',
        desc: 'Deposits retained by the business due to no-show or late cancellation will appear here.',
      },
      disputes: {
        title: 'No disputes',
        desc: 'There are no active chargebacks in this period.',
      },
      searchFallback: {
        title: 'No results for your search',
        desc: 'Try a different term or clear the filter.',
      },
    },

    // Filters
    period: {
      thisMonth: 'This month',
      lastMonth: 'Last month',
      last3Months: 'Last 3 months',
      last6Months: 'Last 6 months',
    },

    search: 'Search client, service, payment ID…',

    // Info footer
    disputesInfo:
      'Disputes (chargebacks) are handled directly by MercadoPago. Contact MP support with the reference ID to initiate a response.',

    loading: 'Loading payments…',
  },

  // ── Deposit status labels ────────────────────────────────────────────────────
  status: {
    paid: 'Paid',
    pending: 'Pending',
    refunded: 'Refunded',
    partial_refund: 'Partial refund',
    failed: 'Failed',
    not_required: 'Not required',
    chargeback: 'Dispute',
    hold_expired: 'Hold expired',
  },

  // ── Deposit checkout (wizard step) ──────────────────────────────────────────
  checkout: {
    requiredTitle: 'Deposit required',
    optionalTitle: 'Optional deposit',
    requiredDesc: 'This business requires a deposit payment to confirm your appointment.',
    optionalDesc: 'You can pay the deposit now or directly at the business.',

    payButton: 'Pay deposit',
    payInStore: 'Pay at the business',
    redirecting: 'Redirecting to MercadoPago…',
    redirectInfo: 'You will be securely redirected to MercadoPago to complete the payment.',

    policyTitle: 'Cancellation policy',
    policyAccept: 'I have read and accept the cancellation policy of this business.',

    policyFull:
      'Cancellation more than {hours}h in advance: 100% deposit refund.',
    policyPartial:
      'Between {partialHours}h and {fullHours}h: {pct}% refund.',
    policyNone:
      'Less than {hours}h or no-show: no refund.',
  },

  // ── Confirmation step notice ─────────────────────────────────────────────────
  notice: {
    required: '⚠️ Deposit required',
    optional: '💡 Optional deposit available',
    requiredDetail: 'You will not be able to proceed without paying it.',
    optionalDetail: 'You can pay it now or at the business.',
    depositAmount: 'Confirming will request a deposit of {amount} ({pct}% of the price).',
  },

  // ── Settings (admin) ─────────────────────────────────────────────────────────
  settings: {
    title: 'Payment settings',
    enableToggle: 'Enable deposit collection',
    enableDesc: 'Clients will be required (or able) to pay a deposit when booking.',
    requiredToggle: 'Mandatory deposit',
    requiredDesc:
      'When enabled, clients cannot complete the booking without paying the deposit.',
    percentageLabel: 'Deposit percentage',
    percentageDesc: 'Percentage of the total service price charged at booking.',
    settlementMode: 'MP settlement mode',
    settlementImmediate: 'Immediate (~7.13% fee)',
    settlementStandard: 'Standard 1-2 days (~4.75% fee)',
    settlementDeferred: 'Deferred 14 days (~3.56% fee)',

    cancellationTitle: 'Cancellation policy',
    fullRefundHours: 'Hours for 100% refund',
    partialRefundHours: 'Hours for partial refund',
    partialRefundPct: '% partial refund',
    policyPreview: 'Policy preview',

    tosTitle: 'Terms and conditions',
    tosAccept: 'I accept the Gestabiz advance payment terms of use.',
    tosAccepted: 'Terms accepted on {date}.',

    save: 'Save settings',
    saved: 'Settings saved',
    saveError: 'Could not save settings',
  },

  // ── MP Connection ────────────────────────────────────────────────────────────
  mp: {
    connectionTitle: 'MercadoPago account',
    connected: 'Connected',
    disconnected: 'Not connected',
    expiringSoon: 'Expiring soon',
    expired: 'Expired',
    connectBtn: 'Connect MP account',
    disconnectBtn: 'Disconnect',
    connectedAs: 'Connected as MP user: {userId}',
    liveMode: 'Live mode',
    sandboxMode: 'Sandbox mode (testing)',
    disconnectConfirm: 'Are you sure you want to disconnect your MercadoPago account? Deposit collection will be disabled.',
    connectRequired: 'You need to connect your MercadoPago account to enable deposit collection.',
  },

  // ── Refund ───────────────────────────────────────────────────────────────────
  refund: {
    title: 'Deposit refund',
    willRefund: '{amount} ({pct}% of the deposit) will be refunded.',
    willKeep: 'The business retains the full deposit (late cancellation or no-show).',
    partialRefund: 'Partial refund: {amount} ({pct}%). The business retains the rest.',
    confirmBtn: 'Confirm refund',
    processing: 'Processing refund…',
    success: 'Refund issued successfully.',
    error: 'Could not issue the refund.',
    noDeposit: 'This appointment has no registered deposit.',
  },
} as const
