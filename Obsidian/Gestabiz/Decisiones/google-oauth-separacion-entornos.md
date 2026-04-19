---
date: 2026-03-31
tags: [oauth, google, seguridad, entornos, vercel, supabase]
---

# Decisión: Separación de clientes Google OAuth por entorno

## Contexto

El proyecto tiene dos entornos de Supabase (DEV `dkancockzvcqorqbwtyh` y PROD `emknatoknbomvmyumqju`) y dos dominios (`dev.gestabiz.com` y `gestabiz.com`). Google OAuth requiere que cada entorno use su propio cliente OAuth para que los redirects funcionen correctamente.

## Decisión

Dos clientes OAuth en Google Cloud Console, configuración separada en Supabase y Vercel por entorno.

## Configuración

### Google Cloud Console
| Cliente | Uso | Client ID |
|---------|-----|-----------|
| Gestabiz Web | PROD | `496587471913-7cqaibtabnrm7evqfv4ak2tri8f63us7.apps.googleusercontent.com` |
| Gestabiz Web - dev | DEV/local | `496587471913-qk668fv00cpto430petb79c3h4tkvla6.apps.googleusercontent.com` |

### Supabase DEV (`dkancockzvcqorqbwtyh`)
- `site_url`: `https://dev.gestabiz.com`
- `uri_allow_list`: `https://dev.gestabiz.com/**,http://localhost:5173/**,http://localhost:5174/**`
- `external_google_client_id`: cliente DEV (`...qk668...`)

### Supabase PROD (`emknatoknbomvmyumqju`)
- `site_url`: `https://gestabiz.com`
- `uri_allow_list`: `https://gestabiz.com/**,https://www.gestabiz.com/**`
- `external_google_client_id`: cliente PROD (`...7cqai...`)

### Vercel (env vars)
- `VITE_GOOGLE_CLIENT_ID` en target `production` → PROD client
- `VITE_GOOGLE_CLIENT_ID` en targets `development,preview` → DEV client
- Ídem para `VITE_GOOGLE_CLIENT_SECRET`

## Por qué

Sin esta separación, el login con Google desde `dev.gestabiz.com` redirigía a `www.gestabiz.com` porque Supabase DEV tenía configurado el `site_url` de producción.

## Notas Relacionadas

- [[sistema-autenticacion]] — Auth con Google OAuth
- [[stack-tecnologico]] — Entornos DEV/PROD, Vercel env vars
- [[base-de-datos]] — Supabase DEV vs PROD
- [[secretos-en-scripts-gitguardian]] — Problema de secretos que motivó la separación
- [[2026-03-31-infra-oauth-ci]] — Sesión donde se implementó
- [[bug-session-disconnection-on-tab-switch]] — Bug de auth relacionado
- [[auditoria-completa-abril-2026]] — Auditoría de seguridad e infraestructura
