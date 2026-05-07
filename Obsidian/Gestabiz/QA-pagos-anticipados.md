---
date: 2026-05-07
tags: [qa, pagos, anticipos, testing, mercadopago]
---

# Plan de Pruebas — Sistema de Pagos Anticipados

> Usar **MercadoPago Sandbox** para todas las pruebas de pago.
> Credenciales sandbox: cuenta de prueba MP del proyecto (ver secrets del equipo).
> Marcar cada ítem con ✅ (pasa), ❌ (falla), o ⚠️ (comportamiento inesperado + nota).

---

## 1. Configuración inicial del negocio (Admin Settings → Pagos)

### 1.1 Visibilidad del tab

- [ ] El tab **"Pagos"** aparece en la barra de sub-tabs de Configuración
- [ ] El tab es accesible con scroll horizontal en móvil (no se corta)
- [ ] Sólo aparece para usuarios con rol Admin u Owner del negocio

### 1.2 Estado sin conexión MP

- [ ] Al entrar al tab sin cuenta MP conectada, se muestra aviso "Conecta tu cuenta de MercadoPago para activar cobros"
- [ ] Los toggles de activación de anticipos están **deshabilitados** hasta conectar MP
- [ ] El botón "Conectar cuenta MP" es visible y clickeable

### 1.3 Flujo OAuth — conectar cuenta MP

- [ ] Click en "Conectar cuenta MP" redirige a la página de autorización de MercadoPago
- [ ] Tras autorizar en MP, el callback regresa a Gestabiz sin errores
- [ ] El estado cambia a "Cuenta conectada" con el email/nombre de la cuenta MP
- [ ] Los toggles de configuración se habilitan tras la conexión
- [ ] Si se abre una segunda ventana y se repite el OAuth con otra cuenta, el token se reemplaza correctamente

### 1.4 Configurar anticipo

- [ ] Toggle **"Cobrar anticipo al reservar"** activa/desactiva `advance_payment_enabled`
- [ ] Toggle **"Anticipo obligatorio"** activa/desactiva `advance_payment_required`
  - Si obligatorio = OFF → el cliente puede saltar el pago ("Pagar en sede")
  - Si obligatorio = ON → el cliente no puede confirmar sin pagar
- [ ] Slider de porcentaje funciona de 10% a 100% en pasos de 5%
- [ ] El valor del slider persiste al recargar la página

### 1.5 Política de cancelación

- [ ] Input `full_refund_hours` acepta solo números positivos (default: 48)
- [ ] Input `partial_refund_hours` acepta solo números positivos (default: 24)
- [ ] Input `partial_refund_percentage` acepta 0–100 (default: 50)
- [ ] La **vista previa textual** se actualiza en tiempo real al cambiar los inputs
  - Ejemplo esperado: "Si cancelas con más de 48h de anticipación: devolución del 100%. Entre 24h y 48h: 50%. Menos de 24h o no asistir: sin devolución."
- [ ] Guardar persiste correctamente en `businesses.cancellation_policy` JSONB

### 1.6 Calculadora en vivo

- [ ] Campo "Precio del servicio de ejemplo" acepta valores numéricos
- [ ] El breakdown se actualiza al escribir:
  - Anticipo = precio × porcentaje configurado
  - Comisión MP = anticipo × tarifa (según modo de acreditación seleccionado)
  - Fee Gestabiz = anticipo × 5%
  - Neto al negocio = anticipo − comisión MP − fee Gestabiz
- [ ] Los tres modos de acreditación (Inmediata 7.13%, Estándar 4.75%, Diferida 3.56%) producen resultados distintos

### 1.7 Desconectar cuenta MP

- [ ] Botón "Desconectar" revoca la conexión
- [ ] El estado regresa a "sin conexión"
- [ ] Los toggles vuelven a deshabilitarse

---

## 2. Wizard de reserva — flujo del cliente

> **Configuración previa para estas pruebas**: negocio con `advance_payment_enabled = true`, servicio de $100.000, anticipo 50%.

### 2.1 ConfirmationStep — aviso de anticipo

- [ ] Aparece banner ámbar indicando que se cobrará un anticipo antes de confirmar
- [ ] El banner muestra el monto exacto del anticipo ($50.000)
- [ ] Si el negocio NO tiene anticipos activados, el banner NO aparece
- [ ] Si el servicio tiene precio $0, el banner NO aparece

### 2.2 DepositCheckoutStep — desglose y pago

- [ ] El paso aparece después de ConfirmationStep y antes de SuccessStep
- [ ] Muestra el desglose completo:
  - Anticipo: $50.000
  - Comisión MercadoPago: ~$2.375
  - Fee Gestabiz: $2.500
  - Neto al negocio: ~$45.125
- [ ] Muestra la política de cancelación resumida del negocio
- [ ] El checkbox de aceptación de política es **obligatorio** (no se puede avanzar sin marcarlo)
- [ ] El botón "Pagar anticipo $50.000" redirige al checkout de MercadoPago (sandbox)
- [ ] Si `advance_payment_required = false`, aparece botón adicional "Pagar en sede" que salta el paso
- [ ] La barra de progreso del wizard **NO** muestra este paso (excluido de `getDisplaySteps`)
- [ ] El footer del wizard está **oculto** en este paso (el step tiene sus propios botones)

### 2.3 La cita se crea con hold temporal

- [ ] Antes de pagar, la cita existe en BD con `deposit_status = 'pending'`
- [ ] `hold_expires_at = now() + 15 minutos`
- [ ] El slot aparece como ocupado para otros clientes durante esos 15 min

### 2.4 Pago exitoso en sandbox MP

- [ ] El cliente completa el pago en la sandbox de MP
- [ ] El webhook recibe la notificación y actualiza `deposit_status = 'paid'`
- [ ] `deposit_paid`, `mp_payment_id`, `deposit_paid_at`, `gateway_fee`, `platform_fee`, `net_to_business` quedan registrados en `appointments`
- [ ] `hold_expires_at` queda en NULL (hold liberado)
- [ ] Se registra evento en `appointment_payment_events` con `event_type = 'deposit_charged'`
- [ ] El cliente llega a la página de éxito / AppointmentConfirmation mostrando que el anticipo fue pagado
- [ ] El negocio recibe notificación in-app "Nuevo anticipo recibido"

### 2.5 Pago fallido en sandbox MP

- [ ] Si el cliente cancela o falla el pago en MP, regresa a Gestabiz
- [ ] La cita permanece en `deposit_status = 'pending'` con el hold activo
- [ ] El cliente puede intentar pagar de nuevo (botón disponible)
- [ ] Después de 15 min sin pago, el hold expira (ver sección 5)

### 2.6 Servicio con precio $0

- [ ] El DepositCheckoutStep **se salta automáticamente** sin flash de UI
- [ ] La cita se crea con `deposit_status = 'not_required'`
- [ ] No hay redirección a MP

### 2.7 Negocio sin anticipos activados

- [ ] El wizard funciona exactamente igual que antes de esta feature
- [ ] No aparece ningún paso de pago
- [ ] La cita se crea sin campos de depósito (`deposit_status = null`)

---

## 3. Calendario admin — visualización de anticipos

### 3.1 Cita con anticipo pagado

- [ ] En el modal de detalle de cita aparece bloque ámbar: "Anticipo cobrado digitalmente: $50.000"
- [ ] Se muestra "Saldo a cobrar al cliente: $50.000" (precio − anticipo)
- [ ] Se muestra aviso de política: "Al cancelar se calculará la devolución automáticamente"

### 3.2 Cita sin anticipo

- [ ] No aparece ningún bloque de anticipo en el modal
- [ ] El comportamiento es idéntico al anterior a esta feature

### 3.3 Cita con anticipo pendiente (no pagó en 15 min pero el cron aún no corrió)

- [ ] El modal muestra `deposit_status = 'pending'`
- [ ] No se muestra como "cobrado"

---

## 4. Cancelaciones y reembolsos

> **Configuración**: política default — 100% si >48h, 50% entre 24h y 48h, 0% si <24h.

### 4.1 Cancelar con más de 48h de anticipación → devolución 100%

- [ ] Al cancelar la cita, se llama `refund-appointment-deposit` EF
- [ ] MP procesa el refund completo ($50.000) a la tarjeta del cliente
- [ ] `deposit_status` cambia a `'refunded'`
- [ ] Se registra evento `deposit_refunded` en `appointment_payment_events`
- [ ] El negocio recibe notificación de la cancelación + reembolso

### 4.2 Cancelar entre 24h y 48h de anticipación → devolución 50%

- [ ] Se devuelve $25.000 (50% del anticipo)
- [ ] `deposit_status` cambia a `'partial_refund'`
- [ ] Se registra evento `deposit_refunded` con el monto parcial
- [ ] El negocio retiene $25.000 en su cuenta MP

### 4.3 Cancelar con menos de 24h → devolución 0%

- [ ] No se llama a la API de refund de MP
- [ ] Se registra evento `manual_adjustment` (negocio retiene el anticipo)
- [ ] `deposit_status` permanece `'paid'` (el dinero ya está en el negocio)
- [ ] El cliente recibe notificación indicando que no hay devolución por política

### 4.4 No-show (cita marcada como no-show sin cancelar)

- [ ] Comportamiento igual al caso <24h → 0% devolución
- [ ] Evento `manual_adjustment` registrado

### 4.5 Modal de cancelación — UX del cliente

- [ ] Antes de confirmar la cancelación, el modal muestra la política aplicable según la hora actual
  - Ejemplo: "Cancelarás con 52h de anticipación. Recibirás devolución de $50.000 (100%)."
- [ ] El cliente debe confirmar explícitamente antes de proceder
- [ ] El monto de devolución es correcto según la ventana horaria

### 4.6 Reprogramación de cita

- [ ] Al reprogramar (cambiar start_time), el anticipo **no se devuelve** — viaja con la cita
- [ ] `deposit_status` permanece `'paid'`
- [ ] El saldo a cobrar en sede se mantiene igual

---

## 5. Expiración de holds (cron)

### 5.1 Hold expira sin pago

- [ ] Crear cita con anticipo requerido, NO completar el pago
- [ ] Esperar 15 minutos (o modificar `hold_expires_at` en BD local para acelerar)
- [ ] El cron `release-expired-appointment-holds` corre y llama `release_expired_holds()` RPC
- [ ] La cita queda cancelada / el slot queda libre
- [ ] Un segundo cliente puede reservar ese mismo slot

### 5.2 Hold no expira si el pago llega antes

- [ ] Cita con hold activo → pagar en sandbox antes de los 15 min
- [ ] `hold_expires_at` queda en NULL
- [ ] El cron no afecta esta cita

---

## 6. Dashboard de pagos (/app/admin/payments)

### 6.1 Acceso

- [ ] El ítem "Cobros anticipados" aparece en el sidebar del admin
- [ ] La ruta `/app/admin/payments` carga sin errores
- [ ] Usuario sin permiso `payments.view` no puede acceder (PermissionGate)

### 6.2 KPIs

- [ ] "Total cobrado" suma correctamente todos los `deposit_paid` del período
- [ ] "Neto al negocio" suma correctamente todos los `net_to_business`
- [ ] "Fees" suma `gateway_fee + platform_fee`
- [ ] "Devuelto" suma los montos de eventos `deposit_refunded`

### 6.3 Tabs

- [ ] **Pagos recibidos**: muestra citas con `deposit_status = 'paid'`
- [ ] **Devoluciones**: muestra citas con `deposit_status = 'refunded'` o `'partial_refund'`
- [ ] **Retenidos**: muestra anticipos retenidos por política (0% devolución)
- [ ] **Disputas**: muestra citas con `deposit_status = 'failed'` o `'chargeback'`

### 6.4 Tabla

- [ ] Columnas visibles: fecha, cliente, servicio, anticipo, fees, neto, estado, referencia MP
- [ ] Click en el nombre del cliente abre `ClientProfileModal` correctamente
- [ ] La referencia MP es el `mp_payment_id` y está visible

### 6.5 Filtros

- [ ] Selector de período funciona: "Este mes", "Mes anterior", "Últimos 3 meses", "Últimos 6 meses"
- [ ] Los KPIs y la tabla se actualizan al cambiar el período
- [ ] El buscador filtra por nombre de cliente o referencia MP

### 6.6 Estado vacío

- [ ] Si no hay pagos en el período seleccionado, se muestra mensaje vacío amigable (no pantalla en blanco)

---

## 7. Seguridad del webhook

### 7.1 HMAC válido

- [ ] MP envía notificación con firma `x-signature` correcta → el webhook la procesa y actualiza la BD

### 7.2 HMAC inválido (simulación de ataque)

- [ ] Enviar un POST al endpoint del webhook con `x-signature` incorrecto o ausente
- [ ] El webhook retorna HTTP 200 (para no bloquear los retries de MP) pero **no modifica** ningún dato en BD
- [ ] No se registra ningún `appointment_payment_events` ni cambio de `deposit_status`

### 7.3 Idempotencia

- [ ] Enviar el mismo evento de pago dos veces seguidas al webhook
- [ ] La BD refleja el pago solo una vez (tabla `webhook_idempotency_keys` previene duplicados)
- [ ] El segundo envío retorna 200 pero no crea registros duplicados en `appointment_payment_events`

---

## 8. Citas creadas por admin (sin anticipo obligatorio)

- [ ] Cuando un admin crea una cita presencialmente para un cliente, hay opción "Crear sin requerir anticipo"
- [ ] La cita se crea con `deposit_status = 'not_required'` aunque el negocio tenga `advance_payment_required = true`
- [ ] La cita aparece normalmente en el calendario sin ninguna alerta de anticipo pendiente

---

## 9. Permisos

| Acción | Permiso requerido | Comportamiento sin permiso |
|--------|------------------|--------------------------|
| Configurar anticipos (Settings → Pagos) | `payments.configure` | Tab deshabilitado |
| Ver dashboard de cobros | `payments.view` | Ítem del sidebar oculto o bloqueado |
| Emitir devolución manual | `payments.refund` | Botón oculto o deshabilitado |
| Ver cuenta bancaria del negocio | `payments.payout` | Sección oculta |

- [ ] Verificar cada fila de la tabla con un usuario que NO tenga el permiso correspondiente

---

## 10. i18n

- [ ] Con idioma en **Español**: todas las cadenas del módulo de pagos aparecen en español
- [ ] Cambiar a **Inglés** (toggle de idioma): todas las cadenas del módulo aparecen en inglés sin claves sin traducir (ej: no debe aparecer `"payments.dashboard.tabs.received"` literal)
- [ ] El desglose de fees en el wizard muestra los labels traducidos correctamente en ambos idiomas
- [ ] Los estados del pago (`Pagado`, `Reembolsado`, `Pendiente`, etc.) están traducidos

---

## 11. Escenarios de borde

### 11.1 Dos clientes intentan reservar el mismo slot simultáneamente

- [ ] El primer cliente que completa el pago se queda con el slot
- [ ] El segundo cliente recibe error de slot no disponible (el hold del primero lo bloqueó)

### 11.2 Negocio desconecta su cuenta MP mientras hay citas con anticipos pendientes

- [ ] Las citas ya pagadas siguen mostrando `deposit_status = 'paid'` correctamente
- [ ] Los nuevos intentos de cobrar anticipo fallan con mensaje claro ("Cuenta MP desconectada")

### 11.3 Token MP expirado (simulación)

- [ ] El cron `mp-oauth-refresh` corre diariamente y renueva tokens antes de que expiren
- [ ] Si el token expiró antes del cron, el intento de crear preferencia de pago falla con mensaje de error claro en el wizard (no pantalla en blanco)

### 11.4 Servicio con override de porcentaje propio

- [ ] Si un servicio tiene `advance_payment_percentage` propio (distinto al del negocio), el wizard usa el del servicio
- [ ] La calculadora en ServicesManager muestra el porcentaje correcto para ese servicio

### 11.5 Servicio con anticipo 100%

- [ ] El cliente paga el total del servicio como anticipo
- [ ] "Saldo a cobrar en sede" en el calendario del admin muestra $0

### 11.6 Múltiples citas en el mismo período en el dashboard

- [ ] Los KPIs suman correctamente con 10+ pagos en el período
- [ ] La paginación/scroll de la tabla funciona sin errores

---

## 12. Tipos generados (técnico)

- [ ] Ejecutar `npx supabase gen types typescript` produce `src/types/supabase.gen.ts` sin errores
- [ ] Los nuevos campos de `appointments` (`deposit_status`, `deposit_paid`, etc.) aparecen en los tipos generados
- [ ] La tabla `business_mp_connections` y `appointment_payment_events` aparecen en los tipos generados
- [ ] No hay errores de TypeScript al compilar (`npm run type-check`)

---

## Resumen de resultados

Completar al finalizar las pruebas:

| Sección | Total ítems | ✅ Pasan | ❌ Fallan | ⚠️ Observaciones |
|---------|------------|---------|---------|-----------------|
| 1. Configuración Settings | 17 | | | |
| 2. Wizard cliente | 14 | | | |
| 3. Calendario admin | 5 | | | |
| 4. Cancelaciones | 11 | | | |
| 5. Expiración holds | 4 | | | |
| 6. Dashboard pagos | 13 | | | |
| 7. Seguridad webhook | 5 | | | |
| 8. Citas admin sin anticipo | 3 | | | |
| 9. Permisos | 4 | | | |
| 10. i18n | 4 | | | |
| 11. Escenarios de borde | 10 | | | |
| 12. Tipos generados | 4 | | | |
| **TOTAL** | **94** | | | |

---

> Cuando termines las pruebas, comparte los resultados en la sesión de Claude Code para proceder con los fixes necesarios.
