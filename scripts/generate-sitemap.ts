/**
 * Genera sitemap.xml dinámicamente con todos los perfiles públicos de negocios.
 *
 * Ejecutar: npm run generate-sitemap
 * También se ejecuta automáticamente como parte del build en Vercel.
 *
 * Genera public/sitemap.xml con:
 * - Landing page
 * - Landing pages por vertical: /para/{slug}
 * - Blog index: /blog
 * - Artículos del blog: /blog/{slug}
 * - Todos los perfiles públicos: /negocio/{slug}
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { config } from 'dotenv'

// Slugs de los verticales (sincronizado con src/data/verticals.ts)
const VERTICAL_SLUGS = [
  'salones', 'barberias', 'clinicas', 'gimnasios', 'spas',
  'odontologos', 'psicologos', 'fisioterapeutas', 'entrenadores', 'coworkings',
]

// Slugs de artículos del blog (sincronizado con src/data/blog.ts)
const BLOG_SLUGS = [
  'como-reducir-ausencias-citas-whatsapp',
  'software-salones-belleza-colombia-2026',
  'gestabiz-vs-calendly-colombia',
  'como-digitalizar-negocio-servicios-colombia',
  'agenda-online-ventajas-para-negocios',
]

// Cargar variables de entorno desde .env.local en desarrollo
config({ path: path.resolve(process.cwd(), '.env.local') })
config({ path: path.resolve(process.cwd(), '.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''
const SITE_URL = (process.env.VITE_SITE_URL || 'https://gestabiz.com').replace(/\/$/, '')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function generateSitemap() {
  console.log('🚀 Generando sitemap.xml...')
  console.log(`🌐 Site URL: ${SITE_URL}`)

  try {
    // Fetch todos los negocios públicos con slug válido
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('slug, updated_at, name')
      .eq('is_public', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Error fetching businesses: ${error.message}`)
    }

    const today = new Date().toISOString().split('T')[0]

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
    xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n'
    xml += '          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'

    // Landing Page — máxima prioridad
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}/</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n'

    // Landing pages por vertical (prioridad alta, contenido estático)
    for (const slug of VERTICAL_SLUGS) {
      xml += '  <url>\n'
      xml += `    <loc>${SITE_URL}/para/${slug}</loc>\n`
      xml += `    <lastmod>${today}</lastmod>\n`
      xml += '    <changefreq>monthly</changefreq>\n'
      xml += '    <priority>0.9</priority>\n'
      xml += '  </url>\n'
    }
    console.log(`✅ ${VERTICAL_SLUGS.length} landing pages verticales agregadas`)

    // Blog index
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}/blog</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'

    // Artículos del blog
    for (const slug of BLOG_SLUGS) {
      xml += '  <url>\n'
      xml += `    <loc>${SITE_URL}/blog/${slug}</loc>\n`
      xml += `    <lastmod>${today}</lastmod>\n`
      xml += '    <changefreq>monthly</changefreq>\n'
      xml += '    <priority>0.7</priority>\n'
      xml += '  </url>\n'
    }
    console.log(`✅ ${BLOG_SLUGS.length + 1} páginas del blog agregadas`)

    if (!businesses || businesses.length === 0) {
      console.warn('⚠️  No se encontraron negocios públicos')
    } else {
      console.log(`✅ Encontrados ${businesses.length} negocios públicos`)

      for (const business of businesses) {
        if (!business.slug) continue

        const lastmod = business.updated_at
          ? new Date(business.updated_at).toISOString().split('T')[0]
          : today

        const slug = escapeXml(business.slug)

        xml += '  <url>\n'
        xml += `    <loc>${SITE_URL}/negocio/${slug}</loc>\n`
        xml += `    <lastmod>${lastmod}</lastmod>\n`
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.8</priority>\n'
        xml += '  </url>\n'
      }
    }

    xml += '</urlset>\n'

    // Escribir en public/
    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const sitemapPath = path.join(publicDir, 'sitemap.xml')
    fs.writeFileSync(sitemapPath, xml, 'utf-8')

    const totalUrls = (businesses?.length ?? 0) + 1 + VERTICAL_SLUGS.length + BLOG_SLUGS.length + 1
    console.log(`✅ Sitemap generado: ${sitemapPath}`)
    console.log(`📊 Total URLs: ${totalUrls}`)
    console.log(`🔗 Ver en: ${SITE_URL}/sitemap.xml`)

  } catch (error) {
    console.error('❌ Error generando sitemap:', error)
    process.exit(1)
  }
}

await generateSitemap()
