export const payments = {
  // ── Sidebar ─────────────────────────────────────────────────────────────────
  sidebar: {
    title: 'Cobros anticipados',
  },

  // ── Dashboard ────────────────────────────────────────────────────────────────
  dashboard: {
    title: 'Pagos anticipados',
    subtitle: 'Seguimiento de anticipos cobrados, devoluciones y retenciones',

    // Tabs
    tabs: {
      recent: 'Pagos recibidos',
      refunds: 'Devoluciones',
      retained: 'Retenidos',
      disputes: 'Disputas',
    },

    // KPIs
    kpi: {
      totalCobrado: 'Total cobrado',
      netoNegocio: 'Neto al negocio',
      totalFees: 'Fees (MP + Gestabiz)',
      totalDevuelto: 'Devuelto',
      afterFees: 'Después de comisiones',
      feesDeducted: 'Comisiones descontadas',
      refundsIssued: 'Reembolsos emitidos',
    },

    // Table columns
    table: {
      dateAppointment: 'Fecha cita',
      client: 'Cliente',
      service: 'Servicio',
      deposit: 'Anticipo',
      fees: 'Fees',
      net: 'Neto',
      status: 'Estado',
      mpRef: 'Ref. MP',
    },

    // Empty states
    empty: {
      recent: {
        title: 'Sin pagos en este período',
        desc: 'Los anticipos cobrados aparecerán aquí cuando los clientes completen el pago vía MercadoPago.',
      },
      refunds: {
        title: 'Sin devoluciones',
        desc: 'No se han emitido reembolsos en el período seleccionado.',
      },
      retained: {
        title: 'Sin anticipos retenidos',
        desc: 'Los anticipos que el negocio retiene por no-show o cancelación tardía aparecerán aquí.',
      },
      disputes: {
        title: 'Sin disputas',
        desc: 'No hay chargebacks activos en este período.',
      },
      searchFallback: {
        title: 'Sin resultados para tu búsqueda',
        desc: 'Intenta con otro término o limpia el filtro.',
      },
    },

    // Filters
    period: {
      thisMonth: 'Este mes',
      lastMonth: 'Mes anterior',
      last3Months: 'Últimos 3 meses',
      last6Months: 'Últimos 6 meses',
    },

    search: 'Buscar cliente, servicio, ID de pago…',

    // Info footer
    disputesInfo:
      'Las disputas (chargebacks) son procesadas directamente por MercadoPago. Contacta soporte de MP con el ID de referencia para iniciar la contestación.',

    loading: 'Cargando pagos…',
  },

  // ── Deposit status labels ────────────────────────────────────────────────────
  status: {
    paid: 'Pagado',
    pending: 'Pendiente',
    refunded: 'Devuelto',
    partial_refund: 'Dev. parcial',
    failed: 'Fallido',
    not_required: 'No requerido',
    chargeback: 'Disputa',
    hold_expired: 'Hold vencido',
  },

  // ── Deposit checkout (wizard step) ──────────────────────────────────────────
  checkout: {
    requiredTitle: 'Anticipo requerido',
    optionalTitle: 'Anticipo opcional',
    requiredDesc: 'Este negocio requiere el pago de un anticipo para confirmar tu cita.',
    optionalDesc: 'Puedes pagar el anticipo ahora o directamente en el negocio.',

    payButton: 'Pagar anticipo',
    payInStore: 'Pagar en el negocio',
    redirecting: 'Redirigiendo a MercadoPago…',
    redirectInfo: 'Serás redirigido a MercadoPago de forma segura para completar el pago.',

    policyTitle: 'Política de cancelación',
    policyAccept: 'He leído y acepto la política de cancelación de este negocio.',

    policyFull:
      'Cancelación con más de {hours}h de anticipación: devolución 100% del anticipo.',
    policyPartial:
      'Entre {partialHours}h y {fullHours}h: devolución del {pct}%.',
    policyNone:
      'Menos de {hours}h o no asistir: sin devolución.',
  },

  // ── Confirmation step notice ─────────────────────────────────────────────────
  notice: {
    required: '⚠️ Anticipo requerido',
    optional: '💡 Anticipo opcional disponible',
    requiredDetail: 'No podrás continuar sin pagarlo.',
    optionalDetail: 'Puedes pagarlo ahora o en el negocio.',
    depositAmount: 'Al confirmar se solicitará un anticipo de {amount} ({pct}% del precio).',
  },

  // ── Settings (admin) ─────────────────────────────────────────────────────────
  settings: {
    title: 'Configuración de pagos',
    enableToggle: 'Habilitar cobro de anticipo',
    enableDesc: 'Los clientes deberán (o podrán) pagar un anticipo al reservar.',
    requiredToggle: 'Anticipo obligatorio',
    requiredDesc:
      'Si está activado, los clientes no podrán completar la reserva sin pagar el anticipo.',
    percentageLabel: 'Porcentaje de anticipo',
    percentageDesc: 'Del precio total del servicio que se cobra al reservar.',
    settlementMode: 'Modo de acreditación MP',
    settlementImmediate: 'Inmediata (~7.13% comisión)',
    settlementStandard: 'Estándar 1-2 días (~4.75% comisión)',
    settlementDeferred: 'Diferida 14 días (~3.56% comisión)',

    cancellationTitle: 'Política de cancelación',
    fullRefundHours: 'Horas para devolución 100%',
    partialRefundHours: 'Horas para devolución parcial',
    partialRefundPct: '% de devolución parcial',
    policyPreview: 'Vista previa de la política',

    tosTitle: 'Términos y condiciones',
    tosAccept: 'Acepto los términos de uso de pagos anticipados de Gestabiz.',
    tosAccepted: 'Términos aceptados el {date}.',

    save: 'Guardar configuración',
    saved: 'Configuración guardada',
    saveError: 'No se pudo guardar la configuración',
  },

  // ── MP Connection ────────────────────────────────────────────────────────────
  mp: {
    connectionTitle: 'Cuenta MercadoPago',
    connected: 'Conectado',
    disconnected: 'Sin conectar',
    expiringSoon: 'Expira pronto',
    expired: 'Expirado',
    connectBtn: 'Conectar cuenta MP',
    disconnectBtn: 'Desconectar',
    connectedAs: 'Conectado como usuario MP: {userId}',
    liveMode: 'Modo producción',
    sandboxMode: 'Modo sandbox (pruebas)',
    disconnectConfirm: '¿Seguro que deseas desconectar tu cuenta de MercadoPago? Los cobros de anticipo quedarán deshabilitados.',
    connectRequired: 'Necesitas conectar tu cuenta de MercadoPago para habilitar los cobros de anticipo.',
  },

  // ── Refund ───────────────────────────────────────────────────────────────────
  refund: {
    title: 'Devolución del anticipo',
    willRefund: 'Se devolverá {amount} ({pct}% del anticipo).',
    willKeep: 'El negocio retiene el anticipo completo (cancelación tardía o no-show).',
    partialRefund: 'Devolución parcial: {amount} ({pct}%). El negocio retiene el resto.',
    confirmBtn: 'Confirmar devolución',
    processing: 'Procesando devolución…',
    success: 'Devolución emitida correctamente.',
    error: 'No se pudo emitir la devolución.',
    noDeposit: 'Esta cita no tiene anticipo registrado.',
  },
} as const
