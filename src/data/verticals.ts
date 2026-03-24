/**
 * verticals.ts — Datos de landing pages verticales para SEO
 *
 * Cada vertical apunta a un tipo de negocio específico en Colombia.
 * Los contenidos están optimizados para posicionamiento orgánico en Google.
 *
 * Usado por:
 *   - src/pages/VerticalLandingPage.tsx  (renderizado en cliente)
 *   - api/para/[vertical].ts             (inyección de meta tags SSR en Vercel Edge)
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface VerticalFaq {
  question: string
  answer: string
}

export interface VerticalFeature {
  iconName: string   // nombre de icono de lucide-react
  title: string
  description: string
}

export interface VerticalTestimonial {
  name: string
  businessName: string
  city: string
  text: string
  stat: string
  avatarInitial: string
}

export interface VerticalStat {
  value: string
  label: string
}

export interface VerticalData {
  slug: string
  name: string
  namePlural: string
  headline: string         // H1 — incluye keyword principal
  subheadline: string      // 2 frases, menciona beneficios clave
  metaTitle: string        // máx 58 chars — keyword + Colombia + Gestabiz
  metaDescription: string  // máx 158 chars — beneficios + CTA
  metaKeywords: string[]   // 8-12 keywords
  canonicalPath: string
  ogImage: string
  heroIconName: string     // icono lucide-react
  gradientFrom: string     // clase tailwind, ej. 'purple-600'
  gradientTo: string       // clase tailwind, ej. 'blue-600'
  painPoints: string[]     // 4 problemas reales del dueño
  features: VerticalFeature[]    // 6 características relevantes
  stats: VerticalStat[]    // 3 estadísticas impactantes
  testimonial: VerticalTestimonial
  faqItems: VerticalFaq[]  // 5 preguntas frecuentes específicas del vertical
  relatedVerticals: string[]  // 2-3 slugs relacionados
}

// ─── Verticals data ──────────────────────────────────────────────────────────

const salones: VerticalData = {
  slug: 'salones',
  name: 'Salón de Belleza',
  namePlural: 'Salones de Belleza',
  headline: 'El Software que tu Salón de Belleza Necesitaba',
  subheadline:
    'Gestiona la agenda de todos tus estilistas desde un solo lugar y recibe reservas online las 24 horas. Reduce las ausencias con recordatorios automáticos por WhatsApp y conoce exactamente cuánto genera cada profesional.',
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
  canonicalPath: '/para/salones',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Scissors',
  gradientFrom: 'pink-600',
  gradientTo: 'purple-600',
  painPoints: [
    'Mis clientes olvidan las citas y no avisan, perdiendo horas de trabajo pagadas',
    'Manejar la agenda de varios estilistas por WhatsApp es un caos total',
    'No tengo forma de recibir reservas cuando el salón está cerrado o estoy ocupada',
    'No sé exactamente cuánto está generando cada estilista ni qué servicios son más rentables',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Agenda por estilista',
      description:
        'Cada estilista tiene su propia agenda visual. Ve quién está ocupado, quién tiene espacio y asigna citas sin conflictos en segundos.',
    },
    {
      iconName: 'MessageSquare',
      title: 'Recordatorios automáticos por WhatsApp',
      description:
        'El sistema envía recordatorios 24 horas y 1 hora antes de cada cita. Tus clientes confirman o cancelan, y tú evitas ausencias sin avisar.',
    },
    {
      iconName: 'Globe',
      title: 'Reservas online 24/7',
      description:
        'Tus clientes reservan desde tu perfil público en cualquier momento, incluso cuando el salón está cerrado. Sin llamadas, sin WhatsApps manuales.',
    },
    {
      iconName: 'Users',
      title: 'Historial de cliente con coloraciones',
      description:
        'Guarda el historial completo de cada cliente: productos usados, fórmulas de color, servicios anteriores y preferencias. Nada se pierde.',
    },
    {
      iconName: 'BarChart3',
      title: 'Reportes de ingresos por estilista',
      description:
        'Sabe cuánto genera cada profesional, qué servicios son los más solicitados y cuáles horas tienen mayor demanda. Toma decisiones con datos reales.',
    },
    {
      iconName: 'Clock',
      title: 'Lista de espera digital',
      description:
        'Cuando un horario se llena, los clientes entran a lista de espera automática. Si alguien cancela, el sistema notifica al siguiente en la fila.',
    },
  ],
  stats: [
    { value: '70%', label: 'menos ausencias con recordatorios automáticos' },
    { value: '3h', label: 'ahorradas por día en coordinación de agenda' },
    { value: '+40%', label: 'más reservas gracias al perfil online 24/7' },
  ],
  testimonial: {
    name: 'Valentina García',
    businessName: 'Studio V Beauty',
    city: 'Medellín',
    text: 'Antes perdía entre 4 y 5 citas a la semana porque la gente simplemente no aparecía. Con Gestabiz mis clientes reciben el recordatorio por WhatsApp y el no-show bajó a casi cero. Ahora también tengo reservas de madrugada que llegan solas mientras duermo.',
    stat: 'Redujo los no-shows en un 72% en el primer mes',
    avatarInitial: 'V',
  },
  faqItems: [
    {
      question: '¿Puedo manejar la agenda de varios estilistas al mismo tiempo?',
      answer:
        'Sí. Gestabiz permite crear perfiles individuales para cada estilista de tu salón. Cada uno tiene su propia agenda, sus propios servicios y sus propios horarios de atención. Tú como administradora ves todo desde un panel unificado y puedes asignar o mover citas entre estilistas fácilmente.',
    },
    {
      question: '¿El sistema guarda el historial de coloraciones y tratamientos de cada cliente?',
      answer:
        'Absolutamente. Cada cliente tiene un perfil con su historial completo de visitas. Puedes ver qué servicios le han hecho, en qué fecha, con qué estilista y agregar notas sobre fórmulas de color, alergias o preferencias especiales. Esta información queda guardada para siempre y es visible antes de cada cita.',
    },
    {
      question: '¿Cómo funcionan los recordatorios por WhatsApp?',
      answer:
        'El sistema envía mensajes automáticos al número de WhatsApp de cada cliente: uno 24 horas antes de la cita y otro 1 hora antes. El cliente puede confirmar o cancelar desde el mismo mensaje. Si cancela, el horario queda libre automáticamente y puedes ofrecérselo a otro cliente.',
    },
    {
      question: '¿Puedo saber cuánto está generando cada estilista por semana o mes?',
      answer:
        'Sí. El módulo de reportes de Gestabiz te muestra los ingresos desglosados por estilista, por servicio y por período. Puedes ver quién genera más, qué servicios tienen mayor demanda y comparar el rendimiento entre profesionales. Toda la información está disponible en tiempo real.',
    },
    {
      question: '¿Los clientes pueden reservar sin tener que llamar al salón?',
      answer:
        'Exacto. Tu salón tiene un perfil público en Gestabiz donde tus clientes pueden ver los servicios disponibles, los estilistas, los horarios y hacer su reserva directamente. Esto funciona las 24 horas, incluso cuando el salón está cerrado. Recibes la notificación al instante en tu teléfono.',
    },
  ],
  relatedVerticals: ['barberias', 'spas', 'entrenadores'],
}

const barberias: VerticalData = {
  slug: 'barberias',
  name: 'Barbería',
  namePlural: 'Barberías',
  headline: 'Gestiona tu Barbería sin Caos ni Papeles',
  subheadline:
    'Elimina las filas de espera y el desorden de los turnos por WhatsApp con una agenda digital que tus clientes pueden usar desde el celular. Cada barbero con su propia agenda, cobros integrados y estadísticas en tiempo real.',
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
  canonicalPath: '/para/barberias',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Scissors',
  gradientFrom: 'slate-700',
  gradientTo: 'amber-600',
  painPoints: [
    'Mis clientes llegan sin cita y se forman en silla esperando mucho tiempo, lo que genera mal ambiente',
    'La coordinación de turnos por WhatsApp es un caos: mensajes perdidos, dobles citas y malentendidos',
    'No sé en tiempo real qué barbero tiene espacio libre y cuál tiene la agenda llena',
    'Los cobros son informales y al final del día no sé exactamente cuánto entró ni qué servicios se hicieron',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Turnos sin espera',
      description:
        'Tus clientes reservan su turno online y llegan a la hora exacta. Adiós a las sillas llenas de gente esperando. Tu barbería funciona con precisión de reloj.',
    },
    {
      iconName: 'Users',
      title: 'Agenda por barbero',
      description:
        'Cada barbero tiene su propio calendario. Los clientes eligen con quién quieren cortarse y ven la disponibilidad en tiempo real sin necesitar llamar.',
    },
    {
      iconName: 'CreditCard',
      title: 'Cobros integrados',
      description:
        'Registra cada servicio cobrado directamente en el sistema. Lleva el control de ingresos por barbero y por servicio sin planillas ni hojas de Excel.',
    },
    {
      iconName: 'Clock',
      title: 'Lista de espera digital',
      description:
        'Si todos los barberos están ocupados, el cliente entra a la lista de espera. Cuando se libera un espacio, recibe una notificación automática.',
    },
    {
      iconName: 'BarChart3',
      title: 'Estadísticas por barbero',
      description:
        'Ve cuántos cortes hace cada barbero, cuánto genera y cuáles son los servicios más solicitados. Datos reales para premiar a tus mejores empleados.',
    },
    {
      iconName: 'Globe',
      title: 'Perfil público en Google',
      description:
        'Tu barbería aparece en búsquedas de Google con tu dirección, servicios, fotos y botón de reserva directa. Atrae clientes nuevos sin pagar publicidad.',
    },
  ],
  stats: [
    { value: '0min', label: 'de espera para clientes con reserva previa' },
    { value: '85%', label: 'de clientes prefieren reservar online vs llamar' },
    { value: '+35%', label: 'de nuevos clientes llegan por el perfil en Google' },
  ],
  testimonial: {
    name: 'Sebastián Mora',
    businessName: 'The Barber Room',
    city: 'Bogotá',
    text: 'Antes mi local parecía una sala de espera desordenada. Desde que implementamos Gestabiz, cada cliente llega a su hora, sabe con qué barbero tiene cita y no hay confusiones. Mis barberos trabajan más tranquilos y los clientes quedan más satisfechos.',
    stat: 'Aumentó la satisfacción de clientes y redujo conflictos de agenda en 90%',
    avatarInitial: 'S',
  },
  faqItems: [
    {
      question: '¿Mis clientes tienen que descargarse una app para sacar turno?',
      answer:
        'No. Tus clientes reservan directamente desde el navegador de su celular, sin instalar nada. Entran al perfil de tu barbería, eligen el barbero, el servicio y el horario, y listo. También pueden recibir el recordatorio por WhatsApp sin necesitar ninguna aplicación adicional.',
    },
    {
      question: '¿Puedo configurar horarios diferentes para cada barbero?',
      answer:
        'Sí. Cada barbero en Gestabiz tiene su propio perfil con su horario de trabajo, los servicios que ofrece y su hora de almuerzo. Si un barbero trabaja de martes a domingo y otro de lunes a sábado, el sistema lo refleja automáticamente y solo muestra los horarios reales disponibles.',
    },
    {
      question: '¿Funciona si tengo varias sedes de mi barbería?',
      answer:
        'Perfectamente. Gestabiz soporta múltiples sedes bajo un mismo negocio. Puedes ver la agenda de todas tus barberías desde un solo panel, con estadísticas separadas por sede. Ideal si tienes 2 o más locales en diferentes zonas de la ciudad.',
    },
    {
      question: '¿Puedo ver cuánto generó cada barbero en el mes?',
      answer:
        'Sí. El módulo de reportes muestra los ingresos de cada barbero por período: semana, mes o rango personalizado. También ves el número de cortes realizados, los servicios más solicitados y puedes comparar el rendimiento entre profesionales fácilmente.',
    },
    {
      question: '¿Qué pasa si un cliente no muestra para su cita?',
      answer:
        'Gestabiz envía recordatorios automáticos por WhatsApp para reducir los no-shows. Si el cliente igualmente no aparece, puedes marcarlo como ausencia en el sistema. El historial de asistencia de cada cliente queda registrado y puedes tomar decisiones sobre clientes con historial de inasistencias repetidas.',
    },
  ],
  relatedVerticals: ['salones', 'spas', 'entrenadores'],
}

const clinicas: VerticalData = {
  slug: 'clinicas',
  name: 'Clínica Médica',
  namePlural: 'Clínicas Médicas',
  headline: 'La Agenda Médica Digital que Transforma tu Clínica',
  subheadline:
    'Centraliza la agenda de todos tus médicos y especialistas en un sistema inteligente que envía recordatorios automáticos a los pacientes. Elimina los no-shows, reduce las llamadas entrantes y ten el control total de tus consultorios.',
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
  canonicalPath: '/para/clinicas',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Stethoscope',
  gradientFrom: 'blue-600',
  gradientTo: 'cyan-500',
  painPoints: [
    'La agenda médica se lleva en papel o en hojas de Excel y el equipo de recepción comete errores constantemente',
    'Los pacientes llaman para cancelar o a última hora, dejando consultorios vacíos y tiempo perdido',
    'Los no-shows son frecuentes porque los pacientes olvidan su cita sin que nadie les recuerde',
    'Con varios médicos y especialidades es muy difícil saber qué consultorio está libre y cuándo',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Agenda por médico y especialidad',
      description:
        'Cada médico tiene su propia agenda configurada con su especialidad, duración de consulta y horarios de atención. El equipo de recepción asigna citas sin errores ni cruces.',
    },
    {
      iconName: 'Bell',
      title: 'Recordatorios automáticos a pacientes',
      description:
        'El sistema contacta a cada paciente por WhatsApp o email antes de su cita. El paciente confirma o cancela, y el consultorio queda libre automáticamente si no puede asistir.',
    },
    {
      iconName: 'FileText',
      title: 'Historial de paciente',
      description:
        'Registra las visitas de cada paciente, los médicos que lo atendieron y las fechas de consulta. Un perfil centralizado que todos los médicos autorizados pueden consultar.',
    },
    {
      iconName: 'MapPin',
      title: 'Control de consultorios',
      description:
        'Gestiona la disponibilidad de cada consultorio como un recurso independiente. Evita que dos médicos queden asignados al mismo espacio físico al mismo tiempo.',
    },
    {
      iconName: 'BarChart3',
      title: 'Reportes de atención',
      description:
        'Sabe cuántas consultas realiza cada médico, cuál es la tasa de no-shows por especialidad y qué días tienen mayor demanda. Optimiza tu operación con datos reales.',
    },
    {
      iconName: 'Smartphone',
      title: 'Integración con Google Calendar',
      description:
        'Sincroniza las citas de la clínica con el Google Calendar de cada médico. Todos reciben notificaciones y ven su agenda actualizada en el dispositivo que prefieran.',
    },
  ],
  stats: [
    { value: '60%', label: 'de reducción en llamadas de confirmación manual' },
    { value: '50%', label: 'menos no-shows con recordatorios automáticos' },
    { value: '2x', label: 'más capacidad de atención con agenda optimizada' },
  ],
  testimonial: {
    name: 'Dr. Andrés Ospina',
    businessName: 'Centro Médico Integral Ospina',
    city: 'Cali',
    text: 'Teníamos 3 especialistas y una recepcionista manejando todo en un cuaderno. Era caótico. Con Gestabiz cada médico ve su agenda en su celular, los pacientes reciben recordatorio y las cancelaciones se procesan solas. Nuestra recepcionista ahora puede dedicarse a atender bien a quienes llegan.',
    stat: 'Redujo los no-shows en un 55% y liberó 4 horas diarias de recepción',
    avatarInitial: 'A',
  },
  faqItems: [
    {
      question: '¿Puedo manejar varias especialidades médicas con el mismo sistema?',
      answer:
        'Sí. Gestabiz permite configurar cada médico con su especialidad, la duración de sus consultas y sus horarios específicos. Puedes tener medicina general, pediatría, ginecología y cualquier otra especialidad funcionando en paralelo desde el mismo panel de administración.',
    },
    {
      question: '¿Cómo se gestionan los consultorios cuando hay varios médicos?',
      answer:
        'Cada consultorio se configura como un recurso físico en el sistema. Cuando se asigna una cita a un médico en un consultorio, ese espacio queda bloqueado automáticamente para ese horario. El sistema evita solapamientos y te alerta si intentas asignar el mismo consultorio dos veces a la misma hora.',
    },
    {
      question: '¿Los pacientes pueden ver la disponibilidad y reservar en línea?',
      answer:
        'Sí. Tu clínica tiene un perfil público donde los pacientes pueden ver los médicos disponibles, las especialidades, los horarios y hacer su reserva directamente. Si prefieres que las citas solo se asignen internamente por recepción, también puedes desactivar la reserva pública.',
    },
    {
      question: '¿Es posible registrar notas o indicaciones para cada consulta?',
      answer:
        'El sistema guarda el historial de visitas de cada paciente incluyendo el médico que lo atendió, la fecha y notas adicionales que el equipo quiera agregar. No reemplaza a un sistema de historia clínica electrónica completa, pero sí mantiene un registro centralizado de las consultas realizadas.',
    },
    {
      question: '¿Se puede usar Gestabiz en una clínica con varias sedes?',
      answer:
        'Perfectamente. Puedes gestionar múltiples sedes de tu clínica desde un solo panel. Cada sede tiene su propio equipo médico, sus propios consultorios y su propia agenda, pero tú tienes visibilidad y reportes consolidados de toda la operación.',
    },
  ],
  relatedVerticals: ['odontologos', 'psicologos', 'fisioterapeutas'],
}

const gimnasios: VerticalData = {
  slug: 'gimnasios',
  name: 'Gimnasio',
  namePlural: 'Gimnasios y Centros Fitness',
  headline: 'Gestiona tu Gimnasio y Reserva de Clases sin Complicaciones',
  subheadline:
    'Controla los cupos de tus clases, la agenda de tus entrenadores y las membresías de tus clientes desde un solo sistema. Recibe reservas online y reduce el caos en recepción con recordatorios automáticos.',
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
  canonicalPath: '/para/gimnasios',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Dumbbell',
  gradientFrom: 'orange-600',
  gradientTo: 'red-600',
  painPoints: [
    'Mis clases grupales se llenan sin control real de cupos y la gente llega sin saber si hay espacio',
    'Cobrar las membresías manualmente es desgastante y siempre hay clientes que se atrasan en el pago',
    'Los entrenadores no tienen una agenda clara de sus sesiones personales y hay confusiones de horario',
    'Los clientes inactivos no vuelven porque nadie les recuerda que están perdiendo su membresía',
  ],
  features: [
    {
      iconName: 'Users',
      title: 'Reserva de clases con control de cupos',
      description:
        'Cada clase tiene un límite de cupos configurable. Los clientes reservan en línea y cuando se llena, el sistema cierra el registro automáticamente. Sin sorpresas ni sobrecupos.',
    },
    {
      iconName: 'Calendar',
      title: 'Agenda por entrenador',
      description:
        'Cada entrenador personal tiene su propia agenda de sesiones individuales. Los clientes eligen el entrenador y el horario sin necesitar llamar ni escribir por WhatsApp.',
    },
    {
      iconName: 'CreditCard',
      title: 'Control de membresías',
      description:
        'Registra las membresías activas, las fechas de vencimiento y el historial de pagos de cada cliente. El sistema te alerta cuando una membresía está próxima a vencer.',
    },
    {
      iconName: 'Bell',
      title: 'Recordatorios de clases',
      description:
        'Tus clientes reciben recordatorios automáticos por WhatsApp antes de cada clase o sesión. Reduce las ausencias y aumenta la asistencia sin hacer llamadas manuales.',
    },
    {
      iconName: 'BarChart3',
      title: 'Reportes de asistencia',
      description:
        'Ve qué clases tienen mayor demanda, qué entrenadores son más solicitados y cuáles horarios están siempre llenos. Optimiza tu oferta con datos reales de tu gimnasio.',
    },
    {
      iconName: 'Smartphone',
      title: 'App móvil para tus clientes',
      description:
        'Tus clientes gestionan sus reservas, ven sus clases pendientes y reciben notificaciones directamente desde el perfil web de tu gimnasio en su celular, sin instalar nada.',
    },
  ],
  stats: [
    { value: '95%', label: 'de ocupación en clases con reserva previa obligatoria' },
    { value: '40%', label: 'menos trabajo manual en recepción' },
    { value: '+25%', label: 'de retención de clientes con recordatorios activos' },
  ],
  testimonial: {
    name: 'Carolina Ríos',
    businessName: 'FitZone Gym',
    city: 'Barranquilla',
    text: 'Antes mis clases de spinning eran un caos: llegaban 20 personas para 15 bicicletas y alguien siempre se molestaba. Ahora todos reservan con anticipación, saben si hay cupo y llegan puntual. Además dejé de perseguir a los morosos porque el sistema me avisa quién está próximo a vencer.',
    stat: 'Eliminó los conflictos de sobrecupo y mejoró la puntualidad de asistencia en 80%',
    avatarInitial: 'C',
  },
  faqItems: [
    {
      question: '¿Puedo configurar diferentes tipos de clase con distintos cupos?',
      answer:
        'Sí. En Gestabiz puedes crear cada tipo de clase (spinning, yoga, crossfit, zumba, etc.) con su propio cupo máximo, duración, precio y entrenador asignado. Cuando el cupo se llena, el sistema no permite más reservas y ofrece la opción de lista de espera.',
    },
    {
      question: '¿Gestabiz maneja membresías mensuales y planes de entrenamiento?',
      answer:
        'Puedes registrar las membresías de tus clientes con fecha de inicio, fecha de vencimiento e historial de pagos. El sistema te notifica cuando una membresía está próxima a vencer para que puedas contactar al cliente. Para planes de entrenamiento individualizados, puedes usar las notas del perfil del cliente.',
    },
    {
      question: '¿Los entrenadores pueden ver su propia agenda desde su celular?',
      answer:
        'Sí. Cada entrenador tiene acceso a su perfil con su agenda del día y de la semana. Puede ver sus clases grupales y sus sesiones personales, recibir notificaciones de nuevas reservas y marcar asistencias directamente desde su teléfono sin necesitar ir a recepción.',
    },
    {
      question: '¿Funciona si tengo varias sedes del gimnasio?',
      answer:
        'Perfectamente. Gestabiz soporta múltiples sedes bajo el mismo negocio. Puedes configurar cada sede con sus propias clases, entrenadores y horarios, y ver los reportes consolidados de todas las sedes o por separado desde el mismo panel de administración.',
    },
    {
      question: '¿Puedo dar de baja a clientes con membresías vencidas automáticamente?',
      answer:
        'El sistema registra el estado de las membresías y te alerta sobre vencimientos, pero la decisión de restringir el acceso la tomas tú. Puedes marcar manualmente un cliente como inactivo si no ha renovado. Para control de acceso físico con torniquetes, Gestabiz se puede complementar con hardware especializado.',
    },
  ],
  relatedVerticals: ['entrenadores', 'spas', 'clinicas'],
}

const spas: VerticalData = {
  slug: 'spas',
  name: 'Spa y Centro de Estética',
  namePlural: 'Spas y Centros de Estética',
  headline: 'Software para Spa que Eleva la Experiencia de tus Clientes',
  subheadline:
    'Gestiona la agenda de tus terapeutas y cabinas de tratamiento con un sistema elegante y profesional. Recibe reservas online, confirma automáticamente y ofrece la experiencia premium que tus clientes merecen desde el primer contacto.',
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
  canonicalPath: '/para/spas',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Sparkles',
  gradientFrom: 'teal-600',
  gradientTo: 'emerald-500',
  painPoints: [
    'La coordinación entre terapeutas y cabinas de tratamiento me genera conflictos de dobles reservas constantemente',
    'Los clientes llaman para saber disponibilidad y eso interrumpe todo el tiempo a mi recepcionista',
    'No puedo ofrecer una experiencia premium cuando el proceso de reserva es tan informal',
    'No sé cuáles tratamientos generan más ingresos ni cuáles terapeutas tienen la agenda más llena',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Agenda de terapeutas y cabinas',
      description:
        'Gestiona simultáneamente la disponibilidad de tus terapeutas y tus cabinas de tratamiento. El sistema evita dobles reservas y mantiene todo sincronizado automáticamente.',
    },
    {
      iconName: 'Globe',
      title: 'Reservas online premium',
      description:
        'Tu spa tiene un perfil público elegante donde los clientes pueden explorar servicios, ver precios y reservar en línea. Una experiencia de reserva que refleja la calidad de tu spa.',
    },
    {
      iconName: 'MessageSquare',
      title: 'Confirmaciones por WhatsApp',
      description:
        'Envía confirmaciones y recordatorios de cita automáticos por WhatsApp. Tus clientes sienten un servicio personalizado y de alta calidad desde el primer mensaje.',
    },
    {
      iconName: 'Users',
      title: 'Historial VIP del cliente',
      description:
        'Registra las preferencias de cada cliente, sus tratamientos favoritos, posibles alergias o restricciones. El terapeuta llega preparado a cada sesión sin necesitar preguntar.',
    },
    {
      iconName: 'BarChart3',
      title: 'Reportes de tratamientos rentables',
      description:
        'Descubre cuáles tratamientos generan más ingresos, qué terapeutas tienen mayor demanda y en qué días y horarios tu spa está más ocupado.',
    },
    {
      iconName: 'Shield',
      title: 'Gestión de paquetes y abonos',
      description:
        'Registra paquetes de sesiones prepagadas para tus clientes frecuentes. Controla cuántas sesiones han usado y cuántas les quedan con total transparencia.',
    },
  ],
  stats: [
    { value: '65%', label: 'menos tiempo en gestión de agenda por recepción' },
    { value: '4.8★', label: 'valoración promedio de clientes con reserva online' },
    { value: '+50%', label: 'de clientes nuevos desde el perfil público' },
  ],
  testimonial: {
    name: 'Mariana Londoño',
    businessName: 'Serenity Spa & Wellness',
    city: 'Medellín',
    text: 'En un spa la primera impresión lo es todo. Antes les enviaba la disponibilidad por WhatsApp informal y no era coherente con la imagen que quería proyectar. Con Gestabiz mis clientes pueden reservar desde una página elegante, reciben su confirmación inmediatamente y sienten que se están confiando a un lugar de alto nivel.',
    stat: 'Aumentó las reservas nuevas en un 45% en los primeros 2 meses',
    avatarInitial: 'M',
  },
  faqItems: [
    {
      question: '¿Puedo controlar la disponibilidad de las cabinas de tratamiento por separado de los terapeutas?',
      answer:
        'Sí. Gestabiz permite configurar tanto a los terapeutas como a las cabinas como recursos independientes. Cuando se reserva un servicio, el sistema verifica que tanto el terapeuta como la cabina asignada estén disponibles. Si uno de los dos está ocupado, el horario no se ofrece al cliente.',
    },
    {
      question: '¿Los clientes pueden ver la foto y descripción de cada tratamiento?',
      answer:
        'Absolutamente. Cada servicio en el perfil público de tu spa puede tener nombre, descripción detallada, duración, precio e imagen. Tus clientes llegan al proceso de reserva completamente informados sobre lo que van a vivir.',
    },
    {
      question: '¿Se puede registrar información sensible del cliente como alergias o restricciones?',
      answer:
        'Sí. Cada perfil de cliente en Gestabiz incluye un campo de notas donde puedes registrar alergias, condiciones de salud relevantes, productos que no debe recibir o preferencias especiales. Esta información es visible para el terapeuta antes de la sesión.',
    },
    {
      question: '¿Es posible crear paquetes de múltiples sesiones para clientes frecuentes?',
      answer:
        'Puedes registrar los paquetes vendidos como notas en el perfil del cliente con el número de sesiones incluidas y las usadas. Para un control más automatizado de paquetes con descuento, puedes gestionar los pagos a través del módulo de ventas rápidas de Gestabiz.',
    },
    {
      question: '¿Gestabiz funciona para un spa con varias sedes en diferentes ciudades?',
      answer:
        'Sí. Puedes gestionar múltiples sedes de tu spa desde un panel central. Cada sede tiene sus propios terapeutas, cabinas, servicios y horarios. Los reportes pueden verse de forma consolidada o filtrados por sede, lo que es ideal para cadenas de spa o centros de bienestar con expansión en varias ciudades.',
    },
  ],
  relatedVerticals: ['salones', 'barberias', 'fisioterapeutas'],
}

const odontologos: VerticalData = {
  slug: 'odontologos',
  name: 'Consultorio Odontológico',
  namePlural: 'Consultorios Odontológicos',
  headline: 'Agenda Digital para Odontólogos que Cuida cada Detalle',
  subheadline:
    'Organiza las citas de tus pacientes, controla la disponibilidad de tus unidades odontológicas y elimina los no-shows con recordatorios automáticos. Más tiempo para tratar pacientes, menos tiempo en coordinación.',
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
  canonicalPath: '/para/odontologos',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Smile',
  gradientFrom: 'sky-600',
  gradientTo: 'blue-500',
  painPoints: [
    'Los pacientes olvidan sus citas de control periódico y llaman el mismo día para cancelar',
    'Manejar la agenda de varias unidades odontológicas y varios odontólogos causa confusiones',
    'No tengo forma de enviarle recordatorios automáticos a los pacientes que deben volver en 6 meses',
    'No sé cuáles procedimientos generan más ingresos ni cuál odontólogo tiene la agenda más llena',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Agenda por odontólogo y unidad',
      description:
        'Cada odontólogo tiene su agenda y cada unidad odontológica es un recurso controlado. El sistema evita que dos procedimientos compartan el mismo sillón al mismo tiempo.',
    },
    {
      iconName: 'Bell',
      title: 'Recordatorios de control periódico',
      description:
        'Programa recordatorios para que tus pacientes vuelvan a su control en 3 o 6 meses. El sistema los contacta automáticamente para que agenden sin que tengas que hacer seguimiento manual.',
    },
    {
      iconName: 'FileText',
      title: 'Historial odontológico del paciente',
      description:
        'Registra los procedimientos realizados, las fechas de cada intervención y las notas clínicas de cada paciente. Todo en un perfil accesible para el equipo autorizado.',
    },
    {
      iconName: 'MessageSquare',
      title: 'Confirmación y recordatorio automático',
      description:
        'WhatsApp o email de confirmación al reservar y recordatorio el día anterior. Tus pacientes llegan a su cita recordando con antelación y no hay excusas de "se me olvidó".',
    },
    {
      iconName: 'BarChart3',
      title: 'Ingresos por procedimiento',
      description:
        'Ve cuánto generan los limpiezas, las extracciones, las ortodoncia y cualquier otro tratamiento. Analiza cuál es la distribución de tus ingresos y qué procedimientos debes promover más.',
    },
    {
      iconName: 'Globe',
      title: 'Perfil público con reserva online',
      description:
        'Tus nuevos pacientes pueden encontrarte en Google y reservar directamente desde tu perfil en Gestabiz, con los servicios disponibles, el equipo odontológico y los horarios de atención.',
    },
  ],
  stats: [
    { value: '55%', label: 'de reducción en no-shows con recordatorios automáticos' },
    { value: '30%', label: 'más pacientes de control que vuelven con seguimiento activo' },
    { value: '2h', label: 'menos al día en coordinación de agenda por teléfono' },
  ],
  testimonial: {
    name: 'Dra. Luciana Vargas',
    businessName: 'Clínica Dental Vargas',
    city: 'Bogotá',
    text: 'Mis pacientes de ortodoncia tienen citas de seguimiento cada mes. Antes dependía de que ellos me llamaran y muchos se atrasaban meses en sus controles. Con Gestabiz el sistema les manda recordatorio automático y ellos pueden reservar solos. Mi agenda está más organizada que nunca.',
    stat: 'Aumentó los controles de seguimiento en ortodoncia en un 60%',
    avatarInitial: 'L',
  },
  faqItems: [
    {
      question: '¿Puedo controlar la disponibilidad de cada sillón odontológico por separado?',
      answer:
        'Sí. En Gestabiz puedes configurar cada unidad odontológica como un recurso físico independiente. El sistema verifica que la unidad esté libre antes de confirmar una cita, evitando que dos pacientes queden asignados al mismo sillón en el mismo horario.',
    },
    {
      question: '¿El sistema puede recordarle a los pacientes que deben volver en 6 meses?',
      answer:
        'Puedes configurar recordatorios programados para que el sistema contacte automáticamente a los pacientes en la fecha que necesiten su control periódico. El paciente recibe el mensaje con un enlace para agendar directamente, sin necesidad de que tu equipo haga llamadas de seguimiento.',
    },
    {
      question: '¿Puedo tener varios odontólogos con especialidades diferentes en el mismo consultorio?',
      answer:
        'Perfectamente. Cada odontólogo tiene su perfil con su especialidad (ortodoncia, endodoncia, periodoncia, estética dental, etc.), su horario específico y sus propias tarifas por procedimiento. Los pacientes pueden elegir al especialista que necesitan al momento de reservar.',
    },
    {
      question: '¿Gestabiz reemplaza al software de historia clínica odontológica?',
      answer:
        'No. Gestabiz está especializado en la gestión de agenda, reservas y coordinación del consultorio, no en historia clínica odontológica completa con odontograma y radiografías. Es el sistema ideal para manejar tu flujo de pacientes y agenda, complementario a tu software clínico si tienes uno.',
    },
    {
      question: '¿Cómo saben los nuevos pacientes que pueden reservar online?',
      answer:
        'Tu consultorio tiene una URL pública en Gestabiz que puedes compartir en tu Instagram, WhatsApp de negocio, tarjeta de presentación o Google My Business. También puedes instalar un botón de reserva en tu sitio web si tienes uno. Los nuevos pacientes llegan, ven tus servicios y reservan directamente.',
    },
  ],
  relatedVerticals: ['clinicas', 'psicologos', 'fisioterapeutas'],
}

const psicologos: VerticalData = {
  slug: 'psicologos',
  name: 'Consultorio de Psicología',
  namePlural: 'Consultorios de Psicología',
  headline: 'Gestión de Citas para Psicólogos sin Interrupciones',
  subheadline:
    'Mantén tu agenda organizada y céntrate en tus pacientes mientras el sistema gestiona las reservas, los recordatorios y el historial de sesiones de forma automática. Diseñado para psicólogos independientes y centros de salud mental.',
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
  canonicalPath: '/para/psicologos',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Brain',
  gradientFrom: 'violet-600',
  gradientTo: 'purple-500',
  painPoints: [
    'Los pacientes me escriben para cancelar en el momento que empieza la sesión, interrumpiendo mi trabajo',
    'Manejar mi agenda personal mientras atiendo pacientes es estresante e ineficiente',
    'No tengo una forma profesional de que pacientes nuevos me encuentren y reserven su primera cita',
    'Llevar el registro de las sesiones de cada paciente en libretas o archivos separados es desorganizado',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Agenda privada y profesional',
      description:
        'Configura tus horarios de atención, la duración de tus sesiones y los días que no trabajas. Tu agenda se actualiza automáticamente y nunca muestra horarios que no tienes disponibles.',
    },
    {
      iconName: 'Bell',
      title: 'Recordatorios que reducen cancelaciones tardías',
      description:
        'El sistema recuerda a cada paciente su sesión con 24 horas de anticipación. Pueden confirmar o cancelar con tiempo, dándote la oportunidad de reasignar ese espacio.',
    },
    {
      iconName: 'Globe',
      title: 'Perfil profesional público',
      description:
        'Tiene una página profesional con tu especialidad, enfoque terapéutico, tarifas y disponibilidad. Tus pacientes nuevos reservan su primera sesión directamente, sin intermediarios.',
    },
    {
      iconName: 'FileText',
      title: 'Historial de sesiones del paciente',
      description:
        'Registra cuántas sesiones ha tenido cada paciente, las fechas y las notas que consideres relevantes. Un historial claro que te ayuda a hacer seguimiento sin depender de tu memoria.',
    },
    {
      iconName: 'Shield',
      title: 'Confidencialidad garantizada',
      description:
        'Los datos de tus pacientes están protegidos con las políticas de privacidad y seguridad de Gestabiz. Solo tú y tu equipo autorizado tienen acceso a la información clínica.',
    },
    {
      iconName: 'Smartphone',
      title: 'Gestión desde el celular',
      description:
        'Consulta tu agenda, responde solicitudes de cita y revisa el historial de tus pacientes desde tu teléfono. Gestabiz funciona perfectamente en móvil sin necesitar instalar nada.',
    },
  ],
  stats: [
    { value: '80%', label: 'de reducción en cancelaciones de último momento' },
    { value: '3x', label: 'más pacientes nuevos por semana desde el perfil público' },
    { value: '1h', label: 'menos al día en coordinación de agenda y mensajes' },
  ],
  testimonial: {
    name: 'Ps. Natalia Herrera',
    businessName: 'Consulta Psicológica Herrera',
    city: 'Bogotá',
    text: 'Como psicóloga independiente, antes gestionaba todo por WhatsApp y las cancelaciones de último minuto me afectaban económica y anímicamente. Gestabiz me dio una agenda profesional donde mis pacientes reservan solos, reciben recordatorio y si van a cancelar lo hacen con tiempo. Ahora tengo el control.',
    stat: 'Redujo las cancelaciones tardías en 75% y aumentó la ocupación de su agenda al 90%',
    avatarInitial: 'N',
  },
  faqItems: [
    {
      question: '¿Puedo ofrecer sesiones presenciales y virtuales en la misma agenda?',
      answer:
        'Sí. Puedes crear dos tipos de sesión en Gestabiz: presencial (con ubicación de tu consultorio) y virtual (con instrucciones para la videollamada). Los pacientes eligen el formato al momento de reservar y el sistema gestiona ambas modalidades en la misma agenda.',
    },
    {
      question: '¿Los pacientes pueden ver mi disponibilidad en tiempo real?',
      answer:
        'Exactamente. Tu perfil público muestra los horarios reales disponibles basados en tu agenda configurada. Cuando un horario se reserva, desaparece automáticamente de la vista del paciente. No hay riesgo de dobles reservas ni de que alguien elija un horario que ya está ocupado.',
    },
    {
      question: '¿Puedo establecer una política de cancelación con tiempo mínimo de aviso?',
      answer:
        'Puedes configurar un tiempo mínimo de anticipación para reservas y cancelaciones. Por ejemplo, puedes establecer que los pacientes deben reservar con al menos 24 horas de anticipación o que las cancelaciones deben hacerse con mínimo 12 horas de aviso. El sistema aplica estas restricciones automáticamente.',
    },
    {
      question: '¿Mis pacientes saben que sus datos están seguros en Gestabiz?',
      answer:
        'Gestabiz utiliza la infraestructura de Supabase (basada en AWS) con encriptación en tránsito y en reposo. Los datos de tus pacientes no son compartidos con terceros. Como psicólogo, eres el administrador de los datos de tu consultorio y tienes control total sobre quién puede acceder a ellos.',
    },
    {
      question: '¿Es útil Gestabiz si soy psicólogo independiente sin empleados?',
      answer:
        'Absolutamente. Gestabiz está diseñado tanto para profesionales independientes como para centros con equipos. Como psicólogo solo, úsalo para gestionar tu agenda personal, publicar tu perfil profesional, recibir reservas y enviar recordatorios automáticamente. Todo funciona igual de bien aunque seas una sola persona.',
    },
  ],
  relatedVerticals: ['clinicas', 'fisioterapeutas', 'odontologos'],
}

const fisioterapeutas: VerticalData = {
  slug: 'fisioterapeutas',
  name: 'Centro de Fisioterapia',
  namePlural: 'Centros de Fisioterapia',
  headline: 'Software para Fisioterapeutas que Pone el Orden en tu Clínica',
  subheadline:
    'Controla la agenda de tus fisioterapeutas, la disponibilidad de tus camillas y equipos de rehabilitación, y lleva un seguimiento detallado de cada paciente. Todo en un sistema diseñado para centros de fisioterapia modernos.',
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
  canonicalPath: '/para/fisioterapeutas',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Activity',
  gradientFrom: 'green-600',
  gradientTo: 'teal-500',
  painPoints: [
    'Coordinar las citas de varios fisioterapeutas con las camillas y equipos disponibles genera constantes conflictos',
    'Los pacientes en proceso de rehabilitación olvidan sus sesiones periódicas y atrasan su recuperación',
    'No tengo control real sobre el avance de cada paciente a lo largo de sus sesiones de tratamiento',
    'La gestión manual de la agenda consume tiempo valioso que podría dedicar a la atención de pacientes',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Agenda por fisioterapeuta y camilla',
      description:
        'Gestiona simultáneamente la disponibilidad de cada fisioterapeuta y cada camilla o equipo. El sistema verifica ambos recursos antes de confirmar una cita para evitar conflictos.',
    },
    {
      iconName: 'Bell',
      title: 'Recordatorios de sesiones de rehabilitación',
      description:
        'Tus pacientes reciben recordatorios automáticos de cada sesión de su plan de rehabilitación. Menos sesiones perdidas significa mejores resultados y más satisfacción del paciente.',
    },
    {
      iconName: 'FileText',
      title: 'Seguimiento del plan de tratamiento',
      description:
        'Registra el número de sesiones del plan de cada paciente, las completadas y las pendientes. Un seguimiento claro del progreso terapéutico sin papeles ni planillas.',
    },
    {
      iconName: 'Users',
      title: 'Gestión de equipo de rehabilitación',
      description:
        'Asigna pacientes a fisioterapeutas específicos según su especialidad (deportiva, neurológica, pediátrica, etc.) y gestiona la carga de trabajo del equipo de forma equitativa.',
    },
    {
      iconName: 'BarChart3',
      title: 'Reportes de productividad clínica',
      description:
        'Analiza cuántas sesiones realizó cada fisioterapeuta, cuál es la tasa de cumplimiento de los planes de rehabilitación y qué tipos de terapia tienen mayor demanda.',
    },
    {
      iconName: 'Globe',
      title: 'Perfil clínico en Google',
      description:
        'Aparece cuando alguien busca fisioterapeutas en tu ciudad. Tu perfil muestra el equipo, las especialidades, los horarios y permite reservar la primera sesión directamente.',
    },
  ],
  stats: [
    { value: '70%', label: 'de cumplimiento de planes de rehabilitación con recordatorios' },
    { value: '45%', label: 'menos tiempo en coordinación de agenda diaria' },
    { value: '+30%', label: 'de nuevos pacientes que llegan desde búsquedas en Google' },
  ],
  testimonial: {
    name: 'Ft. Diego Cardona',
    businessName: 'Rehab Center Cardona',
    city: 'Manizales',
    text: 'El problema más grande que tenía era que los pacientes dejaban su rehabilitación a medias porque olvidaban sus citas o les daba pereza llamar para reagendar. Con Gestabiz el sistema les recuerda su próxima sesión, ellos confirman y si no pueden, reagendan solos. El cumplimiento de los planes de tratamiento mejoró notablemente.',
    stat: 'Incrementó el cumplimiento de planes de rehabilitación del 55% al 82%',
    avatarInitial: 'D',
  },
  faqItems: [
    {
      question: '¿Puedo configurar planes de múltiples sesiones para cada paciente?',
      answer:
        'Sí. Puedes registrar en el perfil de cada paciente el número total de sesiones de su plan de rehabilitación, la frecuencia recomendada y las sesiones completadas. Esta información te da visibilidad sobre el avance de cada paciente y te alerta cuando alguien está atrasando su tratamiento.',
    },
    {
      question: '¿El sistema controla la disponibilidad de las camillas y los equipos?',
      answer:
        'Perfectamente. Cada camilla, máquina de electroterapia, piscina de hidroterapia o cualquier otro equipo se configura como un recurso en Gestabiz. El sistema verifica que el equipo esté disponible antes de confirmar la cita, evitando conflictos entre sesiones simultáneas que requieren el mismo recurso.',
    },
    {
      question: '¿Puedo diferenciar entre fisioterapia deportiva, neurológica y otras especialidades?',
      answer:
        'Sí. Cada servicio en Gestabiz tiene nombre, descripción y duración propios. Puedes crear "Fisioterapia Deportiva", "Rehabilitación Neurológica", "Terapia Manual", "Electroterapia" como servicios separados, cada uno con su duración y precio. Los pacientes eligen el tipo de sesión que necesitan al reservar.',
    },
    {
      question: '¿Cómo se maneja la asignación de pacientes a fisioterapeutas específicos?',
      answer:
        'Cuando un paciente reserva, puede elegir un fisioterapeuta específico del equipo o el sistema puede asignar automáticamente al próximo disponible. Para pacientes en proceso de rehabilitación continua, es recomendable que siempre pidan cita con el mismo profesional para continuidad del tratamiento.',
    },
    {
      question: '¿Funciona Gestabiz para un fisioterapeuta independiente que trabaja a domicilio?',
      answer:
        'Sí. Si ofreces servicios a domicilio, puedes configurar tu perfil sin una sede física fija. Gestiona tu agenda de visitas, recibe reservas online, envía confirmaciones y lleva el historial de tus pacientes exactamente igual. Muchos profesionales de la salud independientes en Colombia usan Gestabiz para gestionar su práctica privada.',
    },
  ],
  relatedVerticals: ['clinicas', 'psicologos', 'entrenadores'],
}

const entrenadores: VerticalData = {
  slug: 'entrenadores',
  name: 'Entrenador Personal',
  namePlural: 'Entrenadores Personales',
  headline: 'La App que Todo Entrenador Personal en Colombia Necesita',
  subheadline:
    'Gestiona tu agenda de sesiones personales, muestra tu perfil profesional en Google y recibe reservas de nuevos clientes sin depender de Instagram ni WhatsApp para coordinar cada cita. Más tiempo entrenando, menos tiempo administrando.',
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
  canonicalPath: '/para/entrenadores',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Dumbbell',
  gradientFrom: 'amber-600',
  gradientTo: 'orange-500',
  painPoints: [
    'Coordinar las sesiones de todos mis clientes por WhatsApp me quita tiempo y energía que necesito para entrenar',
    'No tengo un perfil profesional donde los potenciales clientes puedan verme y reservar sin intermediarios',
    'Mis clientes olvidan sesiones o las cambian a última hora sin darme tiempo para reorganizarme',
    'No llevo un control claro de cuánto genero al mes ni cuántas sesiones hace cada cliente',
  ],
  features: [
    {
      iconName: 'Calendar',
      title: 'Agenda de sesiones personales',
      description:
        'Toda tu agenda en un solo lugar. Ve tus sesiones del día, la semana y el mes. Acepta reservas online sin revisar el WhatsApp cada vez que alguien quiere una cita.',
    },
    {
      iconName: 'Globe',
      title: 'Perfil profesional visible en Google',
      description:
        'Tu perfil de entrenador aparece cuando alguien busca "entrenador personal en [tu ciudad]". Los clientes nuevos pueden ver tu especialidad, tus servicios y reservar directamente.',
    },
    {
      iconName: 'Bell',
      title: 'Recordatorios automáticos',
      description:
        'Tus clientes reciben recordatorio por WhatsApp antes de cada sesión. Los que tienden a olvidar o cancelar tarde se mantienen comprometidos con su entrenamiento.',
    },
    {
      iconName: 'FileText',
      title: 'Historial de sesiones por cliente',
      description:
        'Ve cuántas sesiones ha hecho cada cliente, la frecuencia de entrenamiento y las notas que hayas registrado sobre su progreso. Un seguimiento profesional de cada persona.',
    },
    {
      iconName: 'BarChart3',
      title: 'Control de ingresos mensuales',
      description:
        'Sabe cuánto generaste en el mes, qué clientes son más activos y cuántas sesiones realizaste. Información clara para planear tu negocio como entrenador independiente.',
    },
    {
      iconName: 'Star',
      title: 'Reseñas de clientes satisfechos',
      description:
        'Tus clientes pueden dejar reseñas en tu perfil público. Las opiniones positivas aumentan tu credibilidad y te ayudan a conseguir más clientes sin pagar publicidad.',
    },
  ],
  stats: [
    { value: '2h', label: 'menos por semana en coordinación de agenda' },
    { value: '+60%', label: 'de consultas de clientes nuevos desde el perfil público' },
    { value: '90%', label: 'de clientes que reaservan cuando reciben recordatorio' },
  ],
  testimonial: {
    name: 'Camilo Jiménez',
    businessName: 'Coach Camilo Fitness',
    city: 'Bogotá',
    text: 'Tenía 25 clientes y todos me escribían por Instagram o WhatsApp para cambiar horarios. Era imposible. Con Gestabiz creé mi perfil profesional, mis clientes reservan solos y reciben recordatorio. Ahora tengo 38 clientes activos y manejo todo en 10 minutos al día.',
    stat: 'Creció de 25 a 38 clientes activos en 3 meses usando su perfil público en Gestabiz',
    avatarInitial: 'C',
  },
  faqItems: [
    {
      question: '¿Gestabiz funciona para un entrenador que trabaja de forma independiente?',
      answer:
        'Está hecho exactamente para eso. Como entrenador independiente puedes crear tu perfil en minutos, configurar tus servicios (sesión individual, plan mensual, clase grupal), tus horarios disponibles y empezar a recibir reservas ese mismo día. No necesitas empleados ni oficina para usar Gestabiz.',
    },
    {
      question: '¿Puedo ofrecer tanto sesiones presenciales como virtuales?',
      answer:
        'Sí. Puedes crear distintos tipos de sesión: presencial en gym, presencial a domicilio o virtual por videollamada. Cada tipo puede tener su propia duración y precio. Los clientes eligen el formato al reservar y el sistema gestiona ambas modalidades en tu misma agenda.',
    },
    {
      question: '¿Cómo me ayuda Gestabiz a conseguir clientes nuevos?',
      answer:
        'Tu perfil público aparece en Google cuando alguien busca entrenadores personales en tu ciudad. También puedes compartir el enlace de tu perfil en tus redes sociales en lugar de pedirle a cada prospecto que te escriba por DM. Clientes que ya te conocen pueden dejar reseñas que aumentan tu credibilidad ante quienes no te conocen.',
    },
    {
      question: '¿Puedo llevar el seguimiento de los planes de entrenamiento de cada cliente?',
      answer:
        'Puedes registrar notas en el perfil de cada cliente con objetivos, progreso, restricciones físicas o cualquier información relevante. También ves el historial completo de sesiones con fechas y puedes ver qué clientes están manteniendo la frecuencia recomendada y cuáles se están atrasando.',
    },
    {
      question: '¿Es difícil configurar Gestabiz para empezar a usarlo?',
      answer:
        'No. El proceso es muy sencillo: creas tu negocio, agregas tus servicios con duración y precio, configuras tus horarios disponibles y ya puedes compartir tu perfil. La mayoría de entrenadores en Colombia que usan Gestabiz están activos y recibiendo reservas en menos de 30 minutos desde que se registran.',
    },
  ],
  relatedVerticals: ['gimnasios', 'fisioterapeutas', 'spas'],
}

const coworkings: VerticalData = {
  slug: 'coworkings',
  name: 'Espacio Coworking',
  namePlural: 'Espacios Coworking',
  headline: 'Reservas de Salas y Escritorios para tu Coworking en Piloto Automático',
  subheadline:
    'Gestiona la disponibilidad de tus salas de reuniones, escritorios y espacios privados con un sistema de reservas online que funciona 24 horas. Tus miembros reservan solos, tú controlas todo desde un panel centralizado.',
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
  canonicalPath: '/para/coworkings',
  ogImage: 'https://gestabiz.com/og-image.png',
  heroIconName: 'Building2',
  gradientFrom: 'indigo-600',
  gradientTo: 'blue-500',
  painPoints: [
    'Los miembros me escriben por WhatsApp para reservar salas y a veces dos personas quedan en la misma sala a la misma hora',
    'No tengo visibilidad en tiempo real de qué espacios están ocupados y cuáles están libres en este momento',
    'Gestionar las membresías de acceso al coworking y los pagos manualmente es muy ineficiente',
    'No tengo forma de que empresas externas reserven una sala de reunión sin tener que coordinar todo por email o teléfono',
  ],
  features: [
    {
      iconName: 'Building2',
      title: 'Reserva de salas en tiempo real',
      description:
        'Tus miembros ven la disponibilidad de cada sala de reunión y la reservan directamente desde su celular. Sin WhatsApps, sin conflictos, sin dobles reservas. Todo sincronizado al instante.',
    },
    {
      iconName: 'MapPin',
      title: 'Control de escritorios y espacios',
      description:
        'Gestiona escritorios fijos, escritorios hot-desk, oficinas privadas y cualquier tipo de espacio. Cada recurso tiene su propio calendario y reglas de reserva.',
    },
    {
      iconName: 'Users',
      title: 'Gestión de miembros',
      description:
        'Registra a tus miembros con su plan de membresía, sus horas de acceso y su historial de reservas. Sabe quién usa más el espacio y quién está en plan de renovar.',
    },
    {
      iconName: 'Globe',
      title: 'Reservas para visitantes externos',
      description:
        'Empresas y freelancers externos pueden reservar una sala de reunión desde tu perfil público sin necesidad de ser miembros. Genera ingresos adicionales con reservas por hora o medio día.',
    },
    {
      iconName: 'BarChart3',
      title: 'Reportes de ocupación',
      description:
        'Analiza qué espacios tienen más demanda, en qué días y horarios hay mayor ocupación y cuál es la tasa de utilización de cada sala o escritorio. Optimiza tu oferta con datos.',
    },
    {
      iconName: 'CreditCard',
      title: 'Control de pagos de membresías',
      description:
        'Registra los pagos de membresías, ve quién está al día y quién está atrasado. Recibe alertas de vencimientos y mantén tus ingresos bajo control sin hacer seguimiento manual.',
    },
  ],
  stats: [
    { value: '100%', label: 'de las reservas procesadas automáticamente sin intervención manual' },
    { value: '85%', label: 'de ocupación promedio en coworkings con reserva online activa' },
    { value: '+40%', label: 'de ingresos por reservas de visitantes externos' },
  ],
  testimonial: {
    name: 'Juliana Moreno',
    businessName: 'HubWork Coworking',
    city: 'Bogotá',
    text: 'Tenemos 4 salas de reunión y antes del sistema la gente llegaba sin reservar y se generaban conflictos todos los días. Ahora con Gestabiz cada miembro reserva desde el celular, la sala queda bloqueada automáticamente y yo tengo el reporte de ocupación semanal sin hacer nada. Es un cambio total en la operación.',
    stat: 'Eliminó los conflictos de reservas y aumentó los ingresos por reservas externas en 35%',
    avatarInitial: 'J',
  },
  faqItems: [
    {
      question: '¿Puedo configurar diferentes tipos de espacios con distintas reglas de reserva?',
      answer:
        'Sí. En Gestabiz puedes crear salas de reunión con reserva por horas, escritorios hot-desk con reserva por día, oficinas privadas con membresía mensual y cualquier otro tipo de espacio con sus propias reglas. Cada recurso tiene su calendario independiente y sus condiciones de uso.',
    },
    {
      question: '¿Pueden reservar personas que no son miembros del coworking?',
      answer:
        'Sí. Tu perfil público en Gestabiz permite que cualquier persona, sea miembro o visitante externo, reserve un espacio disponible. Puedes configurar qué tipos de espacio están disponibles para el público general y cuáles son exclusivos para miembros registrados.',
    },
    {
      question: '¿Cómo funciona el sistema para controlar el acceso de los miembros?',
      answer:
        'Gestabiz gestiona la parte administrativa: registrar miembros, controlar sus reservas y hacer seguimiento de membresías. Para el control físico de acceso (torniquetes, puertas con código, etc.), Gestabiz se puede complementar con hardware de control de acceso especializado. El sistema te avisa qué miembros tienen membresía activa en cualquier momento.',
    },
    {
      question: '¿Se pueden configurar límites de tiempo para las reservas?',
      answer:
        'Puedes configurar la duración mínima y máxima de las reservas para cada espacio. Por ejemplo, las salas de reunión solo pueden reservarse en bloques de 1 hora mínimo y máximo 4 horas seguidas. El sistema aplica estas restricciones automáticamente cuando alguien intenta hacer una reserva fuera del rango permitido.',
    },
    {
      question: '¿Funciona Gestabiz para un coworking con varias sedes en la ciudad?',
      answer:
        'Perfectamente. Puedes gestionar múltiples sedes de tu coworking desde un solo panel. Cada sede tiene sus propios espacios, sus propios horarios y su propio equipo de gestión, pero tú tienes visibilidad y reportes consolidados de toda la operación. Ideal para redes de coworking en expansión en Colombia.',
    },
  ],
  relatedVerticals: ['clinicas', 'gimnasios', 'spas'],
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const VERTICALS_MAP: Record<string, VerticalData> = {
  salones,
  barberias,
  clinicas,
  gimnasios,
  spas,
  odontologos,
  psicologos,
  fisioterapeutas,
  entrenadores,
  coworkings,
}

export const VERTICALS_LIST: VerticalData[] = Object.values(VERTICALS_MAP)
