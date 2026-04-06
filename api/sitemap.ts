/**
 * Vercel Edge Function — Sitemap dinámico
 *
 * Genera sitemap.xml consultando todos los negocios públicos de Supabase
 * en tiempo real. Cada nuevo negocio registrado aparece automáticamente
 * en el sitemap sin necesidad de re-deploy.
 *
 * Cache: 15 minutos en CDN edge para equilibrar frescura vs latencia.
 */

export const config = { runtime: 'edge' }

interface BusinessRow {
  slug: string
  updated_at: string
}

async function fetchPublicBusinessSlugs(): Promise<BusinessRow[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return []

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/businesses?is_public=eq.true&is_active=eq.true&select=slug,updated_at&order=updated_at.desc&limit=5000`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
      }
    )
    if (!res.ok) return []
    const data = await res.json() as BusinessRow[]
    return data.filter(b => b.slug)
  } catch {
    return []
  }
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

export default async function handler(_req: Request): Promise<Response> {
  const today = new Date().toISOString().split('T')[0]
  const businesses = await fetchPublicBusinessSlugs()

  // ─── Páginas estáticas ──────────────────────────────────────────────────────
  const staticPages = [
    urlEntry('https://gestabiz.com/', today, 'weekly', '1.0'),
    urlEntry('https://gestabiz.com/para/salones', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/barberias', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/clinicas', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/gimnasios', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/spas', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/odontologos', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/psicologos', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/fisioterapeutas', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/nutricionistas', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/para/entrenadores', today, 'monthly', '0.9'),
    urlEntry('https://gestabiz.com/blog', today, 'weekly', '0.8'),
  ]

  // ─── Directorios (categoría × ciudad) ──────────────────────────────────────
  // Las combinaciones más relevantes del mercado colombiano
  const categorySlugs = ['barberias', 'salones', 'clinicas', 'spas', 'gimnasios', 'odontologos', 'psicologos', 'fisioterapeutas', 'nutricionistas']
  const citySlugs = ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga', 'pereira', 'manizales']

  const directoryPages = categorySlugs.flatMap(cat =>
    citySlugs.map(city =>
      urlEntry(`https://gestabiz.com/directorio/${cat}/${city}`, today, 'weekly', '0.7')
    )
  )

  // ─── Perfiles de negocios (dinámico desde BD) ───────────────────────────────
  const businessPages = businesses.map(b => {
    const lastmod = b.updated_at ? b.updated_at.split('T')[0] : today
    return urlEntry(`https://gestabiz.com/negocio/${b.slug}`, lastmod, 'weekly', '0.8')
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticPages.join('\n')}
${directoryPages.join('\n')}
${businessPages.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // 15 min CDN cache + 1 hora stale mientras se regenera
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  })
}
