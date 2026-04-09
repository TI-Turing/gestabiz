// ─── Blog metadata ────────────────────────────────────────────────────────────
// Central registry of all published blog posts.
// Each post maps a slug → full SEO + taxonomy metadata.
// Article content lives in src/content/blog/<slug>.ts

export interface BlogAuthor {
  name: string
  role: string
  avatarInitial: string
}

export type BlogCategory = 'guias' | 'negocios' | 'tecnologia' | 'comparativas'

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  ogImage: string
  canonicalPath: string
  publishedAt: string
  updatedAt: string
  author: BlogAuthor
  category: BlogCategory
  readingTimeMinutes: number
  tags: string[]
  relatedVerticals: string[]
  featured: boolean
  published: boolean
}

// ─── Shared author ────────────────────────────────────────────────────────────

const GESTABIZ_AUTHOR: BlogAuthor = {
  name: 'Equipo Gestabiz',
  role: 'Especialistas en Gestión de Negocios',
  avatarInitial: 'G',
}

const OG_IMAGE = 'https://gestabiz.com/og-image.png'

// ─── Posts ────────────────────────────────────────────────────────────────────

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'como-reducir-ausencias-citas-whatsapp',
    title:
      'Cómo Reducir las Ausencias en Citas de tu Negocio con Recordatorios por WhatsApp',
    excerpt:
      'Las ausencias sin aviso le cuestan a los negocios colombianos entre $800.000 y $2.000.000 COP al mes. Descubre cómo los recordatorios automáticos por WhatsApp pueden reducir los no-shows hasta en un 70%.',
    metaTitle: 'Reduce Ausencias en Citas con Recordatorios WhatsApp',
    metaDescription:
      'Aprende cómo reducir las ausencias en citas usando recordatorios automáticos por WhatsApp. Guía práctica para negocios en Colombia con resultados comprobados.',
    metaKeywords: [
      'cómo reducir ausencias en citas',
      'recordatorios whatsapp citas automáticos',
      'no-shows colombia',
      'recordatorios automáticos negocio',
      'reducir inasistencias citas',
      'whatsapp citas colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/como-reducir-ausencias-citas-whatsapp',
    publishedAt: '2026-03-15',
    updatedAt: '2026-03-15',
    author: GESTABIZ_AUTHOR,
    category: 'guias',
    readingTimeMinutes: 8,
    tags: ['recordatorios', 'whatsapp', 'no-shows', 'citas', 'automatización'],
    relatedVerticals: ['salones', 'clinicas', 'barberias'],
    featured: true,
    published: true,
  },
  {
    slug: 'software-salones-belleza-colombia-2026',
    title:
      'Los 5 Mejores Software para Salones de Belleza en Colombia (2026)',
    excerpt:
      'Comparamos los 5 software más usados en salones de belleza colombianos: agenda por estilista, pagos en COP, integración WhatsApp y mucho más. Descubre cuál se adapta a tu negocio.',
    metaTitle: 'Top 5 Software Salones de Belleza Colombia 2026',
    metaDescription:
      'Los 5 mejores software para salones de belleza en Colombia en 2026. Comparativa completa: precio en COP, pagos locales, WhatsApp, soporte en español y más.',
    metaKeywords: [
      'software para salones de belleza colombia',
      'mejor software salón belleza colombia 2026',
      'programa para peluquería colombia',
      'app salón de belleza',
      'gestión salón belleza colombia',
      'software peluquería colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/software-salones-belleza-colombia-2026',
    publishedAt: '2026-03-15',
    updatedAt: '2026-03-15',
    author: GESTABIZ_AUTHOR,
    category: 'comparativas',
    readingTimeMinutes: 10,
    tags: ['software', 'salones de belleza', 'peluquería', 'colombia'],
    relatedVerticals: ['salones', 'barberias', 'spas'],
    featured: true,
    published: true,
  },
  {
    slug: 'gestabiz-vs-calendly-colombia',
    title:
      'Gestabiz vs Calendly: ¿Cuál es Mejor para Negocios en Colombia? (2026)',
    excerpt:
      'Calendly es popular a nivel global pero carece de soporte para pagos en COP, WhatsApp, DIAN y CRM de clientes. Te explicamos cuándo usar cada uno y por qué Gestabiz fue diseñado para la realidad colombiana.',
    metaTitle: 'Gestabiz vs Calendly para Negocios Colombia 2026',
    metaDescription:
      'Comparativa Gestabiz vs Calendly para negocios colombianos. Descubre cuál soporta pagos en COP, WhatsApp, DIAN y tiene mejor precio para el mercado colombiano.',
    metaKeywords: [
      'gestabiz vs calendly colombia',
      'alternativa calendly colombia',
      'calendly colombia pagos',
      'software citas colombia',
      'alternativa calendly en español',
      'mejor que calendly colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/gestabiz-vs-calendly-colombia',
    publishedAt: '2026-03-15',
    updatedAt: '2026-03-15',
    author: GESTABIZ_AUTHOR,
    category: 'comparativas',
    readingTimeMinutes: 7,
    tags: ['calendly', 'comparativa', 'software citas', 'colombia'],
    relatedVerticals: ['clinicas', 'psicologos', 'fisioterapeutas'],
    featured: false,
    published: true,
  },
  {
    slug: 'como-digitalizar-negocio-servicios-colombia',
    title: 'Cómo Digitalizar tu Negocio de Servicios en Colombia en 2026',
    excerpt:
      'Digitalizar tu negocio en Colombia ya no es opcional: el 73% de los consumidores colombianos prefieren reservar en línea. Aprende el paso a paso para transformar tu negocio de servicios sin complicaciones.',
    metaTitle: 'Cómo Digitalizar tu Negocio de Servicios Colombia 2026',
    metaDescription:
      'Guía completa para digitalizar tu negocio de servicios en Colombia en 2026. Pasos prácticos para pymes: agenda online, pagos digitales, marketing y más.',
    metaKeywords: [
      'digitalizar negocio colombia',
      'cómo digitalizar pyme colombia 2026',
      'transformación digital pequeñas empresas colombia',
      'agenda online colombia',
      'pagos digitales negocios colombia',
      'tecnología para pymes colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/como-digitalizar-negocio-servicios-colombia',
    publishedAt: '2026-03-15',
    updatedAt: '2026-03-15',
    author: GESTABIZ_AUTHOR,
    category: 'negocios',
    readingTimeMinutes: 9,
    tags: ['digitalización', 'negocios', 'pyme', 'colombia', 'tecnología'],
    relatedVerticals: ['salones', 'gimnasios', 'clinicas', 'coworkings'],
    featured: false,
    published: true,
  },
  {
    slug: 'agenda-online-ventajas-para-negocios',
    title:
      '7 Ventajas de Tener una Agenda Online para tu Negocio en Colombia',
    excerpt:
      'Una agenda online no solo reemplaza el cuaderno: reduce ausencias, aumenta reservas fuera de horario y da una imagen profesional. Descubre las 7 ventajas que ya disfrutan miles de negocios en Colombia.',
    metaTitle: '7 Ventajas Agenda Online para Negocios Colombia',
    metaDescription:
      'Descubre las 7 principales ventajas de tener una agenda online para tu negocio en Colombia: menos ausencias, más reservas, mejor organización y clientes más satisfechos.',
    metaKeywords: [
      'agenda online negocios colombia',
      'ventajas agenda online colombia',
      'reservas online colombia',
      'agenda digital negocio servicios',
      'beneficios agenda online pyme',
      'sistema reservas online colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/agenda-online-ventajas-para-negocios',
    publishedAt: '2026-03-15',
    updatedAt: '2026-03-15',
    author: GESTABIZ_AUTHOR,
    category: 'negocios',
    readingTimeMinutes: 6,
    tags: ['agenda online', 'reservas', 'automatización', 'negocios servicios'],
    relatedVerticals: ['salones', 'barberias', 'gimnasios', 'spas'],
    featured: false,
    published: true,
  },
  // ── Nuevos posts Abr 2026 — comparativas competidores + guías por industria ──
  {
    slug: 'gestabiz-vs-agendapro-colombia',
    title:
      'Gestabiz vs AgendaPro: ¿Cuál es Mejor para Negocios en Colombia? (2026)',
    excerpt:
      'AgendaPro es el líder en Chile pero ¿funciona igual de bien en Colombia? Comparamos precios en COP, soporte local, WhatsApp, DIAN y más. Descubre cuál conviene para tu negocio.',
    metaTitle: 'Gestabiz vs AgendaPro para Negocios Colombia 2026',
    metaDescription:
      'Comparativa Gestabiz vs AgendaPro para negocios en Colombia. Precio en COP, WhatsApp, DIAN, soporte local. Descubre cuál es mejor para tu negocio colombiano.',
    metaKeywords: [
      'gestabiz vs agendapro',
      'alternativa agendapro colombia',
      'agendapro colombia precios',
      'mejor software citas colombia 2026',
      'agendapro vs gestabiz comparativa',
      'software agendamiento colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/gestabiz-vs-agendapro-colombia',
    publishedAt: '2026-04-05',
    updatedAt: '2026-04-05',
    author: GESTABIZ_AUTHOR,
    category: 'comparativas',
    readingTimeMinutes: 9,
    tags: ['agendapro', 'comparativa', 'software citas', 'colombia'],
    relatedVerticals: ['salones', 'barberias', 'clinicas', 'spas'],
    featured: true,
    published: true,
  },
  {
    slug: 'gestabiz-vs-fresha-colombia',
    title:
      'Gestabiz vs Fresha: Comparativa Completa para Salones y Clínicas en Colombia (2026)',
    excerpt:
      'Fresha es gratis pero cobra comisiones por cada reserva online. Gestabiz tiene tarifa fija sin comisiones. Comparamos ambas plataformas para el mercado colombiano.',
    metaTitle: 'Gestabiz vs Fresha para Salones Colombia 2026',
    metaDescription:
      'Gestabiz vs Fresha: comparativa para salones y clínicas en Colombia. Comisiones, pagos en COP, WhatsApp, contabilidad DIAN. ¿Cuál te conviene más?',
    metaKeywords: [
      'gestabiz vs fresha',
      'alternativa fresha colombia',
      'fresha colombia comisiones',
      'software salones gratis colombia',
      'fresha vs gestabiz comparativa',
      'mejor app salones colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/gestabiz-vs-fresha-colombia',
    publishedAt: '2026-04-05',
    updatedAt: '2026-04-05',
    author: GESTABIZ_AUTHOR,
    category: 'comparativas',
    readingTimeMinutes: 8,
    tags: ['fresha', 'comparativa', 'salones', 'comisiones', 'colombia'],
    relatedVerticals: ['salones', 'barberias', 'spas'],
    featured: true,
    published: true,
  },
  {
    slug: 'software-citas-medicas-colombia-2026',
    title:
      'Los 5 Mejores Software de Citas Médicas en Colombia (2026): Guía Completa',
    excerpt:
      'Comparamos los mejores software de agendamiento de citas médicas en Colombia: cumplimiento DIAN, historia clínica, recordatorios WhatsApp y precios en COP.',
    metaTitle: 'Top 5 Software Citas Médicas Colombia 2026',
    metaDescription:
      'Los 5 mejores software de citas médicas en Colombia en 2026. Comparativa: DIAN, historia clínica, WhatsApp, precios COP. Guía para médicos y clínicas.',
    metaKeywords: [
      'software citas médicas colombia',
      'sistema agendamiento médico colombia',
      'agenda médica online colombia',
      'software consultorio médico colombia 2026',
      'app citas médicas colombia',
      'software clínica dental colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/software-citas-medicas-colombia-2026',
    publishedAt: '2026-04-05',
    updatedAt: '2026-04-05',
    author: GESTABIZ_AUTHOR,
    category: 'comparativas',
    readingTimeMinutes: 10,
    tags: ['software médico', 'clínicas', 'citas médicas', 'colombia'],
    relatedVerticals: ['clinicas', 'odontologos', 'psicologos', 'fisioterapeutas'],
    featured: false,
    published: true,
  },
  {
    slug: 'software-barberias-colombia-2026',
    title:
      'Software para Barberías en Colombia: Los 5 Mejores en 2026',
    excerpt:
      'Las barberías colombianas están creciendo rápido. Comparamos los 5 mejores software con agenda por barbero, recordatorios WhatsApp, pagos en COP y control de comisiones.',
    metaTitle: 'Top 5 Software para Barberías Colombia 2026',
    metaDescription:
      'Los 5 mejores software para barberías en Colombia en 2026. Agenda por barbero, WhatsApp, pagos COP, comisiones. Guía completa para barbershops.',
    metaKeywords: [
      'software barberías colombia',
      'app barbería colombia',
      'sistema citas barbería',
      'software barbershop colombia 2026',
      'agenda barberos online',
      'programa para barbería colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/software-barberias-colombia-2026',
    publishedAt: '2026-04-05',
    updatedAt: '2026-04-05',
    author: GESTABIZ_AUTHOR,
    category: 'comparativas',
    readingTimeMinutes: 8,
    tags: ['barberías', 'barbershop', 'software', 'colombia'],
    relatedVerticals: ['barberias', 'salones'],
    featured: false,
    published: true,
  },
  {
    slug: 'como-elegir-software-agendamiento-citas',
    title:
      'Cómo Elegir el Mejor Software de Agendamiento de Citas para tu Negocio en Colombia',
    excerpt:
      'No todos los software de citas son iguales. Te damos los 10 criterios que debes evaluar antes de elegir: precio, WhatsApp, pagos locales, soporte, escalabilidad y más.',
    metaTitle: 'Cómo Elegir Software de Agendamiento de Citas Colombia',
    metaDescription:
      'Guía para elegir el mejor software de agendamiento de citas en Colombia. 10 criterios clave: precio COP, WhatsApp, DIAN, soporte español, escalabilidad.',
    metaKeywords: [
      'cómo elegir software agendamiento citas',
      'mejor software citas colombia',
      'software de agendamiento de citas',
      'qué buscar en software de citas',
      'comparar software reservas online',
      'sistema agendamiento citas colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/como-elegir-software-agendamiento-citas',
    publishedAt: '2026-04-05',
    updatedAt: '2026-04-05',
    author: GESTABIZ_AUTHOR,
    category: 'guias',
    readingTimeMinutes: 7,
    tags: ['guía de compra', 'software citas', 'agendamiento', 'colombia'],
    relatedVerticals: ['salones', 'clinicas', 'barberias', 'gimnasios'],
    featured: false,
    published: true,
  },
  {
    slug: 'crm-para-negocios-servicios-colombia-2026',
    title: 'CRM para Negocios de Servicios en Colombia: La Guía Completa 2026',
    excerpt:
      'El 68% de los negocios colombianos pierde clientes por falta de seguimiento. Descubre cómo un CRM integrado con tu agenda puede aumentar la retención hasta un 27% y generar ingresos adicionales sin invertir en publicidad.',
    metaTitle: 'CRM para Negocios de Servicios Colombia 2026 | Guía Completa',
    metaDescription:
      'Guía completa de CRM para negocios de servicios en Colombia en 2026. Cómo retener clientes, automatizar seguimientos y aumentar ingresos sin más publicidad.',
    metaKeywords: [
      'crm para negocios de servicios colombia',
      'crm pyme colombia 2026',
      'software crm colombia pyme',
      'retención clientes negocio servicios',
      'crm salón belleza colombia',
      'crm clínica colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/crm-para-negocios-servicios-colombia-2026',
    publishedAt: '2026-04-08',
    updatedAt: '2026-04-08',
    author: GESTABIZ_AUTHOR,
    category: 'guias',
    readingTimeMinutes: 9,
    tags: ['crm', 'retención de clientes', 'fidelización', 'colombia', 'pyme'],
    relatedVerticals: ['salones', 'clinicas', 'gimnasios', 'barberias', 'spas'],
    featured: true,
    published: true,
  },
  {
    slug: 'software-gimnasios-centros-deportivos-colombia-2026',
    title: 'Software para Gimnasios en Colombia: Los 5 Mejores en 2026',
    excerpt:
      'Los gimnasios colombianos ya no se gestionan con hojas de Excel. Comparamos los 5 mejores software para gimnasios y centros deportivos: gestión de recursos físicos, reservas de canchas, pagos en COP y control de acceso.',
    metaTitle: 'Top 5 Software para Gimnasios Colombia 2026',
    metaDescription:
      'Los 5 mejores software para gimnasios en Colombia en 2026. Gestión de recursos físicos, reservas de canchas, pagos COP, recordatorios WhatsApp. Guía comparativa completa.',
    metaKeywords: [
      'software gimnasios colombia',
      'app para gimnasio colombia',
      'sistema gestión gimnasio colombia 2026',
      'software centro deportivo colombia',
      'gestión membresías gimnasio',
      'programa para gimnasio colombia',
    ],
    ogImage: OG_IMAGE,
    canonicalPath: '/blog/software-gimnasios-centros-deportivos-colombia-2026',
    publishedAt: '2026-04-08',
    updatedAt: '2026-04-08',
    author: GESTABIZ_AUTHOR,
    category: 'comparativas',
    readingTimeMinutes: 9,
    tags: ['gimnasios', 'centros deportivos', 'software', 'colombia', 'fitness'],
    relatedVerticals: ['gimnasios', 'academias', 'yoga', 'crossfit'],
    featured: true,
    published: true,
  },
]

// ─── Map for O(1) lookup by slug ──────────────────────────────────────────────

export const BLOG_POSTS_MAP: Record<string, BlogPost> = Object.fromEntries(
  BLOG_POSTS.map((post) => [post.slug, post])
)
