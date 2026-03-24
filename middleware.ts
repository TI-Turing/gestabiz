/**
 * Vercel Edge Middleware — IP protection for dev.gestabiz.com
 *
 * Only requests coming from IPs listed in DEV_ALLOWED_IPS (comma-separated
 * env var, set in Vercel for Preview environments) can access the dev URL.
 * All other environments (production) pass through without any check.
 */

export const config = {
  matcher: '/(.*)',
}

export default function middleware(request: Request): Response | undefined {
  const host = new URL(request.url).hostname

  // Only enforce protection on the dev subdomain
  if (host !== 'dev.gestabiz.com') {
    return undefined // pass through
  }

  const allowedIPs = (process.env.DEV_ALLOWED_IPS ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)

  // If no IPs are configured, block everyone (fail closed)
  if (allowedIPs.length === 0) {
    return forbidden()
  }

  // Vercel sets x-real-ip to the real client IP (already de-proxied)
  const clientIP =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    ''

  if (!allowedIPs.includes(clientIP)) {
    return forbidden(clientIP)
  }

  return undefined // pass through
}

function forbidden(ip = ''): Response {
  const body = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Acceso Restringido — Gestabiz Dev</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
    .box { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p  { color: #94a3b8; margin: 0.25rem 0; }
    code { background: #1e293b; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🔒 Acceso Restringido</h1>
    <p>Este entorno solo es accesible desde IPs autorizadas.</p>
    ${ip ? `<p>Tu IP: <code>${ip}</code></p>` : ''}
    <p style="margin-top:1rem;font-size:0.8rem;color:#475569">Gestabiz Dev — Ambiente de Desarrollo</p>
  </div>
</body>
</html>`

  return new Response(body, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
