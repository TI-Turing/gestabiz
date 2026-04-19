---
date: 2026-04-19
tags: [sistema, referrals, cupones, mercadopago, adquisicion, crecimiento]
status: completado
---

# Sistema de Referrals con Cupones

Programa de referidos donde cualquier usuario de Gestabiz puede generar un cupón único, compartirlo con dueños de negocio nuevos, y recibir una comisión automática vía MercadoPago cuando el negocio paga su primer Plan Básico.

## Economía del Programa

| Parte | Monto |
|-------|-------|
| Plan Básico precio normal | $89.900 COP |
| Plan Básico con cupón | $74.900 COP (descuento $15.000) |
| Comisión al referrer | $60.000 COP |
| Gestabiz retiene | $14.900 COP neto en primer pago |

La comisión se transfiere automáticamente vía **MercadoPago Money Transfer API** al confirmar el pago del negocio referido.

## Reglas del Programa

1. **Solo Plan Básico, primera vez**: el cupón solo aplica si el negocio nunca ha pagado un plan antes (`NOT EXISTS business_plans WHERE status IN ('active','canceled','past_due')`)
2. **Un cupón por par (creador, negocio)**: constraint `UNIQUE (creator_user_id, used_by_business_id)` — un usuario no puede referir el mismo negocio dos veces
3. **No auto-referral**: el creador del cupón no puede ser el `owner_id` del negocio que lo usa
4. **Cupón válido 90 días** desde su generación
5. **Requiere datos de pago previos**: el usuario debe configurar su email de MercadoPago antes de generar un cupón (RPC `create_referral_code` valida que exista registro en `user_payout_details`)
6. **Kill-switch**: feature flag `system_config.referral_program_enabled` — al alcanzar ~200-300 clientes se desactiva

## Por Qué el Fraude No Es Viable

Ver decisión detallada en [[decision-antifraude-referrals]].

Resumen: el modelo económico hace que el fraude no sea rentable para el referrer ni para el dueño de negocio:
- El dueño de negocio tendría que crear negocios falsos repetidamente solo para ahorrar $15.000/mes cuando ya existe un **Plan Gratis** con 50 citas
- Si intenta usar el cupón de su propio socio/familiar → bloqueado por constraint `creator_user_id != owner_id`
- El programa es **temporal** (hasta 200-300 clientes) → ventana de fraude muy corta
- El pago solo se transfiere cuando el negocio **realmente paga** → no hay valor en crear negocios ficticios sin pagar

## Arquitectura Técnica

### Tablas nuevas (migración `20260704000000`)

| Tabla | Propósito |
|-------|-----------|
| `user_payout_details` | Datos bancarios/MP del referrer (email obligatorio) |
| `referral_codes` | Cupones: code UNIQUE 8 chars, status, expires_at, discount/payout amounts |
| `referral_payouts` | Transferencias ejecutadas: status, mp_transfer_id, idempotency_key |

**Idempotencia**: `referral_payouts.idempotency_key = referral_code_id::TEXT` (UNIQUE) → webhooks duplicados no crean doble pago.

### RPCs (migración `20260704000001`)

| RPC | Propósito |
|-----|-----------|
| `get_referral_feature_enabled()` | Lee `system_config`, SECURITY DEFINER (bypass RLS) |
| `create_referral_code(p_user_id)` | Verifica flag + payout_details, genera código único |
| `apply_referral_code(p_business_id, p_code)` | Valida cupón con SELECT FOR UPDATE (anti race-condition) |
| `mark_referral_redeemed(...)` | Marca redeemed + crea payout, ON CONFLICT DO NOTHING |

### Edge Functions

- **`mercadopago-payout-referral`** — nueva: llama MP Money Transfer API, retry hasta 5 intentos, `manual_review` + Sentry en el 5to fallo
- **`mercadopago-webhook`** — modificada: detecta `payment.metadata.referral_code_id`, llama `mark_referral_redeemed`, dispara payout fire-and-forget
- **`mercadopago-create-preference`** — modificada: intenta `apply_referral_code` primero, embebe `referral_code_id` en metadata

### Frontend

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useFeatureFlag.ts` | Kill-switch via RPC |
| `src/hooks/usePayoutDetails.ts` | CRUD datos bancarios |
| `src/hooks/useReferralCodes.ts` | CRUD cupones, generate |
| `src/hooks/useReferralEarnings.ts` | Historial de comisiones |
| `src/components/referrals/ReferralBanner.tsx` | Banner en ClientDashboard |
| `src/components/referrals/ReferralCodeCard.tsx` | Tarjeta con copy + WhatsApp share |
| `src/components/referrals/PayoutDetailsForm.tsx` | Formulario con 41 bancos colombianos |
| `src/pages/ReferralsPage.tsx` | Página completa `/app/referrals` |

El banner aparece en el tab "Citas" del ClientDashboard. No hay ítem en el sidebar — el acceso es solo desde el banner.

## Flujo End-to-End

1. Usuario ve banner "¿Quieres generar un dinerito extra?" → navega a `/app/referrals`
2. Si no tiene datos de pago → abre `PayoutDetailsForm` → guarda → genera cupón automáticamente
3. Comparte cupón por WhatsApp o copia al portapapeles
4. Negocio nuevo aplica cupón en `PricingPage` → ve precio $74.900 y badge "Cupón referido"
5. Paga en MercadoPago → webhook detecta `referral_code_id` en metadata
6. `mark_referral_redeemed` → crea `referral_payouts` con status `pending`
7. `mercadopago-payout-referral` → transfiere $60.000 → status `transferred`
8. Notificación in-app al referrer

## Kill-Switch

```sql
-- Desactivar el programa
UPDATE system_config SET value = 'false' WHERE key = 'referral_program_enabled';

-- Desactivar todos los cupones activos (opcional, para cupones ya emitidos)
UPDATE referral_codes SET status = 'disabled' WHERE status = 'active';
```

Los cupones ya canjeados **no se revierten** — los payouts pendientes se procesan igual.

## Relacionado

- [[sistema-billing]] — gateway MercadoPago, Edge Functions de pagos
- [[planes-y-precios]] — Plan Básico $89.900, gratuito 50 citas
- [[decision-antifraude-referrals]] — análisis completo de por qué el fraude no es rentable
- [[sistema-notificaciones]] — in_app_notifications al completar transferencia
