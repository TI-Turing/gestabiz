export const electronicBilling = {
  // ============================================================
  // Navegación y títulos generales
  // ============================================================
  title: 'Facturación Electrónica',
  subtitle: 'Emisión de facturas DIAN para Colombia',
  history: 'Historial de facturas',
  settings: 'Configuración DIAN',
  enrollment: 'Habilitación ante DIAN',

  // ============================================================
  // Estados de facturas
  // ============================================================
  status: {
    pending: 'Pendiente',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    failed_permanent: 'Error permanente',
    cancelled: 'Anulada',
  },

  // ============================================================
  // Tipos de documento
  // ============================================================
  documentType: {
    invoice: 'Factura de venta',
    pos: 'Documento POS',
    credit_note: 'Nota crédito',
  },

  // ============================================================
  // Wizard de habilitación (5 pasos)
  // ============================================================
  wizard: {
    title: 'Habilitación DIAN',
    subtitle: 'Configura tu negocio como facturador electrónico',
    step: 'Paso {{current}} de {{total}}',
    next: 'Continuar',
    back: 'Atrás',
    finish: 'Finalizar habilitación',
    testConnection: 'Probar conexión',
    testing: 'Probando...',
    connectionSuccess: 'Conexión exitosa con Matias API',
    connectionError: 'No se pudo conectar. Verifica el token.',

    steps: {
      businessData: {
        title: 'Datos del negocio',
        description: 'Información fiscal requerida por la DIAN',
        nit: 'NIT (sin dígito de verificación)',
        dv: 'Dígito de verificación',
        dvHelp: 'El dígito que aparece después del guion en tu NIT',
        legalName: 'Razón social',
        typeOrganization: 'Tipo de persona',
        typeOrganizationNatural: 'Persona natural',
        typeOrganizationJuridica: 'Persona jurídica',
        ciiu: 'Código CIIU (actividad económica)',
        ciiuHelp: 'Código de 4 dígitos de tu actividad principal. Lo encuentras en tu RUT.',
        municipalityCode: 'Código DANE del municipio',
        taxResponsibilities: 'Responsabilidades fiscales',
        taxResponsibilitiesHelp: 'Selecciona las que aplican según tu RUT',
        responsibilities: {
          'O-13': 'Gran contribuyente',
          'O-15': 'Autorretenedor',
          'O-23': 'Agente de retención en el impuesto sobre las ventas',
          'O-47': 'Régimen simple de tributación',
          'R-99-PN': 'No responsable de IVA (persona natural)',
        },
      },
      resolution: {
        title: 'Resolución de numeración',
        description: 'Datos del Formulario 1876 emitido por la DIAN',
        helpText: '¿No tienes resolución? Sigue estos pasos para solicitarla en MUISCA →',
        resolutionNumber: 'Número de resolución',
        prefix: 'Prefijo (opcional)',
        prefixHelp: 'Ejemplo: FE, FAC. Déjalo vacío si la DIAN no asignó prefijo.',
        fromNumber: 'Desde (número inicial)',
        toNumber: 'Hasta (número final)',
        validFrom: 'Fecha de inicio de vigencia',
        validTo: 'Fecha de fin de vigencia',
        technicalKey: 'Clave técnica (technical key)',
        technicalKeyHelp: 'String de 96 caracteres que entrega la DIAN en el Form 1876.',
        rangeInfo: 'Rango autorizado: {{from}} a {{to}} ({{total}} documentos)',
        expiresIn: 'Vence el {{date}} ({{days}} días)',
        expired: 'Esta resolución ya venció',
        exhausted: 'Esta resolución ya está agotada',
        muiscaGuide: 'Ver guía paso a paso MUISCA',
      },
      software: {
        title: 'Token Matias API',
        description: 'Conecta tu cuenta de Matias API',
        environment: 'Ambiente',
        sandbox: 'Pruebas (sandbox)',
        production: 'Producción',
        matiasToken: 'Token de acceso (PAT)',
        matiasTokenHelp: 'Crea un Personal Access Token en tu cuenta de Matias API.',
        matiasLink: 'Ir a Matias API →',
        useOwnSoftware: 'Usar Software ID propio (avanzado)',
        ownSoftwareId: 'Software ID de DIAN',
        ownSoftwarePin: 'PIN de DIAN',
        ownSoftwareHelp: 'Solo necesario si registraste tu propio software en MUISCA. La mayoría de negocios no requiere esto.',
      },
      certificate: {
        title: 'Certificado digital',
        description: 'Archivo .p12 emitido por entidad certificadora acreditada por ONAC',
        helpText: '¿Cómo obtengo mi certificado?',
        freeOption: 'Solicitar certificado GRATUITO en GSE →',
        providers: 'Entidades certificadoras acreditadas en Colombia:',
        uploadLabel: 'Subir archivo .p12',
        uploadButton: 'Seleccionar archivo .p12',
        passwordLabel: 'Contraseña del certificado',
        passwordHelp: 'La contraseña que la entidad certificadora te envió junto con el archivo.',
        validating: 'Validando certificado...',
        valid: 'Certificado válido. Expira el {{date}}.',
        invalid: 'El certificado no es válido o la contraseña es incorrecta.',
        expiresWarning: 'Este certificado expira en menos de 30 días. Renuévalo pronto.',
        securityNote: 'Tu certificado se almacena encriptado con AES-256. Nunca se expone al frontend.',
      },
      test: {
        title: 'Prueba de conexión',
        description: 'Verificamos que todo esté configurado correctamente',
        running: 'Realizando prueba...',
        success: '¡Todo listo! Tu negocio está habilitado para emitir facturas electrónicas.',
        error: 'La prueba falló. Revisa los pasos anteriores.',
        errorDetails: 'Detalle del error:',
        whatNext: '¿Qué sigue?',
        whatNextDesc: 'Podrás emitir facturas desde el historial de ventas o automáticamente al completar una cita.',
      },
    },
  },

  // ============================================================
  // Acciones de emisión
  // ============================================================
  actions: {
    emit: 'Emitir factura',
    emitPos: 'Emitir POS',
    emitCreditNote: 'Emitir nota crédito',
    retry: 'Reintentar',
    download: 'Descargar',
    downloadXml: 'Descargar XML',
    downloadPdf: 'Descargar PDF',
    sendEmail: 'Enviar por email',
    viewDetails: 'Ver detalles',
    cancelInvoice: 'Anular factura',
  },

  // ============================================================
  // Estados y mensajes en historial
  // ============================================================
  list: {
    empty: 'No hay facturas electrónicas aún',
    emptyDesc: 'Las facturas se generarán automáticamente al completar citas o registrar ventas.',
    filterAll: 'Todas',
    searchPlaceholder: 'Buscar por número, cliente o CUFE...',
    columns: {
      number: 'N.° Factura',
      date: 'Fecha',
      client: 'Cliente',
      amount: 'Valor',
      type: 'Tipo',
      status: 'Estado',
      cufe: 'CUFE',
    },
    retryCount: '{{n}} reintentos',
    nextRetry: 'Próximo reintento: {{time}}',
  },

  // ============================================================
  // Datos del cliente para la factura
  // ============================================================
  buyer: {
    title: 'Datos del comprador',
    consumerFinal: 'Consumidor final',
    consumerFinalHelp: 'Sin datos de identificación. La factura va a nombre de Consumidor Final (222222222222).',
    useClientData: 'Usar datos del cliente registrado',
    manualEntry: 'Ingresar manualmente',
    documentType: 'Tipo de documento',
    documentNumber: 'Número de documento',
    lookupDian: 'Consultar en DIAN',
    lookupLoading: 'Consultando...',
    lookupFound: 'Datos encontrados automáticamente',
    lookupNotFound: 'No encontrado en DIAN. Ingresa manualmente.',
    name: 'Nombre o razón social',
    email: 'Correo electrónico (para envío de factura)',
    emailOptional: 'Opcional — si no lo ingresas, la factura no se enviará por email.',
  },

  // ============================================================
  // Notas crédito
  // ============================================================
  creditNote: {
    title: 'Anular factura con nota crédito',
    subtitle: 'Esta acción genera un documento de anulación ante la DIAN.',
    reason: 'Motivo de anulación',
    reasons: {
      '01': 'Devolución parcial de bienes',
      '02': 'Anulación de factura',
      '03': 'Rebaja o descuento',
      '04': 'Ajuste de precio',
      '05': 'Otros',
    },
    amount: 'Monto a anular',
    fullAmount: 'Monto total ({{amount}})',
    partialAmount: 'Monto parcial',
    refundNote: 'Se procesará un reembolso de {{amount}} al método de pago original.',
    noRefund: 'Sin reembolso (cancelación tardía según política del negocio).',
    confirm: 'Emitir nota crédito',
    warning: 'Esta acción no se puede deshacer. La DIAN registrará la anulación permanentemente.',
    generating: 'Generando nota crédito...',
    success: 'Nota crédito emitida correctamente. CUFE: {{cufe}}',
  },

  // ============================================================
  // Errores y advertencias
  // ============================================================
  errors: {
    notEnrolled: 'Este negocio no está habilitado para facturación electrónica. Completa el wizard de habilitación.',
    notEnrolledCta: 'Configurar ahora',
    resolutionExpired: 'La resolución de numeración ha vencido. Solicita una nueva en MUISCA.',
    resolutionExhausted: 'El rango de numeración está agotado. Solicita una nueva resolución en MUISCA.',
    resolutionExpiringSoon: 'Tu resolución DIAN vence en {{days}} días. Renuévala pronto.',
    planRequired: 'La facturación electrónica está disponible en los planes Pro y Empresarial.',
    planRequiredCta: 'Ver planes',
    colombiaOnly: 'La facturación electrónica DIAN solo está disponible para negocios en Colombia.',
    emitFailed: 'No se pudo emitir la factura. Código de error: {{code}}',
    dianRejected: 'La DIAN rechazó la factura: {{reason}}',
    alreadyInvoiced: 'Esta transacción ya tiene una factura asociada.',
    certificateExpiring: 'Tu certificado digital expira el {{date}}. Renuévalo en tu entidad certificadora.',
    certificateExpired: 'El certificado digital ha vencido. Sube uno nuevo en Configuración → DIAN.',
    maxRetriesReached: 'Se alcanzó el máximo de reintentos. Revisa los datos y emite manualmente.',
  },

  // ============================================================
  // Habeas Data / Política de datos
  // ============================================================
  habeasData: {
    consentLabel: 'Autorizo el tratamiento de mis datos personales para la emisión de facturas electrónicas, de acuerdo con la',
    policyLink: 'Política de Tratamiento de Datos',
    policyLinkEnd: 'de Gestabiz (Ley 1581/2012).',
    required: 'Debes aceptar la política de tratamiento de datos para continuar.',
    alreadyAccepted: 'Ya tienes autorización vigente para este propósito.',
    revokeTitle: 'Revocar autorización',
    revokeDesc: 'Si revocas tu autorización, no podremos emitir facturas a tu nombre. Puedes revocarla en Mis datos → Privacidad.',
    revokeButton: 'Revocar mi autorización',
    revokeConfirm: '¿Estás seguro? Esto afectará la emisión de facturas futuras a tu nombre.',
    arcoTitle: 'Solicitar derechos ARCO',
    arcoDesc: 'Puedes solicitar Acceso, Rectificación, Cancelación u Oposición sobre tus datos.',
    arcoButton: 'Ejercer mis derechos',
    arcoSent: 'Tu solicitud fue enviada. Te responderemos en máximo 15 días hábiles.',
  },

  // ============================================================
  // Resolución — monitor y alertas
  // ============================================================
  resolution: {
    status: 'Estado de la resolución',
    active: 'Activa',
    expired: 'Vencida',
    exhausted: 'Rango agotado',
    rangeUsed: '{{used}} de {{total}} documentos usados',
    percentUsed: '{{pct}}% utilizado',
    expiresOn: 'Vence el {{date}}',
    renewGuide: 'Cómo renovar en MUISCA →',
    warningDays: 'Vence en {{days}} días',
    warningRange: 'Solo quedan {{remaining}} documentos disponibles',
    add: 'Agregar nueva resolución',
    addDesc: 'Cuando solicites una nueva resolución en DIAN, agrégala aquí.',
  },

  // ============================================================
  // Dashboard / Métricas en BillingDashboard
  // ============================================================
  metrics: {
    totalIssued: 'Facturas emitidas',
    accepted: 'Aceptadas por DIAN',
    pending: 'Pendientes',
    rejected: 'Rechazadas',
    totalAmount: 'Valor total facturado',
    thisMonth: 'Este mes',
    resolutionHealth: 'Salud resolución DIAN',
  },
}
