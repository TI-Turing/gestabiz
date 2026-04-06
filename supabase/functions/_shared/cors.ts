/**
 * CORS utility for Supabase Edge Functions
 * Restricts allowed origins to known app domains
 */

const ALLOWED_ORIGINS = [
  'https://gestabiz.com',
  'https://www.gestabiz.com',
  'https://dev.gestabiz.com',
  'https://gestabiz.vercel.app',
  // Development
  'http://localhost:5173',
  'http://localhost:3000',
]

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  }
}

export function handleCorsPreFlight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  return null
}
