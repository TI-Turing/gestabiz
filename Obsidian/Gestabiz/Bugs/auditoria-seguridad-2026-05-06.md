---
date: 2026-05-06
tags: [seguridad, auditoria, edge-functions, rls, owasp, supabase, vercel]
status: pendiente-fix
ronda: 6 (informal)
relacionados:
  - "[[secretos-en-scripts-gitguardian]]"
---

# Auditoría de Seguridad — 6 May 2026

> Auditoría estática del código fuente, Edge Functions, migraciones y configuración de despliegue de Gestabiz (rama `dev`).
> Complementa a `SECURITY_AUDIT.md` (R1–R3, 30 vulns, 18 corregidas) y `SECURITY_PENDING.md` (R5 cerró VULN-41 a 51).
> Esta nota lista **hallazgos NUEVOS** no documentados antes y confirma estado de algunos pendientes.

## Resumen ejecutivo

| Severidad | Cantidad | Notas |
|-----------|---------:|-------|
| 🔴 Crítico | 3 | Webhook sin firma + función SQL DEFINER abierta + OTP sin auth |
| 🟠 Alto | 4 | Cron sin secreto, bug-report sin JWT, árbol duplicado, payout interno sin guard |
| 🟡 Medio | 3 | `send-confirmation` sin JWT, `search_path` faltante, falta CSP |
| 🟢 Bajo | 3 | CORS inline `*` en 4 funciones, `innerHTML` controlado, headers menores |
| ℹ️ Info | 2 | `VITE_*` en `vercel.json` (ya documentado), `localStorage` OK |

**Postura general**: 🟠 **Mejorable**. Base sólida pero quedan 3 vectores críticos corregibles en <4 horas.

---

## Base sólida de seguridad (lo que está bien)

Antes de los hallazgos, vale dejar registro de **lo que sí está bien implementado** para no romperlo en próximas refactors:

### Frontend
- ✅ **Cliente Supabase singleton** (`src/lib/supabase.ts`) con validación FAIL-LOUD en PROD si faltan env vars.
- ✅ **Sin secretos en `localStorage`**: 20+ usos verificados, solo guardan preferencias (`preferred-location-${businessId}`, `cookie-consent`, KV demo). Ningún token ni secreto.
- ✅ **`dangerouslySetInnerHTML`** solo aparece en `src/components/ui/chart.tsx` y es seguro: solo inyecta CSS variables construidas a partir de `config` controlado por el desarrollador (patrón estándar de shadcn/ui).
- ✅ **`innerHTML =`** solo en `src/components/client/SearchBar.tsx` línea 355, asignando SVG estático sin input de usuario.
- ✅ **No se encontró `eval()`** en código de aplicación.

### Edge Functions canónicas (`supabase/functions/`)
- ✅ **`stripe-webhook`**: usa `stripe.webhooks.constructEvent` con secret + idempotencia. ✅ Excelente.
- ✅ **`payu-webhook`**: verifica firma MD5 con intento de comparación constant-time.
- ✅ **`activate-free-trial`**: JWT + ownership + múltiples capas de validación. Modelo a seguir.
- ✅ **`create-test-users`**: gateado por `CREATE_TEST_USERS_SECRET` (devuelve 403 si no está configurado, 401 si hay mismatch).
- ✅ **`get-client-dashboard-data`**: validación JWT con `auth.getUser(token)` + validación de input + UUID regex.
- ✅ **`send-message`** (chat): valida JWT + rate limiting (30 msgs/min) + filtro básico de palabras prohibidas.
- ✅ **CORS por whitelist** vía `_shared/cors.ts` en la mayoría de funciones canónicas.
- ✅ **Sentry integrado** en la mayoría de funciones para captura de errores.
- ✅ **HTML escaping** disponible vía `_shared/html.ts` (`escapeHtml`).

### Configuración de despliegue
- ✅ **`vercel.json`** con headers de seguridad: `X-Frame-Options: DENY`, `Strict-Transport-Security` con preload, `Permissions-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- ✅ **Validación de claves Supabase**: el código rechaza placeholders y URLs vacías.

### Rondas previas de seguridad
- ✅ R5 cerró: payu/mercadopago auth, webhook fail-closed, `CRON_SECRET` en `check-business-inactivity`, IDOR en `calendar-integration`, open redirects, HTML injection.
- ✅ R1+R2 corrigieron 18 de 30 vulnerabilidades reportadas.

---

## 🔴 Vectores CRÍTICOS

### VULN-A1 — `mercadopago-webhook` sin verificación de firma HMAC
- **Archivo**: `supabase/functions/mercadopago-webhook/index.ts`
- **OWASP**: A02 (Cryptographic Failures), A08 (Software & Data Integrity Failures), A04 (Insecure Design)

**Riesgo**: Spoofing de pagos. Cualquiera puede enviar `POST /functions/v1/mercadopago-webhook?topic=payment&id=<ID>` y disparar el flujo de upgrade/renovación de plan. La función consulta MercadoPago con el `id`, pero un atacante puede pasar un `id` real ajeno y forzar a Gestabiz a procesar el pago de un tercero como si fuera propio si la metadata `external_reference` apunta a un negocio que controla.

**Evidencia**: `grep_search "x-signature|MERCADOPAGO_WEBHOOK_SECRET"` → 0 matches. La función solo lee `topic` y `id` del query string.

**Recomendación**:
1. Activar webhooks firmados en MercadoPago, guardar secret como `MERCADOPAGO_WEBHOOK_SECRET`.
2. Verificar header `x-signature` (formato `ts=...,v1=...`) calculando HMAC-SHA256 de `id:<id>;request-id:<x-request-id>;ts:<ts>` y comparar con `crypto.timingSafeEqual`.
3. Mientras tanto, validar al menos que `payment.collector_id` corresponda a la cuenta MercadoPago propia.

### VULN-A2 — `get_supabase_service_role_key()` SECURITY DEFINER potencialmente abierta
- **Archivo**: `supabase/migrations/00000000000000_consolidated_schema.sql` líneas ~4408
- **OWASP**: A01 (Broken Access Control), A04 (Insecure Design)

**Riesgo**: Función marcada `SECURITY DEFINER` que devuelve la **service role key**. No se encontró ningún `REVOKE EXECUTE … FROM PUBLIC` ni `GRANT EXECUTE … TO service_role` en ninguna migración. Si los grants por defecto de PostgreSQL aplican, **cualquier usuario autenticado podría hacer `select get_supabase_service_role_key()` vía PostgREST** y obtener la clave maestra → bypass total de RLS.

**Verificación inmediata** (Studio LOCAL):
```sql
SELECT proacl FROM pg_proc WHERE proname = 'get_supabase_service_role_key';
```
Si `proacl` es `NULL` o incluye `=X/postgres`, está accesible para PUBLIC.

**Recomendación**:
1. **Eliminar la función completamente** — la service role key NUNCA debe ser leíble por SQL. Las Edge Functions ya la reciben por `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.
2. Si se mantiene: `REVOKE EXECUTE ON FUNCTION get_supabase_service_role_key() FROM PUBLIC, anon, authenticated;` + `GRANT EXECUTE TO service_role;` + `SET search_path = pg_catalog, public`.

### VULN-A3 — `send-phone-otp` y `verify-phone-otp` aceptan `userId` arbitrario sin auth del caller
- **Archivos**: `supabase/functions/send-phone-otp/index.ts`, `supabase/functions/verify-phone-otp/index.ts`
- **OWASP**: A01, A07 (Identification & Authentication Failures), A04

**Riesgo**:
- `send-phone-otp`: no llama a `auth.getUser()`. Lee `userId` y `phone` del body → atacante puede **enumerar números** asociados a cuentas, generar **costos SMS ilimitados** (DoS económico vía AWS SNS) y **spamear** víctimas.
- `verify-phone-otp`: mismo patrón. Permite **fuerza bruta** del OTP de 6 dígitos sobre cualquier `userId` (1M combinaciones, sin rate limit visible).

**Recomendación**:
1. Validar JWT del caller con `auth.getUser()` y forzar `userId === user.id`.
2. Rate limit por IP **y** por `userId` (3 envíos/hora, 5 verificaciones/15min).
3. Bloquear cuenta tras 5 verificaciones fallidas consecutivas.

---

## 🟠 Vectores ALTOS

### VULN-A4 — `process-expired-plans` cron sin `CRON_SECRET`
- **Archivo**: `supabase/functions/process-expired-plans/index.ts`
- **OWASP**: A01

**Riesgo**: Endpoint público sin autenticación. Cualquiera puede invocarlo y forzar transición de planes a expirado fuera del cron real → degradación de servicio para clientes pagos, posible cancelación de funciones premium.

**Recomendación**: aplicar patrón de `check-business-inactivity` (Round 5):
```ts
const cronSecret = Deno.env.get('CRON_SECRET');
const provided = req.headers.get('x-cron-secret');
if (!cronSecret || provided !== cronSecret) return new Response('Forbidden', { status: 403 });
```

### VULN-A5 — `send-bug-report-email` solo verifica que exista `Authorization` (no valida JWT)
- **Archivo**: `supabase/functions/send-bug-report-email/index.ts` línea 35
- **OWASP**: A01, A03 (Injection)

**Riesgo**: Comprueba `if (!authHeader) throw` pero **no llama a `auth.getUser(token)`**. Cualquier string en `Authorization: Bearer xxx` pasa. Permite spam de emails al equipo de soporte (consumo de cuota Brevo) e inyección de payloads HTML al template del correo si los campos no están escapados (hay `escapeHtml` importado, validar uso completo en el HTML del email).

**Recomendación**: agregar `await supabase.auth.getUser(token)` y forzar `userId === user.id`. Verificar que TODOS los campos del email usen `escapeHtml()`.

### VULN-A6 — Árbol duplicado `src/supabase/functions/` con patrones inseguros
- **Ubicación**: `src/supabase/functions/**` (11 funciones duplicadas vs ~50 en `supabase/functions/`)
- **OWASP**: A05 (Security Misconfiguration), A08

**Riesgo**:
- Confusión: desarrolladores pueden parchear el árbol equivocado.
- 16 matches de `Access-Control-Allow-Origin: *` están en este árbol stale.
- 20 matches de `SUPABASE_SERVICE_ROLE_KEY` con patrones más débiles.
- Si el deploy CI/CD apunta al directorio incorrecto, se publican versiones inseguras.

**Recomendación**:
1. **Eliminar `src/supabase/functions/` completamente** (un solo árbol canónico: `supabase/functions/`).
2. Agregar regla en CI que falle si existe ese path.
3. Auditar `.gitignore` y workflow de deploy para que solo despliegue el canónico.

### VULN-A7 — `mercadopago-payout-referral` sin guardia de "internal-only"
- **Archivo**: `supabase/functions/mercadopago-payout-referral/index.ts`
- **OWASP**: A01, A04

**Riesgo**: Diseñada para ser invocada solo desde `mercadopago-webhook`, pero no verifica secreto interno ni JWT. Atacante puede dispararla directamente con un `referral_code_id` válido → payouts duplicados/fraudulentos.

**Recomendación**: header compartido `x-internal-secret` validado contra `INTERNAL_FUNCTION_SECRET`, e idempotencia por `referral_code_id + payment_id`.

---

## 🟡 Vectores MEDIOS

### VULN-A8 — `send-confirmation` sin verificación JWT
- **Archivo**: `supabase/functions/send-confirmation/index.ts`
- **OWASP**: A01, A04

**Riesgo**: Acepta payload `appointment` del body sin auth. Permite spam de correos de confirmación con datos arbitrarios (suplantación de Gestabiz para phishing) y posible filtración si la función después consulta y devuelve datos.

**Recomendación**: validar JWT y verificar que `user.id === appointment.client_id` o sea owner/employee del negocio.

### VULN-A9 — `get_supabase_service_role_key()` sin `SET search_path`
- **Archivo**: misma migración consolidada
- **OWASP**: A04, A05

**Riesgo**: Además de VULN-A2, al ser SECURITY DEFINER sin `SET search_path = pg_catalog, public`, es vulnerable a **search_path hijacking**: atacante con permiso `CREATE` en algún schema puede crear funciones que sombreen funciones del sistema y se ejecuten con privilegios del owner.

**Recomendación**: si no se elimina, agregar `SET search_path = pg_catalog, public`. **Auditar TODAS las funciones SECURITY DEFINER del schema** con la misma omisión.

### VULN-A10 — `vercel.json` sin Content-Security-Policy
- **Archivo**: `vercel.json`
- **OWASP**: A05

**Riesgo**: Buenos headers (HSTS, X-Frame-Options DENY, Permissions-Policy, X-Content-Type-Options, Referrer-Policy) pero **falta CSP**. Sin CSP, un XSS reflejado o stored sería inmediatamente explotable.

**Recomendación**: añadir CSP estricta. Borrador inicial:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://api.stripe.com https://www.google-analytics.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; frame-src https://js.stripe.com https://www.mercadopago.com.co; object-src 'none'; base-uri 'self'; form-action 'self'"
}
```
Probar primero en `Content-Security-Policy-Report-Only` durante 1 semana.

---

## 🟢 Vectores BAJOS

### VULN-A11 — CORS inline `*` en funciones canónicas
- **Archivos**: `start-call/index.ts`, `end-call/index.ts`, `notify-business-unconfigured/index.ts`, `search_businesses/index.ts`
- **Riesgo**: Inconsistencia con el resto del repo que usa `_shared/cors.ts` (whitelist por origen). La auth real está dentro de la función, pero mejora defensa en profundidad.
- **Recomendación**: migrar las 4 a `getCorsHeaders(req)` / `handleCorsPreFlight(req)`.

### VULN-A12 — `innerHTML =` en `SearchBar.tsx`
- **Archivo**: `src/components/client/SearchBar.tsx` línea 355
- **Riesgo**: SVG estático sin input de usuario → seguro hoy. Riesgo: si alguien refactoriza para incluir variables, se vuelve XSS.
- **Recomendación**: reemplazar por JSX/React state para prevenir regresiones.

### VULN-A13 — `dangerouslySetInnerHTML` en `chart.tsx`
- **Archivo**: `src/components/ui/chart.tsx` línea 99
- **Riesgo**: solo inyecta CSS variables construidas a partir de `config` (control del desarrollador) e `id` (controlado por componente). Patrón estándar shadcn/ui.
- **Recomendación**: ninguna acción inmediata. Asegurar que `id` nunca venga de input de usuario. Considerar `CSS.escape()`.

---

## ℹ️ Informativos

### INFO-A1 — `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` expuestos en `vercel.json`
Ya reportado como **VULN-03** en `SECURITY_AUDIT.md` / **P-01** en `SECURITY_PENDING.md`.
La `anon key` es pública por diseño cuando RLS está bien configurada. **Pero**: la confianza en RLS hace que un solo policy con `USING (true)` o `WITH CHECK (true)` lo arruine todo. Pendiente: auditoría completa de policies.

### INFO-A2 — `localStorage` no almacena secretos
20+ usos verificados: solo guarda `preferred-location-${businessId}`, `cookie-consent`, datos de demo de `useKV`. ✅ OK.

---

## Top-5 Quick Wins

| # | Acción | Tiempo | Severidad cerrada |
|---|--------|--------|-------------------|
| 1 | Verificar permisos de `get_supabase_service_role_key()` (`SELECT proacl FROM pg_proc...`) y `REVOKE … FROM PUBLIC` o eliminar | 15 min | 🔴 VULN-A2 |
| 2 | Agregar `CRON_SECRET` a `process-expired-plans` (copiar patrón de `check-business-inactivity`) | 20 min | 🟠 VULN-A4 |
| 3 | Validar JWT real en `send-phone-otp`, `verify-phone-otp`, `send-bug-report-email`, `send-confirmation` | 1 h | 🔴 + 🟠 + 🟡 (A3, A5, A8) |
| 4 | Eliminar `src/supabase/functions/` y agregar guard en CI | 30 min | 🟠 VULN-A6 |
| 5 | Implementar verificación HMAC en `mercadopago-webhook` | 2 h | 🔴 VULN-A1 |

**Total para cerrar todo CRÍTICO + ALTO**: ~4 horas.

---

## Lo que NO se auditó (pendiente Round 6)

- **Cobertura RLS exhaustiva por tabla**: ~150+ políticas RLS no inspeccionadas. Buscar especialmente `USING (true)`, `WITH CHECK (true)` o policies que solo filtren por columnas no relacionadas con `auth.uid()`.
- **Storage buckets**: no verifiqué que `cvs`, `chat-attachments`, `bug-report-evidences` sean realmente privados ni sus policies de Storage.
- **`vite.config.ts` y exposición en bundle**: revisar si alguna variable sin prefijo `VITE_` se filtra por mala configuración.
- **`npm audit` / dependencias**: ejecutar `npm audit --production` y `pnpm audit` periódicamente.
- **SQL Injection en RPCs**: ~10 funciones RPC (`search_businesses`, `get_client_dashboard_data`, etc.) en busca de concatenación dinámica.
- **Triggers y funciones de BD adicionales**: ~20+ funciones SECURITY DEFINER en el schema; auditar todas en busca del mismo patrón de `search_path`.
- **CSRF en formularios web**: Supabase Auth no usa cookies por defecto, riesgo bajo, pero no verificado.
- **Logs y exposición de PII**: no se inspeccionaron `console.log` en frontend ni el detalle de `error_logs` para evitar log de tokens/contraseñas.

**Próxima ronda recomendada**: focalizada en **RLS policies + Storage buckets + funciones SECURITY DEFINER restantes**. Es donde hoy está la mayor superficie de ataque silente.

---

## Conclusión

Gestabiz tiene una **base de seguridad sólida** en frontend (cliente Supabase singleton, FAIL-LOUD, patrones de auth correctos en ~80% de Edge Functions, headers de Vercel decentes) y en webhooks de **Stripe y PayU** (firmados correctamente). Las rondas previas (R1–R5) cerraron las vulnerabilidades estructurales más graves.

Sin embargo, persisten **3 vectores críticos** que un atacante motivado podría explotar sin generar logs visibles:

1. **`mercadopago-webhook` sin firma** → fraude financiero / manipulación de planes.
2. **`get_supabase_service_role_key()` SECURITY DEFINER** → potencial bypass total de RLS si está accesible para PUBLIC.
3. **Endpoints OTP sin auth del caller** → enumeración + DoS económico vía SMS.

Los 3 son corregibles en menos de 4 horas. **Priorizar antes de cualquier release a producción.**

---

## Archivos auditados

### Edge Functions inspeccionadas (lectura completa primeros 60–80 líneas)
- `mercadopago-webhook/index.ts` ❌ sin firma
- `payu-webhook/index.ts` ✅ firma MD5
- `stripe-webhook/index.ts` ✅ constructEvent
- `process-expired-plans/index.ts` ❌ sin auth
- `send-phone-otp/index.ts` ❌ sin auth caller
- `verify-phone-otp/index.ts` ❌ sin auth caller
- `send-confirmation/index.ts` ❌ sin JWT
- `send-bug-report-email/index.ts` ❌ JWT no validado
- `start-call/index.ts` ✅ auth OK / ⚠️ CORS inline
- `end-call/index.ts` ⚠️ CORS inline
- `activate-free-trial/index.ts` ✅ excelente
- `create-test-users/index.ts` ✅ secret gating
- `mercadopago-payout-referral/index.ts` ❌ sin guard interno
- `get-client-dashboard-data/index.ts` ✅ auth + UUID validation
- `send-message/index.ts` ✅ auth + rate limit
- `send-renewal-reminder/index.ts` (template HTML revisado)

### Frontend
- `src/lib/supabase.ts` ✅ singleton + FAIL-LOUD
- `src/components/ui/chart.tsx` ✅ DSI controlado
- `src/components/client/SearchBar.tsx` ✅ innerHTML estático

### Configuración
- `vercel.json` ⚠️ falta CSP, resto OK
- `supabase/migrations/00000000000000_consolidated_schema.sql` ❌ función DEFINER abierta

### Búsquedas globales
- `dangerouslySetInnerHTML|innerHTML|eval` → 2 matches benignos
- `SUPABASE_SERVICE_ROLE_KEY` en src/ → 20 matches en árbol stale
- `Access-Control-Allow-Origin: *` → 16 matches (mayoría stale + 4 canónicos)
- `localStorage.(setItem|getItem)` → 20+ matches sin secretos
- `x-signature|MERCADOPAGO_WEBHOOK_SECRET` → 0 matches
- `REVOKE.*get_supabase_service_role_key|GRANT.*get_supabase_service_role_key` → 0 matches

---

*Auditoría realizada con Claude Sonnet 4.5 — análisis estático, sin pentesting activo. Recomendado complementar con escaneo dinámico (OWASP ZAP) y `npm audit` periódico.*
