import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { config } from 'dotenv'

// Slugs de los verticales
const VERTICAL_SLUGS = [
  'salones','barberias','clinicas','gimnasios','spas',
  'odontologos','psicologos','fisioterapeutas','entrenadores','coworkings',
]

// Slugs de artículos del blog
const BLOG_SLUGS = [
  'como-reducir-ausencias-citas-whatsapp',
  'software-salones-belleza-colombia-2026',
  'gestabiz-vs-calendly-colombia',
  'como-digitalizar-negocio-servicios-colombia',
  'agenda-online-ventajas-para-negocios',
]

// cargar .env
config({ path: path.resolve(process.cwd(), '.env.local') })
config({ path: path.resolve(process.cwd(), '.env') })

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || ''

// nueva key
const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY || '' // fallback legacy

const SITE_URL =
  (process.env.VITE_SITE_URL || 'https://gestabiz.com')
  .replace(/\/$/, '')

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {  const today = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  xml += '  <url>\n'
  xml += `    <loc>${SITE_URL}/</loc>\n`
  xml += `    <lastmod>${today}</lastmod>\n`
  xml += '    <changefreq>weekly</changefreq>\n'
  xml += '    <priority>1.0</priority>\n'
  xml += '  </url>\n'
  xml += '</urlset>'

  fs.writeFileSync('public/sitemap.xml', xml, 'utf-8')  process.exit(0)
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
)

function escapeXml(str: string): string {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;')
}

async function generateSitemap() {  try {

    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('slug, updated_at, name')
      .eq('is_public', true)
      .not('slug','is',null)
      .order('updated_at',{ ascending:false })

    if (error) {
      throw new Error(`Error fetching businesses: ${error.message}`)
    }

    const today = new Date().toISOString().split('T')[0]

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
    xml += 'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n'
    xml += 'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'

    // Landing
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}/</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n'

    // vertical pages
    for (const slug of VERTICAL_SLUGS) {

      xml += '  <url>\n'
      xml += `    <loc>${SITE_URL}/para/${slug}</loc>\n`
      xml += `    <lastmod>${today}</lastmod>\n`
      xml += '    <changefreq>monthly</changefreq>\n'
      xml += '    <priority>0.9</priority>\n'
      xml += '  </url>\n'
    }    // blog index
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}/blog</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'

    // blog posts
    for (const slug of BLOG_SLUGS) {

      xml += '  <url>\n'
      xml += `    <loc>${SITE_URL}/blog/${slug}</loc>\n`
      xml += `    <lastmod>${today}</lastmod>\n`
      xml += '    <changefreq>monthly</changefreq>\n'
      xml += '    <priority>0.7</priority>\n'
      xml += '  </url>\n'
    }    if (businesses?.length) {      for (const business of businesses) {

        if (!business.slug) continue

        const lastmod =
          business.updated_at
            ? new Date(business.updated_at)
                .toISOString()
                .split('T')[0]
            : today

        const slug = escapeXml(business.slug)

        xml += '  <url>\n'
        xml += `    <loc>${SITE_URL}/negocio/${slug}</loc>\n`
        xml += `    <lastmod>${lastmod}</lastmod>\n`
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.8</priority>\n'
        xml += '  </url>\n'
      }

    } else {    }

    xml += '</urlset>\n'

    const publicDir = path.join(process.cwd(),'public')

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir,{ recursive:true })
    }

    const sitemapPath = path.join(publicDir,'sitemap.xml')

    fs.writeFileSync(sitemapPath,xml,'utf-8')

    const totalUrls =
      (businesses?.length ?? 0)
      + 1
      + VERTICAL_SLUGS.length
      + BLOG_SLUGS.length
      + 1  } catch (error) {

    console.warn(
      '⚠️ Sitemap no generado (continuando build):',
      error instanceof Error ? error.message : error
    )
  }
}

await generateSitemap()