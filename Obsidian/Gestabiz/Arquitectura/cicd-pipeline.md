---
date: 2026-04-25
tags: [cicd, github-actions, deploy, infraestructura, vercel, supabase]
status: completed
---

# Pipeline de CI/CD

Gestabiz usa **GitHub Actions** para validar PRs, deployar a DEV en cada push a `dev` y deployar a PROD en cada merge a `main`. El pipeline está optimizado para minimizar tiempo de deploy mediante **selective deploy** de Edge Functions.

## Workflows

| Workflow | Trigger | Propósito |
|----------|---------|-----------|
| `ci.yml` | Pull Request a `dev` o `main` | Lint + type-check + tests + dry-run de migraciones |
| `deploy-dev.yml` | Push a `dev` | Deploy app a Vercel preview + Edge Functions a Supabase DEV |
| `deploy-prod.yml` | Push a `main` | Deploy app a Vercel producción + Edge Functions a Supabase PROD |

## Validación en PR

`ci.yml` corre en cada PR:

1. **Lint y type-check** — `npm run lint` + `npm run type-check`.
2. **Tests** — `npm run test` (algunos E2E pausados con `describe.skip()`).
3. **Dry-run de migraciones** — Levanta Supabase local con `supabase start`, aplica todas las migraciones del PR con `supabase db reset`. Si falla cualquier migración, el PR no puede mergearse.
4. **Build** — `npm run build` para validar que el bundle compila.

## Selective deploy de Edge Functions

Para evitar redeployar las ~50 funciones en cada push, el workflow calcula qué cambió:

```bash
# Obtiene archivos modificados bajo supabase/functions/
CHANGED=$(git diff --name-only HEAD~1 HEAD -- supabase/functions/)

# Si hay cambios en _shared/, redeploy completo
if echo "$CHANGED" | grep -q "supabase/functions/_shared/"; then
  FUNCTIONS_TO_DEPLOY=$(ls supabase/functions/ | grep -v "_shared")
else
  # Solo las funciones modificadas
  FUNCTIONS_TO_DEPLOY=$(echo "$CHANGED" | awk -F/ '{print $3}' | sort -u)
fi
```

- Push típico que toca 1 función → deploy de 1 función (~30 seg).
- Cambio en `_shared/` → redeploy completo (~10 min) porque cualquier función puede importar de ahí.

## Deploy a DEV

Trigger: `push` a rama `dev`.

1. Build de la app web → Vercel preview en `dev.gestabiz.com`.
2. Deploy de Edge Functions modificadas a Supabase DEV (`dkancockzvcqorqbwtyh`).
3. Migraciones: **NO se aplican automáticamente** — el desarrollador ejecuta `npx supabase db push --dns-resolver https --yes` localmente con autorización del lead.
4. Post-deploy: ejecutar `scripts/generate-sitemap.ts` y subir `sitemap.xml` actualizado al bucket público.

## Deploy a PROD

Trigger: `push` a rama `main` (vía merge de PR aprobado).

1. Build de la app → Vercel producción en `gestabiz.com`.
2. Deploy de Edge Functions a Supabase PROD (`emknatoknbomvmyumqju`).
3. Migraciones: aplicación manual con autorización explícita y ventana de bajo tráfico.
4. Post-deploy:
   - `scripts/generate-sitemap.ts` con datos PROD.
   - `scripts/seed-prod-data.mjs` si hay catálogos nuevos (countries, business_categories, etc.).
   - Health-check contra `/api/health` y URLs públicas críticas.

## Variables y secrets

Configurados en GitHub Actions secrets:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN` (sbp_*) — Management API para deploys
- `SUPABASE_DEV_PROJECT_REF`, `SUPABASE_PROD_PROJECT_REF`
- Service role keys NO se exponen en el pipeline (solo en Edge Functions runtime).

## Headers de seguridad

`vercel.json` aplica HSTS, X-Frame-Options DENY, Permissions-Policy, cache immutable 1-year para assets. Ver [[supabase-local-workflow]] sección "Headers de seguridad en Vercel".

## Notas relacionadas

- [[edge-functions]] — Catálogo de funciones y selective deploy
- [[base-de-datos]] — Migraciones SQL
- [[supabase-local-workflow]] — Validación local pre-PR
- [[stack-tecnologico]] — Vercel + Supabase + GitHub Actions
