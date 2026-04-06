/**
 * Vercel Edge Function — SSR de páginas directorio por categoría + ciudad
 *
 * Ej: /directorio/barberias/bogota
 *     /directorio/salones/medellin
 *
 * Estas páginas capturan búsquedas genéricas ("barberías bogotá") y enlazan
 * a cada negocio inscrito en Gestabiz, pasando autoridad de dominio hacia
 * los perfiles individuales — el mismo patrón que usa Agenda Pro para rankear.
 *
 * Inyecta meta tags + JSON-LD ItemList con los negocios encontrados.
 */

export const config = { runtime: 'edge' }

// ─── Catálogo ──────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, { label: string; labelSingular: string; categoryId?: string }> = {
  barberias:       { label: 'Barberías',             labelSingular: 'Barbería' },
  salones:         { label: 'Salones de Belleza',    labelSingular: 'Salón de Belleza' },
  clinicas:        { label: 'Clínicas',              labelSingular: 'Clínica' },
  spas:            { label: 'Spas',                  labelSingular: 'Spa' },
  gimnasios:       { label: 'Gimnasios',             labelSingular: 'Gimnasio' },
  odontologos:     { label: 'Odontólogos',           labelSingular: 'Odontólogo' },
  psicologos:      { label: 'Psicólogos',            labelSingular: 'Psicólogo' },
  fisioterapeutas: { label: 'Fisioterapeutas',       labelSingular: 'Fisioterapeuta' },
  nutricionistas:  { label: 'Nutricionistas',        labelSingular: 'Nutricionista' },
  entrenadores:    { label: 'Entrenadores Personales', labelSingular: 'Entrenador Personal' },
}

const CIUDADES: Record<string, string> = {
  bogota:       'Bogotá',
  medellin:     'Medellín',
  cali:         'Cali',
  barranquilla: 'Barranquilla',
  cartagena:    'Cartagena',
  bucaramanga:  'Bucaramanga',
  pereira:      'Pereira',
  manizales:    'Manizales',
  cucuta:       'Cúcuta',
  ibague:       'Ibagué',
  armenia:      'Armenia',
  pasto:        'Pasto',
  villavicencio: 'Villavicencio',
  monteria:     'Montería',
  neiva:        'Neiva',
  santa_marta:  'Santa Marta',
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface BusinessResult {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  average_rating: number | null
  review_count: number | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function trunc(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

// ─── Supabase fetch ──────────────────────────────────────────────────────────

async function fetchBusinessesByCategoryAndCity(
  categoriaSlug: string,
  ciudadNombre: string
): Promise<BusinessResult[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return []

  try {
    // Buscar por categoria slug + city name en locations
    // Supabase REST no soporta JOIN directamente, usamos la RPC de búsqueda si existe
    // o hacemos dos pasos: primero categoría → id, luego businesses con city filter
    const catRes = await fetch(
      `${supabaseUrl}/rest/v1/business_categories?slug=eq.${encodeURIComponent(categoriaSlug)}&is_active=eq.true&select=id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
      }
    )

    let categoryFilter = ''
    if (catRes.ok) {
      const cats = await catRes.json() as { id: string }[]
      if (cats[0]?.id) {
        categoryFilter = `&category_id=eq.${cats[0].id}`
      }
    }

    // Buscar negocios públicos, activos, que tengan sede en la ciudad indicada
    // La ciudad está en locations.city (texto) o vía city_id
    // Hacemos búsqueda por el campo city de locations JOIN businesses
    const res = await fetch(
      `${supabaseUrl}/rest/v1/rpc/search_businesses_by_category_city`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          p_category_slug: categoriaSlug,
          p_city_name: ciudadNombre,
          p_limit: 30,
        }),
      }
    )

    if (res.ok) {
      return await res.json() as BusinessResult[]
    }

    // Fallback: buscar negocios por categoría sin filtro de ciudad
    if (categoryFilter) {
      const fallbackRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?is_public=eq.true&is_active=eq.true${categoryFilter}&select=id,name,slug,description,logo_url,average_rating,review_count&order=average_rating.desc.nullslast&limit=20`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Accept: 'application/json',
          },
        }
      )
      if (fallbackRes.ok) return await fallbackRes.json() as BusinessResult[]
    }

    return []
  } catch {
    return []
  }
}

// ─── Meta + JSON-LD ──────────────────────────────────────────────────────────

function buildMeta(
  categoriaLabel: string,
  ciudadNombre: string,
  canonical: string,
  count: number
): string {
  const title = esc(`${categoriaLabel} en ${ciudadNombre} | Gestabiz`)
  const desc = esc(
    trunc(
      `Encuentra y reserva cita en las mejores ${categoriaLabel.toLowerCase()} de ${ciudadNombre}. ${count > 0 ? `${count} negocios registrados` : 'Reserva online 24/7'} con Gestabiz.`,
      160
    )
  )
  const kw = esc(`${categoriaLabel.toLowerCase()} ${ciudadNombre.toLowerCase()}, reservar cita ${ciudadNombre.toLowerCase()}, ${categoriaLabel.toLowerCase()} cerca de mí`)

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta name="keywords" content="${kw}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Gestabiz" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<link rel="canonical" href="${canonical}" />`,
  ].join('\n  ')
}

function buildJsonLd(
  businesses: BusinessResult[],
  categoriaLabel: string,
  ciudadNombre: string,
  baseUrl: string
): string {
  if (businesses.length === 0) return ''

  const items = businesses.map((b, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: b.name,
    url: `${baseUrl}/negocio/${b.slug}`,
    ...(b.description ? { description: trunc(b.description, 120) } : {}),
    ...(b.average_rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: b.average_rating,
        reviewCount: b.review_count ?? 1,
      }
    } : {}),
  }))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoriaLabel} en ${ciudadNombre}`,
    description: `Listado de ${categoriaLabel.toLowerCase()} en ${ciudadNombre} disponibles para reserva online en Gestabiz`,
    numberOfItems: businesses.length,
    itemListElement: items,
  }

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  // path: /directorio/:categoria/:ciudad
  const parts = url.pathname.replace(/^\/directorio\//, '').replace(/\/$/, '').split('/')
  const categoriaSlug = parts[0] ?? ''
  const ciudadSlug = parts[1] ?? ''

  const categoriaInfo = CATEGORIAS[categoriaSlug]
  const ciudadNombre = CIUDADES[ciudadSlug]

  // 404 si no conocemos la combinación
  if (!categoriaInfo || !ciudadNombre) {
    return new Response('Not found', { status: 404 })
  }

  const canonical = `${url.origin}/directorio/${categoriaSlug}/${ciudadSlug}`

  const [businesses, indexRes] = await Promise.all([
    fetchBusinessesByCategoryAndCity(categoriaSlug, ciudadNombre),
    fetch(`${url.origin}/index.html`),
  ])

  let html = await indexRes.text()

  const metaHtml = buildMeta(categoriaInfo.label, ciudadNombre, canonical, businesses.length)
  const jsonLd = buildJsonLd(businesses, categoriaInfo.label, ciudadNombre, url.origin)

  // Limpiar meta tags genéricos del index.html
  html = html.replace(/<title>[^<]*<\/title>/, '')
  html = html
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta name="title"[^>]*>/g, '')
    .replace(/<meta name="keywords"[^>]*>/g, '')
    .replace(/<meta name="robots"[^>]*>/g, '')
    .replace(/<meta property="og:[^"]*"[^>]*>/g, '')
    .replace(/<meta name="twitter:[^"]*"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace(/<link rel="alternate"[^>]*>/g, '')
  html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '')

  // Inyectar meta tags + JSON-LD
  html = html.replace('</head>', `  ${metaHtml}\n  ${jsonLd}\n</head>`)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // 1 hora CDN + 24h stale-while-revalidate
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  })
}
