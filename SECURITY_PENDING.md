# Vulnerabilidades Pendientes — Gestabiz Security Audit
**Generado**: 16 de Marzo, 2026
**Fuente**: Rondas 1, 2 y 3 de SECURITY_AUDIT.md
**Total pendiente**: 18 ítems (5 config manual + 13 código/infraestructura)

---

## Resumen por Severidad

| Severidad | Pendientes |
|-----------|-----------|
| CRÍTICO   | 3 (config manual) |
| ALTO      | 4 |
| MEDIO     | 7 |
| BAJO      | 4 |
| **Total** | **18** |

---

## CRÍTICOS PENDIENTES (Acciones Manuales — No automatizables por código)

### P-01 — Credenciales expuestas en `vercel.json` (VULN-03)
**Severidad**: CRÍTICO | **Tipo**: Configuración manual
**Archivo**: `vercel.json`

**Problema**: `VITE_SUPABASE_ANON_KEY` y `VITE_SUPABASE_URL` están hardcodeadas en `vercel.json`, que está commiteado al repositorio. Aunque la anon key es semi-pública por diseño de Supabase (RLS protege los datos), es una mala práctica exponer credenciales en el repo.

**Acción requerida**:
1. Ir a **Vercel Dashboard → Project Settings → Environment Variables**
2. Agregar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, y todas las demás `VITE_*` vars
3. Eliminar la sección `"env": { ... }` de `vercel.json`
4. Hacer redeploy en Vercel

---

### P-02 — Verificar que `.env` nunca fue commiteado (VULN-03 extensión)
**Severidad**: CRÍTICO | **Tipo**: Verificación manual
**Archivos**: `.env`, historial git

**Problema**: Si el archivo `.env` con `SUPABASE_SERVICE_ROLE_KEY` fue commiteado alguna vez, todas las credenciales deben rotarse inmediatamente.

**Acción requerida**:
```bash
git log --all --full-history -- .env
git log --all --full-history -- "*.env"
```
Si hay resultados: rotar todas las credenciales en los dashboards de Supabase, Stripe, Brevo, WhatsApp Business API.

---

### P-03 — Configurar `MERCADOPAGO_WEBHOOK_SECRET` en Supabase Secrets (VULN-31)
**Severidad**: CRÍTICO | **Tipo**: Configuración manual
**Función**: `supabase/functions/mercadopago-webhook/index.ts`

**Problema**: La verificación HMAC-SHA256 del webhook de MercadoPago fue implementada en el código, pero requiere que la variable `MERCADOPAGO_WEBHOOK_SECRET` esté configurada en los Supabase Secrets o la verificación fallará silenciosamente.

**Acción requerida**:
```bash
npx supabase secrets set MERCADOPAGO_WEBHOOK_SECRET=<webhook_secret_from_mp_dashboard>
```
Obtener el valor en: MercadoPago Dashboard → Notificaciones → Clave secreta.

---

## ALTOS PENDIENTES (Código/Infraestructura)

### P-04 — Rate limiting no persistente en `send-message` (VULN-07)
**Severidad**: ALTO | **Tipo**: Infraestructura
**Archivo**: `supabase/functions/send-message/index.ts`

**Problema**: Rate limiting implementado con `Map` en memoria Deno. En entornos serverless, cada cold start reinicia el mapa, permitiendo que un atacante evite el límite reiniciando la función.

**Solución recomendada**: Usar **Upstash Redis** (serverless-compatible):
```typescript
import { Redis } from 'https://esm.sh/@upstash/redis'
const redis = new Redis({ url: Deno.env.get('UPSTASH_URL')!, token: Deno.env.get('UPSTASH_TOKEN')! })
const key = `rate:send-message:${userId}`
const count = await redis.incr(key)
if (count === 1) await redis.expire(key, 60)
if (count > 10) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
```
Alternativa: tabla `rate_limit_events(user_id, action, window_start)` en Supabase.

---

### P-05 — Sin rate limiting en endpoints de pago checkout (VULN-08 / VULN-36)
**Severidad**: ALTO | **Tipo**: Infraestructura
**Archivos**:
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/payu-create-checkout/index.ts`
- `supabase/functions/mercadopago-create-preference/index.ts`

**Problema**: Usuarios autenticados pueden crear sesiones de pago ilimitadas, pudiendo agotar cuotas de APIs de pago (Stripe, PayU, MercadoPago) o crear spam de transacciones/cobros.

**Solución recomendada**: Máximo 10 intentos por usuario por hora. Implementar con tabla Supabase o Upstash Redis (mismo patrón que P-04).

---

### P-06 — Webhooks sin deduplicación (procesamiento duplicado) (VULN-24)
**Severidad**: ALTO | **Tipo**: Base de datos
**Archivos**:
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/payu-webhook/index.ts`
- `supabase/functions/mercadopago-webhook/index.ts`

**Problema**: Sin idempotency keys ni deduplicación, el mismo webhook puede procesarse múltiples veces si el gateway reintenta la notificación, creando registros duplicados de pagos o activaciones duplicadas de suscripciones.

**Solución recomendada**: Crear migración SQL:
```sql
CREATE TABLE webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,        -- 'stripe' | 'payu' | 'mercadopago'
  event_id TEXT NOT NULL,      -- ID del evento del gateway
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, event_id)
);
```
En cada webhook, antes de procesar:
```typescript
const { error } = await supabase.from('webhook_events').insert({ source: 'stripe', event_id: event.id })
if (error?.code === '23505') return new Response('Already processed', { status: 200 })
```

---

### P-07 — `manage-subscription` solo permite owner (VULN-28)
**Severidad**: ALTO | **Tipo**: Código
**Archivo**: `supabase/functions/manage-subscription/index.ts`

**Problema**: Solo el owner del negocio puede gestionar suscripciones. Los admins delegados no pueden hacerlo, en violación del modelo de roles documentado.

**Nota**: El historial de la sesión indica que esto podría haberse corregido en Ronda 2, pero la documentación de `SECURITY_AUDIT.md` lo marca como PENDIENTE. Verificar el estado actual del archivo antes de aplicar el fix.

**Solución**: Mismo patrón que VULN-22:
```typescript
const isOwner = business.owner_id === user.id
let isAuthorized = isOwner
if (!isAuthorized) {
  const { data: adminRole } = await supabase.from('business_roles')
    .select('id').eq('user_id', user.id).eq('business_id', businessId)
    .in('role', ['admin', 'manager']).single()
  isAuthorized = !!adminRole
}
if (!isAuthorized) return 403
```

---

## MEDIOS PENDIENTES

### P-08 — Slug de negocio sin verificación de unicidad (VULN-12)
**Severidad**: MEDIO | **Tipo**: Código
**Archivo**: `src/lib/services/businesses.ts` — función `generateSlug`

**Problema**: La función crea slugs sin verificar colisiones en la base de datos. Dos negocios podrían compartir la misma URL pública `/negocio/:slug`.

**Solución recomendada**: Agregar loop de verificación:
```typescript
async function generateUniqueSlug(name: string): Promise<string> {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let slug = base, i = 1
  while (true) {
    const { data } = await supabase.from('businesses').select('id').eq('slug', slug).single()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}
```

---

### P-09 — Metadata sin validar en notificaciones (VULN-13)
**Severidad**: MEDIO | **Tipo**: Código
**Archivo**: `supabase/functions/send-notification/index.ts`

**Problema**: El campo `data` acepta `any` sin límite de tamaño ni validación de estructura. Permite inyectar payloads arbitrariamente grandes en la tabla `in_app_notifications`.

**Solución recomendada**:
```typescript
const MAX_DATA_SIZE = 4096
const dataStr = JSON.stringify(data || {})
if (dataStr.length > MAX_DATA_SIZE) throw new Error('Notification data too large')
const ALLOWED_KEYS = ['appointment_id', 'business_id', 'employee_id', 'client_id', 'message', 'action_url']
const sanitizedData = Object.fromEntries(
  Object.entries(data || {}).filter(([k]) => ALLOWED_KEYS.includes(k))
)
```

---

### P-10 — Validación de email en `request-absence` antes de `send-notification` (VULN-26)
**Severidad**: MEDIO | **Tipo**: Código
**Archivo**: `supabase/functions/request-absence/index.ts` (líneas 305-322)

**Problema**: Los emails de admins obtenidos de la BD se pasan directamente al servicio de notificación sin validar formato. Si un perfil tiene email malformado, puede causar errores inesperados.

**Solución**:
```typescript
const validAdminEmails = adminEmails.filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
```

---

### P-11 — Stack traces expuestos en Edge Functions (VULN-37)
**Severidad**: MEDIO | **Tipo**: Código
**Archivos**:
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/send-email/index.ts` (catch block final)
- `supabase/functions/send-whatsapp/index.ts` (catch block final — fallback log)

**Problema**: Los catch blocks retornan `error.message` o `error.stack` directamente al cliente, exponiendo rutas de archivo, líneas de código y estructura interna.

**Código vulnerable** (patrón en múltiples funciones):
```typescript
catch (error) {
  return new Response(JSON.stringify({ error: error.message }), { status: 500 })
}
```

**Solución**: Respuesta genérica + log interno:
```typescript
catch (error) {
  console.error('Internal error:', error)  // Para Sentry/logs internos
  return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 })
}
```

---

### P-12 — CORS wildcard en funciones internas de notificación (VULN-38)
**Severidad**: MEDIO | **Tipo**: Código
**Archivos**:
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/send-email-reminder/index.ts`
- `supabase/functions/send-sms-reminder/index.ts`
- `supabase/functions/process-reminders/index.ts`
- `supabase/functions/refresh-ratings-stats/index.ts`
- `supabase/functions/notify-business-unconfigured/index.ts`

**Problema**: Funciones server-to-server usan `Access-Control-Allow-Origin: *`. Estas funciones no necesitan CORS (son llamadas internamente), pero tenerlo con wildcard es innecesariamente permisivo.

**Solución**: Aplicar `_shared/cors.ts` o, para funciones puramente internas, eliminar CORS completamente y agregar verificación de `Authorization: Bearer <SERVICE_ROLE_KEY>`.

---

### P-13 — `send-email-reminder` y `send-sms-reminder` sin validación de destinatario (VULN-39)
**Severidad**: MEDIO | **Tipo**: Código
**Archivos**:
- `supabase/functions/send-email-reminder/index.ts`
- `supabase/functions/send-sms-reminder/index.ts`

**Problema**: Las funciones de recordatorio heredan el mismo problema que `send-email` (VULN-32) y `send-whatsapp` (VULN-34): no validan formato de email/teléfono antes de invocar APIs externas.

**Solución**: Aplicar misma validación que en `send-email` (EMAIL_REGEX + sanitizeEmailField) y `send-whatsapp` (E164_REGEX).

---

### P-14 — `send-whatsapp` fallback log intenta releer `req.json()` (código muerto peligroso)
**Severidad**: MEDIO | **Tipo**: Código
**Archivo**: `supabase/functions/send-whatsapp/index.ts` (líneas 183-187)

**Problema**: El catch block incluye código que intenta leer el body nuevamente con `req.json()`, pero el body ya fue consumido anteriormente. Esto creará errores silenciosos y el log del fallback no funcionará.

```typescript
// Código problemático actual:
console.log('WhatsApp message that failed to send:', {
  to: req.json().then(data => data.to),    // ← req.body ya fue consumido
  message: req.json().then(data => data.message),
})
```

**Solución**: El cuerpo del request debe guardarse antes de consumirlo, o simplemente loguear los valores ya parseados.

---

## BAJOS PENDIENTES

### P-15 — Tokens de sesión en localStorage (VULN-15)
**Severidad**: BAJO | **Tipo**: Architectural (SDK behavior)
**Archivo**: `src/lib/supabase.ts`

**Problema**: Supabase SDK almacena tokens en `localStorage` por defecto, susceptible a XSS.

**Nota**: Este es el comportamiento estándar del SDK. Cambiar a httpOnly cookies requiere un backend proxy y es una refactorización mayor. El riesgo se mitiga con CSP estricto.

**Acción**: Baja prioridad. Considerar para v1.0 con implementación de Content Security Policy estricta.

---

### P-16 — `PermissionGate` modo `warn` accesible en staging (VULN-16/VULN-30)
**Severidad**: BAJO | **Tipo**: Código
**Archivo**: `src/components/ui/PermissionGate.tsx`

**Problema**: El modo `warn` podría usar `process.env.NODE_ENV === 'development'` que puede ser `'development'` en staging si no se configura correctamente.

**Nota**: En Ronda 2 se corrigió usando `import.meta.env.DEV`. Verificar que el fix se aplicó correctamente.

---

### P-17 — URL hardcodeada en `notify-business-unconfigured` (VULN-40)
**Severidad**: BAJO | **Tipo**: Código
**Archivo**: `supabase/functions/notify-business-unconfigured/index.ts`

**Problema**: URL `https://gestabiz.com/app/admin/overview` hardcodeada en el HTML del email, rompiendo staging/preview environments.

**Solución**:
```typescript
const appUrl = Deno.env.get('APP_URL') ?? 'https://gestabiz.com'
// Usar: `${appUrl}/app/admin/overview`
```

---

### P-18 — Content Security Policy (CSP) no configurada
**Severidad**: BAJO | **Tipo**: Configuración
**Archivo**: `vercel.json`

**Problema**: No hay cabecera `Content-Security-Policy` configurada, lo que permitiría inyección de scripts externos si hubiera una vulnerabilidad XSS.

**Acción**: Una vez auditados todos los recursos inline (scripts, estilos, fuentes), agregar CSP en `vercel.json`:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:"
}
```

---

## Deploy Pendiente

Todas las funciones modificadas en Rondas 1-3 deben ser desplegadas:

```bash
# Ronda 1
npx supabase functions deploy appointment-actions
npx supabase functions deploy create-test-users

# Ronda 2
npx supabase functions deploy update-hierarchy
npx supabase functions deploy cancel-future-appointments-on-transfer
npx supabase functions deploy get-client-dashboard-data
npx supabase functions deploy approve-reject-absence
npx supabase functions deploy request-absence
npx supabase functions deploy payu-webhook

# Ronda 3
npx supabase functions deploy mercadopago-webhook
npx supabase functions deploy send-email
npx supabase functions deploy search_businesses
npx supabase functions deploy send-whatsapp
```

---

*Generado: 16 Mar 2026 | Gestabiz v0.0.12 | Fuente: SECURITY_AUDIT.md Rondas 1-3*
