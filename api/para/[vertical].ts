/**
 * Vercel Edge Function — SSR de meta tags para landing pages verticales
 *
 * Problema: Gestabiz es un SPA de React. Cuando Google crawlea /para/:vertical
 * recibe el index.html genérico. Los meta tags correctos y los schemas JSON-LD
 * solo aparecen después de que JS corre en el cliente.
 *
 * Solución: este Edge Function intercepta /para/:vertical, inyecta los meta
 * tags específicos del vertical (title, description, keywords, og:*, twitter:*,
 * canonical) y los schemas JSON-LD (SoftwareApplication + FAQPage) en el
 * index.html antes de devolverlo al crawler.
 *
 * Cache: 24h en CDN (s-maxage=86400) — contenido estático, no cambia frecuentemente.
 */

export const config = { runtime: 'edge' }

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerticalSeoData {
  slug: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  ogImage: string
  canonicalPath: string
  faqItems: Array<{ question: string; answer: string }>
}

// ─── Verticals data (inline — Edge Function no puede importar desde src/) ────
// Solo incluye los campos necesarios para la inyección de meta tags.

const VERTICALS: Record<string, VerticalSeoData> = {
  salones: {
    slug: 'salones',
    metaTitle: 'Software para Salones de Belleza en Colombia | Gestabiz',
    metaDescription:
      'Agenda digital para salones de belleza en Colombia. Reservas online, recordatorios WhatsApp, historial de clientes y reportes por estilista. Prueba gratis hoy.',
    metaKeywords: [
      'software salón de belleza colombia',
      'sistema citas salón belleza',
      'app peluquería colombia',
      'agenda estilistas',
      'gestión salon de belleza',
      'programa reservas salón',
      'software belleza colombia',
      'agenda online peluquería colombia',
      'recordatorios whatsapp salón',
      'reservas online salón belleza',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/salones',
    faqItems: [
      {
        question: '¿Puedo manejar la agenda de varios estilistas al mismo tiempo?',
        answer:
          'Sí. Gestabiz permite crear perfiles individuales para cada estilista de tu salón. Cada uno tiene su propia agenda, sus propios servicios y sus propios horarios de atención. Tú como administradora ves todo desde un panel unificado y puedes asignar o mover citas entre estilistas fácilmente.',
      },
      {
        question: '¿El sistema guarda el historial de coloraciones y tratamientos de cada cliente?',
        answer:
          'Cada cliente tiene un perfil con su historial completo de visitas. Puedes ver qué servicios le han hecho, en qué fecha, con qué estilista y agregar notas sobre fórmulas de color, alergias o preferencias especiales.',
      },
      {
        question: '¿Cómo funcionan los recordatorios por WhatsApp?',
        answer:
          'El sistema envía mensajes automáticos al número de WhatsApp de cada cliente: uno 24 horas antes de la cita y otro 1 hora antes. El cliente puede confirmar o cancelar desde el mismo mensaje.',
      },
      {
        question: '¿Puedo saber cuánto está generando cada estilista por semana o mes?',
        answer:
          'Sí. El módulo de reportes de Gestabiz te muestra los ingresos desglosados por estilista, por servicio y por período. Puedes ver quién genera más y comparar el rendimiento entre profesionales.',
      },
      {
        question: '¿Los clientes pueden reservar sin tener que llamar al salón?',
        answer:
          'Tu salón tiene un perfil público en Gestabiz donde tus clientes pueden ver los servicios disponibles, los estilistas, los horarios y hacer su reserva directamente. Esto funciona las 24 horas, incluso cuando el salón está cerrado.',
      },
    ],
  },

  barberias: {
    slug: 'barberias',
    metaTitle: 'Sistema de Turnos para Barberías | Gestabiz Colombia',
    metaDescription:
      'Software para barberías en Colombia. Turnos online sin espera, agenda por barbero, cobros integrados y perfil público en Google. Empieza gratis hoy.',
    metaKeywords: [
      'software barbería colombia',
      'sistema turnos barbería',
      'app barber shop colombia',
      'agenda barbería online',
      'turnos online barbería colombia',
      'programa gestión barbería',
      'reservas online barbería',
      'gestión cobros barbería',
      'software barber shop',
      'agenda digital barbero',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/barberias',
    faqItems: [
      {
        question: '¿Mis clientes tienen que descargarse una app para sacar turno?',
        answer:
          'No. Tus clientes reservan directamente desde el navegador de su celular, sin instalar nada. Entran al perfil de tu barbería, eligen el barbero, el servicio y el horario, y listo.',
      },
      {
        question: '¿Puedo configurar horarios diferentes para cada barbero?',
        answer:
          'Sí. Cada barbero en Gestabiz tiene su propio perfil con su horario de trabajo, los servicios que ofrece y su hora de almuerzo. El sistema solo muestra los horarios reales disponibles.',
      },
      {
        question: '¿Funciona si tengo varias sedes de mi barbería?',
        answer:
          'Gestabiz soporta múltiples sedes bajo un mismo negocio. Puedes ver la agenda de todas tus barberías desde un solo panel, con estadísticas separadas por sede.',
      },
      {
        question: '¿Puedo ver cuánto generó cada barbero en el mes?',
        answer:
          'Sí. El módulo de reportes muestra los ingresos de cada barbero por período. También ves el número de cortes realizados, los servicios más solicitados y comparas el rendimiento entre profesionales.',
      },
      {
        question: '¿Qué pasa si un cliente no muestra para su cita?',
        answer:
          'Gestabiz envía recordatorios automáticos por WhatsApp para reducir los no-shows. El historial de asistencia de cada cliente queda registrado para que puedas tomar decisiones sobre clientes con historial de inasistencias.',
      },
    ],
  },

  clinicas: {
    slug: 'clinicas',
    metaTitle: 'Software para Clínicas Médicas en Colombia | Gestabiz',
    metaDescription:
      'Sistema de citas para clínicas en Colombia. Agenda por médico, recordatorios automáticos, control de consultorios y reportes de atención. Solicita una demo.',
    metaKeywords: [
      'software clínica colombia',
      'sistema citas médicas colombia',
      'agenda médica online colombia',
      'software consultorio médico',
      'sistema turnos médicos colombia',
      'programa citas clínica',
      'agenda médicos especialistas',
      'software gestión clínica colombia',
      'recordatorios citas médicas',
      'reservas online consultorio',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/clinicas',
    faqItems: [
      {
        question: '¿Puedo manejar varias especialidades médicas con el mismo sistema?',
        answer:
          'Sí. Gestabiz permite configurar cada médico con su especialidad, la duración de sus consultas y sus horarios específicos. Puedes tener medicina general, pediatría, ginecología y cualquier otra especialidad funcionando en paralelo.',
      },
      {
        question: '¿Cómo se gestionan los consultorios cuando hay varios médicos?',
        answer:
          'Cada consultorio se configura como un recurso físico. Cuando se asigna una cita, ese espacio queda bloqueado automáticamente para ese horario. El sistema evita solapamientos y te alerta si hay conflictos.',
      },
      {
        question: '¿Los pacientes pueden ver la disponibilidad y reservar en línea?',
        answer:
          'Sí. Tu clínica tiene un perfil público donde los pacientes pueden ver los médicos disponibles, las especialidades, los horarios y hacer su reserva directamente.',
      },
      {
        question: '¿Es posible registrar notas o indicaciones para cada consulta?',
        answer:
          'El sistema guarda el historial de visitas de cada paciente incluyendo el médico que lo atendió, la fecha y notas adicionales. Mantiene un registro centralizado de las consultas realizadas.',
      },
      {
        question: '¿Se puede usar Gestabiz en una clínica con varias sedes?',
        answer:
          'Perfectamente. Puedes gestionar múltiples sedes desde un solo panel. Cada sede tiene su propio equipo médico, sus propios consultorios y su propia agenda, con reportes consolidados.',
      },
    ],
  },

  gimnasios: {
    slug: 'gimnasios',
    metaTitle: 'Software para Gimnasios y Fitness en Colombia | Gestabiz',
    metaDescription:
      'Software para gimnasios en Colombia. Reserva de clases con control de cupos, agenda por entrenador, membresías y recordatorios automáticos. Prueba gratis.',
    metaKeywords: [
      'software gimnasio colombia',
      'reserva clases gimnasio',
      'app gimnasio colombia',
      'gestión membresías gym',
      'sistema reservas clases fitness',
      'programa gimnasio colombia',
      'control cupos clases',
      'agenda entrenadores gimnasio',
      'software fitness colombia',
      'gestión gym colombia',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/gimnasios',
    faqItems: [
      {
        question: '¿Puedo configurar diferentes tipos de clase con distintos cupos?',
        answer:
          'Sí. En Gestabiz puedes crear cada tipo de clase con su propio cupo máximo, duración, precio y entrenador asignado. Cuando el cupo se llena, el sistema no permite más reservas.',
      },
      {
        question: '¿Gestabiz maneja membresías mensuales?',
        answer:
          'Puedes registrar las membresías de tus clientes con fecha de inicio, fecha de vencimiento e historial de pagos. El sistema te notifica cuando una membresía está próxima a vencer.',
      },
      {
        question: '¿Los entrenadores pueden ver su propia agenda desde su celular?',
        answer:
          'Sí. Cada entrenador tiene acceso a su perfil con su agenda del día y de la semana. Puede ver sus clases grupales y sesiones personales, y recibir notificaciones de nuevas reservas.',
      },
      {
        question: '¿Funciona si tengo varias sedes del gimnasio?',
        answer:
          'Gestabiz soporta múltiples sedes bajo el mismo negocio. Puedes ver los reportes consolidados de todas las sedes o por separado desde el mismo panel de administración.',
      },
      {
        question: '¿Puedo dar de baja a clientes con membresías vencidas?',
        answer:
          'El sistema registra el estado de las membresías y te alerta sobre vencimientos. Puedes marcar manualmente un cliente como inactivo si no ha renovado su membresía.',
      },
    ],
  },

  spas: {
    slug: 'spas',
    metaTitle: 'Software para Spa y Centro de Estética | Colombia Gestabiz',
    metaDescription:
      'Gestión para spas y centros de estética en Colombia. Agenda de terapeutas, control de cabinas, reservas online y recordatorios automáticos. Prueba gratis.',
    metaKeywords: [
      'software spa colombia',
      'sistema citas spa',
      'app centro de estética colombia',
      'agenda masajista colombia',
      'software bienestar colombia',
      'gestión spa colombia',
      'reservas online spa',
      'programa centro estético',
      'agenda terapeuta colombia',
      'software salud y belleza colombia',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/spas',
    faqItems: [
      {
        question: '¿Puedo controlar la disponibilidad de las cabinas de tratamiento por separado de los terapeutas?',
        answer:
          'Sí. Gestabiz permite configurar tanto a los terapeutas como a las cabinas como recursos independientes. El sistema verifica que ambos estén disponibles antes de confirmar una cita.',
      },
      {
        question: '¿Los clientes pueden ver la foto y descripción de cada tratamiento?',
        answer:
          'Absolutamente. Cada servicio puede tener nombre, descripción detallada, duración, precio e imagen. Tus clientes llegan al proceso de reserva completamente informados.',
      },
      {
        question: '¿Se puede registrar información sensible del cliente como alergias?',
        answer:
          'Sí. Cada perfil de cliente incluye un campo de notas donde puedes registrar alergias, condiciones de salud relevantes o productos que no debe recibir. Esta información es visible para el terapeuta antes de la sesión.',
      },
      {
        question: '¿Es posible crear paquetes de múltiples sesiones?',
        answer:
          'Puedes registrar los paquetes vendidos como notas en el perfil del cliente con el número de sesiones incluidas y las usadas. Para control automatizado, puedes gestionar pagos a través del módulo de ventas rápidas.',
      },
      {
        question: '¿Gestabiz funciona para un spa con varias sedes?',
        answer:
          'Sí. Puedes gestionar múltiples sedes desde un panel central. Cada sede tiene sus propios terapeutas, cabinas, servicios y horarios, con reportes consolidados o por sede.',
      },
    ],
  },

  odontologos: {
    slug: 'odontologos',
    metaTitle: 'Software para Odontología en Colombia | Gestabiz',
    metaDescription:
      'Sistema de citas para odontólogos en Colombia. Agenda dental online, control de unidades, recordatorios automáticos e historial de pacientes. Demo gratuita.',
    metaKeywords: [
      'software odontología colombia',
      'sistema citas dentales colombia',
      'agenda dental online colombia',
      'app odontólogo colombia',
      'programa consultorio dental',
      'software gestión odontológica',
      'sistema turnos dentista colombia',
      'recordatorios citas dentista',
      'reservas online odontólogo',
      'agenda odontológica digital',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/odontologos',
    faqItems: [
      {
        question: '¿Puedo controlar la disponibilidad de cada sillón odontológico por separado?',
        answer:
          'Sí. Cada unidad odontológica se configura como un recurso físico independiente. El sistema verifica que la unidad esté libre antes de confirmar una cita, evitando solapamientos.',
      },
      {
        question: '¿El sistema puede recordarle a los pacientes que deben volver en 6 meses?',
        answer:
          'Puedes configurar recordatorios programados para que el sistema contacte automáticamente a los pacientes en la fecha de su próximo control periódico.',
      },
      {
        question: '¿Puedo tener varios odontólogos con especialidades diferentes?',
        answer:
          'Perfectamente. Cada odontólogo tiene su perfil con su especialidad, horario específico y tarifas. Los pacientes pueden elegir al especialista que necesitan al momento de reservar.',
      },
      {
        question: '¿Gestabiz reemplaza al software de historia clínica odontológica?',
        answer:
          'No. Gestabiz está especializado en gestión de agenda, reservas y coordinación del consultorio. Es complementario a tu software de historia clínica si tienes uno.',
      },
      {
        question: '¿Cómo saben los nuevos pacientes que pueden reservar online?',
        answer:
          'Tu consultorio tiene una URL pública que puedes compartir en Instagram, WhatsApp de negocio, tarjeta de presentación o Google My Business.',
      },
    ],
  },

  psicologos: {
    slug: 'psicologos',
    metaTitle: 'Software para Psicólogos en Colombia | Gestabiz',
    metaDescription:
      'Agenda digital para psicólogos en Colombia. Reservas online, recordatorios automáticos, historial de sesiones y perfil profesional. Empieza gratis.',
    metaKeywords: [
      'software psicólogos colombia',
      'agenda psicología online colombia',
      'sistema citas psicología',
      'app consultorio psicológico colombia',
      'programa psicólogo colombia',
      'gestión citas salud mental',
      'agenda terapeuta colombia',
      'reservas online psicólogo',
      'software psicoterapia colombia',
      'sistema turnos psicología colombia',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/psicologos',
    faqItems: [
      {
        question: '¿Puedo ofrecer sesiones presenciales y virtuales en la misma agenda?',
        answer:
          'Sí. Puedes crear distintos tipos de sesión: presencial y virtual. Los pacientes eligen el formato al reservar y el sistema gestiona ambas modalidades en la misma agenda.',
      },
      {
        question: '¿Los pacientes pueden ver mi disponibilidad en tiempo real?',
        answer:
          'Tu perfil público muestra los horarios reales disponibles. Cuando un horario se reserva, desaparece automáticamente de la vista del paciente. No hay riesgo de dobles reservas.',
      },
      {
        question: '¿Puedo establecer una política de cancelación con tiempo mínimo de aviso?',
        answer:
          'Puedes configurar un tiempo mínimo de anticipación para reservas y cancelaciones. El sistema aplica estas restricciones automáticamente.',
      },
      {
        question: '¿Mis pacientes saben que sus datos están seguros en Gestabiz?',
        answer:
          'Gestabiz utiliza infraestructura AWS con encriptación en tránsito y en reposo. Los datos de tus pacientes no son compartidos con terceros y tienes control total sobre los accesos.',
      },
      {
        question: '¿Es útil Gestabiz si soy psicólogo independiente sin empleados?',
        answer:
          'Absolutamente. Gestabiz está diseñado tanto para profesionales independientes como para centros con equipos. Como psicólogo solo, úsalo para gestionar tu agenda, publicar tu perfil y enviar recordatorios automáticos.',
      },
    ],
  },

  fisioterapeutas: {
    slug: 'fisioterapeutas',
    metaTitle: 'Software para Fisioterapeutas en Colombia | Gestabiz',
    metaDescription:
      'Sistema de citas para centros de fisioterapia en Colombia. Agenda por fisioterapeuta, control de camillas, recordatorios y seguimiento de pacientes. Prueba gratis.',
    metaKeywords: [
      'software fisioterapia colombia',
      'agenda fisioterapeuta online colombia',
      'sistema citas fisioterapia',
      'app fisioterapeuta colombia',
      'programa centro fisioterapia',
      'gestión citas rehabilitación',
      'software terapia física colombia',
      'control camillas fisioterapia',
      'reservas online fisioterapeuta',
      'agenda rehabilitación física colombia',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/fisioterapeutas',
    faqItems: [
      {
        question: '¿Puedo configurar planes de múltiples sesiones para cada paciente?',
        answer:
          'Sí. Puedes registrar el número total de sesiones del plan de rehabilitación de cada paciente y las completadas. Te da visibilidad sobre el progreso de cada paciente.',
      },
      {
        question: '¿El sistema controla la disponibilidad de las camillas y los equipos?',
        answer:
          'Cada camilla o equipo de rehabilitación se configura como un recurso independiente. El sistema verifica que esté disponible antes de confirmar la cita.',
      },
      {
        question: '¿Puedo diferenciar entre fisioterapia deportiva, neurológica y otras especialidades?',
        answer:
          'Sí. Cada servicio tiene nombre, descripción y duración propios. Puedes crear tipos de sesión separados para cada especialidad con su propio precio.',
      },
      {
        question: '¿Cómo se maneja la asignación de pacientes a fisioterapeutas específicos?',
        answer:
          'Cuando un paciente reserva, puede elegir un fisioterapeuta específico del equipo. Para continuidad del tratamiento, los pacientes pueden solicitar siempre el mismo profesional.',
      },
      {
        question: '¿Funciona Gestabiz para un fisioterapeuta independiente que trabaja a domicilio?',
        answer:
          'Sí. Si ofreces servicios a domicilio, puedes configurar tu perfil sin una sede física fija y gestionar tu agenda de visitas exactamente igual.',
      },
    ],
  },

  entrenadores: {
    slug: 'entrenadores',
    metaTitle: 'App para Entrenadores Personales en Colombia | Gestabiz',
    metaDescription:
      'Software para entrenadores personales en Colombia. Agenda de sesiones, perfil profesional, reservas online y recordatorios automáticos. Empieza gratis hoy.',
    metaKeywords: [
      'software entrenador personal colombia',
      'app personal trainer colombia',
      'sistema citas fitness',
      'agenda entrenador personal colombia',
      'programa personal trainer',
      'gestión clientes fitness colombia',
      'reservas sesiones entrenamiento',
      'perfil entrenador personal online',
      'app coach fitness colombia',
      'software coaching deportivo colombia',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/entrenadores',
    faqItems: [
      {
        question: '¿Gestabiz funciona para un entrenador que trabaja de forma independiente?',
        answer:
          'Está hecho exactamente para eso. Como entrenador independiente puedes crear tu perfil en minutos, configurar tus servicios, tus horarios y empezar a recibir reservas ese mismo día.',
      },
      {
        question: '¿Puedo ofrecer tanto sesiones presenciales como virtuales?',
        answer:
          'Sí. Puedes crear distintos tipos de sesión: presencial en gym, presencial a domicilio o virtual. Los clientes eligen el formato al reservar y el sistema gestiona ambas modalidades.',
      },
      {
        question: '¿Cómo me ayuda Gestabiz a conseguir clientes nuevos?',
        answer:
          'Tu perfil público aparece en Google cuando alguien busca entrenadores personales en tu ciudad. Tus clientes satisfechos también pueden dejar reseñas que aumentan tu credibilidad.',
      },
      {
        question: '¿Puedo llevar el seguimiento de los planes de entrenamiento de cada cliente?',
        answer:
          'Puedes registrar notas en el perfil de cada cliente con objetivos, progreso y restricciones físicas. También ves el historial completo de sesiones con fechas.',
      },
      {
        question: '¿Es difícil configurar Gestabiz para empezar a usarlo?',
        answer:
          'No. La mayoría de entrenadores en Colombia que usan Gestabiz están activos y recibiendo reservas en menos de 30 minutos desde que se registran.',
      },
    ],
  },

  coworkings: {
    slug: 'coworkings',
    metaTitle: 'Software para Espacios Coworking en Colombia | Gestabiz',
    metaDescription:
      'Sistema de reservas para coworking en Colombia. Gestiona salas de reunión, escritorios y espacios privados con reservas online. Empieza gratis hoy.',
    metaKeywords: [
      'software coworking colombia',
      'reserva sala reunión online colombia',
      'sistema coworking colombia',
      'app coworking bogotá medellín',
      'gestión espacios coworking',
      'programa reservas coworking',
      'sistema membresías coworking',
      'reservas escritorios coworking',
      'plataforma coworking colombia',
      'software gestión espacio compartido',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/para/coworkings',
    faqItems: [
      {
        question: '¿Puedo configurar diferentes tipos de espacios con distintas reglas de reserva?',
        answer:
          'Sí. Puedes crear salas de reunión con reserva por horas, escritorios hot-desk con reserva por día y oficinas privadas con membresía mensual, cada uno con sus propias reglas.',
      },
      {
        question: '¿Pueden reservar personas que no son miembros del coworking?',
        answer:
          'Sí. Tu perfil público permite que cualquier persona, sea miembro o visitante externo, reserve un espacio disponible. Puedes configurar qué espacios son de acceso público.',
      },
      {
        question: '¿Cómo funciona el sistema para controlar el acceso de los miembros?',
        answer:
          'Gestabiz gestiona la parte administrativa: registrar miembros, controlar reservas y hacer seguimiento de membresías. Para control físico de acceso, se complementa con hardware especializado.',
      },
      {
        question: '¿Se pueden configurar límites de tiempo para las reservas?',
        answer:
          'Puedes configurar la duración mínima y máxima de las reservas para cada espacio. El sistema aplica estas restricciones automáticamente cuando alguien intenta reservar.',
      },
      {
        question: '¿Funciona Gestabiz para un coworking con varias sedes en la ciudad?',
        answer:
          'Perfectamente. Puedes gestionar múltiples sedes desde un solo panel con reportes consolidados de toda la operación. Ideal para redes de coworking en expansión en Colombia.',
      },
    ],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escapa caracteres especiales para atributos HTML */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Trunca texto a max caracteres */
function trunc(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

// ─── Meta tag + JSON-LD injection ────────────────────────────────────────────

function buildVerticalMetaHtml(vertical: VerticalSeoData, canonical: string): string {
  const title = esc(trunc(vertical.metaTitle, 60))
  const desc  = esc(trunc(vertical.metaDescription, 160))
  const kw    = esc(vertical.metaKeywords.join(', '))
  const img   = esc(vertical.ogImage)

  // JSON-LD: SoftwareApplication
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Gestabiz',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'COP',
      description: 'Plan gratuito disponible — sin tarjeta de crédito',
    },
    description: vertical.metaDescription,
    keywords: vertical.metaKeywords.join(', '),
    url: `https://gestabiz.com${vertical.canonicalPath}`,
    image: vertical.ogImage,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  }

  // JSON-LD: FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: vertical.faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  const metaTags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta name="keywords" content="${kw}" />`,
    `<meta name="robots" content="index, follow" />`,
    // Open Graph
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Gestabiz" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="es_CO" />`,
    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    // Canonical
    `<link rel="canonical" href="${esc(canonical)}" />`,
    // JSON-LD schemas
    `<script type="application/ld+json">${JSON.stringify(softwareAppSchema)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`,
  ]

  return metaTags.join('\n  ')
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const url      = new URL(req.url)
  // Extract vertical slug from /para/<slug>
  const slug     = url.pathname.replace(/^\/para\//, '').replace(/\/$/, '')
  const vertical = VERTICALS[slug]

  if (!vertical) {
    return Response.redirect(`${url.origin}/`, 302)
  }

  const canonical = `${url.origin}${vertical.canonicalPath}`

  // Fetch the SPA shell — Vercel serves the static dist/index.html
  const indexRes = await fetch(`${url.origin}/index.html`)
  let html       = await indexRes.text()

  const metaHtml = buildVerticalMetaHtml(vertical, canonical)

  // 1. Remove the generic <title>
  html = html.replace(/<title>[^<]*<\/title>/, '')
  // 2. Remove generic description/keywords/robots meta tags
  html = html
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta name="title"[^>]*>/g, '')
    .replace(/<meta name="keywords"[^>]*>/g, '')
    .replace(/<meta name="robots"[^>]*>/g, '')
  // 3. Remove generic og:* and twitter:* meta tags
  html = html
    .replace(/<meta property="og:[^"]*"[^>]*>/g, '')
    .replace(/<meta name="twitter:[^"]*"[^>]*>/g, '')
  // 4. Remove existing canonical and alternate link tags
  html = html
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace(/<link rel="alternate"[^>]*>/g, '')
  // 5. Remove any existing JSON-LD scripts (we inject our own)
  html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '')
  // 6. Inject vertical-specific meta tags and schemas just before </head>
  html = html.replace('</head>', `  ${metaHtml}\n</head>`)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Contenido estático — cache 24h en CDN, revalidación en background hasta 7 días
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  })
}
