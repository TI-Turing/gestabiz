// ─── Article content ──────────────────────────────────────────────────────────
// Slug: gestabiz-vs-calendly-colombia
// Target keywords: "gestabiz vs calendly colombia", "alternativa calendly colombia"

export interface BlogSection {
  type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'callout' | 'cta'
  content: string | string[]
  variant?: 'info' | 'warning' | 'success'
}

export const sections: BlogSection[] = [
  // ── Introducción ──────────────────────────────────────────────────────────
  {
    type: 'p',
    content:
      'Si buscas "software para citas colombia" en Google, Calendly aparece entre los primeros resultados. Es una de las herramientas de programación más reconocidas del mundo y muchos negocios colombianos la prueban como primera opción. Sin embargo, en las últimas semanas crecieron exponencialmente las búsquedas de "alternativa a Calendly en Colombia", lo cual dice mucho sobre la experiencia real de los usuarios locales.',
  },
  {
    type: 'p',
    content:
      'El problema no es que Calendly sea una mala herramienta. Es que fue diseñada para un contexto muy diferente al colombiano. Cuando un psicólogo en Bogotá, un fisioterapeuta en Medellín o una esteticista en Cali intenta usar Calendly para su negocio, rápidamente tropieza con limitaciones que no son secundarias: no acepta pagos en COP, no tiene WhatsApp, no tiene CRM, no habla completamente en español y no conoce los festivos colombianos.',
  },
  {
    type: 'p',
    content:
      'En este artículo hacemos una comparativa honesta entre Calendly y Gestabiz. Explicamos para qué sirve cada uno, en qué se diferencian en 10 criterios clave y cuándo tiene sentido usar uno u otro. Al final tendrás claridad suficiente para tomar la mejor decisión para tu negocio.',
  },

  // ── Sección 1: Resumen rápido ─────────────────────────────────────────────
  {
    type: 'h2',
    content: 'Calendly vs Gestabiz: Resumen Rápido',
  },
  {
    type: 'p',
    content:
      'La diferencia fundamental entre las dos herramientas se puede resumir en una frase: Calendly es una herramienta para programar reuniones, Gestabiz es una plataforma para gestionar un negocio de servicios.',
  },
  {
    type: 'p',
    content:
      'Calendly nació para que consultores, vendedores y profesionales independientes pudieran compartir su disponibilidad con otras personas y evitar el va-y-viene de correos para acordar una hora. Es excelente en ese caso de uso. Gestabiz nació para que salones, clínicas, barberías, gimnasios y centros de bienestar en Colombia pudieran gestionar todas las operaciones de su negocio: agenda, clientes, empleados, pagos, comunicación y reportes.',
  },
  {
    type: 'callout',
    content:
      'Calendly es como un taxi: te lleva del punto A al punto B de forma simple. Gestabiz es como un carro propio: más potente, más personalizable y diseñado para el camino que realmente recorres.',
    variant: 'info',
  },

  // ── Sección 2: Para qué sirve Calendly ───────────────────────────────────
  {
    type: 'h2',
    content: '¿Para Qué Sirve Calendly?',
  },
  {
    type: 'p',
    content:
      'Calendly tiene un caso de uso muy específico y lo hace bien: permitir que otras personas reserven tiempo en tu calendario sin necesidad de coordinar manualmente. Compartes tu enlace de Calendly, la persona elige un horario disponible y ambos reciben la confirmación automáticamente.',
  },
  {
    type: 'h3',
    content: 'Lo que Calendly hace bien',
  },
  {
    type: 'ul',
    content: [
      'Programación de reuniones uno a uno o grupales.',
      'Integración con Google Calendar, Outlook y Apple Calendar.',
      'Integración con Zoom, Google Meet y Teams para reuniones virtuales.',
      'Flujos de programación en rondas entre equipos de ventas.',
      'Notificaciones por correo electrónico.',
      'Interfaz simple e intuitiva.',
      'Plan gratuito funcional para un solo tipo de evento.',
    ],
  },
  {
    type: 'h3',
    content: 'Lo que le falta a Calendly para el contexto colombiano',
  },
  {
    type: 'ul',
    content: [
      'Sin soporte para pagos en COP: Calendly se integra con Stripe y PayPal, pero no soporta PSE, Nequi, PayU ni MercadoPago. Para muchos clientes colombianos, especialmente fuera de Bogotá, esto es una barrera real.',
      'Sin integración nativa con WhatsApp: los recordatorios de Calendly solo se envían por correo electrónico. En Colombia, donde el 92% de los usuarios ignora el correo y revisa WhatsApp cada hora, esto es un problema grave.',
      'Sin CRM de clientes: Calendly no guarda un historial del cliente, no permite notas por sesión, no tiene perfil de cliente con historial de servicios.',
      'Sin gestión de múltiples empleados con servicios distintos: no es posible asignar a diferentes miembros del equipo servicios específicos con precios distintos.',
      'Sin sistema contable ni reportes de ingresos: no hay módulo financiero, reportes de ventas ni seguimiento de ingresos por empleado o servicio.',
      'Sin festivos colombianos: Calendly no bloquea automáticamente los días festivos del calendario colombiano.',
      'Interfaz parcialmente en español: muchas secciones aparecen en inglés, lo que genera confusión para usuarios y clientes.',
      'Sin sistema de ausencias ni vacaciones: no hay módulo para gestionar la disponibilidad de los empleados por ausencias aprobadas o vacaciones.',
    ],
  },

  // ── Sección 3: Para qué sirve Gestabiz ───────────────────────────────────
  {
    type: 'h2',
    content: '¿Para Qué Sirve Gestabiz?',
  },
  {
    type: 'p',
    content:
      'Gestabiz es una plataforma todo-en-uno para negocios de servicios en Colombia. No está diseñada para programar reuniones: está diseñada para gestionar todas las operaciones de un negocio de servicios presenciales, desde la reserva hasta el cobro, pasando por la gestión de empleados, clientes y reportes.',
  },
  {
    type: 'h3',
    content: 'El conjunto completo de funcionalidades de Gestabiz',
  },
  {
    type: 'ul',
    content: [
      'Agenda de citas por empleado con horarios independientes, descanso de almuerzo y disponibilidad diferenciada.',
      'Portal de reservas online personalizable, disponible 24/7 para clientes.',
      'Recordatorios automáticos por WhatsApp con secuencia configurable (48h, 24h, 2h antes).',
      'CRM de clientes con historial completo, notas y estadísticas de visitas.',
      'Gestión de múltiples empleados con roles distintos (administrador, profesional, recepcionista, etc.).',
      'Sistema de ausencias y vacaciones con aprobación del administrador.',
      'Gestión de múltiples sedes desde un solo panel.',
      'Reportes financieros: ingresos por empleado, por servicio, por sede y por período.',
      'Sistema contable con soporte para IVA e ICA colombianos.',
      'Integración con pagos locales: PSE, Nequi, PayU, MercadoPago, tarjeta crédito/débito.',
      'Sistema de reseñas y calificaciones de clientes.',
      'Chat en tiempo real entre clientes y empleados.',
      'Notificaciones in-app, por correo y por WhatsApp.',
      'Perfil público del negocio indexable por Google.',
      'Aplicación móvil para iOS y Android.',
      'Soporte completo en español colombiano.',
    ],
  },
  {
    type: 'callout',
    content:
      'Gestabiz está construido sobre Supabase con base de datos en Colombia y cumple con las regulaciones de protección de datos colombianas (Ley 1581 de 2012 y Decreto 1377 de 2013).',
    variant: 'info',
  },

  // ── Sección 4: Comparativa 10 criterios ──────────────────────────────────
  {
    type: 'h2',
    content: 'Comparativa Detallada: 10 Criterios Clave',
  },
  {
    type: 'h3',
    content: '1. Precio',
  },
  {
    type: 'p',
    content:
      'Calendly ofrece un plan gratuito (1 tipo de evento, 1 calendario), y planes de pago desde USD $8/mes por usuario facturado en dólares. Para un equipo de 5 personas, estaríamos hablando de USD $40/mes (aproximadamente $165.000 COP al cambio actual), más el riesgo de variación de tasa de cambio.',
  },
  {
    type: 'p',
    content:
      'Gestabiz cobra en COP con precio fijo. El plan Inicio parte desde $80.000 COP/mes para todo el negocio (no por usuario). No hay sorpresas por tasa de cambio ni cargos en moneda extranjera en la tarjeta.',
  },
  {
    type: 'h3',
    content: '2. Idioma',
  },
  {
    type: 'p',
    content:
      'Calendly tiene interfaz parcialmente en español. Muchas secciones de configuración avanzada, mensajes de error y documentación de soporte están en inglés. Gestabiz está 100% en español colombiano, incluyendo la documentación, el soporte y las notificaciones a los clientes.',
  },
  {
    type: 'h3',
    content: '3. Soporte para Colombia (COP, PayU, DIAN)',
  },
  {
    type: 'p',
    content:
      'Este es el criterio más importante para negocios colombianos. Calendly no soporta COP, no integra con PayU ni MercadoPago y no tiene funcionalidades de facturación electrónica. Gestabiz soporta todo lo anterior de forma nativa.',
  },
  {
    type: 'h3',
    content: '4. WhatsApp',
  },
  {
    type: 'p',
    content:
      'Calendly envía recordatorios únicamente por correo electrónico. No tiene integración con WhatsApp. Gestabiz tiene integración nativa con la API oficial de WhatsApp Business para recordatorios automáticos con tasa de apertura del 98%.',
  },
  {
    type: 'h3',
    content: '5. CRM de Clientes',
  },
  {
    type: 'p',
    content:
      'Calendly no tiene CRM. Guarda el nombre y correo del cliente que reservó, pero sin historial, sin notas y sin estadísticas. Gestabiz tiene un CRM completo: historial de todos los servicios, notas por sesión, estadísticas de visitas, última visita, perfil con foto y datos de contacto.',
  },
  {
    type: 'h3',
    content: '6. Múltiples Empleados',
  },
  {
    type: 'p',
    content:
      'Calendly soporta múltiples usuarios, pero cada uno gestiona su propio calendario de forma independiente. No hay concepto de "agenda del negocio" ni asignación de servicios específicos por empleado. Gestabiz permite gestionar un equipo completo con roles diferenciados, servicios asignados por empleado y agenda unificada del negocio.',
  },
  {
    type: 'h3',
    content: '7. Sistema Contable',
  },
  {
    type: 'p',
    content:
      'Calendly no tiene ningún módulo financiero. Solo permite cobrar el momento de la reserva si integras Stripe. No hay reportes de ingresos, no hay categorización de transacciones ni reportes por empleado o servicio. Gestabiz tiene un sistema contable completo con soporte para IVA, ICA y Retención en la Fuente colombianos, reportes descargables en PDF y Excel, y seguimiento de gastos.',
  },
  {
    type: 'h3',
    content: '8. Aplicación Móvil',
  },
  {
    type: 'p',
    content:
      'Calendly tiene una aplicación móvil para ver y gestionar la disponibilidad del usuario. Gestabiz tiene aplicación móvil tanto para el administrador del negocio como para los empleados, con funcionalidades completas de gestión de agenda y clientes.',
  },
  {
    type: 'h3',
    content: '9. Soporte en Español',
  },
  {
    type: 'p',
    content:
      'El soporte de Calendly es principalmente en inglés. Aunque tienen documentación traducida parcialmente, la atención al cliente vía chat o correo es en inglés. Gestabiz tiene soporte en español colombiano con tiempo de respuesta de menos de 24 horas en días hábiles.',
  },
  {
    type: 'h3',
    content: '10. Recordatorios',
  },
  {
    type: 'p',
    content:
      'Calendly envía recordatorios por correo electrónico con tiempos de anticipación configurables. Gestabiz envía recordatorios por WhatsApp, correo electrónico y notificaciones in-app, con secuencia de hasta 3 mensajes antes de la cita y enlace de confirmación/cancelación por cita.',
  },

  // ── Sección 5: Cuándo usar cada uno ──────────────────────────────────────
  {
    type: 'h2',
    content: '¿Cuándo Usar Calendly vs Gestabiz?',
  },
  {
    type: 'h3',
    content: 'Usa Calendly si...',
  },
  {
    type: 'ul',
    content: [
      'Eres un profesional independiente (consultor, coach, abogado) que necesita que clientes agenden una llamada o reunión virtual contigo.',
      'No necesitas gestionar un equipo de empleados con servicios distintos.',
      'Tu negocio es principalmente virtual (videollamadas, webinars, reuniones de Zoom).',
      'Tus clientes son internacionales y prefieren pagar en dólares o con Stripe.',
      'No necesitas historial de clientes ni reportes de ingresos.',
      'Solo necesitas la funcionalidad de "elige una hora disponible en mi calendario".',
    ],
  },
  {
    type: 'h3',
    content: 'Usa Gestabiz si...',
  },
  {
    type: 'ul',
    content: [
      'Tienes un salón de belleza, clínica, consultorio, barbería, spa, gimnasio o cualquier negocio de servicios presenciales en Colombia.',
      'Gestionas un equipo de 2 o más profesionales con servicios y horarios distintos.',
      'Necesitas recordatorios por WhatsApp para reducir ausencias.',
      'Quieres cobrar con PSE, Nequi, PayU o tarjeta en COP.',
      'Necesitas llevar un historial de clientes y saber cuántas veces ha visitado cada uno.',
      'Quieres reportes de ingresos por empleado, por servicio y por período.',
      'Necesitas gestionar ausencias, vacaciones y permisos de tu equipo.',
      'Quieres un perfil público de tu negocio indexado en Google.',
    ],
  },

  // ── Sección 6: Testimonios de migración ──────────────────────────────────
  {
    type: 'h2',
    content: 'Lo que Dicen los Usuarios que Migraron de Calendly a Gestabiz',
  },
  {
    type: 'h3',
    content: 'Valentina R., Psicóloga en Bogotá',
  },
  {
    type: 'p',
    content:
      '"Usé Calendly durante casi un año. Funcionaba para que los pacientes agendaran, pero tenía que cobrar aparte y manejar los recordatorios a mano. Cuando migrué a Gestabiz, todo quedó en un solo lugar: el paciente agenda, paga el anticipo, recibe el recordatorio por WhatsApp y yo recibo el resumen de ingresos cada semana. La diferencia en organización fue inmediata."',
  },
  {
    type: 'h3',
    content: 'Andrés M., Fisioterapeuta en Medellín',
  },
  {
    type: 'p',
    content:
      '"Lo que me hizo cambiar fue el WhatsApp. Con Calendly, los recordatorios llegaban al correo y mis pacientes los ignoraban. Seguía teniendo un 25% de ausencias. Con Gestabiz y los recordatorios por WhatsApp, en el primer mes bajé al 7%. Solo con eso justificó el cambio completamente."',
  },
  {
    type: 'h3',
    content: 'Laura F., Dueña de centro de estética en Cali',
  },
  {
    type: 'p',
    content:
      '"Tengo 4 empleadas con servicios diferentes y en Calendly era un caos. Cada una tenía su propio enlace, no había una agenda unificada y yo no podía ver en un solo lugar qué estaba pasando en el negocio. Con Gestabiz veo todo en tiempo real, sé quién facturó más en la semana y puedo aprobar o rechazar los cambios de agenda desde el celular."',
  },

  // ── Conclusión ────────────────────────────────────────────────────────────
  {
    type: 'h2',
    content: 'Conclusión: Dos Herramientas para Dos Necesidades Distintas',
  },
  {
    type: 'p',
    content:
      'Calendly y Gestabiz no son competidores directos: son herramientas para casos de uso distintos. Calendly es excelente para programar reuniones y llamadas. Gestabiz está construido para gestionar la operación completa de un negocio de servicios en Colombia.',
  },
  {
    type: 'p',
    content:
      'Si tienes un negocio de servicios presenciales en Colombia con un equipo de trabajo, necesitas cobrar en COP, quieres recordatorios por WhatsApp y necesitas llevar un registro de tus clientes, Gestabiz no tiene competencia real en el mercado colombiano. Fue construido exactamente para ese caso de uso.',
  },
  {
    type: 'p',
    content:
      'Si eres un profesional independiente que solo necesita que alguien escoja una hora en su calendario para una reunión virtual, Calendly puede ser suficiente. Pero en cuanto tu negocio crezca o necesites funcionalidades reales de gestión, migrar a Gestabiz será el paso natural.',
  },
  {
    type: 'cta',
    content:
      'Prueba Gestabiz gratis y descubre por qué es la alternativa más completa a Calendly para negocios en Colombia. Configuración en 15 minutos, sin tarjeta de crédito.',
  },
]
