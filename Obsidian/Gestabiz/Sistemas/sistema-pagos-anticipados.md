---
date: 2026-05-06
tags: [pagos, mercadopago, anticipos, billing, wizard]
---

# Sistema de Pagos Anticipados (Advance Deposits)

Sistema completo de cobro de anticipo al momento de reservar una cita, usando **MercadoPago Marketplace 1:1 (Plan B)**. El dinero fluye directamente a la cuenta MP del negocio; Gestabiz cobra un 5% via `marketplace_fee` sin tocar el dinero ajeno.

---

## Arquitectura general

```
Cliente reserva cita
  → ConfirmationStep muestra aviso de anticipo
  → Wizard crea la cita (INSERT) con deposit_status='pending', hold_expires_at=now+15min
  → DepositCheckoutStep invoca create-appointment-deposit-preference EF
  → Cliente redirigido a MercadoPago (init_point / sandbox_init_point)
  → MP procesa el pago y notifica via webhook (mercadopago-webhook)
  → Webhook valida HMAC-SHA256, actualiza deposit_status='paid', limpia hold
  → Cliente regresa a AppointmentConfirmation.tsx (back_url)
```

---

## Schema (migraciones aplicadas)

| Migración | Qué agrega |
|-----------|-----------|
| `20260507000000_advance_payment_settings.sql` | Columnas en `businesses`: `advance_payment_enabled`, `advance_payment_required`, `advance_payment_percentage`, `cancellation_policy` (JSONB), `payments_tos_accepted_at`, `payments_settlement_mode` |
| `20260507000001_business_mp_connections.sql` | Tabla `business_mp_connections` (OAuth tokens encriptados con pgcrypto) + vista `business_mp_connection_status` |
| `20260507000002_appointment_payments.sql` | Columnas en `appointments`: `deposit_required`, `deposit_paid`, `deposit_status`, `mp_preference_id`, `mp_payment_id`, `deposit_paid_at`, `hold_expires_at`, `gateway_fee`, `platform_fee`, `net_to_business` + tabla `appointment_payment_events` + tabla `payment_gateway_fees` |
| `20260507000003_payment_rpcs.sql` | RPCs: `compute_appointment_fees`, `compute_refund_amount`, `release_expired_holds`, `decrypt_mp_token` |
| `20260507000004_payment_permissions.sql` | 4 permisos nuevos: `payments.configure`, `payments.refund`, `payments.view`, `payments.payout` |

---

## Modelo de fees

```
Servicio:            $100.000
Anticipo (50%):       $50.000
────────────────────────────────
Comisión MP (~4.75%): -$2.375
Fee Gestabiz (5%):    -$2.500
────────────────────────────────
Neto al negocio:      $45.125
Saldo en sede:        $50.000  (efectivo/POS)
```

Tarifas reales MercadoPago Colombia 2026:

| Modo | Tarifa base | +IVA 19% | Efectiva |
|------|-------------|----------|----------|
| Inmediata | 5.99% | 1.14% | ~7.13% |
| Estándar (1-2 días) | 3.99% | 0.76% | ~4.75% |
| Diferida 14 días | 2.99% | 0.57% | ~3.56% |

Las tarifas se guardan en la tabla `payment_gateway_fees` (editable sin redeploy).

---

## Política de cancelación (escalonada)

| Ventana | Devolución |
|---------|-----------|
| > `full_refund_hours` (default: 48h) | 100% del anticipo |
| Entre `partial_refund_hours` (24h) y `full_refund_hours` | `partial_refund_percentage` (default: 50%) |
| < `partial_refund_hours` o no-show | 0% — negocio retiene |

La política se configura en JSONB `businesses.cancellation_policy`. RPC `compute_refund_amount` es la fuente de verdad.

---

## MercadoPago OAuth (Plan B — Marketplace 1:1)

1. Admin hace click "Conectar cuenta MP" → EF `mp-oauth-init` genera URL de autorización MP.
2. Admin aprueba en MP → callback llega a EF `mp-oauth-callback` → tokens encriptados guardados en `business_mp_connections`.
3. Al crear preferencia de pago, EF usa `mp_access_token` del negocio como collector + `marketplace_fee` = 5% del anticipo.
4. MP descuenta su comisión y el `marketplace_fee`; el resto va directo a la cuenta MP del negocio.

**CRÍTICO**: `marketplace_fee` en la preferencia ya descuenta la parte de Gestabiz automáticamente. No hay EF de payout manual.

---

## Edge Functions

| EF | Qué hace |
|----|---------|
| `create-appointment-deposit-preference` | Crea preferencia MP con el token del negocio. `external_reference = "appointment::{id}"` |
| `mercadopago-webhook` | Ramifica por `external_reference`. Valida HMAC-SHA256 `x-signature`. Actualiza `deposit_status`. Fire-and-forget notificación al negocio. |
| `refund-appointment-deposit` | Llama `POST /v1/payments/{id}/refunds` con token del negocio. Calcula tramo de política vía RPC. Actualiza BD. |
| `release-expired-appointment-holds` | Cron cada 5 min. Llama `release_expired_holds()` RPC. Libera slots de citas que no pagaron en 15 min. |
| `mp-oauth-init` | Genera URL de autorización MP con CSRF token. |
| `mp-oauth-callback` | Intercambia `code` por tokens. Encripta y guarda en `business_mp_connections`. |
| `mp-oauth-refresh` | Cron diario. Refresca tokens próximos a expirar. |
| `mp-oauth-disconnect` | Revoca conexión MP del negocio. |

**Nota**: todas las EF tienen `verify_jwt = false` en `supabase/config.toml` (proyecto usa `sb_publishable_*`).

---

## Seguridad

- **HMAC-SHA256**: webhook valida header `x-signature: ts=<ts>,v1=<hash>`. Manifest: `id:<payment_id>;request-id:<x-request-id>;ts:<ts>;`. Retorna 200 aunque sea inválido (MP requiere 200 para no parar retries), pero no procesa el evento.
- **Idempotencia**: tabla `webhook_idempotency_keys` previene doble procesamiento de retries MP.
- **Encriptación de tokens**: `pgcrypto` + función SECURITY DEFINER `decrypt_mp_token()`. El token nunca viaja en texto plano entre tablas.
- **Hold TTL**: slot reservado 15 min mientras el cliente paga. `release_expired_holds()` cron libera slots vencidos.

---

## Frontend

### Wizard de citas

- **ConfirmationStep**: muestra banner ámbar de aviso si `advance_payment_enabled && fees.isEnabled`. Usuario sabe antes de confirmar.
- **DepositCheckoutStep**: paso insertado entre Confirmation y Success. Auto-avanza si no hay depósito requerido (sin flash UI). Checkbox obligatorio de política. Botón "Pagar anticipo" → redirige a MP. Botón "Pagar en sede" (solo si anticipo es opcional).
- **WizardFooter**: oculto en `depositCheckout` (el step tiene sus propios botones).
- **useWizardState**: `depositCheckout` excluido del progress bar (`getDisplaySteps`).

### AppointmentsCalendar (admin)

- Modal de cita: bloque ámbar "Anticipo cobrado digitalmente: $X" cuando `deposit_status === 'paid'`.
- Saldo a cobrar: `service_price - deposit_paid`.
- Aviso de política: "⚠️ Anticipo pagado $X COP. Al cancelar se calculará la devolución automáticamente."

### PaymentsManagementPage

- Ruta: `/app/admin/payments` (sidebar id `payments`).
- Tabs: Pagos recibidos, Devoluciones, Retenidos, Disputas.
- KPIs: total cobrado, neto al negocio, fees, devuelto.
- Tabla: fecha, cliente (abre ClientProfileModal), servicio, anticipo, fees, neto, estado, ref. MP.
- Filtros: período (este mes / mes anterior / últimos 3 / 6 meses) + búsqueda libre.

---

## i18n

- `src/locales/es/payments.ts` — ~40 claves
- `src/locales/en/payments.ts` — ~40 claves
- Exportado en `es/index.ts` y `en/index.ts` como `payments`.

---

## Hooks y servicios

- `usePaymentSettings(businessId)` — config del negocio (STABLE cache).
- `useMpConnection(businessId)` — estado de la conexión OAuth.
- `useAppointmentFees({businessId, serviceId})` — calcula breakdown via RPC.
- `useAppointmentRefundPreview(appointmentId)` — calcula devolución aplicable.
- `useCreateDepositPreference()` — llama EF create-appointment-deposit-preference.
- `useRefundDeposit()` — llama EF refund-appointment-deposit.
- `useAppointmentPaymentEvents(appointmentId)` — audit log de eventos.
- `src/lib/services/appointmentPayments.ts` — capa de servicio completa.
- `src/lib/payments/calculateAppointmentFees.ts` — pure function con tests.

---

## Permisos

| Permiso | Quién lo usa |
|---------|-------------|
| `payments.configure` | Admin configura anticipos y política |
| `payments.refund` | Admin emite devolución manual |
| `payments.view` | Admin ve dashboard de cobros |
| `payments.payout` | Admin ve cuenta bancaria del negocio |

Asignados automáticamente a owners/admins vía trigger `auto_assign_permissions_to_owners`.

---

## TODO factura electrónica

Comentarios `// TODO factura electrónica` en los puntos de cobro y devolución de:
- `mercadopago-webhook/index.ts` (cuando `deposit_status → paid`)
- `refund-appointment-deposit/index.ts` (nota crédito al refund)

Se conectará con [[facturacion-electronica-matias-api]] cuando esté disponible.

---

## Fases implementadas

- **Fase A**: Migraciones SQL, RPCs, permisos, lógica de fees.
- **Fase B**: PaymentSettingsTab, BusinessMpConnectionCard, DepositBreakdown, i18n.
- **Fase C**: EF create-appointment-deposit-preference, mercadopago-webhook ramificado, AppointmentWizard DepositCheckoutStep.
- **Fase D**: EF refund-appointment-deposit, AppointmentsCalendar saldo + aviso política.
- **Fase E**: EF release-expired-appointment-holds (cron), PaymentsManagementPage dashboard.

---

## Ver también

- [[sistema-citas]] — wizard y lógica de reserva
- [[sistema-billing]] — suscripciones y planes (Stripe/PayU/MP)
- [[sistema-contable]] — transacciones e impuestos
- [[edge-functions]] — patrones de EF, HMAC, JWT
