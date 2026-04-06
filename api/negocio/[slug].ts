/**
 * Vercel Edge Function — SSR de meta tags para perfiles públicos
 *
 * Problema: Gestabiz es un SPA de React. Cuando Google crawlea
 * /negocio/:slug recibe el index.html genérico con <title>Gestabiz</title>.
 * Los meta tags correctos solo aparecen después de que JS corre en cliente
 * (segundo wave de indexación, que puede tardar semanas).
 *
 * Solución: este Edge Function intercepta /negocio/:slug, obtiene los datos
 * del negocio desde Supabase REST API, inyecta los meta tags en index.html
 * y devuelve el HTML enriquecido. El SPA (React) se monta normalmente en
 * el cliente gracias a los script tags que ya vienen en index.html.
 *
 * Resultado: Google ve el título y descripción correctos en el primer crawl.
 */

export const config = { runtime: 'edge' }

// ─── Types ───────────────────────────────────────────────────────────────────

interface Business {
  id: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  banner_url: string | null
  logo_url: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string[] | null
  og_image_url: string | null
  average_rating: number | null
  review_count: number | null
  slug: string
}

interface Location {
  address: string | null
  city: string | null
  region: string | null
  lat: number | null
  lng: number | null
  opens_at: string | null
  closes_at: string | null
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

// ─── Supabase fetch ───────────────────────────────────────────────────────────

async function fetchBusiness(slug: string): Promise<Business | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/businesses?slug=eq.${encodeURIComponent(slug)}&is_public=eq.true&select=id,name,slug,description,phone,email,banner_url,logo_url,meta_title,meta_description,meta_keywords,og_image_url,average_rating,review_count&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json',
        },
        // Cache la respuesta 5 minutos en la edge — reduce latencia en re-crawls
        // @ts-ignore — cf-compatible cache hint
        cf: { cacheEverything: true, cacheTtl: 300 },
      }
    )
    if (!res.ok) return null
    const data = await res.json() as Business[]
    return data[0] ?? null
  } catch {
    return null
  }
}

async function fetchPrimaryLocation(businessId: string): Promise<Location | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/locations?business_id=eq.${businessId}&is_active=eq.true&select=address,city,region,lat,lng,opens_at,closes_at&order=created_at.asc&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json',
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json() as Location[]
    return data[0] ?? null
  } catch {
    return null
  }
}

// ─── Meta tag injection ───────────────────────────────────────────────────────

function buildMetaHtml(business: Business, canonical: string): string {
  const title = esc(business.meta_title || `${business.name} - Gestabiz`)
  const desc  = esc(trunc(business.meta_description || business.description || `Reserva citas en ${business.name} a través de Gestabiz`, 160))
  const img   = business.og_image_url || business.banner_url || business.logo_url || ''
  const kw    = esc(business.meta_keywords?.join(', ') || `${business.name}, reservas, citas, gestabiz`)

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta name="keywords" content="${kw}" />`,
    `<meta name="robots" content="index, follow" />`,
    // Open Graph
    `<meta property="og:type" content="business.business" />`,
    `<meta property="og:site_name" content="Gestabiz" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    img ? `<meta property="og:image" content="${esc(img)}" />` : '',
    img ? `<meta property="og:image:width" content="1200" />` : '',
    img ? `<meta property="og:image:height" content="630" />` : '',
    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    img ? `<meta name="twitter:image" content="${esc(img)}" />` : '',
    // Canonical
    `<link rel="canonical" href="${canonical}" />`,
  ].filter(Boolean).join('\n  ')
}

// ─── JSON-LD Schemas ─────────────────────────────────────────────────────────

function buildJsonLd(business: Business, location: Location | null, canonical: string): string {
  const img = business.og_image_url || business.banner_url || business.logo_url || ''

  // 1. LocalBusiness schema — enables Google rich snippets with address, hours, reviews
  const localBusiness: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': canonical,
    'name': business.name,
    'url': canonical,
    ...(business.description ? { description: trunc(business.description, 250) } : {}),
    ...(img ? { image: img } : {}),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
    'priceRange': '$$',
    'currenciesAccepted': 'COP',
    'paymentAccepted': 'Efectivo, Tarjeta de crédito, Tarjeta de débito, Transferencia',
  }

  // Address from primary location
  if (location?.address || location?.city) {
    localBusiness.address = {
      '@type': 'PostalAddress',
      ...(location.address ? { streetAddress: location.address } : {}),
      ...(location.city ? { addressLocality: location.city } : {}),
      ...(location.region ? { addressRegion: location.region } : {}),
      addressCountry: 'CO',
    }
  }

  // Geo coordinates
  if (location?.lat && location?.lng) {
    localBusiness.geo = {
      '@type': 'GeoCoordinates',
      latitude: location.lat,
      longitude: location.lng,
    }
  }

  // Opening hours (from primary location)
  if (location?.opens_at && location?.closes_at) {
    localBusiness.openingHoursSpecification = {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: location.opens_at,
      closes: location.closes_at,
    }
  }

  // AggregateRating — only if real reviews exist
  if (business.average_rating && business.review_count && business.review_count > 0) {
    localBusiness.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: business.average_rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: business.review_count,
    }
  }

  // 2. ReserveAction — enables "Reserve" button in Google search results
  localBusiness.potentialAction = {
    '@type': 'ReserveAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: canonical,
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
    result: {
      '@type': 'Reservation',
      name: `Reservar cita en ${business.name}`,
    },
  }

  // 3. BreadcrumbList — improves SERP navigation display
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://gestabiz.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Negocios',
        item: 'https://gestabiz.com/directorio/salones/bogota',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business.name,
        item: canonical,
      },
    ],
  }

  return [
    `<script type="application/ld+json">${JSON.stringify(localBusiness)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
  ].join('\n  ')
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const url  = new URL(req.url)
  // Extract slug from /negocio/<slug>
  const slug = url.pathname.replace(/^\/negocio\//, '').replace(/\/$/, '')

  if (!slug) {
    return Response.redirect(`${url.origin}/`, 302)
  }

  const canonical = `${url.origin}/negocio/${slug}`

  // Fetch business data + index.html in parallel for minimum latency
  const [business, indexRes] = await Promise.all([
    fetchBusiness(slug),
    // Fetch the SPA shell — Vercel serves the static dist/index.html
    fetch(`${url.origin}/index.html`),
  ])

  let html = await indexRes.text()

  if (business) {
    // Fetch location data (after we have the business ID)
    const location = await fetchPrimaryLocation(business.id)

    const metaHtml = buildMetaHtml(business, canonical)
    const jsonLd = buildJsonLd(business, location, canonical)
    // 1. Remove the generic <title>
    html = html.replace(/<title>[^<]*<\/title>/, '')
    // 2. Remove generic description/og/twitter/canonical/hreflang tags from index.html
    html = html
      .replace(/<meta name="description"[^>]*>/g, '')
      .replace(/<meta name="title"[^>]*>/g, '')
      .replace(/<meta name="keywords"[^>]*>/g, '')
      .replace(/<meta name="robots"[^>]*>/g, '')
      .replace(/<meta property="og:[^"]*"[^>]*>/g, '')
      .replace(/<meta name="twitter:[^"]*"[^>]*>/g, '')
      .replace(/<link rel="canonical"[^>]*>/g, '')
      .replace(/<link rel="alternate"[^>]*>/g, '')
    // 3. Remove landing-page JSON-LD schemas (business profiles have their own)
    html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '')
    // 4. Inject business-specific meta tags + JSON-LD just before </head>
    html = html.replace('</head>', `  ${metaHtml}\n  ${jsonLd}\n</head>`)
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // s-maxage: CDN cache (1 hora) | stale-while-revalidate: background update
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  })
}
