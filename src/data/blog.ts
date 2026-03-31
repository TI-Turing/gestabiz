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
]

// ─── Map for O(1) lookup by slug ──────────────────────────────────────────────

export const BLOG_POSTS_MAP: Record<string, BlogPost> = Object.fromEntries(
  BLOG_POSTS.map((post) => [post.slug, post])
)
