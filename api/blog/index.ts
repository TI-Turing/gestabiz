/**
 * Vercel Edge Function — SSR meta tags para el índice del Blog
 * Intercepta GET /blog y devuelve index.html con meta tags específicos del blog.
 */

export const config = { runtime: 'edge' }

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildBlogIndexMetaHtml(canonical: string): string {
  const title       = 'Blog de Gestabiz — Guías y Recursos para Negocios de Servicios'
  const description = 'Artículos, guías y comparativas para dueños de salones, clínicas, gimnasios y más negocios de servicios en Colombia. Aprende a gestionar mejor tu negocio.'
  const keywords    = 'blog gestión negocios colombia, guías salón belleza, cómo reducir ausencias citas, software negocios colombia, digitalizar pyme colombia, recursos emprendedores colombia'
  const image       = 'https://gestabiz.com/og-image.png'

  const blogJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de Gestabiz',
    description: 'Guías, comparativas y recursos para negocios de servicios en Colombia',
    url: canonical,
    publisher: {
      '@type': 'Organization',
      name: 'Gestabiz',
      logo: { '@type': 'ImageObject', url: image },
    },
    inLanguage: 'es-CO',
  })

  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="keywords" content="${esc(keywords)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Gestabiz" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<script type="application/ld+json">${blogJsonLd}</script>`,
  ].join('\n  ')
}

export default async function handler(req: Request): Promise<Response> {
  const url      = new URL(req.url)
  const canonical = `${url.origin}/blog`

  const indexRes = await fetch(`${url.origin}/index.html`)
  let html = await indexRes.text()

  const metaHtml = buildBlogIndexMetaHtml(canonical)

  html = html
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta name="title"[^>]*>/g, '')
    .replace(/<meta name="keywords"[^>]*>/g, '')
    .replace(/<meta name="robots"[^>]*>/g, '')
    .replace(/<meta property="og:[^"]*"[^>]*>/g, '')
    .replace(/<meta name="twitter:[^"]*"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace(/<link rel="alternate"[^>]*>/g, '')
    .replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '')
    .replace('</head>', `  ${metaHtml}\n</head>`)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  })
}
