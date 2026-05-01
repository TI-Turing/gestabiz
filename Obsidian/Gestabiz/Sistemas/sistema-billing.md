---
date: 2026-04-19
tags: [sistema, billing, pagos, stripe, payu, mercadopago, produccion]
status: completado
---

# Sistema de Billing y Pagos

Triple gateway de pagos (Stripe, PayU Latam, MercadoPago) con factory pattern, suscripciones y gestión de planes.

## Descripción

Gestabiz soporta 3 gateways de pago para cobertura global/LATAM. El gateway activo se determina por `VITE_PAYMENT_GATEWAY`. El `PaymentGatewayFactory` instancia el gateway correcto inyectándole el cliente Supabase singleton.

## ⚠️ DISCREPANCIA: Realidad vs Documentación (25 Abr 2026)

La documentación en `.github/copilot-instructions.md:2141-2145` y `CLAUDE.md:2141-2145` menciona planes `Gratuito/Inicio (90k)/Profesional (180k)/Empresarial`. Sin embargo, la realidad del código es:
- `src/lib/pricingPlans.ts:15-16` y `PlanUpgradeModal.tsx:39-58` definen:
  - Gratuito (free, 0 COP)
  - **Básico** (basico, ~90k COP)
  - **Pro** (pro, ~180k COP)
  - Empresarial aún está deshabilitado

Este vault y el código fuente son la **fuente de verdad**. Las instrucciones de Copilot deben actualizarse en la próxima sesión (Opción B del histórico de commits).

## Gateways

| Gateway | Cobertura | Variable |
|---------|-----------|----------|
| Stripe | Global | `VITE_STRIPE_PUBLISHABLE_KEY` |
| PayU Latam | Colombia | `VITE_PAYU_MERCHANT_ID` |
| MercadoPago | Argentina/Brasil/México/Chile | `VITE_MERCADOPAGO_PUBLIC_KEY` |

## Planes

| Plan | Precio | Estado | Incluye |
|------|--------|--------|---------|
| Gratuito | 0 COP | Activo | 1 sede, 1 empleado, 3 citas/mes, chat solo owner |
| Inicio | $80.000/mes | Activo (Más Popular) | Sedes ilimitadas, empleados, citas, WhatsApp |
| Profesional | — | Próximamente | Todo Inicio + analytics avanzado |
| Empresarial | — | Próximamente | Todo Pro + API, soporte dedicado |

Definición centralizada en `src/lib/pricingPlans.ts`.

## Componentes Clave

| Componente | Ubicación | Función |
|-----------|-----------|---------|
| `BillingDashboard` | `src/components/billing/` | Panel principal de facturación |
| `PaymentHistory` | `src/components/billing/` | Historial de pagos |
| `UsageMetrics` | `src/components/billing/` | Métricas de uso por plan |
| `PlanUpgradeModal` | `src/components/billing/` | Modal de upgrade de plan |
| `AddPaymentMethodModal` | `src/components/billing/` | Agregar método de pago |

## Tablas de Base de Datos

- `subscriptions` — Suscripciones activas (gateway, status, plan, next_billing_date)
- `billing_invoices` — Facturas generadas
- `payment_methods` — Métodos de pago guardados
- `usage_metrics` — Métricas de uso para facturación

## Edge Functions

### Stripe
- `create-checkout-session` — Iniciar checkout
- `create-setup-intent` — Guardar método de pago
- `stripe-webhook` — Webhook de eventos
- `manage-subscription` — Gestión de suscripción

### PayU
- `payu-create-checkout` — Iniciar checkout PayU
- `payu-webhook` — Webhook de eventos PayU

### MercadoPago
- `mercadopago-create-preference` — Crear preferencia de pago
- `mercadopago-webhook` — Webhook de eventos
- `mercadopago-manage-subscription` — Gestión de suscripción

## Factory Pattern

```
PaymentGatewayFactory.create(gateway, supabaseClient)
  → StripeGateway | PayUGateway | MercadoPagoGateway
```

Los gateways reciben el cliente Supabase como parámetro del constructor (NO crean instancias nuevas). Ver [[stack-tecnologico]].

## Hooks

- `useSubscription(businessId)` — Estado de suscripción actual

## Permisos Requeridos

- `billing.manage` — Gestionar suscripción y pagos (proteger con [[sistema-permisos|PermissionGate]])
- `billing.view` — Ver estado de facturación

## Archivos Clave

- `src/lib/payments/PaymentGatewayFactory.ts`
- `src/lib/pricingPlans.ts`
- `src/components/billing/BillingDashboard.tsx`
- `supabase/functions/create-checkout-session/`
- `supabase/functions/stripe-webhook/`

## Programa de Referrals (MercadoPago Payouts)

El webhook de MercadoPago fue extendido para disparar transferencias automáticas cuando un pago se realiza con cupón de referido. Ver [[sistema-referrals]] para el detalle completo.

- Nueva Edge Function: `mercadopago-payout-referral` — transfiere $60.000 COP al referrer vía MP Money Transfer API
- `mercadopago-create-preference` — embebe `referral_code_id` en metadata
- `mercadopago-webhook` — detecta `referral_code_id`, llama `mark_referral_redeemed`, dispara payout

## Notas Relacionadas

- [[sistema-permisos]] — Permisos `billing.manage` y `billing.view`
- [[sistema-notificaciones]] — Canales disponibles dependen del plan
- [[sistema-chat]] — Plan gratuito: solo owner; Básico+: multi-empleado
- [[sistema-citas]] — Límite de 3 citas/mes en plan gratuito
- [[planes-y-precios]] — Detalle comercial de planes
- [[comparativa-competidores]] — Pricing vs Calendly/Booksy/Fresha
- [[stack-tecnologico]] — Arquitectura de payment gateways
- [[sistema-referrals]] — Programa de referidos y comisiones automáticas
