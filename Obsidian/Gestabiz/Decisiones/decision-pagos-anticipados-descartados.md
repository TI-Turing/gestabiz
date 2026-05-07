---
date: 2026-05-06
tags: [decisiones, pagos, anticipos, descartado, scope, fase2]
---

# Pagos Anticipados — Decisiones y Items Descartados a Propósito

Documento que registra qué cosas **no entran** en el alcance del sistema de pagos anticipados de citas (v1) y por qué. Cuando se reconsidere alguno, agregar fecha y razón.

Relacionado: [[sistema-pagos-anticipados]] · [[sistema-billing]] · [[sistema-citas]] · [[modelo-cobro-payg-fase2]]

## Decisiones tomadas (firme)

| # | Decisión | Justificación |
|---|----------|---------------|
| 1 | **Fee Gestabiz: 5% sobre el anticipo recibido** (no sobre el total del servicio) | Confirmado por Jose Luis. Margen razonable sin desincentivar uso. |
| 2 | **Política de cancelación escalonada en 3 tramos** | Aceptado. Estándar industria (Booksy/Fresha). Default 48h/24h/0%. |
| 3 | **Plan B confirmado: Marketplace 1:1 con OAuth + `marketplace_fee`** | Investigación MP confirma disponibilidad en CO. Elimina manejo de dinero ajeno. |
| 4 | **Hold de slot 15 min mientras paga** | Evita race conditions con dos clientes pagando el mismo slot. |
| 5 | **KYC obligatorio antes de activar cobros** | Conexión OAcuth verificada de MP es requisito hard. |
| 6 | **Validación de firma `x-signature` del webhook** | Riesgo real con dinero en juego. |
| 7 | **Reprogramar mantiene anticipo** | Incentiva no cancelar. Simplifica contablemente. |
| 8 | **Servicios gratis (price=0) bypass automático** | Sin sentido cobrar comisión sobre $0. |
| 9 | **Citas presenciales del admin: opción "sin anticipo"** | Recepcionista debe poder agendar sin redirect a MP. |

## Items descartados a propósito (NO entran en v1)

### Fraude / Chargebacks UI completa
**Razón**: low priority hasta que haya volumen real. Por ahora solo se loguea el evento `chargeback` en `appointment_payment_events` y se notifica al admin por email; manejo manual.

**Reconsiderar cuando**: >50 transacciones/mes con cualquier disputa.

### Multi-currency real
**Razón**: 100% del MVP opera en COP. La columna `currency` ya existe en `appointments` y `services` (default 'MXN' por bug histórico — ahora 'COP'), pero la lógica de cálculo de fees asume COP.

**Reconsiderar cuando**: Gestabiz expanda a MX/AR/CL con clientes pagando.

### Pagos parciales del cliente
**Razón**: complejidad de cuotas, recordatorios de saldo, etc. v1 es todo-o-nada: el cliente paga el % configurado o no se agenda.

**Reconsiderar cuando**: clientes pidan layaway o servicios de alto ticket (>500k COP).

### Stripe / PayU integrados al wizard de citas
**Razón**: las clases existen en `src/lib/payments/StripeGateway.ts` y `PayUGateway.ts` pero no están conectadas al `PaymentGatewayFactory` actual. MP es suficiente para LATAM en v1.

**Reconsiderar cuando**: expansión a EU/US (Stripe) o cliente colombiano pida específicamente PayU.

### Modelo MP "Split 1:N" (un cobro a varios sellers)
**Razón**: requiere "advised portfolio" y contacto con ejecutivo comercial MP. Modelo 1:1 cubre el caso de Gestabiz (una cita = un negocio).

**Reconsiderar cuando**: alguien necesite cobros que se dividan entre varios negocios (ej. coworking + servicio externo).

### Facturación electrónica DIAN del anticipo
**Razón**: integración con Matias API es Fase 2 separada. Los puntos de cobro/refund llevan `// TODO factura electrónica` para enganche futuro.

**Reconsiderar cuando**: se inicie [[Features/facturacion-electronica-matias-api]].

### Datos bancarios completos del negocio (cuenta + tipo + banco + número)
**Razón**: Plan B (OAuth MP) lo elimina por completo. MercadoPago hace el KYC, valida la cuenta del negocio y libera fondos automáticamente. Gestabiz nunca toca esos datos.

**Si revertimos**: tabla `business_payout_accounts` quedó documentada en historial de plan por si fuera necesario.

### Edge Function `payout-appointment-deposit`
**Razón**: Plan B elimina la necesidad de transferir fondos manualmente. MP hace split automático al cobrar.

**Si revertimos**: usar `mercadopago-payout-referral` como template (ya existe).

### Auto-conciliación bancaria con extracto
**Razón**: como el dinero llega directo a la cuenta MP del negocio, no hay nada que conciliar del lado de Gestabiz para el negocio. Gestabiz solo concilia su propia comisión recibida.

### Recordatorios automáticos de pago pendiente
**Razón**: si el cliente sale del checkout sin pagar y el hold expira, simplemente se libera el slot. No se le insiste por email. Reduce spam.

**Reconsiderar cuando**: data muestre alta tasa de abandono en checkout (>30%).

### Soporte para PIX, Yape, Daviplata, etc.
**Razón**: solo lo que MercadoPago ofrezca nativo en su checkout (tarjeta, PSE, Efecty, Nequi en CO). No se construyen integraciones directas con cada wallet.

### Programa de lealtad / créditos del cliente
**Razón**: si el cliente cancela y le devuelven el anticipo, el dinero vuelve a su tarjeta — no se ofrece crédito Gestabiz. Reduce complejidad de wallet.

**Reconsiderar cuando**: tasa de cancelación + reagenda muestre que créditos retendrían más clientes.

### Configurar fee Gestabiz por negocio individual
**Razón**: 5% es global. Si el equipo comercial necesita ofrecer descuento a un cliente grande, se hace caso por caso vía superadmin.

### UI para que superadmin cambie tarifas de MP en `payment_gateway_fees`
**Razón**: por ahora se actualiza vía SQL directo cuando MP cambie tarifas (frecuencia ~1 vez al año). UI no justifica esfuerzo todavía.

### Reportes fiscales de comisiones para el negocio
**Razón**: el negocio recibe sus reportes desde su propia cuenta MP (es su dinero). Gestabiz no necesita generar reportes fiscales del lado del negocio.

**Lo que SÍ se construye**: dashboard de cobros (`PaymentsManagementPage`) para conciliación operativa, no fiscal.

## Notas de implementación

- Cada vez que se construya algo de esta lista, mover el ítem desde "descartados" a la nota correspondiente con la fecha de implementación.
- Si un cliente o vendedor pide algo de aquí, citar este documento como justificación de "por ahora no, en roadmap potencial".
