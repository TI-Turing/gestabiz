// Settings - Completo con TODAS las preferencias
export const settings = {
  title: 'Configuraciones',
  subtitle: 'Configura tu cuenta y preferencias',
  profile: 'Perfil',
  appearance: 'Apariencia',
  theme: 'Tema',
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
  language: 'Idioma',
  spanish: 'Español',
  english: 'English',
  notifications: 'Notificaciones',
  email_notifications: 'Notificaciones por Email',
  push_notifications: 'Notificaciones Push',
  browser_notifications: 'Notificaciones del Navegador',
  whatsapp_notifications: 'Notificaciones de WhatsApp',
  reminder_24h: 'Recordatorios de 24 horas',
  reminder_1h: 'Recordatorios de 1 hora',
  reminder_15m: 'Recordatorios de 15 minutos',
  daily_digest: 'Resumen diario',
  weekly_report: 'Reportes semanales',
  save_preferences: 'Guardar Preferencias',
  preferences_saved: 'Preferencias guardadas exitosamente',
  
  // Tabs
  tabs: {
    general: 'Configuración General',
    profile: 'Perfil',
    notifications: 'Notificaciones',
    businessPreferences: 'Preferencias del Negocio',
    employeePreferences: 'Preferencias de Empleado',
    clientPreferences: 'Preferencias de Cliente',
    dangerZone: 'Zona de Peligro'
  },

  // Theme section
  themeSection: {
    title: 'Apariencia y Sistema',
    subtitle: 'Personaliza el tema y el idioma de la aplicación',
    themeLabel: 'Tema de la interfaz',
    themeDescription: 'Selecciona tu tema preferido para la aplicación',
    themes: {
      light: {
        label: 'Claro',
        description: 'Interfaz de colores claros'
      },
      dark: {
        label: 'Oscuro',
        description: 'Interfaz de colores oscuros'
      },
      system: {
        label: 'Sistema',
        description: 'Según las preferencias del sistema'
      }
    },
    currentTheme: 'Tema actual: {theme}',
    systemThemeNote: 'El tema cambia automáticamente según las preferencias de tu sistema operativo',
    changeAnytime: 'Puedes cambiar el tema en cualquier momento'
  },

  // Language section
  languageSection: {
    label: 'Idioma de la Interfaz',
    description: 'Selecciona el idioma de la interfaz'
  },

  // Admin Business Preferences
  businessInfo: {
    title: 'Información del Negocio',
    subtitle: 'Información básica del negocio',
    tabs: {
      info: 'Información del Negocio',
      notifications: 'Notificaciones del Negocio',
      tracking: 'Historial'
    },
    basicInfo: {
      title: 'Información Básica',
      nameLabel: 'Nombre del Negocio *',
      namePlaceholder: 'Ingresa el nombre del negocio',
      descriptionLabel: 'Descripción',
      descriptionPlaceholder: 'Describe tu negocio...'
    },
    contactInfo: {
      title: 'Información de Contacto',
      phoneLabel: 'Teléfono',
      phonePlaceholder: 'Número de teléfono',
      emailLabel: 'Email',
      emailPlaceholder: 'contacto@negocio.com',
      websiteLabel: 'Sitio Web',
      websitePlaceholder: 'https://www.negocio.com'
    },
    addressInfo: {
      title: 'Dirección',
      addressLabel: 'Dirección',
      addressPlaceholder: 'Calle, número, barrio',
      cityLabel: 'Ciudad',
      cityPlaceholder: 'Ciudad',
      stateLabel: 'Departamento/Estado',
      statePlaceholder: 'Departamento o Estado'
    },
    legalInfo: {
      title: 'Información Legal',
      legalNameLabel: 'Razón Social',
      legalNamePlaceholder: 'Razón social del negocio',
      taxIdLabel: 'NIT / ID Fiscal',
      taxIdPlaceholder: 'Número de identificación tributaria'
    },
    operationSettings: {
      title: 'Configuración de Operación',
      allowOnlineBooking: {
        label: 'Permitir reservas en línea',
        description: 'Permite que los clientes reserven en línea'
      },
      autoConfirm: {
        label: 'Confirmación automática',
        description: 'Confirma automáticamente las nuevas citas'
      },
      autoReminders: {
        label: 'Recordatorios automáticos',
        description: 'Envía recordatorios automáticamente a los clientes'
      },
      showPrices: {
        label: 'Mostrar precios públicamente',
        description: 'Muestra los precios en perfiles públicos'
      }
    },
    nameRequired: 'El nombre del negocio es requerido',
    saveSettings: 'Guardar Configuración'
  },

  // Employee Preferences
  employeePrefs: {
    title: 'Preferencias de Empleado',
    subtitle: 'Configura tus preferencias de trabajo',
    profileUpdateSuccess: 'Perfil actualizado exitosamente',
    profileUpdateError: 'Error al actualizar perfil',
    availability: {
      title: 'Disponibilidad',
      description: 'Administra tu disponibilidad para asignaciones y recordatorios',
      availableForHire: {
        label: 'Disponible para contratación',
        description: 'Indica a los negocios que estás abierto a nuevas oportunidades'
      },
      notifyAssignments: {
        label: 'Notificar asignaciones',
        description: 'Recibe notificaciones de nuevas asignaciones'
      },
      reminders: {
        label: 'Recordatorios',
        description: 'Recibe recordatorios sobre tu agenda y citas'
      },
      availableForAppointments: 'Disponible para nuevas citas',
      notifyNewAssignments: 'Notificar nuevas asignaciones',
      appointmentReminders: 'Recordatorios de citas'
    },
    schedule: {
      title: 'Mi Horario de Trabajo',
      description: 'Define tu horario laboral para cada día de la semana',
      days: {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo'
      },
      workingDay: 'Día laboral',
      restDay: 'Día de descanso',
      startTime: 'Inicio',
      endTime: 'Fin',
      lunchBreak: 'Almuerzo',
      saveSchedule: 'Guardar Horarios'
    },
    messages: {
      title: 'Mensajes de Clientes',
      allowMessages: 'Permitir mensajes de clientes',
      description: 'Cuando está habilitado, los clientes pueden enviarte mensajes directos',
      allowClientMessages: {
        label: 'Permitir mensajes de clientes',
        description: 'Cuando está habilitado, los clientes pueden enviarte mensajes directos',
        successEnabled: 'Mensajes de clientes habilitados',
        successDisabled: 'Mensajes de clientes deshabilitados',
        errorBusinessId: 'Se requiere el ID del negocio para actualizar esta preferencia',
        error: 'Error al actualizar la preferencia de mensajes'
      }
    },
    professionalInfo: {
      title: 'Información Profesional',
      subtitle: 'Tu experiencia y tipo de trabajo preferido',
      description: 'Cuéntanos sobre tu experiencia profesional',
      summaryLabel: 'Resumen Profesional',
      summaryPlaceholder: 'Describe tu experiencia, habilidades y especialidades...',
      minCharacters: '{count} / 50 caracteres mínimos',
      yearsExperienceLabel: 'Años de Experiencia',
      workTypeLabel: 'Tipo de Trabajo Preferido',
      errors: {
        summaryTooShort: 'El resumen debe tener al menos 50 caracteres',
        experienceRange: 'La experiencia debe estar entre 0 y 50 años'
      },
      workTypes: {
        fullTime: 'Tiempo Completo',
        partTime: 'Medio Tiempo',
        contract: 'Contrato',
        flexible: 'Flexible'
      }
    },
    salary: {
      title: 'Expectativas Salariales',
      description: 'Define tu rango salarial esperado',
      minLabel: 'Salario Mínimo Esperado',
      maxLabel: 'Salario Máximo Esperado',
      minPlaceholder: 'Monto mínimo',
      maxPlaceholder: 'Monto máximo',
      invalidRange: 'El salario mínimo no puede ser mayor que el máximo',
      errors: {
        minGreaterThanMax: 'El salario mínimo no puede ser mayor que el máximo'
      }
    },
    specializations: {
      title: 'Especializaciones',
      description: 'Agrega tus especializaciones profesionales',
      noSpecializations: 'No hay especializaciones agregadas aún',
      newPlaceholder: 'Nueva especialización',
      placeholder: 'Escribe una especialización',
      successAdd: 'Especialización agregada exitosamente',
      successRemove: 'Especialización eliminada exitosamente',
      addButton: 'Agregar'
    },
    languages: {
      title: 'Idiomas',
      description: 'Agrega los idiomas que hablas',
      noLanguages: 'No hay idiomas agregados aún',
      newPlaceholder: 'Idioma (ej: Inglés - Avanzado)',
      placeholder: 'Escribe un idioma',
      successAdd: 'Idioma agregado exitosamente',
      successRemove: 'Idioma eliminado exitosamente',
      addButton: 'Agregar'
    },
    certifications: {
      title: 'Certificaciones y Licencias',
      description: 'Muestra tus certificaciones y credenciales',
      noCertifications: 'No hay certificaciones agregadas aún',
      addButton: 'Agregar Certificación',
      namePlaceholder: 'Nombre de la certificación *',
      issuerPlaceholder: 'Entidad emisora *',
      issueDatePlaceholder: 'Fecha de emisión *',
      expiryDatePlaceholder: 'Fecha de vencimiento',
      credentialIdPlaceholder: 'ID de credencial',
      credentialUrlPlaceholder: 'URL de credencial',
      issuedLabel: 'Emitida',
      expiresLabel: 'Vence',
      viewCredential: 'Ver credencial',
      requiredFields: 'Completa todos los campos requeridos',
      successAdd: 'Certificación agregada exitosamente',
      successRemove: 'Certificación eliminada exitosamente',
      form: {
        nameLabel: 'Nombre de la Certificación',
        namePlaceholder: 'Nombre de la certificación o licencia',
        issuerLabel: 'Entidad Emisora',
        issuerPlaceholder: 'Entidad que emitió la certificación',
        dateLabel: 'Fecha de Obtención',
        datePlaceholder: 'MM/AAAA',
        urlLabel: 'URL de Credencial (opcional)',
        urlPlaceholder: 'https://...',
        cancelButton: 'Cancelar',
        saveButton: 'Guardar'
      },
      issued: 'Emitido',
      verifyCredential: 'Verificar credencial',
      deleteButton: 'Eliminar'
    },
    links: {
      title: 'Enlaces Profesionales',
      description: 'Agrega tus enlaces profesionales',
      portfolioLabel: 'Portafolio / Sitio Web',
      portfolioPlaceholder: 'https://tu-portafolio.com',
      linkedinLabel: 'LinkedIn',
      linkedinPlaceholder: 'https://linkedin.com/in/tuperfil',
      githubLabel: 'GitHub',
      githubPlaceholder: 'https://github.com/tu-usuario'
    },
    saveButton: 'Guardar Preferencias',
    saveChanges: 'Guardar Cambios',
    resetButton: 'Restablecer'
  },

  // Client Preferences
  clientPrefs: {
    title: 'Preferencias de Cliente',
    subtitle: 'Configura tus preferencias de reserva',
    bookingPrefs: {
      title: 'Preferencias de Reserva',
      description: 'Gestiona cómo quieres recibir información de tus reservas',
      reminders: {
        label: 'Recordatorios de citas',
        description: 'Recibe recordatorios antes de tus citas'
      },
      emailConfirmation: {
        label: 'Confirmación por email',
        description: 'Recibe un email de confirmación después de reservar'
      },
      promotions: {
        label: 'Promociones',
        description: 'Recibe promociones y ofertas especiales'
      },
      savePayment: {
        label: 'Guardar método de pago',
        description: 'Guarda tu método de pago para agilizar el checkout'
      },
      appointmentReminders: 'Recordatorios de citas',
      emailConfirmation: 'Confirmación por email',
      promotionNotifications: 'Notificaciones de promociones',
      savePaymentMethods: 'Guardar métodos de pago'
    },
    advanceTime: {
      title: 'Tiempo de Anticipación Preferido',
      description: 'Con cuánta anticipación prefieres agendar tus citas',
      label: 'Tiempo de aviso preferido para citas',
      options: {
        oneHour: '1 hora',
        twoHours: '2 horas',
        fourHours: '4 horas',
        sameDay: 'Mismo día',
        oneDay: '1 día',
        twoDays: '2 días',
        threeDays: '3 días',
        oneWeek: '1 semana'
      }
    },
    serviceHistory: {
      title: 'Historial de Servicios',
      label: 'Guardar mi historial de servicios para recomendaciones',
      description: 'Usamos esto para sugerir servicios similares',
      completedServices: '{count} servicios completados',
      viewHistory: 'Ver historial'
    },
    paymentMethods: {
      title: 'Métodos de Pago',
      noneAdded: 'No hay métodos de pago agregados',
      options: {
        card: 'Tarjeta de Crédito/Débito',
        cash: 'Efectivo',
        transfer: 'Transferencia Bancaria',
        pse: 'PSE'
      },
      types: {
        card: 'Tarjeta de Crédito/Débito',
        pse: 'PSE',
        cash: 'Efectivo',
        transfer: 'Transferencia Bancaria'
      },
      addButton: 'Agregar Método de Pago'
    },
    savePreferences: 'Guardar Preferencias'
  },

  // Danger Zone
  dangerZone: {
    title: 'Zona de Peligro',
    description: 'Acciones irreversibles de la cuenta',
    warning: {
      label: 'Advertencia',
      message: 'Estas acciones son permanentes y no se pueden deshacer. Procede con extrema precaución.'
    },
    deactivate: {
      title: 'Desactivar Cuenta',
      subtitle: 'Suspender temporalmente tu cuenta. Puedes reactivarla en cualquier momento.',
      description: 'Suspender temporalmente tu cuenta. Puedes reactivarla en cualquier momento.',
      button: 'Desactivar Cuenta',
      whatHappens: '¿Qué sucede cuando desactivas?',
      consequences: {
        markedInactive: 'Tu cuenta será marcada como inactiva',
        sessionClosed: 'Todas las sesiones activas se cerrarán',
        futureAppointments: 'Las citas futuras se cancelarán',
        noLogin: 'No podrás iniciar sesión',
        dataPreserved: 'Todos tus datos se conservarán'
      },
      dataNotDeleted: 'Tus datos NO serán eliminados',
      contactSupport: 'Para reactivar, simplemente inicia sesión nuevamente o contacta soporte',
      confirmTitle: '¿Estás seguro de que deseas desactivar tu cuenta?',
      confirmDescription: 'Tu cuenta será suspendida temporalmente. Todos tus datos se conservarán y podrás reactivarla en cualquier momento iniciando sesión nuevamente.',
      inputLabel: 'Confirma tu email para continuar:',
      inputPlaceholder: 'tu@email.com',
      checkbox: 'Entiendo que mi cuenta será suspendida temporalmente',
      cancel: 'Cancelar',
      confirm: 'Sí, desactivar mi cuenta'
    },
    delete: {
      title: 'Eliminar Cuenta',
      description: 'Eliminar permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.',
      button: 'Eliminar Cuenta',
      step1Title: 'Confirma Tu Identidad',
      step2Title: 'Confirmación Final',
      step1Description: 'Por favor verifica tu dirección de email para continuar',
      step2Description: 'Esta es tu última oportunidad para cancelar',
      step1Warning: 'Esto eliminará permanentemente tu cuenta y todos los datos asociados',
      emailPrompt: 'Confirma tu email',
      emailPlaceholder: 'tu@email.com',
      understandCheckbox: 'Entiendo que esta acción es permanente e irreversible',
      finalWarning: 'Advertencia Final',
      typeExactly: 'Escribe exactamente',
      confirmPlaceholder: 'DESACTIVAR CUENTA',
      confirmDetails: 'Qué será eliminado',
      accountLabel: 'Cuenta',
      profileLabel: 'Perfil',
      rolesLabel: 'Roles',
      activeLabel: 'activos',
      appointmentsLabel: 'Citas',
      cancelledAuto: 'Canceladas automáticamente',
      dataPreservedNote: 'Los datos históricos se conservarán para cumplimiento legal',
      continue: 'Continuar',
      deactivating: 'Desactivando',
      deactivateNow: 'Desactivar Ahora',
      successTitle: 'Cuenta desactivada exitosamente',
      successDescription: 'Tu cuenta ha sido desactivada. Puedes reactivarla iniciando sesión nuevamente.',
      errorTitle: 'Error al desactivar cuenta',
      unknownError: 'Ocurrió un error desconocido',
      confirmTitle: 'Eliminar cuenta permanentemente',
      warningTitle: 'Advertencia: Esta acción es irreversible',
      warningDescription: 'Estás a punto de eliminar permanentemente tu cuenta y todos los datos asociados. Esto incluye:',
      warningItems: {
        profile: 'Tu perfil e información personal',
        appointments: 'Todas tus citas (pasadas y futuras)',
        history: 'Tu historial completo de servicios',
        payments: 'Historial de pagos y métodos',
        preferences: 'Todas tus preferencias y configuraciones'
      },
      confirmText: 'Escribe "DESACTIVAR CUENTA" para confirmar',
      mustTypeCorrectly: 'Debes escribir "DESACTIVAR CUENTA" para confirmar',
      cancel: 'Cancelar',
      confirm: 'Sí, eliminar permanentemente',
      processing: 'Procesando...'
    }
  }
};
