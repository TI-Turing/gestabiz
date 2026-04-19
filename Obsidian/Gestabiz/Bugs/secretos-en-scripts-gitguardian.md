---
date: 2026-03-31
tags: [seguridad, gitguardian, scripts, tokens]
---

# Bug: Secretos hardcodeados en scripts — GitGuardian alerts

## Problema

Scripts de base de datos tenían tokens hardcodeados que quedaron en el historial de git (commit `2eb16f8`):
- `sbp_939fa09...` en `scripts/seed-prod-data.mjs`, `scripts/dump-schema-from-api.ts`, `scripts/mark-migrations-applied.mjs`
- JWT de PROD Service Role en `scripts/seed-prod-data.mjs` (bypasa todo RLS)

GitGuardian los detectó en PR #86 y bloqueó el merge (incidentes 29163861 y 29163862).

## Fix aplicado

Reemplazados con variables de entorno en todos los scripts:
```js
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
```

## Estado

- Código: CORREGIDO (commits `315af53`, `2691925`)
- Historial de git: los secretos siguen en commits históricos
- **Acción pendiente**: rotar PROD Service Role Key en Supabase dashboard → Settings > API

## Prevención

- Nunca hardcodear tokens en scripts. Siempre `process.env.*`
- GitGuardian escanea TODO el historial de commits de un PR, no solo el último
- El prefijo `VITE_` expone variables al bundle del frontend — nunca usarlo para secrets

## Notas Relacionadas

- [[stack-tecnologico]] — Variables de entorno, seguridad
- [[edge-functions]] — Edge Functions y secrets de Supabase
- [[base-de-datos]] — Supabase (DEV/PROD)
- [[google-oauth-separacion-entornos]] — Separación de credenciales por entorno
- [[2026-03-31-infra-oauth-ci]] — Sesión donde se corrigió el problema
- [[auditoria-completa-abril-2026]] — Auditoría documenta el riesgo de secretos en Git
