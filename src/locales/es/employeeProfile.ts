// Modales de Perfil de Empleado — EmployeeProfileModal, EmployeeOccupancyModal,
// EmployeeAppointmentsModal, EmployeeRevenueModal

export const employeeProfile = {

  // ── Selector de período compartido ───────────────────────────────────────
  periods: {
    '7d': '7 días',
    '30d': '30 días',
    '90d': '90 días',
    '6m':  '6 meses',
    '1y':  '1 año',
    all:   'Todo',
  },

  // ── EmployeeProfileModal ──────────────────────────────────────────────────
  modal: {
    tabs: {
      info:    'Información',
      payroll: 'Nómina',
    },
    hierarchy: {
      0:       'Propietario',
      1:       'Administrador',
      2:       'Gerente',
      3:       'Líder de Equipo',
      4:       'Personal',
      unknown: 'Desconocido',
    },
    expertise: {
      1: 'Principiante',
      2: 'Básico',
      3: 'Intermedio',
      4: 'Avanzado',
      5: 'Experto',
      levelFallback: 'Nivel',
    },
    days: {
      monday:    'Lun',
      tuesday:   'Mar',
      wednesday: 'Mié',
      thursday:  'Jue',
      friday:    'Vie',
      saturday:  'Sáb',
      sunday:    'Dom',
    },
    absenceTypes: {
      vacation:   'Vacaciones',
      emergency:  'Emergencia',
      sick_leave: 'Ausencia Médica',
      personal:   'Permiso Personal',
      other:      'Otro',
    },
    cargo: {
      title:       'Cargo',
      placeholder: 'Ej: Recepcionista, Estilista, Terapeuta...',
      noAssigned:  'Sin cargo asignado',
      editTitle:   'Editar cargo',
      updated:     'Cargo actualizado',
      updateError: 'Error al actualizar el cargo',
      viewOrgChart:'Ver organigrama',
    },
    supervisor: {
      label:            'Jefe directo:',
      none:             'Sin jefe directo',
      unassigned:       'Sin asignar',
      changeTitle:      'Cambiar jefe directo',
      selectPlaceholder:'Seleccionar jefe...',
      updated:          'Jefe directo actualizado',
      updateError:      'Error al actualizar el jefe directo',
      unknownError:     'Error desconocido',
    },
    contact: {
      title:           'Información de Contacto',
      email:           'Email',
      phone:           'Teléfono',
      linkedin:        'LinkedIn',
      portfolio:       'Portafolio',
      experience:      'Experiencia',
      specializations: 'Especializaciones',
      summary:         'Resumen Profesional',
      notSpecified:    'No especificado',
      yearSingular:    'año',
      yearPlural:      'años',
    },
    work: {
      title:    'Información Laboral',
      hireDate: 'Fecha de Contratación',
      role:     'Rol',
    },
    schedule: {
      title:        'Horario de Trabajo',
      nonWorkDay:   'No laboral',
      notConfigured:'No configurado',
      lunchBreak:   'Almuerzo:',
      noLunchBreak: 'Sin pausa de almuerzo configurada',
    },
    location: {
      title: 'Ubicación Asignada',
    },
    stats: {
      rating:               'Calificación',
      reviews:              'reseñas',
      occupancy:            'Ocupación',
      occupancyDetail:      'Ver detalle de ocupación →',
      occupancyTooltip:     'Ocupación de los últimos 30 días. Clic para ver el análisis completo.',
      completedAppointments:'Citas Completadas',
      completedDetail:      'Ver historial de citas →',
      completedTooltip:     'Citas atendidas en los últimos 30 días. Clic para ver el historial completo.',
      totalRevenue:         'Ingresos Totales',
      revenueDetail:        'Ver desglose de ingresos →',
      revenueTooltip:       'Ingresos generados por citas completadas. Clic para ver el desglose por período, servicio y cliente.',
    },
    services: {
      title:    'Servicios que atiende',
      subtitle: 'Servicios que este empleado está autorizado a gestionar',
      more:     'servicios más',
    },
    absences: {
      title:       'Ausencias y Vacaciones',
      onlyApproved:'Solo aprobadas',
      empty:       'Sin ausencias aprobadas registradas',
      daySingular: 'día',
      dayPlural:   'días',
    },
    orgChart: {
      title:  'Organigrama del negocio',
      noData: 'No hay datos de jerarquía disponibles',
    },
    reviews: {
      title: 'Reseñas de {name}',
    },
    close: 'Cerrar',
  },

  // ── EmployeeOccupancyModal ────────────────────────────────────────────────
  occupancy: {
    headerTitle: 'Ocupación',
    infoTooltip: 'La ocupación refleja el porcentaje de citas completadas sobre el total de citas asignadas en un período. Las citas futuras se muestran como proyección sujeta a cancelaciones de los clientes.',
    loading:     'Cargando datos de ocupación…',

    stats: {
      occupancy:        'Ocupación',
      occupancyTooltip: 'Citas completadas / total en el período seleccionado.',
      global30d:        'Global 30d: {rate}%',
      completed:        'Completadas',
      completedTooltip: "Citas con estado 'completada' en el período.",
      ofTotal:          'de {total} totales',
      cancelled:        'Canceladas',
      cancelledTooltip: 'Incluye cancelaciones y no-shows.',
      cancelledPct:     '{pct}% del total',
      future:           'Citas futuras',
      futureTooltip:    'Citas confirmadas o pendientes a partir de hoy. Sujeto a cancelaciones.',
      futureConfirmed:  'próximas confirmadas',
    },

    chart: {
      title:          'Actividad en el período',
      tooltip:        'Línea verde = completadas. Azul = confirmadas. Rojo = canceladas.',
      noData:         'Sin citas en este período',
      completed:      'Completadas',
      confirmed:      'Confirmadas',
      cancelled:      'Canceladas',
      cancelledNoShow:'Canceladas / No-show',
    },

    future: {
      title:   'Citas futuras confirmadas',
      tooltip: 'Proyección de ocupación futura. Estas citas pueden cancelarse por los clientes, por lo que son estimadas.',
      empty:   'No hay citas futuras registradas',
      badge:   '{count} citas',
      service: 'Servicio',
    },

    peak: {
      title:        'Horas pico',
      tooltip:      'Cantidad de citas completadas o confirmadas por hora del día.',
      noData:       'Sin datos de horas',
      appointments: 'Citas',
    },

    services: {
      title:        'Servicios más frecuentes',
      noData:       'Sin datos de servicios',
      appointments: '{count} citas',
      noService:    'Sin servicio',
    },

    progress: {
      title:   'Tasa de ocupación en el período',
      low:     'Baja ocupación',
      optimal: 'Óptima',
    },

    status: {
      confirmed: 'Confirmada',
      pending:   'Pendiente',
    },
  },

  // ── EmployeeAppointmentsModal ─────────────────────────────────────────────
  appointments: {
    headerTitle:  'Citas completadas',
    infoTooltip:  "Historial de citas con estado 'completada' atendidas por este empleado en el período seleccionado.",
    loading:      'Cargando citas…',

    stats: {
      completed:   'Completadas',
      revenue:     'Ingresos',
      avgDuration: 'Duración prom.',
    },

    searchPlaceholder: 'Buscar por cliente, servicio o sede…',
    empty:             'No hay citas completadas en este período',
    noResults:         'No hay citas que coincidan con la búsqueda',
    countSingular:     '{count} cita',
    countPlural:       '{count} citas',
    found:             'encontradas',

    row: {
      unknownClient:  'Cliente sin nombre',
      fullDate:       'Fecha completa',
      endTime:        'Hora finalización',
      duration:       'Duración',
      location:       'Sede',
      clientPhone:    'Teléfono cliente',
      serviceValue:   'Valor del servicio',
      notes:          'Notas',
      minutes:        '{count} minutos',
    },
  },

  // ── EmployeeRevenueModal ──────────────────────────────────────────────────
  revenue: {
    headerTitle:  'Ingresos',
    infoTooltip:  'Ingresos calculados a partir de citas completadas por este empleado. Solo se contabilizan servicios con precio registrado.',
    loading:      'Calculando ingresos…',
    empty:        'No hay ingresos registrados en este período',

    kpis: {
      periodRevenue: 'Ingresos del período',
      currency:      'COP',
      avgTicket:     'Ticket promedio',
      appointments:  '{count} citas',
      bestPeriod:    'Mejor período',
    },

    comparison: {
      '7d':    '7 días anteriores',
      '30d':   '30 días anteriores',
      '90d':   '90 días anteriores',
      '6m':    '6 meses anteriores',
      '1y':    'año anterior',
      noData:  'Sin datos previos',
      previous:'Antes: ${amount}',
    },

    charts: {
      evolution:    'Evolución de ingresos',
      byService:    'Ingresos por servicio',
      participation:'Participación',
      revenue:      'Ingresos',
    },

    clients: {
      title:         'Top clientes',
      countSingular: 'cita',
      countPlural:   'citas',
    },

    locations: {
      title:         'Ingresos por sede',
      singleLocation:'Toda la actividad en {name}',
      countSingular: 'cita',
      countPlural:   'citas',
    },
  },
}
