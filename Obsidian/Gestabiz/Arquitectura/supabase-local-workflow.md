---
date: 2026-04-25
tags: [supabase, local, dev, infraestructura, workflow]
---

# Supabase Local — Workflow Operativo

Gestabiz tiene un stack Supabase local basado en Docker que es el **entorno estándar de desarrollo diario**. Es un espejo exacto del DEV remoto y no tiene riesgo de afectar a otros desarrolladores o a producción.

---

## Stack local

| Servicio | URL | Descripción |
|---------|-----|-------------|
| API / PostgREST | `http://localhost:54321` | Mismo endpoint que Supabase Cloud |
| DB (PostgreSQL) | `postgresql://postgres:postgres@localhost:54322/postgres` | Acceso directo a la base de datos |
| Supabase Studio | `http://localhost:54323` | UI visual para tablas, SQL editor, RLS |
| Inbucket (emails) | `http://localhost:54324` | Captura todos los emails enviados localmente |

El archivo `.env.local` apunta automáticamente a localhost y toma prioridad sobre `.env` (que apunta al DEV remoto).

---

## Cuándo usar local vs remoto

| Situación | Local | DEV remoto | PROD |
|-----------|-------|-----------|------|
| Desarrollo diario | ✅ Siempre | — | — |
| Probar migración nueva | ✅ Obligatorio antes del commit | ⚠️ Solo para validación final | ❌ Nunca directo |
| Probar RLS con distintos roles | ✅ | — | — |
| Probar webhooks de pago | ✅ Con ngrok | ⚠️ | — |
| Validación pre-PR | — | ✅ | — |
| Demo a cliente/inversor | — | ✅ | ✅ |
| Integración con Stripe live / Brevo real | — | — | ✅ |

---

## Comandos principales

```bash
# Iniciar/detener
supabase start
supabase stop

# Recrear desde cero (aplica TODAS las migraciones en orden)
supabase db reset

# Comparar schema actual vs migraciones (detectar drift)
supabase db diff

# Servir una Edge Function localmente
supabase functions serve <nombre-funcion> --env-file .env.local

# Ver logs de una función
supabase functions serve <nombre-funcion> --env-file .env.local --debug

# Ver estado de migraciones
npx supabase migration list --dns-resolver https
```

---

## Reglas obligatorias

1. **Toda migración nueva se prueba con `supabase db reset` local antes de commitear.** Si el reset falla, la migración no se commitea.
2. **No ejecutar migraciones directamente en DEV o PROD** — siempre via `npx supabase db push` (DEV) o CI/CD (PROD), y con autorización explícita.
3. **No deployar Edge Functions manualmente** — usar `supabase functions serve` para desarrollo local; el CI/CD hace el deploy al hacer merge a `dev`.

---

## Troubleshooting

| Problema | Causa probable | Solución |
|---------|---------------|---------|
| Puerto 54321/54322 ocupado | Otra instancia corriendo | `supabase stop && supabase start` |
| `supabase db reset` falla con una migración | Migración mal escrita | Corregir el SQL, reintentar |
| Conflicto de migraciones | Migración applied localmente pero no en rama | `supabase db reset --linked=false` |
| App ve DEV en vez de local | `.env.local` no existe o apunta a otro URL | Verificar `VITE_SUPABASE_URL=http://localhost:54321` en `.env.local` |
| Emails no llegan (en tests) | Inbucket es correcto, revisar Edge Function | Abrir `http://localhost:54324` para ver emails capturados |
| Edge Function no se actualiza | Cache de Deno | `supabase functions serve <fn> --env-file .env.local --no-verify-jwt` |

---

## Relación con otros ambientes

- [[base-de-datos]] — Schema completo, tablas, RLS, triggers
- [[edge-functions]] — Catálogo de ~50 Edge Functions y cómo deployarlas

---

## Historial de setup

El stack local fue configurado en Abril 2026 como parte del sprint de estabilización crítica (`chore/stabilization-critical-2026-04`). Antes, el desarrollo diario usaba el DEV remoto directamente, lo que generaba riesgo de interferencia entre desarrolladores.
