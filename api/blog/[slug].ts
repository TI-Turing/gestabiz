/**
 * Vercel Edge Function — SSR de meta tags para artículos del blog
 *
 * Problema: Gestabiz es un SPA de React. Cuando Google crawlea
 * /blog/:slug recibe el index.html genérico con <title>Gestabiz</title>.
 * Los meta tags correctos solo aparecen después de que JS corre en cliente
 * (segundo wave de indexación, que puede tardar semanas).
 *
 * Solución: este Edge Function intercepta /blog/:slug, busca los datos
 * del artículo en el mapa inline, inyecta los meta tags en index.html
 * y devuelve el HTML enriquecido. El SPA (React) se monta normalmente en
 * el cliente gracias a los script tags que ya vienen en index.html.
 *
 * Resultado: Google ve el título, descripción y JSON-LD correctos en el
 * primer crawl, acelerando la indexación y el posicionamiento SEO.
 */

export const config = { runtime: 'edge' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPostSeoData {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  ogImage: string
  canonicalPath: string
  publishedAt: string
  authorName: string
  category: string
}

// ─── Inline SEO data ──────────────────────────────────────────────────────────
// Only fields required for meta injection — no article body content.
// Keep in sync with src/data/blog.ts.

const BLOG_POSTS: Record<string, BlogPostSeoData> = {
  'como-reducir-ausencias-citas-whatsapp': {
    slug: 'como-reducir-ausencias-citas-whatsapp',
    title:
      'Cómo Reducir las Ausencias en Citas de tu Negocio con Recordatorios por WhatsApp',
    metaTitle: 'Reduce Ausencias en Citas con Recordatorios WhatsApp',
    metaDescription:
      'Aprende cómo reducir las ausencias en citas usando recordatorios automáticos por WhatsApp. Guía práctica para negocios en Colombia con resultados comprobados.',
    metaKeywords: [
      'cómo reducir ausencias en citas',
      'recordatorios whatsapp citas automáticos',
      'no-shows colombia',
      'recordatorios automáticos negocio',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/como-reducir-ausencias-citas-whatsapp',
    publishedAt: '2026-03-15',
    authorName: 'Equipo Gestabiz',
    category: 'guias',
  },
  'software-salones-belleza-colombia-2026': {
    slug: 'software-salones-belleza-colombia-2026',
    title: 'Los 5 Mejores Software para Salones de Belleza en Colombia (2026)',
    metaTitle: 'Top 5 Software Salones de Belleza Colombia 2026',
    metaDescription:
      'Los 5 mejores software para salones de belleza en Colombia en 2026. Comparativa completa: precio en COP, pagos locales, WhatsApp, soporte en español y más.',
    metaKeywords: [
      'software para salones de belleza colombia',
      'mejor software salón belleza colombia 2026',
      'programa para peluquería colombia',
      'app salón de belleza',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/software-salones-belleza-colombia-2026',
    publishedAt: '2026-03-15',
    authorName: 'Equipo Gestabiz',
    category: 'comparativas',
  },
  'gestabiz-vs-calendly-colombia': {
    slug: 'gestabiz-vs-calendly-colombia',
    title:
      'Gestabiz vs Calendly: ¿Cuál es Mejor para Negocios en Colombia? (2026)',
    metaTitle: 'Gestabiz vs Calendly para Negocios Colombia 2026',
    metaDescription:
      'Comparativa Gestabiz vs Calendly para negocios colombianos. Descubre cuál soporta pagos en COP, WhatsApp, DIAN y tiene mejor precio para el mercado colombiano.',
    metaKeywords: [
      'gestabiz vs calendly colombia',
      'alternativa calendly colombia',
      'calendly colombia pagos',
      'software citas colombia',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/gestabiz-vs-calendly-colombia',
    publishedAt: '2026-03-15',
    authorName: 'Equipo Gestabiz',
    category: 'comparativas',
  },
  'como-digitalizar-negocio-servicios-colombia': {
    slug: 'como-digitalizar-negocio-servicios-colombia',
    title: 'Cómo Digitalizar tu Negocio de Servicios en Colombia en 2026',
    metaTitle: 'Cómo Digitalizar tu Negocio de Servicios Colombia 2026',
    metaDescription:
      'Guía completa para digitalizar tu negocio de servicios en Colombia en 2026. Pasos prácticos para pymes: agenda online, pagos digitales, marketing y más.',
    metaKeywords: [
      'digitalizar negocio colombia',
      'cómo digitalizar pyme colombia 2026',
      'transformación digital pequeñas empresas colombia',
      'agenda online colombia',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/como-digitalizar-negocio-servicios-colombia',
    publishedAt: '2026-03-15',
    authorName: 'Equipo Gestabiz',
    category: 'negocios',
  },
  'agenda-online-ventajas-para-negocios': {
    slug: 'agenda-online-ventajas-para-negocios',
    title:
      '7 Ventajas de Tener una Agenda Online para tu Negocio en Colombia',
    metaTitle: '7 Ventajas Agenda Online para Negocios Colombia',
    metaDescription:
      'Descubre las 7 principales ventajas de tener una agenda online para tu negocio en Colombia: menos ausencias, más reservas, mejor organización y clientes más satisfechos.',
    metaKeywords: [
      'agenda online negocios colombia',
      'ventajas agenda online colombia',
      'reservas online colombia',
      'agenda digital negocio servicios',
    ],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/agenda-online-ventajas-para-negocios',
    publishedAt: '2026-03-15',
    authorName: 'Equipo Gestabiz',
    category: 'negocios',
  },
  // ── Nuevos posts Abr 2026 ─────────────────────────────────────────────────
  'gestabiz-vs-agendapro-colombia': {
    slug: 'gestabiz-vs-agendapro-colombia',
    title: 'Gestabiz vs AgendaPro: ¿Cuál es Mejor para Negocios en Colombia? (2026)',
    metaTitle: 'Gestabiz vs AgendaPro para Negocios Colombia 2026',
    metaDescription: 'Comparativa Gestabiz vs AgendaPro para negocios en Colombia. Precio en COP, WhatsApp, DIAN, soporte local. Descubre cuál es mejor para tu negocio colombiano.',
    metaKeywords: ['gestabiz vs agendapro', 'alternativa agendapro colombia', 'agendapro colombia precios', 'mejor software citas colombia 2026'],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/gestabiz-vs-agendapro-colombia',
    publishedAt: '2026-04-05',
    authorName: 'Equipo Gestabiz',
    category: 'comparativas',
  },
  'gestabiz-vs-fresha-colombia': {
    slug: 'gestabiz-vs-fresha-colombia',
    title: 'Gestabiz vs Fresha: Comparativa Completa para Salones y Clínicas en Colombia (2026)',
    metaTitle: 'Gestabiz vs Fresha para Salones Colombia 2026',
    metaDescription: 'Gestabiz vs Fresha: comparativa para salones y clínicas en Colombia. Comisiones, pagos en COP, WhatsApp, contabilidad DIAN. ¿Cuál te conviene más?',
    metaKeywords: ['gestabiz vs fresha', 'alternativa fresha colombia', 'fresha colombia comisiones', 'software salones gratis colombia'],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/gestabiz-vs-fresha-colombia',
    publishedAt: '2026-04-05',
    authorName: 'Equipo Gestabiz',
    category: 'comparativas',
  },
  'software-citas-medicas-colombia-2026': {
    slug: 'software-citas-medicas-colombia-2026',
    title: 'Los 5 Mejores Software de Citas Médicas en Colombia (2026): Guía Completa',
    metaTitle: 'Top 5 Software Citas Médicas Colombia 2026',
    metaDescription: 'Los 5 mejores software de citas médicas en Colombia en 2026. Comparativa: DIAN, historia clínica, WhatsApp, precios COP. Guía para médicos y clínicas.',
    metaKeywords: ['software citas médicas colombia', 'sistema agendamiento médico colombia', 'agenda médica online colombia', 'app citas médicas colombia'],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/software-citas-medicas-colombia-2026',
    publishedAt: '2026-04-05',
    authorName: 'Equipo Gestabiz',
    category: 'comparativas',
  },
  'software-barberias-colombia-2026': {
    slug: 'software-barberias-colombia-2026',
    title: 'Software para Barberías en Colombia: Los 5 Mejores en 2026',
    metaTitle: 'Top 5 Software para Barberías Colombia 2026',
    metaDescription: 'Los 5 mejores software para barberías en Colombia en 2026. Agenda por barbero, WhatsApp, pagos COP, comisiones. Guía completa para barbershops.',
    metaKeywords: ['software barberías colombia', 'app barbería colombia', 'sistema citas barbería', 'software barbershop colombia 2026'],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/software-barberias-colombia-2026',
    publishedAt: '2026-04-05',
    authorName: 'Equipo Gestabiz',
    category: 'comparativas',
  },
  'como-elegir-software-agendamiento-citas': {
    slug: 'como-elegir-software-agendamiento-citas',
    title: 'Cómo Elegir el Mejor Software de Agendamiento de Citas para tu Negocio en Colombia',
    metaTitle: 'Cómo Elegir Software de Agendamiento de Citas Colombia',
    metaDescription: 'Guía para elegir el mejor software de agendamiento de citas en Colombia. 10 criterios clave: precio COP, WhatsApp, DIAN, soporte español, escalabilidad.',
    metaKeywords: ['cómo elegir software agendamiento citas', 'mejor software citas colombia', 'software de agendamiento de citas', 'comparar software reservas online'],
    ogImage: 'https://gestabiz.com/og-image.png',
    canonicalPath: '/blog/como-elegir-software-agendamiento-citas',
    publishedAt: '2026-04-05',
    authorName: 'Equipo Gestabiz',
    category: 'guias',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Meta tag builder ─────────────────────────────────────────────────────────

function buildBlogMetaHtml(post: BlogPostSeoData, canonical: string): string {
  const title = esc(trunc(post.metaTitle, 58))
  const desc  = esc(trunc(post.metaDescription, 158))
  const kw    = esc(post.metaKeywords.join(', '))
  const img   = esc(post.ogImage)
  const fullTitle = esc(post.title)

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: post.ogImage,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Gestabiz',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gestabiz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gestabiz.com/og-image.png',
      },
    },
    url: canonical,
  })

  return [
    `<title>${title} | Blog Gestabiz</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta name="keywords" content="${kw}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta name="author" content="${esc(post.authorName)}" />`,
    // Open Graph — article
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Gestabiz" />`,
    `<meta property="og:title" content="${fullTitle}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    // Article specific
    `<meta property="article:published_time" content="${post.publishedAt}" />`,
    `<meta property="article:author" content="${esc(post.authorName)}" />`,
    `<meta property="article:section" content="${esc(post.category)}" />`,
    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${fullTitle}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    // Canonical
    `<link rel="canonical" href="${esc(canonical)}" />`,
    // JSON-LD Article schema
    `<script type="application/ld+json">${jsonLd}</script>`,
    // JSON-LD BreadcrumbList — improves SERP navigation display
    `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://gestabiz.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://gestabiz.com/blog' },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    })}</script>`,
  ].join('\n  ')
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const url  = new URL(req.url)
  // Extract slug from /blog/<slug>
  const slug = url.pathname.replace(/^\/blog\//, '').replace(/\/$/, '')

  if (!slug) {
    return Response.redirect(`${url.origin}/blog`, 302)
  }

  const post = BLOG_POSTS[slug]
  const canonical = `${url.origin}/blog/${slug}`

  // Fetch the SPA shell
  const indexRes = await fetch(`${url.origin}/index.html`)
  let html = await indexRes.text()

  if (post) {
    const metaHtml = buildBlogMetaHtml(post, canonical)

    // 1. Remove the generic <title>
    html = html.replace(/<title>[^<]*<\/title>/, '')
    // 2. Strip generic meta tags from the SPA shell
    html = html
      .replace(/<meta name="description"[^>]*>/g, '')
      .replace(/<meta name="title"[^>]*>/g, '')
      .replace(/<meta name="keywords"[^>]*>/g, '')
      .replace(/<meta name="robots"[^>]*>/g, '')
      .replace(/<meta property="og:[^"]*"[^>]*>/g, '')
      .replace(/<meta name="twitter:[^"]*"[^>]*>/g, '')
      .replace(/<link rel="canonical"[^>]*>/g, '')
      .replace(/<link rel="alternate"[^>]*>/g, '')
    // 3. Remove any existing JSON-LD from the SPA shell (we inject article-specific one)
    html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '')
    // 4. Inject article-specific meta tags just before </head>
    html = html.replace('</head>', `  ${metaHtml}\n</head>`)
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // CDN cache: 1 hora | background revalidation: 24 horas
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  })
}
