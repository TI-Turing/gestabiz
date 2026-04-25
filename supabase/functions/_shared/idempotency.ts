/**
 * Idempotency helper for payment webhooks.
 *
 * Protege contra replay attacks y retries duplicados de los proveedores
 * (Stripe, PayU, MercadoPago) usando la tabla public.webhook_idempotency_keys.
 *
 * Uso típico:
 *
 *   const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
 *   const { firstSeen, duplicateResponse } = await checkIdempotency(supabase, 'stripe', event.id, req)
 *   if (!firstSeen) return duplicateResponse
 *
 *   // ... procesar el evento normalmente ...
 *
 *   await markIdempotencyProcessed(supabase, 'stripe', event.id, 200)
 *
 * Ref: Obsidian/Gestabiz/Contexto/auditoria-completa-abril-2026.md §1.2
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from './cors.ts'

export type WebhookProvider = 'stripe' | 'payu' | 'mercadopago'

export interface IdempotencyCheckResult {
  /** true si es la primera vez que vemos este event_id */
  firstSeen: boolean
  /** Response 200 con {status:"duplicate"} lista para devolver si firstSeen=false */
  duplicateResponse: Response
}

/**
 * Intenta registrar un event_id como visto. Si ya existía, devuelve
 * firstSeen=false junto con la Response que el caller debe retornar tal cual.
 *
 * La lógica es atómica: el INSERT ... ON CONFLICT DO NOTHING garantiza que
 * dos webhooks concurrentes con el mismo event_id solo permitan a UNO pasar.
 */
export async function checkIdempotency(
  supabase: SupabaseClient,
  provider: WebhookProvider,
  eventId: string,
  req: Request,
): Promise<IdempotencyCheckResult> {
  if (!eventId) {
    throw new Error(`[idempotency] ${provider}: eventId is required`)
  }

  const { data, error } = await supabase
    .from('webhook_idempotency_keys')
    .insert({ provider, event_id: eventId })
    .select('event_id')
    .maybeSingle()

  // Si el INSERT fue exitoso (data no-null), es first-seen.
  if (data) {
    return {
      firstSeen: true,
      duplicateResponse: buildDuplicateResponse(req, provider, eventId),
    }
  }

  // Si error.code === '23505' (unique_violation) → duplicado esperado.
  // Cualquier otro error → relanzar para que el webhook devuelva 500 y el
  // proveedor reintente (y en el reintento se resolverá).
  if (error && error.code !== '23505') {
    throw new Error(`[idempotency] ${provider}: ${error.message}`)
  }

  return {
    firstSeen: false,
    duplicateResponse: buildDuplicateResponse(req, provider, eventId),
  }
}

/**
 * Registra el status final con el que se procesó el evento. Se llama al
 * final del handler para tener trazabilidad de qué eventos resolvieron en
 * 200 vs 4xx/5xx. No-throw: si falla, solo loguea.
 */
export async function markIdempotencyProcessed(
  supabase: SupabaseClient,
  provider: WebhookProvider,
  eventId: string,
  responseStatus: number,
): Promise<void> {
  try {
    await supabase
      .from('webhook_idempotency_keys')
      .update({ response_status: responseStatus })
      .eq('provider', provider)
      .eq('event_id', eventId)
  } catch (err) {
    console.warn(`[idempotency] ${provider}: failed to update response_status for ${eventId}:`, err)
  }
}

function buildDuplicateResponse(req: Request, provider: WebhookProvider, eventId: string): Response {
  return new Response(
    JSON.stringify({ status: 'duplicate', provider, event_id: eventId }),
    {
      status: 200,
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json',
      },
    },
  )
}
