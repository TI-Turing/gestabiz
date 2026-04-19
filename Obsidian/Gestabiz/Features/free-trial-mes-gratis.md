---
date: 2026-04-06
tags: [billing, free-trial, planes, owner]
---

# Feature: Mes Gratis por Usuario (Plan Básico)

## Descripción
Cada owner tiene derecho a 1 mes gratuito del Plan Básico ("inicio"). Se trackea a nivel de USUARIO (no negocio). Una vez consumido, no se puede volver a usar.

## Archivos creados
- `supabase/migrations/20260407000000_add_user_free_trial_tracking.sql` — 3 columnas en `profiles`
- `supabase/functions/activate-free-trial/index.ts` — Edge Function con 5 validaciones
- `src/hooks/useFreeTrial.ts` — Hook de estado y activación

## Archivos modificados
- `src/types/types.ts` — Campos `has_used_free_trial`, `free_trial_used_at`, `free_trial_business_id` en `User`
- `src/types/database.ts` — Mismo en tipos generados de Supabase (UTF-16 LE)
- `src/hooks/useAuthSimple.ts` — Propagación de campos desde profile
- `src/components/billing/BillingDashboard.tsx` — Banner trial + alerta trialing activo + prop `ownerId`
- `src/components/billing/PlanUpgradeModal.tsx` — Badge "Primer mes GRATIS" + CTA condicional
- `src/components/admin/AdminDashboard.tsx` — Pasa `ownerId={business.owner_id}` a BillingDashboard
- `supabase/functions/process-expired-plans/index.ts` — Procesa planes `trialing` vencidos

## Modelo de datos
```sql
-- profiles
has_used_free_trial    boolean NOT NULL DEFAULT false
free_trial_used_at     timestamptz
free_trial_business_id uuid REFERENCES businesses(id) ON DELETE SET NULL
```

## Flujo
1. Owner en plan Free → ve banner "1 Mes Gratis — Plan Básico"
2. Clic "Activar Mes Gratis" → llama Edge Function `activate-free-trial`
3. Edge Function valida: ownership + trial no usado + sin plan activo + sin trial en otro negocio
4. Escribe: profile.has_used_free_trial=true → business_plans (trialing, 31 días) → subscription_events
5. Plan activo → BillingDashboard muestra alerta con días restantes y CTA pago
6. Cron 00:05 UTC → `process-expired-plans` marca trialing vencidos como `expired` + event `trial_ended`

## Deploy status (DEV)
- Migración: aplicada ✓
- activate-free-trial: desplegada ✓ (v1)
- process-expired-plans: actualizada en local, pendiente redeploy via CLI

## Notas Relacionadas

- [[sistema-billing]] — Triple gateway de pagos, suscripciones
- [[planes-y-precios]] — Plan Gratuito, Inicio, Pro
- [[edge-functions]] — Edge Functions desplegadas (activate-free-trial, process-expired-plans)
- [[sistema-autenticacion]] — Campos de trial en profiles/useAuthSimple
- [[estrategia-producto-y-negocio]] — Modelo de precios y retención
- [[2026-04-13-primer-dia-ventas]] — Estrategia de ventas con trial
- [[analisis-competitivo-roadmap]] — Competidores y pricing
